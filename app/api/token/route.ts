// app/api/token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { saveTokensToDisk } from "../../../auth/tokenManager.js";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  // Use server-side env variables for secrets (do not expose client_secret to the browser)
  params.append("client_id", process.env.CLIENT_ID!);
  params.append("client_secret", process.env.CLIENT_SECRET!);
  params.append("redirect_uri", process.env.REDIRECT_URI!);

  const res = await fetch("https://auth.worksmobile.com/oauth2/v2.0/token", {
    method: "POST",
    body: params.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await res.json();

  // Create response with token data
  const response = NextResponse.json(data);

  // Store accessToken in httpOnly cookie (secure, not accessible from JS)
  if (data.access_token) {
    response.cookies.set("accessToken", data.access_token, {
      httpOnly: true,
      secure: true, // Allow in development (self-signed certs); set to true in production
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }

  // Persist tokens to disk so server processes (scripts, cron jobs) can reuse and refresh them
  try {
    await saveTokensToDisk(data);
  } catch (err) {
    // Don't block the response on persistence failures, but log for debugging
    console.warn(
      "Could not persist tokens from /api/token:",
      (err as Error).message || err
    );
  }

  return response;
}
