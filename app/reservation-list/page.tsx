"use client";

import React, { useEffect, useState } from "react";

export default function ReservationListPage() {
  const [data, setData] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  //totalPages を data に応じて自動的に計算する
  const totalPages = React.useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data]);

  //currentData も data または currentPage の変更時に自動更新
  const currentData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage]);

  //currentPageがtotalPagesより大きい場合は自動的に修正
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages]);

  // ====データ取得====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sheets");
        const sheetData = await res.json();

        console.log(
          "📄 raw fetch count:",
          Array.isArray(sheetData) ? sheetData.length : "not array",
          sheetData
        );

        if (!Array.isArray(sheetData)) {
          console.error("配列ではないです：", sheetData);
          setData([]);
          return;
        }

        // 1) id がない、または重複した項目を防止: id で重複排除
        const dedupMap = new Map<string, any>();
        for (const item of sheetData) {
          // item.id がなければフォールバック: time+message を組み合わせた一時キー (推奨: スプレッドシートに id 必須)
          const key =
            item.id ??
            `${item.time ?? ""}__${(item.message ?? "").slice(0, 50)}`;
          if (!dedupMap.has(key))
            dedupMap.set(key, { ...item, id: item.id ?? key });
        }
        const deduped = Array.from(dedupMap.values());

        console.log("📄 deduped count:", deduped.length);

        // 2) 最新順にソート
        deduped.sort((a: any, b: any) => {
          const ta = new Date(a.time).getTime() || 0;
          const tb = new Date(b.time).getTime() || 0;
          return tb - ta;
        });

        // 3) setData (そして currentPage 安全補正)
        setData(deduped);
      } catch (err) {
        console.error("❌ データ取得エラー:", err);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sheets?id=${id}`, { method: "DELETE" });
      const result = await res.json();

      if (res.ok) {
        alert("削除しました。");
        setData((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(`削除失敗: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ 削除エラー:", err);
      alert("削除中にエラーが発生しました。");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* 登録ボタン */}
      <div style={buttonArea}>
        <button
          style={registerBtn}
          onClick={() => (location.href = "/reservation")}
        >
          ＋ 登録
        </button>
      </div>

      {/* ==== テーブル ==== */}
      <table
        style={{
          width: "80%",
          borderCollapse: "collapse",
          textAlign: "center",
          margin: "0 auto",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>送信時間</th>
            <th style={{ ...thStyle, width: "216px" }}>個人</th>
            <th style={{ ...thStyle, width: "216px" }}>グループ</th>
            <th style={thStyle}>メッセージ内容</th>
            <th style={thStyle}>状態</th>
            <th style={thStyle}>修正</th>
            <th style={thStyle}>削除</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>
                {(() => {
                  const parts = row.time?.split(" ");
                  if (!parts || parts.length < 2) return row.time;
                  const [date, time] = parts;
                  return (
                    <>
                      <div>{date}</div>
                      <div style={{ fontSize: "15px" }}>{time.slice(0, 5)}</div>
                    </>
                  );
                })()}
              </td>

              {/* <td style={tdStyle}>{row.targetUser}</td> */}
              <td
                style={{
                  ...tdStyle,
                  width: "216px",
                  maxWidth: "216px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
                title={row.targetUser}
                onClick={() => setSelectedUser(row.targetUser)}
              >
                {row.targetUser}
              </td>
              <td style={tdStyle}>{row.targetGroup}</td>
              <td
                style={{ ...tdStyle, cursor: "pointer" }}
                onClick={() => setSelectedMessage(row.message)}
              >
                {row.message?.length > 30
                  ? row.message.slice(0, 30) + "..."
                  : row.message}
              </td>
              <td style={tdStyle}>{row.status}</td>
              <td style={tdStyle}>
                {row.status !== "送信済み" && (
                  <button
                    style={editBtn}
                    onClick={() =>
                      (window.location.href = `/reservation/${row.id}`)
                    }
                  >
                    修正
                  </button>
                )}
              </td>
              <td style={tdStyle}>
                <button
                  style={deleteBtn}
                  onClick={() => setDeleteTarget(row.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ==== ページング ==== */}
      <div style={paginationContainer}>
        <button
          style={pageBtn}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          前へ
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            style={{
              ...pageBtn,
              ...(currentPage === i + 1 ? activePageBtn : {}),
            }}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          style={pageBtn}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          次へ
        </button>
      </div>

      {/* ==== 送付対象の社員モーダル ==== */}
      {selectedUser && (
        <div style={modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={modalTitle}>送付対象の社員</h3>
            </div>
            <div style={modalContent}>
              <ul style={{ paddingLeft: "20px", margin: 0 }}>
                {selectedUser.split("、").map((name, index) => (
                  <li key={index} style={{ marginBottom: "6px" }}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <button
                style={modalCloseBtn}
                onClick={() => setSelectedUser(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== メッセージ全文モーダル ==== */}
      {selectedMessage && (
        <div style={modalOverlay} onClick={() => setSelectedMessage(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={modalTitle}>メッセージ全文</h3>
            </div>
            <div style={modalContent}>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {selectedMessage}
              </pre>
            </div>
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <button
                style={modalCloseBtn}
                onClick={() => setSelectedMessage(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== 削除確認モーダル ==== */}
      {deleteTarget !== null && (
        <div style={modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...modalHeader, backgroundColor: "rgb(7, 181, 59)" }}>
              <h3 style={modalTitle}>削除確認</h3>
            </div>
            <div style={modalContent}>
              <p>このメッセージを削除しますか？</p>
            </div>
            <div style={modalFooter}>
              <button style={cancelBtn} onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
              <button style={okBtn} onClick={() => handleDelete(deleteTarget!)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==== 以下、スタイルはあなたのままでOK ==== */
// thStyle, tdStyle, editBtn, deleteBtn, paginationContainer, pageBtn, activePageBtn, modalOverlay, modalBox, modalHeader, modalTitle, modalContent, modalFooter, modalCloseBtn, cancelBtn, okBtn, buttonArea, registerBtn
// （既存のものをそのまま貼り付けて大丈夫です）

/* ==== スタイル ==== */
const thStyle: React.CSSProperties = {
  borderBottom: "2px solid #ccc",
  padding: "10px",
};
const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px",
};
const editBtn: React.CSSProperties = {
  background: "rgb(17,141,255)",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  cursor: "pointer",
};
const deleteBtn: React.CSSProperties = {
  background: "rgb(7, 181, 59)",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  cursor: "pointer",
};

/* ==== ページング ==== */
const paginationContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "5px",
  marginTop: "20px",
};

const pageBtn: React.CSSProperties = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#ccc",
  background: "#fff",
  color: "#333",
  padding: "5px 10px",
  cursor: "pointer",
  borderRadius: "4px",
};

const activePageBtn: React.CSSProperties = {
  background: "rgb(17,141,255)",
  color: "#fff",
  borderColor: "rgb(17,141,255)",
};

/* ==== モーダル ==== */
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox: React.CSSProperties = {
  background: "#fff",
  borderRadius: "8px",
  maxWidth: "500px",
  width: "90%",
  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  overflow: "hidden",
  paddingBottom: "15px",
};

const modalHeader: React.CSSProperties = {
  backgroundColor: "rgb(7, 181, 59)",
  color: "#fff",
  padding: "10px 0",
  textAlign: "center",
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "bold",
};

const modalContent: React.CSSProperties = {
  padding: "15px 20px",
  maxHeight: "300px",
  overflowY: "auto",
  fontSize: "15px",
  lineHeight: "1.8",
};

const modalFooter: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  paddingRight: "40px",
};

const modalCloseBtn: React.CSSProperties = {
  background: "rgb(17,141,255)",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "40px",
};

const cancelBtn: React.CSSProperties = {
  background: "#fff",
  color: "#333",
  border: "1px solid #ccc",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const okBtn: React.CSSProperties = {
  background: "rgb(17,141,255)",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const buttonArea: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  marginTop: "20px",
  marginBottom: "10px",
  marginLeft: "40px",
};

const registerBtn: React.CSSProperties = {
  background: "rgb(7, 181, 59)", // 💚 緑
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
};
