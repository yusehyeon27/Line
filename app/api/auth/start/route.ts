// app/api/auth/start/route.ts

import { NextResponse } from "next/server";
import { buildAuthUrl } from "../../../../auth/tokenManager.js";

export async function GET() {
  const url = buildAuthUrl();
  return NextResponse.redirect(url);
}
