import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { rateLimit } from "@/app/lib/api-security";
import { findWorkspaceAccess, requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getPrisma } from "@/app/lib/prisma";
import { workspaceSeatLimit } from "@/app/lib/workspace-limits";

type InvitationPayload = {
  email?: unknown;
  role?: unknown;
};

export async function GET(request: NextRequest) {
  const access = await findWorkspaceAccess(request);
  if (access instanceof NextResponse) return access;
  const invitations = await getPrisma().workspaceInvitation.findMany({
    where: {
      workspaceId: access.workspace.id,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invitations });
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 4_096) {
    return NextResponse.json({ error: "Invitation request is too large." }, { status: 413 });
  }
  const limited = await rateLimit(request, "workspace-invitation", 12);
  if (limited) return limited;
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;
  if (access.role !== Role.OWNER && access.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Only workspace owners and admins can invite people." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as InvitationPayload | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "VIEWER" ? Role.VIEWER : Role.MEMBER;
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (body?.role !== undefined &&
      body.role !== Role.MEMBER &&
      body.role !== Role.VIEWER)
  ) {
    return NextResponse.json(
      { error: "Enter a valid email and choose Member or Viewer access." },
      { status: 400 },
    );
  }
  if (email === access.identity.email.toLowerCase()) {
    return NextResponse.json({ error: "You already belong to this workspace." }, { status: 409 });
  }

  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (existingUser?.memberships.some((membership) => membership.workspaceId === access.workspace.id)) {
    return NextResponse.json({ error: "That person is already a workspace member." }, { status: 409 });
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  let invitation;
  try {
    invitation = await prisma.$transaction(
      async (transaction) => {
        const duplicate = await transaction.workspaceInvitation.findFirst({
          where: {
            workspaceId: access.workspace.id,
            email,
            acceptedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        if (duplicate) return { kind: "duplicate" as const };
        const [memberCount, activeInvitations] = await Promise.all([
          transaction.workspaceMember.count({
            where: { workspaceId: access.workspace.id },
          }),
          transaction.workspaceInvitation.count({
            where: {
              workspaceId: access.workspace.id,
              acceptedAt: null,
              expiresAt: { gt: new Date() },
            },
          }),
        ]);
        if (memberCount + activeInvitations >= workspaceSeatLimit(access.workspace.plan)) {
          return { kind: "seat-limit" as const };
        }
        const created = await transaction.workspaceInvitation.create({
          data: {
            email,
            role,
            tokenHash,
            expiresAt,
            workspaceId: access.workspace.id,
          },
        });
        return { kind: "created" as const, invitation: created };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Workspace seats changed while inviting. Please try again." },
        { status: 409 },
      );
    }
    throw error;
  }
  if (invitation.kind === "duplicate") {
    return NextResponse.json(
      { error: "There is already a pending invitation for that email." },
      { status: 409 },
    );
  }
  if (invitation.kind === "seat-limit") {
    return NextResponse.json(
      {
        error: "This plan has no unassigned seats. Upgrade the workspace or wait for an unused invitation to expire.",
        code: "WORKSPACE_SEAT_LIMIT_REACHED",
        billingUrl: "/workspace#billing",
      },
      { status: 409 },
    );
  }
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    await prisma.workspaceInvitation.delete({ where: { id: invitation.invitation.id } });
    return NextResponse.json({ error: "APP_BASE_URL is required to create invitations." }, { status: 503 });
  }
  const inviteUrl = new URL(`/invite?token=${encodeURIComponent(rawToken)}`, baseUrl).toString();

  let emailSent = false;
  const emailApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.INVITATION_FROM_EMAIL;
  if (emailApiKey && emailFrom) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: `Invitation to join ${access.workspace.name} on Brief Group`,
        text: `You have been invited to join ${access.workspace.name} as a ${role.toLowerCase()}. This link expires in 7 days: ${inviteUrl}`,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      await prisma.workspaceInvitation.delete({ where: { id: invitation.invitation.id } });
      return NextResponse.json(
        { error: "Invitation email could not be sent. Check your email provider settings and try again." },
        { status: 502 },
      );
    }
    emailSent = true;
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: access.workspace.id,
      actorId: access.userId,
      action: "workspace.invitation.created",
      target: email,
    },
  });
  return NextResponse.json(
    { invitation: { id: invitation.invitation.id, email, role, expiresAt }, inviteUrl, emailSent },
    { status: 201 },
  );
}

export async function DELETE(request: NextRequest) {
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;
  if (access.role !== Role.OWNER && access.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Only workspace owners and admins can revoke invitations." },
      { status: 403 },
    );
  }
  const invitationId = request.nextUrl.searchParams.get("id");
  if (!invitationId || invitationId.length > 64) {
    return NextResponse.json({ error: "Choose an invitation to revoke." }, { status: 400 });
  }

  const prisma = getPrisma();
  const deleted = await prisma.workspaceInvitation.deleteMany({
    where: {
      id: invitationId,
      workspaceId: access.workspace.id,
      acceptedAt: null,
    },
  });
  if (deleted.count !== 1) {
    return NextResponse.json({ error: "Pending invitation was not found." }, { status: 404 });
  }
  await prisma.auditLog.create({
    data: {
      workspaceId: access.workspace.id,
      actorId: access.userId,
      action: "workspace.invitation.revoked",
      target: invitationId,
    },
  });
  return NextResponse.json({ revoked: true });
}
