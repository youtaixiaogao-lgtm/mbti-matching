// MVP用のインメモリストア（後でSupabaseに移行）
import { UserProfile, Like, Match, MBTIType, getCompatibleTypes } from "./types";

// デモ用ダミーユーザー
const demoUsers: UserProfile[] = [
  { id: "demo-1", name: "あかり", age: 25, gender: "female", mbtiType: "ENFP", bio: "旅行と写真が好き！新しい場所を探検するのが大好きです。", createdAt: "2026-04-01" },
  { id: "demo-2", name: "たくや", age: 28, gender: "male", mbtiType: "INTJ", bio: "プログラミングと読書が趣味。効率的なことが好きです。", createdAt: "2026-04-01" },
  { id: "demo-3", name: "みさき", age: 23, gender: "female", mbtiType: "INFP", bio: "カフェ巡りとイラストを描くのが好き。感性を大切にしています。", createdAt: "2026-04-01" },
  { id: "demo-4", name: "けんた", age: 27, gender: "male", mbtiType: "ENTP", bio: "議論好きのアイデアマン。面白いことを一緒にやりたい！", createdAt: "2026-04-01" },
  { id: "demo-5", name: "ゆい", age: 24, gender: "female", mbtiType: "ISFJ", bio: "料理と映画鑑賞が趣味。穏やかな時間を大切にしたいです。", createdAt: "2026-04-01" },
  { id: "demo-6", name: "りょう", age: 26, gender: "male", mbtiType: "ESTP", bio: "スポーツ全般好き。アクティブに過ごしたい派です。", createdAt: "2026-04-01" },
  { id: "demo-7", name: "はるか", age: 22, gender: "female", mbtiType: "ENFJ", bio: "人と話すのが大好き！みんなが笑顔になれる場を作りたい。", createdAt: "2026-04-01" },
  { id: "demo-8", name: "そうた", age: 29, gender: "male", mbtiType: "INFJ", bio: "哲学と音楽が好き。深い話ができる人を探しています。", createdAt: "2026-04-01" },
  { id: "demo-9", name: "あやね", age: 25, gender: "female", mbtiType: "ESFP", bio: "ダンスとカラオケが大好き！毎日を楽しく過ごしたい。", createdAt: "2026-04-01" },
  { id: "demo-10", name: "だいき", age: 30, gender: "male", mbtiType: "ISTJ", bio: "仕事もプライベートも計画的に。信頼できる関係を築きたい。", createdAt: "2026-04-01" },
];

let users: UserProfile[] = [...demoUsers];
let likes: Like[] = [];
let matches: Match[] = [];
let currentUserId: string | null = null;

export const store = {
  // ユーザー
  getUsers: () => users,
  getUser: (id: string) => users.find((u) => u.id === id),
  getCurrentUser: () => (currentUserId ? users.find((u) => u.id === currentUserId) : null),
  setCurrentUser: (id: string) => { currentUserId = id; },

  addUser: (user: Omit<UserProfile, "id" | "createdAt">) => {
    const newUser: UserProfile = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    currentUserId = newUser.id;
    return newUser;
  },

  // 相性の良いユーザーを取得
  getCompatibleUsers: (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return [];
    const compatibleTypes = getCompatibleTypes(user.mbtiType);
    return users.filter(
      (u) => u.id !== userId && compatibleTypes.includes(u.mbtiType)
    );
  },

  // いいね
  addLike: (fromUserId: string, toUserId: string) => {
    const existing = likes.find((l) => l.fromUserId === fromUserId && l.toUserId === toUserId);
    if (existing) return null;

    const like: Like = {
      id: `like-${Date.now()}`,
      fromUserId,
      toUserId,
      createdAt: new Date().toISOString(),
    };
    likes.push(like);

    // 相互いいねチェック → マッチ成立
    const mutual = likes.find((l) => l.fromUserId === toUserId && l.toUserId === fromUserId);
    if (mutual) {
      const match: Match = {
        id: `match-${Date.now()}`,
        user1Id: fromUserId,
        user2Id: toUserId,
        createdAt: new Date().toISOString(),
      };
      matches.push(match);
      return { like, match };
    }

    return { like, match: null };
  },

  getLikes: () => likes,
  getMatches: (userId: string) =>
    matches.filter((m) => m.user1Id === userId || m.user2Id === userId),

  isLiked: (fromUserId: string, toUserId: string) =>
    likes.some((l) => l.fromUserId === fromUserId && l.toUserId === toUserId),

  isMatched: (userId1: string, userId2: string) =>
    matches.some(
      (m) =>
        (m.user1Id === userId1 && m.user2Id === userId2) ||
        (m.user1Id === userId2 && m.user2Id === userId1)
    ),
};
