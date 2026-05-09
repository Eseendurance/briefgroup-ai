import { NextRequest, NextResponse } from "next/server";
import { apiError, rateLimit, requireBearerToken } from "@/app/lib/api-security";

type WeatherPayload = {
  latitude?: number;
  longitude?: number;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "weather", 30);
  if (limited) return limited;

  const unauthorized = requireBearerToken(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => null)) as WeatherPayload | null;
  const latitude = body?.latitude ?? 6.5244;
  const longitude = body?.longitude ?? 3.3792;

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return apiError("Invalid coordinates.");
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    return apiError("Weather provider is unavailable.", 502);
  }

  const weather = await response.json();

  return NextResponse.json({
    location: { latitude, longitude },
    weather,
  });
}
