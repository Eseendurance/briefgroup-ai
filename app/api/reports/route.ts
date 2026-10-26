import { NextRequest, NextResponse } from "next/server";
import { apiError, rateLimit } from "@/app/lib/api-security";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";
import { getFirebaseAdmin } from "@/app/lib/firebase-admin";

type ReportPayload = {
  energyLoad?: number;
  machineHealth?: number;
  rainfallRisk?: number;
  inspectionFindings?: string;
};

function scoreLabel(score: number) {
  if (score >= 80) return "strong";
  if (score >= 60) return "stable";
  if (score >= 40) return "watch";
  return "critical";
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "reports", 12);
  if (limited) return limited;

  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;

  const body = (await request.json().catch(() => null)) as ReportPayload | null;
  if (!body) return apiError("Invalid report payload.");

  const energyLoad = Number(body.energyLoad ?? 68);
  const machineHealth = Number(body.machineHealth ?? 82);
  const rainfallRisk = Number(body.rainfallRisk ?? 34);
  const inspectionFindings = String(body.inspectionFindings ?? "").slice(0, 500);
  const inputs = [energyLoad, machineHealth, rainfallRisk];

  if (inputs.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    return apiError("Energy, machine health, and rainfall values must be between 0 and 100.");
  }

  const operationalScore = Math.round(
    machineHealth * 0.45 + (100 - rainfallRisk) * 0.25 + (100 - energyLoad) * 0.3,
  );

  const result = {
    title: "Brief Group Operational Summary",
    generatedAt: new Date().toISOString(),
    operationalScore,
    status: scoreLabel(operationalScore),
    summary:
      `Current infrastructure status is ${scoreLabel(operationalScore)} with ` +
      `${energyLoad}% energy load, ${machineHealth}% machine health, and ` +
      `${rainfallRisk}% rainfall exposure.`,
    recommendations: [
      energyLoad > 75
        ? "Shift non-critical energy demand to lower-load operating windows."
        : "Maintain current energy monitoring cadence.",
      machineHealth < 70
        ? "Schedule machine inspection before the next high-demand cycle."
        : "Keep predictive maintenance threshold active.",
      rainfallRisk > 55
        ? "Review farm and field operation timing against weather exposure."
        : "Proceed with normal field monitoring.",
      inspectionFindings
        ? `Inspection note captured: ${inspectionFindings}`
        : "Upload inspection evidence to enrich future reports.",
    ],
  };

  const { firestore } = getFirebaseAdmin();
  const report = await firestore.collection("reports").add({
    ...result,
    ownerId: access.identity.uid,
    workspaceId: access.workspace.id,
    createdAt: new Date(),
  });
  return NextResponse.json({ ...result, id: report.id }, { status: 201 });
}
