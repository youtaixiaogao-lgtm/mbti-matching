"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getMyProfile, getNotifications, markNotificationsAsRead, DBNotification } from "@/lib/supabase-db";

const typeConfig: Record<string, { icon: string; color: string }> = {
  like: { icon: "♥", color: "text-pink-500" },
  match: { icon: "💕", color: "text-purple-500" },
  message: { icon: "💬", color: "text-blue-500" },
  footprint: { icon: "👣", color: "text-orange-500" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }
      const notifs = await getNotifications(profile.id);
      setNotifications(notifs);
      await markNotificationsAsRead(profile.id);
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
          <h1 className="text-lg font-bold text-center">通知</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-gray-600 text-sm">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.like;
              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-xl p-4 flex items-center gap-3 ${!n.is_read ? "ring-1 ring-pink-200" : ""}`}
                >
                  <span className={`text-2xl ${config.color}`}>{config.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{n.content}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString("ja-JP", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
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
              className={`flex-1 flex flex-col items-center py-2 text-xs ${item.href === "/notifications" ? "text-pink-500" : "text-gray-400"}`}
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
