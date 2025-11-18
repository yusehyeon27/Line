"use client";

import { useState } from "react";

export default function ReservationPage() {
  // ユーザー一覧を保持する state（このページではまだ未使用だが将来機能のために残している）
  const [userList, setUserList] = useState([]);

  /**
   * LINE WORKS OAuth ログイン開始処理
   * 認証 URL を生成し、LINE WORKS のログインページへリダイレクトする
   */
  const handleLogin = () => {
    // 認証エンドポイントの URL 作成
    const authUrl = new URL(
      "https://auth.worksmobile.com/oauth2/v2.0/authorize"
    );

    // クライアント ID（公開可能なフロント用 ID）
    authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_CLIENT_ID!);

    // 認証後に戻ってくる URL
    authUrl.searchParams.set(
      "redirect_uri",
      process.env.NEXT_PUBLIC_REDIRECT_URI!
    );

    // OAuth 2.0 のコード方式
    authUrl.searchParams.set("response_type", "code");

    // 要求する権限（profile / bot 等）
    authUrl.searchParams.set("scope", process.env.NEXT_PUBLIC_SCOPE!);

    // CSRF 対策の state（任意の文字列）
    authUrl.searchParams.set("state", "lineworks_oauth");

    // 生成した URL へページ遷移 → ユーザーが LINE WORKS にログイン
    window.location.href = authUrl.toString();
  };

  // NOTE: クライアント ID などは公開情報だが、秘密鍵などは絶対にログに出さないこと

  return (
    <div>
      <h1>LINEWORKS ログイン</h1>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        ログイン
      </button>
    </div>
  );
}
