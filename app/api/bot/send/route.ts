// app/api/bot/send/route.ts

import { NextResponse } from "next/server";
import sendPendingMessages from "../../../../lib/sendWorker.js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = body.accessToken || "";
    const res = await sendPendingMessages(accessToken);
    if (res && res.success) return NextResponse.json(res);
    return NextResponse.json({ success: false, error: res }, { status: 500 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
