"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, getFootprints, DBProfile } from "@/lib/supabase-db";

export default function FootprintsPage() {
  const router = useRouter();
  const [footprints, setFootprints] = useState<{ id: string; created_at: string; visitor: DBProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }
      const data = await getFootprints(profile.id);
      setFootprints(data as typeof footprints);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">読み込み中...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-center">足あと</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        {footprints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-4">👣</p>
            <p className="text-gray-600 text-sm">まだ足あとがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {footprints.map((fp) => (
              <div key={fp.id} className="bg-white rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-xl">
                  {fp.visitor.gender === "female" ? "👩" : fp.visitor.gender === "male" ? "👨" : "🧑"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{fp.visitor.name}</h3>
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                      {fp.visitor.mbti_type}
                    </span>
                    <span className="text-xs text-gray-400">{fp.visitor.age}歳</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(fp.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
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
              className={`flex-1 flex flex-col items-center py-2 text-xs ${item.href === "/footprints" ? "text-pink-500" : "text-gray-400"}`}
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
