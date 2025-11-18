"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter(); // ページ遷移用 Hook（クライアントコンポーネント）

  /**
   * ボタンの共通スタイル
   * ※ inline style を使用しているため、CSSProperties 型を指定
   */
  const buttonStyle: React.CSSProperties = {
    backgroundColor: "rgb(7, 181, 59)", // LINE WORKS イメージカラー系
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    padding: "20px 40px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    width: "220px",
    transition: "0.2s", // hover 時の滑らかなアニメーション
  };

  /**
   * 画面全体のコンテナ（中央に配置）
   */
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // 縦方向中央揃え
    alignItems: "center", // 横方向中央揃え
    minHeight: "100vh",
    gap: "20px",
    backgroundColor: "#f7f7f7",
  };

  /**
   * ボタンを縦に並べるためのラッパー
   */
  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  return (
    <div style={containerStyle}>
      <div style={buttonGroupStyle}>
        {/* 予約作成ページへ遷移 */}
        <button
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")} // hover 時の軽いエフェクト
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => router.push("/reservation")} // Next.js でクライアント遷移
        >
          予約ページへ
        </button>

        {/* 予約一覧ページへ遷移 */}
        <button
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => router.push("/reservation-list")}
        >
          予約一覧へ
        </button>
      </div>
    </div>
  );
}
