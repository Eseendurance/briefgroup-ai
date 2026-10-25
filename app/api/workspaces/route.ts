import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { rateLimit } from "@/app/lib/api-security";
import {
  isFirebaseIdentity,
  verifyFirebaseBearerToken,
} from "@/app/lib/firebase-server-auth";
import { getPrisma } from "@/app/lib/prisma";

type BootstrapPayload = {
  workspaceName?: unknown;
  teamSize?: unknown;
  region?: unknown;
  role?: unknown;
  goal?: unknown;
};

const teamSizes = new Set(["1", "2-5", "6-20", "21+"]);

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.json({ error: "Workspace setup request is too large." }, { status: 413 });
  }
  const limited = await rateLimit(request, "workspace-bootstrap", 10);
  if (limited) return limited;

  const identity = await verifyFirebaseBearerToken(request);
  if (!isFirebaseIdentity(identity)) return identity;
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Workspace services are not configured yet." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as BootstrapPayload | null;
  const name = typeof body?.workspaceName === "string" ? body.workspaceName.trim() : "";
  const teamSize = typeof body?.teamSize === "string" ? body.teamSize : "";
  const region = typeof body?.region === "string" ? body.region.trim().slice(0, 80) : "";
  const primaryRole = typeof body?.role === "string" ? body.role.trim().slice(0, 80) : "";
  const primaryGoal = typeof body?.goal === "string" ? body.goal.trim().slice(0, 80) : "";

  if (!name || name.length > 80 || !teamSizes.has(teamSize)) {
    return NextResponse.json(
      { error: "Enter a workspace name and choose a valid team size." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const user = await prisma.user.upsert({
    where: { firebaseUid: identity.uid },
    update: { email: identity.email, name: identity.name },
    create: {
      firebaseUid: identity.uid,
      email: identity.email,
      name: identity.name,
    },
  });

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  const slugBase =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "workspace";
  const result = await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: user.id },
      data: { email: identity.email, name: identity.name },
    });
    const existingMembership = await transaction.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (existingMembership) {
      return { workspace: existingMembership.workspace, alreadyExists: true };
    }

    const createdWorkspace = await transaction.workspace.create({
      data: {
        name,
        slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
        region: region || null,
        teamSize,
        primaryRole: primaryRole || null,
        primaryGoal: primaryGoal || null,
        trialStartedAt,
        trialEndsAt,
      },
    });
    await transaction.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: createdWorkspace.id,
        role: Role.OWNER,
      },
    });
    await transaction.auditLog.create({
      data: {
        workspaceId: createdWorkspace.id,
        actorId: user.id,
        action: "workspace.created",
      },
    });
    return { workspace: createdWorkspace, alreadyExists: false };
  });

  return NextResponse.json(
    {
      workspaceId: result.workspace.id,
      workspaceName: result.workspace.name,
      trialEndsAt: result.workspace.trialEndsAt,
      alreadyExists: result.alreadyExists,
    },
    { status: result.alreadyExists ? 200 : 201 },
  );
}
