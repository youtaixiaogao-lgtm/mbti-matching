"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("認証を確認中...");

  useEffect(() => {
    const handleCallback = async () => {
      // URLのハッシュフラグメントからセッションを取得
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setMessage("認証に失敗しました。もう一度お試しください。");
        setTimeout(() => router.push("/auth"), 3000);
        return;
      }

      if (session) {
        // プロフィール登録済みかチェック
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          router.push("/discover");
        } else {
          router.push("/register");
        }
      } else {
        setMessage("メールアドレスが確認されました。ログインしてください。");
        setTimeout(() => router.push("/auth"), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-pink-500 mb-4">MBTI Match</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
