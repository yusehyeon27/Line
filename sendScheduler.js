// sendScheduler.js
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();

import sendPendingMessages from "./lib/sendWorker.js";
import { getServerAccessToken } from "./auth/tokenManager.js";

console.log("⏳ 定期送信スケジューラー起動中...");

cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ 5分ごとのメッセージ送信タスク開始...");

  try {
    const accessToken = await getServerAccessToken();
    const res = await sendPendingMessages(accessToken);
    console.log("✅ 送信結果:", res);
  } catch (err) {
    console.error("💥 タスクエラー:", err.message);
  }
});

// 매시간 0분에 실행

// cron.schedule("0 * * * *", async () => {
//   console.log("⏰ 1時間ごとのメッセージ送信タスク開始...");

//   try {
//     const accessToken = await getServerAccessToken();
//     const res = await sendPendingMessages(accessToken);
//     console.log("✅ 定期送信完了:", res);
//   } catch (err) {
//     console.error("💥 タスクエラー:", err.message);
//   }
// });
