"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, getMatches, DBProfile } from "@/lib/supabase-db";
import { getCompatibility } from "@/lib/types";

export default function MatchesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<DBProfile | null>(null);
  const [matches, setMatches] = useState<{
    matchId: string;
    matchedAt: string;
    partner: DBProfile;
    lastMessage: { content: string; createdAt: string; senderId: string } | null;
    unreadCount: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }
      setCurrentUser(profile);
      const matchList = await getMatches(profile.id);
      setMatches(matchList);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-center">メッセージ</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        {/* 新しいマッチ */}
        {matches.filter((m) => !m.lastMessage).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 mb-3">新しいマッチ</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {matches.filter((m) => !m.lastMessage).map(({ matchId, partner }) => (
                <button
                  key={matchId}
                  onClick={() => router.push(`/chat/${matchId}`)}
                  className="flex flex-col items-center shrink-0"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl ring-2 ring-pink-300">
                    {partner.gender === "female" ? "👩" : partner.gender === "male" ? "👨" : "🧑"}
                  </div>
                  <p className="text-xs mt-1 text-gray-700">{partner.name}</p>
                  <span className="text-[10px] text-purple-500">{partner.mbti_type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* メッセージ一覧 */}
        <h2 className="text-sm font-bold text-gray-500 mb-3">トーク</h2>
        {matches.filter((m) => m.lastMessage).length === 0 && matches.filter((m) => !m.lastMessage).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-4">💌</p>
            <p className="text-gray-600 text-sm">
              まだマッチがありません。<br />
              気になる人にいいねを送りましょう！
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-sm"
            >
              探しに行く
            </button>
          </div>
        ) : matches.filter((m) => m.lastMessage).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">まだトークはありません</p>
        ) : (
          <div className="space-y-1">
            {matches.filter((m) => m.lastMessage).map(({ matchId, partner, lastMessage, unreadCount }) => (
              <button
                key={matchId}
                onClick={() => router.push(`/chat/${matchId}`)}
                className="w-full bg-white rounded-xl p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl shrink-0">
                  {partner.gender === "female" ? "👩" : partner.gender === "male" ? "👨" : "🧑"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{partner.name}</h3>
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                        {partner.mbti_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {lastMessage && new Date(lastMessage.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {lastMessage?.senderId === currentUser?.id && "あなた: "}
                      {lastMessage?.content}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-pink-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ボトムナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-area-bottom">
        <div className="max-w-md mx-auto flex">
          {[
            { href: "/discover", icon: "🏠", label: "ホーム" },
            { href: "/footprints", icon: "👣", label: "足あと" },
            { href: "/matches", icon: "💬", label: "マッチ" },
            { href: "/notifications", icon: "🔔", label: "通知" },
            { href: "/mypage", icon: "👤", label: "マイページ" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                item.href === "/matches" ? "text-pink-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
