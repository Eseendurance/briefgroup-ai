import { NextRequest, NextResponse } from "next/server";
import { apiError, rateLimit, requireBearerToken } from "@/app/lib/api-security";

type InspectionPayload = {
  fileName?: string;
  fileSize?: number;
  category?: "energy" | "farm" | "machine" | "computer";
  notes?: string;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "inspections", 10);
  if (limited) return limited;

  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => null)) as InspectionPayload | null;
  if (!body?.fileName) return apiError("Inspection file name is required.");

  const fileSize = Number(body.fileSize ?? 0);
  if (fileSize > 10 * 1024 * 1024) {
    return apiError("Inspection uploads must be under 10MB.", 413);
  }

  const risk =
    body.category === "machine"
      ? "medium"
      : body.category === "computer"
        ? "low"
        : "watch";

  return NextResponse.json({
    inspectionId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    status: "queued",
    risk,
    engine:
      "Computer inspection engine queued the evidence for anomaly, metadata, and operational context review.",
    nextStep:
      "Store the original file in Firebase Storage and save this inspection record in Firestore.",
  });
}
