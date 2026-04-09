"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { MBTI_TYPES, MBTIType, COMPATIBILITY_MAP } from "@/lib/types";

function ShareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "INTJ") as MBTIType;
  const isValid = MBTI_TYPES.includes(type);

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">無効なMBTIタイプです</p>
      </div>
    );
  }

  const bestMatches = COMPATIBILITY_MAP[type].best;
  const goodMatches = COMPATIBILITY_MAP[type].good;

  const descriptions: Record<string, string> = {
    INTJ: "独立した戦略家。効率と知識を重視する完璧主義者。",
    INTP: "論理的な思考家。知的好奇心が旺盛な分析者。",
    ENTJ: "天性のリーダー。決断力と効率性を持つ指揮官。",
    ENTP: "革新的な議論好き。アイデア溢れる発明家。",
    INFJ: "直感的な理想主義者。深い洞察力を持つ提唱者。",
    INFP: "情熱的な理想家。価値観を大切にする仲介者。",
    ENFJ: "カリスマ的な指導者。人々を鼓舞する主人公。",
    ENFP: "情熱的な自由人。創造性と社交性の塊。",
    ISTJ: "責任感の強い実務家。信頼と安定を重視する管理者。",
    ISFJ: "献身的な守護者。思いやり深い縁の下の力持ち。",
    ESTJ: "秩序を重んじる管理者。責任感と実行力の人。",
    ESFJ: "温かい世話好き。調和とコミュニティを大切にする。",
    ISTP: "冷静な職人。実践的で柔軟な対応力の達人。",
    ISFP: "穏やかな芸術家。感性と自由を愛する冒険者。",
    ESTP: "エネルギッシュな挑戦者。今を生きるリアリスト。",
    ESFP: "明るいエンターテイナー。楽しさと人を愛する社交家。",
  };

  const shareText = `私のMBTIは ${type} でした！\n${descriptions[type]}\n相性の良い人を探すなら MBTI Match で。\n\nhttps://mbti-matching-beta.vercel.app`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `MBTI診断結果: ${type}`, text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("コピーしました！");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        <p className="text-sm text-gray-500 mb-1">あなたのMBTIタイプは</p>
        <h1 className="text-5xl font-black text-purple-600 mb-2">{type}</h1>
        <p className="text-sm text-gray-600 mb-6">{descriptions[type]}</p>

        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 mb-2">最高の相性</p>
          <div className="flex justify-center gap-2 mb-3">
            {bestMatches.map((t) => (
              <span key={t} className="bg-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-500 mb-2">良い相性</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {goodMatches.map((t) => (
              <span key={t} className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full transition-colors"
          >
            結果をシェアする
          </button>
          <button
            onClick={() => router.push("/auth")}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-full transition-colors"
          >
            相性の良い人を探す
          </button>
          <button
            onClick={() => {
              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
              window.open(url, "_blank");
            }}
            className="w-full bg-gray-800 text-white font-bold py-3 rounded-full transition-colors text-sm"
          >
            Xでシェアする
          </button>
        </div>
      </div>
      <p className="text-white/60 text-xs mt-4">MBTI Match</p>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">読み込み中...</div></div>}>
      <ShareContent />
    </Suspense>
  );
}
