import { supabase } from "./supabase";
import { MBTIType, getCompatibleTypes } from "./types";

export interface DBProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mbti_type: MBTIType;
  bio: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// プロフィール作成
export async function createProfile(data: {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mbti_type: MBTIType;
  bio: string;
}) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return profile as DBProfile;
}

// 自分のプロフィール取得
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data as DBProfile;
}

// プロフィール取得
export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as DBProfile;
}

// 相性の良いユーザー取得
export async function getCompatibleUsers(userId: string, mbtiType: MBTIType) {
  const compatibleTypes = getCompatibleTypes(mbtiType);

  // 既にいいね済み or スキップ済みのユーザーを除外
  const { data: likedUsers } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", userId);

  const excludeIds = [userId, ...(likedUsers?.map((l) => l.to_user_id) || [])];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("mbti_type", compatibleTypes)
    .eq("is_active", true)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as DBProfile[];
}

// いいね送信
export async function sendLike(fromUserId: string, toUserId: string) {
  const { error } = await supabase
    .from("likes")
    .insert({ from_user_id: fromUserId, to_user_id: toUserId });
  if (error) throw error;

  // マッチ成立したか確認（トリガーで自動作成される）
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .or(
      `and(user1_id.eq.${[fromUserId, toUserId].sort()[0]},user2_id.eq.${[fromUserId, toUserId].sort()[1]})`
    )
    .maybeSingle();

  return { matched: !!match };
}

// マッチ一覧取得
export async function getMatches(userId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id,
      user1_id,
      user2_id,
      created_at
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // パートナーのプロフィールを取得
  const partnerIds = (data || []).map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id
  );

  if (partnerIds.length === 0) return [];

  const { data: partners } = await supabase
    .from("profiles")
    .select("*")
    .in("id", partnerIds);

  return (data || []).map((m) => {
    const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
    return {
      matchId: m.id,
      matchedAt: m.created_at,
      partner: (partners || []).find((p) => p.id === partnerId) as DBProfile,
    };
  }).filter((m) => m.partner);
}

// 全ユーザー取得（管理画面用）
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DBProfile[];
}

// 全マッチ取得（管理画面用）
export async function getAllMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// 全いいね取得（管理画面用）
export async function getAllLikes() {
  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
