"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      const { data: signUpData, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (err) {
        if (err.message.includes("already registered") || err.message.includes("already been registered")) {
          setError("このメールアドレスは既に登録されています。ログインしてください。");
          setMode("login");
        } else {
          setError(err.message);
        }
        return;
      }
      // Supabaseは既存メールでもエラーを返さない場合がある（identities空）
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError("このメールアドレスは既に登録されています。ログインしてください。");
        setMode("login");
        return;
      }
      setMessage("確認メールを送信しました。メール内のリンクをクリックしてください。");
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (err) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          router.push("/discover");
        } else {
          router.push("/register");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">MBTI Match</h1>
        <p className="text-gray-500 text-center mb-6">
          {mode === "signup" ? "アカウント作成" : "ログイン"}
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="6文字以上"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition-colors"
          >
            {loading
              ? "処理中..."
              : mode === "signup"
              ? "アカウント作成"
              : "ログイン"}
          </button>

          <button
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
              setMessage("");
            }}
            className="w-full text-gray-500 text-sm py-2"
          >
            {mode === "signup"
              ? "すでにアカウントをお持ちの方"
              : "新規アカウント作成はこちら"}
          </button>
        </div>
      </div>
    </div>
  );
}
