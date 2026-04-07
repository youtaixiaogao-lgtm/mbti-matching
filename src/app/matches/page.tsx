"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, getMatches, DBProfile } from "@/lib/supabase-db";
import { getCompatibility, CompatibilityLevel } from "@/lib/types";

const compatLabel: Record<CompatibilityLevel, string> = {
  best: "最高の相性",
  good: "良い相性",
  neutral: "普通",
  bad: "合わないかも",
};

export default function MatchesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<DBProfile | null>(null);
  const [matches, setMatches] = useState<{ matchId: string; matchedAt: string; partner: DBProfile }[]>([]);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push("/discover")} className="text-pink-500 text-sm font-medium">
            ← 戻る
          </button>
          <h1 className="text-lg font-bold">マッチ一覧</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-4xl mb-4">💌</p>
            <p className="text-gray-600">
              まだマッチがありません。<br />
              気になる人にいいねを送りましょう！
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full transition-colors"
            >
              探しに行く
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(({ matchId, matchedAt, partner }) => (
              <div key={matchId} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                  {partner.gender === "female" ? "👩" : partner.gender === "male" ? "👨" : "🧑"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{partner.name}</h3>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      {partner.mbti_type}
                    </span>
                  </div>
                  {currentUser && (
                    <p className="text-xs text-pink-500">
                      {compatLabel[getCompatibility(currentUser.mbti_type, partner.mbti_type)]}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(matchedAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
