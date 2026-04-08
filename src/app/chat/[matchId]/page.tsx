"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getMyProfile,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  DBProfile,
  DBMessage,
} from "@/lib/supabase-db";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [currentUser, setCurrentUser] = useState<DBProfile | null>(null);
  const [partner, setPartner] = useState<DBProfile | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }
      setCurrentUser(profile);

      // マッチ情報からパートナーを取得
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match) { router.push("/matches"); return; }

      const partnerId = match.user1_id === profile.id ? match.user2_id : match.user1_id;
      const { data: partnerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", partnerId)
        .single();

      setPartner(partnerData as DBProfile);

      const msgs = await getMessages(matchId);
      setMessages(msgs);
      await markMessagesAsRead(matchId, profile.id);
      setLoading(false);
    })();
  }, [matchId, router]);

  // メッセージポーリング
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      const msgs = await getMessages(matchId);
      setMessages(msgs);
      await markMessagesAsRead(matchId, currentUser.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [matchId, currentUser]);

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;
    const content = input.trim();
    setInput("");
    await sendMessage(matchId, currentUser.id, content);
    const msgs = await getMessages(matchId);
    setMessages(msgs);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
  };

  // 日付でグループ化
  const groupedMessages: { date: string; msgs: DBMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm flex items-center gap-3 px-4 py-3 shrink-0">
        <button onClick={() => router.push("/matches")} className="text-pink-500 text-lg">
          ←
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
          {partner?.gender === "female" ? "👩" : partner?.gender === "male" ? "👨" : "🧑"}
        </div>
        <div>
          <p className="font-bold text-sm">{partner?.name}</p>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
            {partner?.mbti_type}
          </span>
        </div>
      </header>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {groupedMessages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            メッセージを送ってみましょう！
          </p>
        )}
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center my-4">
              <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                {group.date}
              </span>
            </div>
            {group.msgs.map((msg) => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-1 max-w-[75%] ${isMine ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm break-words ${
                        isMine
                          ? "bg-pink-500 text-white rounded-br-sm"
                          : "bg-white text-gray-700 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力バー */}
      <div className="bg-white border-t px-4 py-3 shrink-0 safe-area-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="メッセージを入力..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-full text-sm transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
