import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { rateLimit } from "@/app/lib/api-security";
import {
  isFirebaseIdentity,
  verifyFirebaseBearerToken,
} from "@/app/lib/firebase-server-auth";
import { getPrisma } from "@/app/lib/prisma";
import { workspaceSeatLimit } from "@/app/lib/workspace-limits";

class InvitationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 4_096) {
    return NextResponse.json({ error: "Invitation token request is too large." }, { status: 413 });
  }
  const limited = await rateLimit(request, "accept-workspace-invitation", 8);
  if (limited) return limited;
  const identity = await verifyFirebaseBearerToken(request);
  if (!isFirebaseIdentity(identity)) return identity;
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  if (typeof body?.token !== "string" || body.token.length < 32 || body.token.length > 128) {
    return NextResponse.json({ error: "Invitation link is invalid or expired." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(body.token).digest("hex");
  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const invitation = await transaction.workspaceInvitation.findUnique({
          where: { tokenHash },
          include: { workspace: true },
        });
        if (
          !invitation ||
          invitation.acceptedAt ||
          invitation.expiresAt <= new Date()
        ) {
          throw new InvitationError("Invitation link is invalid or expired.", 400);
        }
        if (invitation.email.toLowerCase() !== identity.email.toLowerCase()) {
          throw new InvitationError(
            `Sign in with ${invitation.email} to accept this invitation.`,
            403,
          );
        }

        const user = await transaction.user.upsert({
          where: { firebaseUid: identity.uid },
          update: { email: identity.email, name: identity.name },
          create: {
            firebaseUid: identity.uid,
            email: identity.email,
            name: identity.name,
          },
        });
        const existingMembership = await transaction.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId: invitation.workspaceId,
            },
          },
        });
        if (!existingMembership) {
          const memberCount = await transaction.workspaceMember.count({
            where: { workspaceId: invitation.workspaceId },
          });
          if (memberCount >= workspaceSeatLimit(invitation.workspace.plan)) {
            throw new InvitationError(
              "This workspace has reached its seat limit. Ask an admin to upgrade the plan.",
              409,
            );
          }
          await transaction.workspaceMember.create({
            data: {
              userId: user.id,
              workspaceId: invitation.workspaceId,
              role:
                invitation.role === Role.MEMBER || invitation.role === Role.VIEWER
                  ? invitation.role
                  : Role.MEMBER,
            },
          });
        }
        const claimed = await transaction.workspaceInvitation.updateMany({
          where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
          data: { acceptedAt: new Date() },
        });
        if (claimed.count !== 1) {
          throw new InvitationError("Invitation link was already used.", 409);
        }
        await transaction.auditLog.create({
          data: {
            workspaceId: invitation.workspaceId,
            actorId: user.id,
            action: "workspace.invitation.accepted",
          },
        });
        return {
          workspaceId: invitation.workspaceId,
          workspaceName: invitation.workspace.name,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvitationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Workspace membership changed while accepting. Please try again." },
        { status: 409 },
      );
    }
    throw error;
  }
}
