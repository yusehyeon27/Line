// app/api/sendMessage/route.ts
import { NextResponse } from "next/server";
import { getServerAccessToken } from "@/auth/tokenManager";
import sendPendingMessages from "@/lib/sendWorker";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🚀 Scheduled function triggered");
    const accessToken = await getServerAccessToken();
    const res = await sendPendingMessages(accessToken);
    console.log("✅送信結果:", res);
    return NextResponse.json({ ok: true, result: res });
  } catch (err: any) {
    console.error("💥 Error:", err.message);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
