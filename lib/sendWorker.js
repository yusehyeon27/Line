// lib/sendWorker.js

import { GoogleAuth } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import dayjs from "dayjs";
import { getServerAccessToken } from "../auth/tokenManager.js";

const SHEET_ID = process.env.SPREADSHEET_ID;
const BOT_ID = process.env.WORKS_BOT_ID;

async function loadSheet() {
  const auth = new GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  return { sheet, rows };
}

export async function sendPendingMessages(providedAccessToken) {
  const result = { success: true, count: 0, errors: [] };

  try {
    let ACCESS_TOKEN = providedAccessToken || "";
    if (!ACCESS_TOKEN) {
      ACCESS_TOKEN = await getServerAccessToken();
    }

    const { sheet, rows } = await loadSheet();

    const headers = sheet.headerValues;
    const stateIndex = headers.findIndex((h) => h.trim() === "状態");
    const messageIndex = headers.findIndex(
      (h) => h.trim() === "メッセージ内容"
    );
    const groupIndex = headers.findIndex((h) => h.trim() === "グループ");
    const userIndex = headers.findIndex((h) => h.trim() === "ユーザーID");
    const timeIndex = headers.findIndex((h) => h.trim() === "送信時間");

    const now = dayjs();
    const waitingRows = rows.filter((r) => {
      const state = r._rawData[stateIndex]?.trim();
      const sendTimeStr = r._rawData[timeIndex]?.trim();
      if (state !== "送信待機" || !sendTimeStr) return false;
      const sendTime = dayjs(sendTimeStr);
      return sendTime.isBefore(now);
    });

    result.count = waitingRows.length;

    for (const row of waitingRows) {
      const raw = row._rawData;
      const message = raw[messageIndex];
      const groupId = raw[groupIndex];
      const userIds = (raw[userIndex] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let success = false;

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
              const txt = await res.text();
              result.errors.push({ id, status: res.status, body: txt });
            }
          } catch (err) {
            result.errors.push({ id, error: String(err) });
          }
        }
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

      row._rawData[stateIndex] = "送信中";
      await row.save(); // 送信前に状態修正

      try {
        // ... send message ...
        success = true;
      } catch (err) {
        result.errors.push({ id, error: String(err) });
      }

      // 最終的に成功すると"送信済み"に変更
      if (success) {
        row._rawData[stateIndex] = "送信済み";
        await row.save();
      }
    }

    return result;
  } catch (err) {
    return { success: false, error: (err && err.message) || String(err) };
  }
}

export default sendPendingMessages;
