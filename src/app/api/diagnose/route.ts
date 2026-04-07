import { NextResponse } from "next/server";
import { MBTI_TYPES, MBTIType } from "@/lib/types";

// Claude APIキーが設定されていない場合のフォールバック診断
const QUESTIONS = [
  "初対面の人が多いパーティーに誘われました。あなたはどうしますか？\nA: 楽しそう！たくさんの人と話したい\nB: 少し疲れそう...親しい友人と少人数で過ごしたい",
  "大事な決断をするとき、何を重視しますか？\nA: データや論理的な根拠\nB: 自分の気持ちや相手への影響",
  "予定のない休日、どう過ごしますか？\nA: その日の気分で自由に過ごす\nB: 前もって計画を立てて過ごす",
  "新しいプロジェクトに取り組むとき、あなたは？\nA: まず全体像やアイデアを考える\nB: まず具体的な事実や手順を確認する",
];

function simpleDiagnosis(answers: string[]): MBTIType {
  const e = answers[0]?.toUpperCase() === "A" ? "E" : "I";
  const n = answers[3]?.toUpperCase() === "A" ? "N" : "S";
  const t = answers[1]?.toUpperCase() === "A" ? "T" : "F";
  const j = answers[2]?.toUpperCase() === "B" ? "J" : "P";
  const result = `${e}${n}${t}${j}` as string;
  return MBTI_TYPES.includes(result as MBTIType) ? (result as MBTIType) : "INFP";
}

export async function POST(request: Request) {
  const { messages } = await request.json();

  // 会話が空 → 最初の質問を送る
  if (messages.length === 0) {
    return NextResponse.json({
      message: `MBTIを診断しましょう！4つの質問に答えてください。\n\n質問1: ${QUESTIONS[0]}`,
      mbtiType: null,
    });
  }

  // ユーザーの回答数をカウント
  const userAnswers = messages.filter((m: { role: string }) => m.role === "user");
  const answerCount = userAnswers.length;

  if (answerCount < 4) {
    return NextResponse.json({
      message: `質問${answerCount + 1}: ${QUESTIONS[answerCount]}`,
      mbtiType: null,
    });
  }

  // 4問回答完了 → 診断結果
  const answers = userAnswers.map((m: { text: string }) => m.text);
  const mbtiType = simpleDiagnosis(answers);

  return NextResponse.json({
    message: `診断が完了しました！あなたのMBTIタイプは **${mbtiType}** です！`,
    mbtiType,
  });
}
