import { NextRequest, NextResponse } from "next/server";
import { findWorkspaceAccess, requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getPrisma } from "@/app/lib/prisma";

type WorkspaceSettingsPayload = {
  name?: unknown;
  brandName?: unknown;
  logoUrl?: unknown;
  brandColor?: unknown;
  customDomain?: unknown;
};

function validLogoUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validDomain(value: string) {
  return (
    value.length <= 253 &&
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value)
  );
}

export async function GET(request: NextRequest) {
  const access = await findWorkspaceAccess(request);
  if (access instanceof NextResponse) return access;

  const prisma = getPrisma();
  const workspace = await prisma.workspace.findUnique({
    where: { id: access.workspace.id },
    include: {
      _count: { select: { members: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const trialDaysRemaining = Math.max(
    0,
    Math.ceil((workspace.trialEndsAt.getTime() - Date.now()) / 86_400_000),
  );
  const effectiveWorkspace =
    workspace.subscriptionStatus === "TRIALING" && trialDaysRemaining === 0
      ? { ...workspace, subscriptionStatus: "EXPIRED" }
      : workspace;

  return NextResponse.json({
    workspace: effectiveWorkspace,
    trialDaysRemaining,
    memberRole: access.role,
    canManage: access.role === "OWNER" || access.role === "ADMIN",
  });
}

export async function PATCH(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.json({ error: "Workspace settings request is too large." }, { status: 413 });
  }
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;
  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only workspace owners and admins can change workspace settings." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as WorkspaceSettingsPayload | null;
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const brandName =
    typeof body?.brandName === "string" ? body.brandName.trim() : undefined;
  const logoUrl = typeof body?.logoUrl === "string" ? body.logoUrl.trim() : undefined;
  const brandColor =
    typeof body?.brandColor === "string" ? body.brandColor.trim() : undefined;
  const customDomain =
    typeof body?.customDomain === "string" ? body.customDomain.trim().toLowerCase() : undefined;

  if (
    (name !== undefined && (!name || name.length > 80)) ||
    (brandName !== undefined && brandName.length > 80) ||
    (logoUrl !== undefined && logoUrl && (!validLogoUrl(logoUrl) || logoUrl.length > 500)) ||
    (brandColor !== undefined && !/^#[0-9a-f]{6}$/i.test(brandColor)) ||
    (customDomain !== undefined && customDomain !== "" && !validDomain(customDomain))
  ) {
    return NextResponse.json(
      { error: "Check the workspace name, brand color, logo URL, and custom domain." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const workspace = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.workspace.update({
      where: { id: access.workspace.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(brandName !== undefined ? { brandName: brandName || null } : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
        ...(brandColor !== undefined ? { brandColor } : {}),
        ...(customDomain !== undefined ? { customDomain: customDomain || null } : {}),
      },
    });
    await transaction.auditLog.create({
      data: {
        workspaceId: updated.id,
        actorId: access.userId,
        action: "workspace.settings.updated",
      },
    });
    return updated;
  });

  return NextResponse.json({ workspace });
}
