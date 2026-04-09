"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, DBProfile } from "@/lib/supabase-db";

export default function InvitePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const p = await getMyProfile();
      if (p) setProfile(p);
    })();
  }, [router]);

  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}?ref=${profile?.id?.slice(0, 8) || ""}`
    : "";

  const inviteText = `MBTIで相性の良い人としかマッチしないアプリ見つけた！\n私は${profile?.mbti_type}タイプ。あなたのMBTIは？\n\n${inviteUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "MBTI Match - 相性で繋がるマッチングアプリ",
        text: inviteText,
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteText)}`;
    window.open(url, "_blank");
  };

  const shareToLine = () => {
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(inviteText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button onClick={() => router.back()} className="text-pink-500 text-sm">← 戻る</button>
          <h1 className="text-lg font-bold flex-1 text-center">友達を招待</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-xl font-bold mb-2">友達を招待しよう</h2>
          <p className="text-sm text-gray-500 mb-6">
            マッチングアプリはユーザーが多いほど楽しい！<br />
            友達にも教えてあげよう。
          </p>

          {profile && (
            <div className="bg-pink-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">あなたの招待メッセージ</p>
              <p className="text-sm text-gray-800 whitespace-pre-line text-left">{inviteText}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleShare}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full transition-colors"
            >
              {copied ? "コピーしました！" : "共有する"}
            </button>

            <div className="flex gap-3">
              <button
                onClick={shareToLine}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full transition-colors text-sm"
              >
                LINEで送る
              </button>
              <button
                onClick={shareToTwitter}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-full transition-colors text-sm"
              >
                Xでシェア
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-full transition-colors text-sm"
            >
              {copied ? "コピー済み ✓" : "リンクをコピー"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
