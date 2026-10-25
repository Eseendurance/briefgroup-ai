import { NextRequest, NextResponse } from "next/server";
import { firebaseConfig } from "@/app/lib/firebase-config";

export type FirebaseIdentity = {
  uid: string;
  email: string;
  name: string | null;
};

export async function verifyFirebaseBearerToken(
  request: NextRequest,
): Promise<FirebaseIdentity | NextResponse> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return NextResponse.json({ error: "Authentication token required." }, { status: 401 });
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Authentication token is invalid or expired." },
      { status: 401 },
    );
  }

  const result = (await response.json()) as {
    users?: { localId?: string; email?: string; displayName?: string }[];
  };
  const identity = result.users?.[0];
  if (!identity?.localId || !identity.email) {
    return NextResponse.json(
      { error: "Authentication token is invalid or expired." },
      { status: 401 },
    );
  }

  return {
    uid: identity.localId,
    email: identity.email,
    name: identity.displayName ?? null,
  };
}

export function isFirebaseIdentity(
  value: FirebaseIdentity | NextResponse,
): value is FirebaseIdentity {
  return !(value instanceof NextResponse);
}
