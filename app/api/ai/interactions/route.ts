import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/api-security";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getFirebaseAdmin } from "@/app/lib/firebase-admin";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 16_384) {
    return NextResponse.json({ error: "Conversation record is too large." }, { status: 413 });
  }
  const limited = await rateLimit(request, "save-ai-interaction", 20);
  if (limited) return limited;
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;

  const body = (await request.json().catch(() => null)) as {
    domain?: unknown;
    prompt?: unknown;
    reply?: unknown;
  } | null;
  if (
    typeof body?.prompt !== "string" ||
    !body.prompt.trim() ||
    body.prompt.length > 1200 ||
    typeof body.reply !== "string" ||
    !body.reply.trim() ||
    body.reply.length > 6000 ||
    typeof body.domain !== "string" ||
    body.domain.length > 40
  ) {
    return NextResponse.json({ error: "Conversation details are invalid." }, { status: 400 });
  }

  const { firestore } = getFirebaseAdmin();
  const interaction = await firestore.collection("aiInteractions").add({
    ownerId: access.identity.uid,
    workspaceId: access.workspace.id,
    domain: body.domain,
    prompt: body.prompt.trim(),
    reply: body.reply.trim(),
    createdAt: new Date(),
  });
  return NextResponse.json({ id: interaction.id }, { status: 201 });
}
