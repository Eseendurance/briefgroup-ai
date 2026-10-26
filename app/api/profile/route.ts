import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/app/lib/api-security";
import {
  isFirebaseIdentity,
  verifyFirebaseBearerToken,
} from "@/app/lib/firebase-server-auth";
import { getFirebaseAdmin } from "@/app/lib/firebase-admin";
import { requireWorkspaceWriteAccess } from "@/app/lib/billing-access";

type ProfilePayload = {
  role?: unknown;
  goal?: unknown;
  workspaceName?: unknown;
  teamSize?: unknown;
  region?: unknown;
};

const teamSizes = new Set(["1", "2-5", "6-20", "21+"]);

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.json({ error: "Profile request is too large." }, { status: 413 });
  }
  const limited = await rateLimit(request, "profile-setup", 10);
  if (limited) return limited;

  const identity = await verifyFirebaseBearerToken(request);
  if (!isFirebaseIdentity(identity)) return identity;
  const body = (await request.json().catch(() => null)) as ProfilePayload | null;
  const role = typeof body?.role === "string" ? body.role.trim() : "";
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  const workspaceName =
    typeof body?.workspaceName === "string" ? body.workspaceName.trim() : "";
  const teamSize = typeof body?.teamSize === "string" ? body.teamSize : "";
  const region = typeof body?.region === "string" ? body.region.trim() : "";

  if (
    role.length > 80 ||
    goal.length > 80 ||
    workspaceName.length > 80 ||
    (teamSize && !teamSizes.has(teamSize)) ||
    region.length > 80
  ) {
    return NextResponse.json({ error: "Check your profile details and try again." }, { status: 400 });
  }

  const { firestore } = getFirebaseAdmin();
  await firestore.collection("users").doc(identity.uid).set(
    {
      uid: identity.uid,
      email: identity.email,
      name: identity.name,
      ...(role ? { role } : {}),
      ...(goal ? { goal } : {}),
      ...(workspaceName ? { workspaceName } : {}),
      ...(teamSize ? { teamSize } : {}),
      ...(region ? { region } : {}),
      enableHealthHub: false,
      safetyReminders: true,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { merge: true },
  );
  return NextResponse.json({ saved: true });
}

export async function PATCH(request: NextRequest) {
  const access = await requireWorkspaceWriteAccess(request);
  if (access instanceof NextResponse) return access;
  const body = (await request.json().catch(() => null)) as {
    enableHealthHub?: unknown;
  } | null;
  if (typeof body?.enableHealthHub !== "boolean") {
    return NextResponse.json({ error: "Choose whether to enable wellbeing reminders." }, { status: 400 });
  }

  const { firestore } = getFirebaseAdmin();
  await firestore.collection("users").doc(access.identity.uid).set(
    {
      enableHealthHub: body.enableHealthHub,
      safetyReminders: body.enableHealthHub,
      updatedAt: new Date(),
    },
    { merge: true },
  );
  return NextResponse.json({ enableHealthHub: body.enableHealthHub });
}
