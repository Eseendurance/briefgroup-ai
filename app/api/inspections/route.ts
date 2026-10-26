import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/api-security";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getFirebaseAdmin } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

const maxUploadBytes = 10 * 1024 * 1024;
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxUploadBytes + 16_384) {
    return NextResponse.json(
      { error: "Inspection files must be smaller than 10 MB." },
      { status: 413 },
    );
  }
  const limited = await rateLimit(request, "inspection-upload", 8);
  if (limited) return limited;
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an inspection image or PDF." }, { status: 400 });
  }
  if (!supportedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP image, or PDF file." },
      { status: 415 },
    );
  }
  if (file.size === 0 || file.size > maxUploadBytes) {
    return NextResponse.json(
      { error: "Inspection files must be between 1 byte and 10 MB." },
      { status: 413 },
    );
  }

  const { firestore, storage } = getFirebaseAdmin();
  const fileId = crypto.randomUUID();
  const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  const storagePath = `inspections/${access.identity.uid}/${fileId}-${originalName}`;
  const bucket = storage.bucket();
  if (!bucket.name) {
    return NextResponse.json(
      { error: "Firebase Storage bucket is not configured for server uploads." },
      { status: 503 },
    );
  }
  const storedFile = bucket.file(storagePath);
  await storedFile.save(Buffer.from(await file.arrayBuffer()), {
    resumable: false,
    metadata: {
      contentType: file.type,
      metadata: { ownerId: access.identity.uid, workspaceId: access.workspace.id },
    },
  });

  try {
    const record = await firestore.collection("inspections").add({
      ownerId: access.identity.uid,
      workspaceId: access.workspace.id,
      fileName: file.name,
      storagePath,
      fileSize: file.size,
      contentType: file.type,
      status: "stored",
      createdAt: new Date(),
    });
    await getFirebaseAdmin().firestore.collection("users").doc(access.identity.uid).set(
      { lastSeenAt: new Date() },
      { merge: true },
    );
    return NextResponse.json(
      { id: record.id, fileName: file.name, storagePath },
      { status: 201 },
    );
  } catch (error) {
    await storedFile.delete({ ignoreNotFound: true });
    throw error;
  }
}
