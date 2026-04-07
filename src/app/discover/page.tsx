"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, getCompatibleUsers, sendLike, DBProfile } from "@/lib/supabase-db";
import { getCompatibility, CompatibilityLevel } from "@/lib/types";

const compatLabel: Record<CompatibilityLevel, { text: string; color: string }> = {
  best: { text: "最高の相性", color: "bg-pink-500 text-white" },
  good: { text: "良い相性", color: "bg-pink-100 text-pink-600" },
  neutral: { text: "普通", color: "bg-gray-100 text-gray-600" },
  bad: { text: "合わないかも", color: "bg-gray-200 text-gray-500" },
};

export default function DiscoverPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<DBProfile | null>(null);
  const [users, setUsers] = useState<DBProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }

      setCurrentUser(profile);
      const compatible = await getCompatibleUsers(profile.id, profile.mbti_type);
      setUsers(compatible);
      setLoading(false);
    })();
  }, [router]);

  const handleLike = async () => {
    const target = users[currentIndex];
    if (!target || !currentUser) return;

    const { matched } = await sendLike(currentUser.id, target.id);
    if (matched) setMatchPopup(target);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => setCurrentIndex((prev) => prev + 1);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  const target = users[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-pink-500">MBTI Match</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => router.push("/matches")}
              className="text-sm bg-pink-50 text-pink-600 px-3 py-1 rounded-full"
            >
              マッチ一覧
            </button>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {currentUser?.mbti_type}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 px-2 py-1"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {!target ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-gray-600">
              相性の良い人を全員チェックしました！<br />
              新しいユーザーが登録されるまでお待ちください。
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-pink-400 to-purple-500 h-48 flex items-center justify-center">
              <span className="text-6xl">
                {target.gender === "female" ? "👩" : target.gender === "male" ? "👨" : "🧑"}
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">
                  {target.name}
                  <span className="text-gray-400 font-normal ml-2">{target.age}</span>
                </h2>
                <span className="text-sm font-bold bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  {target.mbti_type}
                </span>
              </div>
              {currentUser && (
                <div className="mb-4">
                  <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                    compatLabel[getCompatibility(currentUser.mbti_type, target.mbti_type)].color
                  }`}>
                    {compatLabel[getCompatibility(currentUser.mbti_type, target.mbti_type)].text}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-sm mb-6">{target.bio}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-full transition-colors text-lg"
                >
                  スキップ
                </button>
                <button
                  onClick={handleLike}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-full transition-colors text-lg"
                >
                  ♥ いいね
                </button>
              </div>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-4">
          {users.length > 0 && `${Math.min(currentIndex + 1, users.length)} / ${users.length} 人`}
        </p>
      </div>

      {matchPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-5xl mb-4">💕</p>
            <h2 className="text-2xl font-bold text-pink-500 mb-2">マッチ成立！</h2>
            <p className="text-gray-600 mb-6">{matchPopup.name}さんとマッチしました！</p>
            <button
              onClick={() => setMatchPopup(null)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full transition-colors"
            >
              続ける
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
