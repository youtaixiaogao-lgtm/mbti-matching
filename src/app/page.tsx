"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MBTI_PAIRS = [
  { type1: "ENFP", type2: "INTJ", label: "最高の相性" },
  { type1: "INFJ", type2: "ENTP", label: "最高の相性" },
  { type1: "INFP", type2: "ENTJ", label: "最高の相性" },
  { type1: "ISFP", type2: "ENFJ", label: "最高の相性" },
];

const FEATURES = [
  { icon: "🧠", title: "MBTI相性マッチ", desc: "16タイプの相性データに基づき、合う人だけが表示される" },
  { icon: "💬", title: "マッチ後チャット", desc: "相互いいねでマッチ成立。すぐにメッセージが送れる" },
  { icon: "🔒", title: "安心・安全", desc: "メール認証必須。ブロック・通報機能で安全に出会える" },
  { icon: "📱", title: "スマホ対応", desc: "ホーム画面に追加するだけでアプリのように使える" },
];

const TESTIMONIALS = [
  { name: "A.K", age: 25, type: "ENFP", text: "INTJの彼と相性最高って表示されて、話してみたら本当に気が合った！" },
  { name: "T.M", age: 28, type: "INTJ", text: "無駄なマッチが少ないから効率的。相性の科学を信じてよかった。" },
  { name: "M.S", age: 23, type: "INFP", text: "MBTIを理解してくれる人が多いから、最初から深い話ができる。" },
];

export default function Home() {
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/discover");
    });
    // ユーザー数を取得（概算表示用）
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => {
      setUserCount(count || 0);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-400 to-purple-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">💕</div>
          <div className="absolute top-40 right-20 text-6xl">🧠</div>
          <div className="absolute bottom-20 left-1/4 text-7xl">✨</div>
        </div>
        <div className="relative max-w-md mx-auto px-6 pt-16 pb-20 text-center">
          <h1 className="text-4xl font-black mb-3 leading-tight">
            MBTI Match
          </h1>
          <p className="text-lg font-medium mb-2 opacity-95">
            相性の良い人としかマッチしない
          </p>
          <p className="text-sm opacity-80 mb-8">
            16タイプの性格診断で、本当に合う人だけと出会える
          </p>

          <button
            onClick={() => router.push("/auth")}
            className="w-full max-w-xs bg-white text-pink-500 font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 mb-4"
          >
            無料ではじめる
          </button>

          {userCount > 0 && (
            <p className="text-sm opacity-80">
              すでに <span className="font-bold">{userCount.toLocaleString()}人</span> が登録中
            </p>
          )}
        </div>
      </section>

      {/* 相性の例 */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-center mb-2">MBTIで相性がわかる</h2>
          <p className="text-sm text-gray-500 text-center mb-6">科学的な性格分析で最適なパートナーを見つける</p>
          <div className="grid grid-cols-2 gap-3">
            {MBTI_PAIRS.map((pair, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full">{pair.type1}</span>
                  <span className="text-pink-400">♥</span>
                  <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full">{pair.type2}</span>
                </div>
                <span className="text-xs text-pink-500 font-medium">{pair.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-12 px-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">MBTI Matchの特徴</h2>
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-3xl shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">使い方はかんたん3ステップ</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "MBTIタイプを設定", desc: "知っていれば選ぶだけ。わからなければAIが診断" },
              { step: "2", title: "相性の良い人を見つける", desc: "あなたと合う人だけが表示。右スワイプでいいね" },
              { step: "3", title: "マッチしたらチャット", desc: "お互いいいねでマッチ成立。メッセージを送ろう" },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 口コミ */}
      <section className="py-12 px-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">ユーザーの声</h2>
          <div className="space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">{t.type}</span>
                  <span className="text-xs text-gray-400">{t.name}さん（{t.age}歳）</span>
                </div>
                <p className="text-sm text-gray-700">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-pink-500 to-purple-500 text-white text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-3">今すぐ始めよう</h2>
          <p className="text-sm opacity-90 mb-6">完全無料。MBTIで本当に合う人と出会える。</p>
          <button
            onClick={() => router.push("/auth")}
            className="w-full max-w-xs bg-white text-pink-500 font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            無料で登録する
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer className="py-6 px-6 bg-gray-900 text-gray-400 text-center text-xs">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-center gap-4">
            <a href="/privacy" className="hover:text-white">プライバシーポリシー</a>
            <a href="/terms" className="hover:text-white">利用規約</a>
          </div>
          <p>&copy; 2026 MBTI Match. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
