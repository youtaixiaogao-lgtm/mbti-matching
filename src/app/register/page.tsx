"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createProfile } from "@/lib/supabase-db";
import { MBTI_TYPES, MBTIType } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<"info" | "mbti">("info");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [bio, setBio] = useState("");
  const [mbtiType, setMbtiType] = useState<MBTIType | null>(null);
  const [knowsMbti, setKnowsMbti] = useState<boolean | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserId(user.id);
    });
  }, [router]);

  const handleInfoSubmit = () => {
    if (!name || !age) return;
    setStep("mbti");
  };

  const handleRegister = async () => {
    if (!mbtiType || !userId) return;
    setLoading(true);
    try {
      await createProfile({
        id: userId,
        name,
        age: parseInt(age),
        gender,
        mbti_type: mbtiType,
        bio,
      });
      router.push("/discover");
    } catch {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);

    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...chatMessages, { role: "user", text: userMsg }] }),
    });
    const data = await res.json();
    setChatMessages((prev) => [...prev, { role: "ai", text: data.message }]);

    if (data.mbtiType) {
      setMbtiType(data.mbtiType);
      setDiagnosisComplete(true);
    }
  };

  const startDiagnosis = async () => {
    setDiagnosing(true);
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    const data = await res.json();
    setChatMessages([{ role: "ai", text: data.message }]);
  };

  if (step === "info") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">プロフィール登録</h1>
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="表示名を入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="25"
                min="18"
                max="99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
              <div className="flex gap-3">
                {([["male", "男性"], ["female", "女性"], ["other", "その他"]] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setGender(val)}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      gender === val
                        ? "bg-pink-500 text-white border-pink-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-pink-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={3}
                placeholder="趣味や好きなことを書いてみましょう"
              />
            </div>
            <button
              onClick={handleInfoSubmit}
              disabled={!name || !age}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition-colors"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">MBTIタイプ</h1>

        {knowsMbti === null && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <p className="text-center text-gray-600 mb-4">あなたのMBTIタイプを知っていますか？</p>
            <button
              onClick={() => setKnowsMbti(true)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full transition-colors"
            >
              知っている（タイプを選ぶ）
            </button>
            <button
              onClick={() => {
                setKnowsMbti(false);
                startDiagnosis();
              }}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-full border border-gray-200 transition-colors"
            >
              知らない（AIで診断する）
            </button>
          </div>
        )}

        {knowsMbti === true && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-4">あなたのMBTIタイプを選んでください</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {MBTI_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMbtiType(type)}
                  className={`py-3 rounded-lg text-sm font-bold transition-colors ${
                    mbtiType === type
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-pink-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={handleRegister}
              disabled={!mbtiType || loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-full transition-colors"
            >
              {loading ? "登録中..." : "登録完了"}
            </button>
          </div>
        )}

        {knowsMbti === false && diagnosing && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-pink-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {diagnosisComplete ? (
              <div className="text-center">
                <p className="text-lg font-bold text-pink-500 mb-2">あなたは {mbtiType} です！</p>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full transition-colors"
                >
                  {loading ? "登録中..." : "この結果で登録する"}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  placeholder="回答を入力..."
                />
                <button
                  onClick={handleChat}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
                >
                  送信
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
