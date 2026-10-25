import { NextRequest, NextResponse } from "next/server";
import { firebaseConfig } from "@/app/lib/firebase-config";

const buckets = new Map<string, { count: number; resetAt: number }>();
const slidingWindowScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, math.max(1, math.ceil((tonumber(oldest[2]) + windowMs - now) / 1000))}
end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, windowMs)
return {1, 0}
`;

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

export async function rateLimit(
  request: NextRequest,
  key: string,
  limit = 20,
  windowMs = 60_000,
): Promise<NextResponse | null> {
  const bucketKey = `${key}:${getClientIp(request)}`;
  const now = Date.now();

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        slidingWindowScript,
        "1",
        `rate:${bucketKey}`,
        String(now),
        String(windowMs),
        String(limit),
        crypto.randomUUID(),
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      return apiError("Rate limiting is temporarily unavailable.", 503);
    }

    const redisResult = (await response.json()) as {
      result?: unknown;
      error?: string;
    };
    if (redisResult.error || !Array.isArray(redisResult.result)) {
      return apiError("Rate limiting is temporarily unavailable.", 503);
    }

    if (Number(redisResult.result[0]) === 0) {
      const retryAfter = Math.max(1, Number(redisResult.result[1]) || 1);
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return apiError("Rate limiting is not configured.", 503);
  }

  if (buckets.size > 5000) {
    for (const [existingKey, existingBucket] of buckets) {
      if (existingBucket.resetAt <= now) buckets.delete(existingKey);
    }
  }

  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}

export async function requireBearerToken(
  request: NextRequest,
): Promise<NextResponse | null> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer ([^\s]+)$/)?.[1];

  if (!token) {
    return apiError("Authentication token required.", 401);
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
    return apiError("Authentication token is invalid or expired.", 401);
  }

  const result = (await response.json()) as {
    users?: { localId?: string }[];
  };
  if (!result.users?.[0]?.localId) {
    return apiError("Authentication token is invalid or expired.", 401);
  }

  return null;
}
