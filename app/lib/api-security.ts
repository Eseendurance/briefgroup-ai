import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

export function rateLimit(
  request: NextRequest,
  key: string,
  limit = 20,
  windowMs = 60_000,
) {
  const bucketKey = `${key}:${getClientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return apiError("Too many requests. Please try again shortly.", 429);
  }

  return null;
}

export function requireBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return apiError("Authentication token required.", 401);
  }

  return null;
}
