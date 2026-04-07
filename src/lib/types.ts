export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MBTIType = (typeof MBTI_TYPES)[number];

export type CompatibilityLevel = "best" | "good" | "neutral" | "bad";

// MBTI相性テーブル（科学的根拠に基づく一般的な分類）
export const COMPATIBILITY_MAP: Record<MBTIType, Record<CompatibilityLevel, MBTIType[]>> = {
  INTJ: {
    best: ["ENFP", "ENTP"],
    good: ["INFJ", "INFP", "ENTJ", "INTJ"],
    neutral: ["INTP", "ENFJ", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  INTP: {
    best: ["ENTJ", "ESTJ"],
    good: ["INTJ", "ENTP", "INFP", "INTP"],
    neutral: ["ENFP", "ENFJ", "INFJ", "ISTJ", "ISFJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  ENTJ: {
    best: ["INTP", "INFP"],
    good: ["INTJ", "ENTP", "ENTJ", "ENFJ"],
    neutral: ["ENFP", "INFJ", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  ENTP: {
    best: ["INTJ", "INFJ"],
    good: ["INTP", "ENTJ", "ENFP", "ENTP"],
    neutral: ["INFP", "ENFJ", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  INFJ: {
    best: ["ENTP", "ENFP"],
    good: ["INFP", "INTJ", "INFJ", "ENFJ"],
    neutral: ["INTP", "ENTJ", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  INFP: {
    best: ["ENTJ", "ENFJ"],
    good: ["INFJ", "INTP", "ENFP", "INFP"],
    neutral: ["INTJ", "ENTP", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  ENFJ: {
    best: ["INFP", "ISFP"],
    good: ["INFJ", "ENFP", "ENTJ", "ENFJ"],
    neutral: ["INTJ", "INTP", "ENTP", "ISTJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ESTP", "ESFP", "ISFJ"],
  },
  ENFP: {
    best: ["INTJ", "INFJ"],
    good: ["ENTP", "ENFJ", "INFP", "ENFP"],
    neutral: ["INTP", "ENTJ", "ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    bad: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
  ISTJ: {
    best: ["ESFP", "ESTP"],
    good: ["ISFJ", "ESTJ", "ISTJ", "ESFJ"],
    neutral: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP"],
    bad: ["ISTP", "ISFP"],
  },
  ISFJ: {
    best: ["ESFP", "ESTP"],
    good: ["ISTJ", "ESFJ", "ESTJ", "ISFJ"],
    neutral: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFP"],
    bad: ["ISTP", "ISFP", "ENFJ"],
  },
  ESTJ: {
    best: ["INTP", "ISTP"],
    good: ["ISTJ", "ISFJ", "ESFJ", "ESTJ"],
    neutral: ["INTJ", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP"],
    bad: ["ISFP", "ESTP", "ESFP"],
  },
  ESFJ: {
    best: ["ISFP", "ISTP"],
    good: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    neutral: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFP"],
    bad: ["ESTP", "ESFP", "ENFJ"],
  },
  ISTP: {
    best: ["ESTJ", "ESFJ"],
    good: ["ESTP", "ISFP", "ISTP", "ESFP"],
    neutral: ["ISTJ", "ISFJ", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP"],
    bad: ["ENFJ", "ENFP"],
  },
  ISFP: {
    best: ["ENFJ", "ESFJ"],
    good: ["ISTP", "ESFP", "ISFP", "ESTP"],
    neutral: ["ISTJ", "ISFJ", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP"],
    bad: ["ESTJ", "ENFP"],
  },
  ESTP: {
    best: ["ISTJ", "ISFJ"],
    good: ["ISTP", "ESFP", "ESTP", "ISFP"],
    neutral: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFP"],
    bad: ["ESTJ", "ESFJ", "ENFJ"],
  },
  ESFP: {
    best: ["ISTJ", "ISFJ"],
    good: ["ISTP", "ESTP", "ISFP", "ESFP"],
    neutral: ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFP"],
    bad: ["ESTJ", "ESFJ", "ENFJ"],
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
