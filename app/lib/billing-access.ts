import { NextRequest, NextResponse } from "next/server";
import { Role, type Workspace, type WorkspaceMember } from "@prisma/client";
import {
  isFirebaseIdentity,
  verifyFirebaseBearerToken,
} from "@/app/lib/firebase-server-auth";
import { getPrisma } from "@/app/lib/prisma";

export type WorkspaceAccess = {
  identity: { uid: string; email: string; name: string | null };
  workspace: Workspace;
  role: Role;
  userId: string;
};

type MembershipWithWorkspace = WorkspaceMember & { workspace: Workspace };

export async function findWorkspaceAccess(
  request: NextRequest,
): Promise<WorkspaceAccess | NextResponse> {
  const identity = await verifyFirebaseBearerToken(request);
  if (!isFirebaseIdentity(identity)) return identity;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Workspace services are not configured yet." },
      { status: 503 },
    );
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { firebaseUid: identity.uid },
    include: {
      memberships: {
        take: 1,
        orderBy: { createdAt: "asc" },
        include: { workspace: true },
      },
    },
  });
  const membership = user?.memberships[0] as MembershipWithWorkspace | undefined;

  if (!user || !membership) {
    return NextResponse.json(
      { error: "Your workspace is not set up yet. Please complete onboarding." },
      { status: 404 },
    );
  }

  return {
    identity,
    workspace: membership.workspace,
    role: membership.role,
    userId: user.id,
  };
}

export async function requireWorkspaceWriteAccess(
  request: NextRequest,
): Promise<WorkspaceAccess | NextResponse> {
  const access = await findWorkspaceAccess(request);
  if (access instanceof NextResponse) return access;

  const { workspace } = access;
  const trialOpen =
    workspace.subscriptionStatus === "TRIALING" &&
    workspace.trialEndsAt.getTime() > Date.now();
  const paidPeriodOpen =
    workspace.subscriptionStatus === "CANCELED" &&
    workspace.currentPeriodEnd !== null &&
    workspace.currentPeriodEnd.getTime() > Date.now();
  const paidPlanActive = workspace.subscriptionStatus === "ACTIVE";

  if (!trialOpen && !paidPeriodOpen && !paidPlanActive) {
    return NextResponse.json(
      {
        error: "Your trial has ended. Choose a plan to continue using workspace actions.",
        code: "SUBSCRIPTION_REQUIRED",
        billingUrl: "/workspace#billing",
      },
      { status: 402 },
    );
  }

  return access;
}
