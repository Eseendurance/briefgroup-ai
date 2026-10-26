import { resolveTxt } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getPrisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;
  if (access.role !== Role.OWNER && access.role !== Role.ADMIN) {
    return NextResponse.json(
      { error: "Only workspace owners and admins can verify a domain." },
      { status: 403 },
    );
  }

  const prisma = getPrisma();
  const workspace = await prisma.workspace.findUnique({
    where: { id: access.workspace.id },
    select: { customDomain: true, domainVerificationToken: true },
  });
  const domain = workspace?.customDomain ?? null;
  const token = workspace?.domainVerificationToken ?? null;
  if (!domain || !token) {
    return NextResponse.json({ error: "Add a custom domain before verifying it." }, { status: 400 });
  }

  const recordName = `_briefgroup-verify.${domain}`;
  let records: string[][];
  try {
    records = await resolveTxt(recordName);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "ENODATA" || error.code === "ENOTFOUND")
    ) {
      return NextResponse.json(
        { error: `The TXT record ${recordName} was not found yet. DNS changes can take time to propagate.` },
        { status: 409 },
      );
    }
    throw error;
  }
  if (!records.some((record) => record.join("") === `briefgroup=${token}`)) {
    return NextResponse.json(
      { error: `The TXT record ${recordName} does not match the workspace verification value.` },
      { status: 409 },
    );
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: access.workspace.id },
    data: {
      customDomainVerifiedAt: new Date(),
      domainVerificationToken: null,
    },
    select: { customDomain: true, customDomainVerifiedAt: true },
  });
  await prisma.auditLog.create({
    data: {
      workspaceId: access.workspace.id,
      actorId: access.userId,
      action: "workspace.domain.verified",
      target: domain,
    },
  });
  return NextResponse.json({ workspace: updatedWorkspace });
}
