//cron.js
import cron from "node-cron";
import { exec } from "child_process";

// 5分ごとに実行
//cron.schedule("*/5 * * * *", () => {
// 60分ごとに実行
cron.schedule("0 * * * *", () => {
  console.log("⏳ 60分ごとの sendMessage.js 実行開始...");

  exec("node scripts/sendMessage.js", (error, stdout, stderr) => {
    if (error) {
      console.error("💥 実行エラー:", error);
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
});

console.log("🟢 Cron スケジューラーが起動しました (60分ごとに実行)");
