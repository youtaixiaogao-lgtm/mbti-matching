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
  height: number | null;
  occupation: string;
  location: string;
  hobbies: string[];
  looking_for: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface DBMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DBNotification {
  id: string;
  user_id: string;
  type: "like" | "match" | "message" | "footprint";
  from_user_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DBPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
}

// ============ プロフィール ============

export async function createProfile(data: {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mbti_type: MBTIType;
  bio: string;
  height?: number;
  occupation?: string;
  location?: string;
  hobbies?: string[];
  looking_for?: string;
}) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return profile as DBProfile;
}

export async function updateProfile(id: string, data: Partial<{
  name: string;
  age: number;
  bio: string;
  height: number;
  occupation: string;
  location: string;
  hobbies: string[];
  looking_for: string;
}>) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

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

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as DBProfile;
}

export async function updateLastActive(userId: string) {
  await supabase
    .from("profiles")
    .update({ last_active: new Date().toISOString() })
    .eq("id", userId);
}

// ============ 写真 ============

export async function getPhotos(userId: string) {
  const { data } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", userId)
    .order("display_order");
  return (data || []) as DBPhoto[];
}

export async function uploadPhoto(userId: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(path);

  const { data: existing } = await supabase
    .from("profile_photos")
    .select("display_order")
    .eq("user_id", userId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data: photo, error } = await supabase
    .from("profile_photos")
    .insert({ user_id: userId, photo_url: urlData.publicUrl, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return photo as DBPhoto;
}

export async function deletePhoto(photoId: string) {
  await supabase.from("profile_photos").delete().eq("id", photoId);
}

// ============ マッチング ============

export async function getCompatibleUsers(
  userId: string,
  mbtiType: MBTIType,
  filters?: { minAge?: number; maxAge?: number; gender?: string }
) {
  const compatibleTypes = getCompatibleTypes(mbtiType);

  const { data: likedUsers } = await supabase
    .from("likes")
    .select("to_user_id")
    .eq("from_user_id", userId);

  const { data: skippedUsers } = await supabase
    .from("skips")
    .select("to_user_id")
    .eq("from_user_id", userId);

  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);

  const { data: blockedByUsers } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocked_id", userId);

  const excludeIds = [
    userId,
    ...(likedUsers?.map((l) => l.to_user_id) || []),
    ...(skippedUsers?.map((s) => s.to_user_id) || []),
    ...(blockedUsers?.map((b) => b.blocked_id) || []),
    ...(blockedByUsers?.map((b) => b.blocker_id) || []),
  ];

  let query = supabase
    .from("profiles")
    .select("*")
    .in("mbti_type", compatibleTypes)
    .eq("is_active", true)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("last_active", { ascending: false });

  if (filters?.minAge) query = query.gte("age", filters.minAge);
  if (filters?.maxAge) query = query.lte("age", filters.maxAge);
  if (filters?.gender) query = query.eq("gender", filters.gender);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as DBProfile[];
}

export async function sendLike(fromUserId: string, toUserId: string) {
  const { error } = await supabase
    .from("likes")
    .insert({ from_user_id: fromUserId, to_user_id: toUserId });
  if (error) throw error;

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .or(
      `and(user1_id.eq.${[fromUserId, toUserId].sort()[0]},user2_id.eq.${[fromUserId, toUserId].sort()[1]})`
    )
    .maybeSingle();

  return { matched: !!match };
}

export async function sendSkip(fromUserId: string, toUserId: string) {
  await supabase
    .from("skips")
    .insert({ from_user_id: fromUserId, to_user_id: toUserId });
}

// ============ マッチ・メッセージ ============

export async function getMatches(userId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, user1_id, user2_id, created_at")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const partnerIds = (data || []).map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id
  );
  if (partnerIds.length === 0) return [];

  const { data: partners } = await supabase
    .from("profiles")
    .select("*")
    .in("id", partnerIds);

  // 各マッチの最新メッセージを取得
  const matchIds = (data || []).map((m) => m.id);
  const { data: lastMessages } = await supabase
    .from("messages")
    .select("match_id, content, created_at, sender_id")
    .in("match_id", matchIds)
    .order("created_at", { ascending: false });

  // 未読数を取得
  const { data: unreadCounts } = await supabase
    .from("messages")
    .select("match_id")
    .in("match_id", matchIds)
    .neq("sender_id", userId)
    .eq("is_read", false);

  return (data || []).map((m) => {
    const partnerId = m.user1_id === userId ? m.user2_id : m.user1_id;
    const lastMsg = lastMessages?.find((msg) => msg.match_id === m.id);
    const unread = unreadCounts?.filter((msg) => msg.match_id === m.id).length || 0;
    return {
      matchId: m.id,
      matchedAt: m.created_at,
      partner: (partners || []).find((p) => p.id === partnerId) as DBProfile,
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.created_at, senderId: lastMsg.sender_id } : null,
      unreadCount: unread,
    };
  }).filter((m) => m.partner);
}

export async function getMessages(matchId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as DBMessage[];
}

export async function sendMessage(matchId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: senderId, content })
    .select()
    .single();
  if (error) throw error;
  return data as DBMessage;
}

export async function markMessagesAsRead(matchId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("match_id", matchId)
    .neq("sender_id", userId)
    .eq("is_read", false);
}

// ============ 足あと ============

export async function addFootprint(visitorId: string, visitedId: string) {
  if (visitorId === visitedId) return;
  await supabase
    .from("footprints")
    .insert({ visitor_id: visitorId, visited_id: visitedId });
}

export async function getFootprints(userId: string) {
  const { data, error } = await supabase
    .from("footprints")
    .select("*, visitor:profiles!footprints_visitor_id_fkey(*)")
    .eq("visited_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// ============ ブロック・通報 ============

export async function blockUser(blockerId: string, blockedId: string) {
  await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
}

export async function reportUser(reporterId: string, reportedId: string, reason: string, detail: string) {
  await supabase
    .from("reports")
    .insert({ reporter_id: reporterId, reported_id: reportedId, reason, detail });
}

// ============ 通知 ============

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as DBNotification[];
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) return 0;
  return count || 0;
}

export async function markNotificationsAsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

// ============ 管理画面用 ============

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DBProfile[];
}

export async function getAllMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllLikes() {
  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
