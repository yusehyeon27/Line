// app/callback/CallbackPageClient.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CallbackPageClient() {
  const searchParams = useSearchParams(); // URL の検索パラメータ（?code=xxxx）を取得
  const router = useRouter(); // ページ遷移用

  /**
   * LINE WORKS OAuth リダイレクト後の処理
   * - URL に含まれる `code` を取得
   * - その code をバックエンド (/api/token) に送ってアクセストークンを交換
   * - 成功したら /main に遷移
   */
  useEffect(() => {
    const code = searchParams.get("code");

    // code が存在しなければトップへ戻す
    if (!code) {
      router.push("/");
      return;
    }

    /**
     * 認証コードをバックエンドへ送信し、アクセストークンに交換する処理
     */
    const exchangeCodeForToken = async () => {
      try {
        // API Route に POST → サーバーで token に交換
        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        // トークン交換失敗
        if (!tokenRes.ok) {
          console.error("Token exchange failed:", tokenRes.status);
          router.push("/");
          return;
        }

        // 成功 → メイン画面へ遷移
        router.push("/main");
      } catch (err) {
        // 通信エラーなど
        console.error("Error exchanging code:", err);
        router.push("/");
      }
    };

    // 実行
    exchangeCodeForToken();
  }, [searchParams, router]);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <p>ログイン中...</p>
      {/* 認証中の簡易表示 */}
    </div>
  );
}
