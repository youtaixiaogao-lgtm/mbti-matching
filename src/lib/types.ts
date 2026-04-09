export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = (typeof MBTI_TYPES)[number];

export type CompatibilityLevel = "best" | "good" | "neutral" | "bad";

// MBTI相性テーブル（Socionics双対関係に基づく）
// best = 双対関係（認知機能が完全に補完し合う）
// good = 活性化関係・同一・鏡像関係
// neutral = その他
// bad = 対立・監督関係
export const COMPATIBILITY_MAP: Record<MBTIType, Record<CompatibilityLevel, MBTIType[]>> = {
  INTP: {
    best: ["ESFP", "ENFJ"],
    good: ["ENTP", "INTJ", "INFP", "ESTP"],
    neutral: ["ENTJ", "INFJ", "ENFP", "ISTP", "ISFP", "ESTJ"],
    bad: ["ISTJ", "ISFJ", "ESFJ", "INTP"],
  },
  INTJ: {
    best: ["ESFJ", "ENFP"],
    good: ["ENTJ", "INTP", "INFJ", "ESTJ"],
    neutral: ["ENTP", "INFP", "ENFJ", "ISTP", "ISFP", "ESFP"],
    bad: ["ISTJ", "ISFJ", "ESTP", "INTJ"],
  },
  ENTP: {
    best: ["ISFP", "INFJ"],
    good: ["INTP", "ENTJ", "ENFP", "ISTP"],
    neutral: ["INTJ", "INFP", "ENFJ", "ESFP", "ESTP", "ESFJ"],
    bad: ["ISTJ", "ISFJ", "ESTJ", "ENTP"],
  },
  ENTJ: {
    best: ["ISFJ", "INFP"],
    good: ["INTJ", "ENTP", "ENFJ", "ISTJ"],
    neutral: ["INTP", "INFJ", "ENFP", "ESFJ", "ESTJ", "ESFP"],
    bad: ["ISTP", "ISFP", "ESTP", "ENTJ"],
  },
  INFP: {
    best: ["ESTJ", "ENTJ"],
    good: ["ENFP", "INFJ", "INTP", "ESFJ"],
    neutral: ["ENFJ", "INTJ", "ENTP", "ISFP", "ISFJ", "ESFP"],
    bad: ["ISTP", "ESTP", "ISTJ", "INFP"],
  },
  INFJ: {
    best: ["ESTP", "ENTP"],
    good: ["ENFJ", "INFP", "INTJ", "ESFP"],
    neutral: ["ENFP", "INTP", "ENTJ", "ISFJ", "ISTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTJ", "INFJ"],
  },
  ENFP: {
    best: ["ISTJ", "INTJ"],
    good: ["INFP", "ENFJ", "ENTP", "ISFJ"],
    neutral: ["INFJ", "INTP", "ENTJ", "ESFP", "ESFJ", "ESTP"],
    bad: ["ISTP", "ISFP", "ESTJ", "ENFP"],
  },
  ENFJ: {
    best: ["ISTP", "INTP"],
    good: ["INFJ", "ENFP", "ENTJ", "ISFP"],
    neutral: ["INFP", "INTJ", "ENTP", "ESFJ", "ESTJ", "ESFP"],
    bad: ["ISTJ", "ISFJ", "ESTP", "ENFJ"],
  },
  ISTP: {
    best: ["ENFJ", "ESFJ"],
    good: ["ESTP", "ISFP", "ENTP", "ESTJ"],
    neutral: ["ESFP", "ISTJ", "ISFJ", "INTJ", "INTP", "INFJ"],
    bad: ["ENTJ", "INFP", "ENFP", "ISTP"],
  },
  ISFP: {
    best: ["ENTP", "ESTJ"],
    good: ["ESFP", "ISTP", "ENFP", "ESFJ"],
    neutral: ["ESTP", "ISTJ", "ISFJ", "INTJ", "INTP", "INFP"],
    bad: ["ENTJ", "INFJ", "ENFJ", "ISFP"],
  },
  ESTP: {
    best: ["INFJ", "ISFJ"],
    good: ["ISTP", "ESFP", "INTP", "ISTJ"],
    neutral: ["ISFP", "ESTJ", "ESFJ", "ENFP", "ENTP", "ENTJ"],
    bad: ["INTJ", "INFP", "ENFJ", "ESTP"],
  },
  ESFP: {
    best: ["INTP", "ISTJ"],
    good: ["ISFP", "ESTP", "INFP", "ISFJ"],
    neutral: ["ISTP", "ESTJ", "ESFJ", "ENFJ", "ENTP", "ENTJ"],
    bad: ["INTJ", "INFJ", "ENFP", "ESFP"],
  },
  ISTJ: {
    best: ["ENFP", "ESFP"],
    good: ["ESTJ", "ISFJ", "ENTJ", "ESTP"],
    neutral: ["ESFJ", "ISTP", "ISFP", "INTP", "INTJ", "INFP"],
    bad: ["ENTP", "INFJ", "ENFJ", "ISTJ"],
  },
  ISFJ: {
    best: ["ENTJ", "ESTP"],
    good: ["ESFJ", "ISTJ", "ENFJ", "ESFP"],
    neutral: ["ESTJ", "ISTP", "ISFP", "INTP", "INTJ", "INFJ"],
    bad: ["ENTP", "INFP", "ENFP", "ISFJ"],
  },
  ESTJ: {
    best: ["INFP", "ISFP"],
    good: ["ISTJ", "ESFJ", "ISTP", "INTJ"],
    neutral: ["ISFJ", "ESTP", "ESFP", "ENTP", "ENTJ", "ENFJ"],
    bad: ["INTP", "INFJ", "ENFP", "ESTJ"],
  },
  ESFJ: {
    best: ["INTJ", "ISTP"],
    good: ["ISFJ", "ESTJ", "ISFP", "INTP"],
    neutral: ["ISTJ", "ESTP", "ESFP", "ENFP", "ENFJ", "ENTJ"],
    bad: ["ENTP", "INFP", "INFJ", "ESFJ"],
  },
};

export function getCompatibility(type1: MBTIType, type2: MBTIType): CompatibilityLevel {
  return (
    Object.entries(COMPATIBILITY_MAP[type1]).find(([, types]) =>
      types.includes(type2)
    )?.[0] as CompatibilityLevel ?? "neutral"
  );
}

export function getCompatibleTypes(type: MBTIType): MBTIType[] {
  const map = COMPATIBILITY_MAP[type];
  return [...map.best, ...map.good];
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mbtiType: MBTIType;
  bio: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}
