// scripts/sendMessage.js

import { getServerAccessToken } from "../auth/tokenManager.js";
import sendPendingMessages from "../lib/sendWorker.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

(async () => {
  try {
    console.log("🚀 メッセージ送信プロセス開始...");
    let accessToken = "";
    try {
      accessToken = await getServerAccessToken();
    } catch (e) {
      throw new Error(
        "サーバー保存トークンが見つかりません。まずブラウザで OAuth を完了してください。"
      );
    }

    console.log("📤 スプレッドシートの待機送信システムを開始します...");
    const res = await sendPendingMessages(accessToken);
    const { count, ...rest } = res;
    console.log("✅送信作業結果:", rest);
  } catch (err) {
    console.error("💥 メッセージ送信エラー:", err.message);
  }
})();
