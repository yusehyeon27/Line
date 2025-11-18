// lib/sendWorker.js

import { GoogleAuth } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import dayjs from "dayjs";
import { getServerAccessToken } from "../auth/tokenManager.js";

const SHEET_ID = process.env.SPREADSHEET_ID;
const BOT_ID = process.env.WORKS_BOT_ID;

/**
 * Google スプレッドシートに接続し、
 * 最初のシート情報と全行データを読み込む関数
 */
async function loadSheet() {
  // Google 認証設定（サービスアカウント）
  const auth = new GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // 改行エスケープを実際の改行に戻す
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // スプレッドシート読み込み
  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();

  // 1個目のシートを取得
  const sheet = doc.sheetsByIndex[0];

  // ヘッダー行の読み込み
  await sheet.loadHeaderRow();

  // 全行データを取得
  const rows = await sheet.getRows();

  return { sheet, rows };
}

/**
 * スプレッドシート内の「送信待機」メッセージを検出し、
 * その時間が過ぎていれば WORKS メッセージを送信する関数
 */
export async function sendPendingMessages(providedAccessToken) {
  const result = { success: true, count: 0, errors: [] };

  try {
    // アクセストークンが引数で渡されていなければサーバー側で取得
    let ACCESS_TOKEN = providedAccessToken || "";
    if (!ACCESS_TOKEN) {
      ACCESS_TOKEN = await getServerAccessToken();
    }

    // シートの読み込み
    const { sheet, rows } = await loadSheet();

    // ヘッダー名から列インデックスを取得
    const headers = sheet.headerValues;
    const stateIndex = headers.findIndex((h) => h.trim() === "状態");
    const messageIndex = headers.findIndex(
      (h) => h.trim() === "メッセージ内容"
    );
    const groupIndex = headers.findIndex((h) => h.trim() === "グループ");
    const userIndex = headers.findIndex((h) => h.trim() === "ユーザーID");
    const timeIndex = headers.findIndex((h) => h.trim() === "送信時間");

    const now = dayjs();

    // 送信待機で、かつ送信時間が現在時刻を過ぎている行を抽出
    const waitingRows = rows.filter((r) => {
      const state = r._rawData[stateIndex]?.trim();
      const sendTimeStr = r._rawData[timeIndex]?.trim();

      // 状態が "送信待機" でない、または送信時間が空なら対象外
      if (state !== "送信待機" || !sendTimeStr) return false;

      const sendTime = dayjs(sendTimeStr);
      return sendTime.isBefore(now); // 過去の時間なら送信対象
    });

    result.count = waitingRows.length;

    // 各対象行に対してメッセージ送信を実行
    for (const row of waitingRows) {
      const raw = row._rawData;

      const message = raw[messageIndex];
      const groupId = raw[groupIndex];

      // ユーザーIDが複数書かれている場合、カンマ区切りで配列化
      const userIds = (raw[userIndex] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let success = false;

      /**
       * ① 個別ユーザー宛てメッセージ送信
       */
      if (userIds.length > 0) {
        for (const id of userIds) {
          try {
            const res = await fetch(
              `https://www.worksapis.com/v1.0/bots/${BOT_ID}/users/${id}/messages`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  content: { type: "text", text: message },
                }),
              }
            );

            if (res.ok) {
              success = true;
            } else {
              // エラー内容を記録
              const txt = await res.text();
              result.errors.push({ id, status: res.status, body: txt });
            }
          } catch (err) {
            // fetch 自体の失敗を記録
            result.errors.push({ id, error: String(err) });
          }
        }

        /**
         * ② グループ宛てメッセージ送信
         */
      } else if (groupId) {
        try {
          const res = await fetch(
            `https://www.worksapis.com/v1.0/bots/${BOT_ID}/channels/${groupId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: { type: "text", text: message },
              }),
            }
          );

          if (res.ok) success = true;
          else {
            const txt = await res.text();
            result.errors.push({ groupId, status: res.status, body: txt });
          }
        } catch (err) {
          result.errors.push({ groupId, error: String(err) });
        }
      }

      /**
       * 送信成功した場合、シートの状態を「送信済み」に更新
       */
      if (success) {
        row._rawData[stateIndex] = "送信済み";
        await row.save(); // スプレッドシートへ書き込み
      }
    }

    return result;
  } catch (err) {
    // 全体の処理自体が失敗した場合
    return { success: false, error: (err && err.message) || String(err) };
  }
}

export default sendPendingMessages;
