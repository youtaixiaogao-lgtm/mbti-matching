"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/discover");
      }
    });
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-pink-500 mb-2">MBTI Match</h1>
        <p className="text-gray-500 mb-8">相性の良い人としかマッチしない</p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-4 gap-2 mb-6">
            {["INTJ", "ENFP", "INFJ", "ENTP", "ISFJ", "ESTP", "INFP", "ENTJ"].map((type) => (
              <span
                key={type}
                className="bg-pink-50 text-pink-600 text-xs font-medium px-2 py-1 rounded-full text-center"
              >
                {type}
              </span>
            ))}
          </div>
          <p className="text-gray-600 text-sm mb-6">
            MBTIの性格タイプに基づいて、あなたと本当に相性の良い人だけをマッチング。
            無駄なやりとりを減らして、深い繋がりを。
          </p>
        </div>

        <button
          onClick={() => router.push("/auth")}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors"
        >
          無料ではじめる
        </button>
      </div>
    </div>
  );
}
