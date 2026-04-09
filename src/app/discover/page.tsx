"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InstallBanner from "@/components/InstallBanner";
import { supabase } from "@/lib/supabase";
import {
  getMyProfile,
  getCompatibleUsers,
  sendLike,
  sendSkip,
  getPhotos,
  addFootprint,
  getUnreadNotificationCount,
  updateLastActive,
  DBProfile,
  DBPhoto,
} from "@/lib/supabase-db";
import { getCompatibility, CompatibilityLevel } from "@/lib/types";

// ============ 定数 ============

const SWIPE_THRESHOLD = 100; // px

const compatLabel: Record<CompatibilityLevel, { text: string; color: string }> = {
  best: { text: "最高の相性", color: "bg-pink-500 text-white" },
  good: { text: "良い相性", color: "bg-pink-100 text-pink-600" },
  neutral: { text: "普通", color: "bg-gray-100 text-gray-600" },
  bad: { text: "合わないかも", color: "bg-gray-200 text-gray-500" },
};

// ============ フィルター型 ============

interface Filters {
  minAge: number;
  maxAge: number;
  gender: "" | "male" | "female" | "other";
}

const DEFAULT_FILTERS: Filters = { minAge: 18, maxAge: 60, gender: "" };

// ============ ボトムナビアイテム ============

const NAV_ITEMS = [
  { href: "/discover", icon: "🏠", label: "ホーム" },
  { href: "/footprints", icon: "👣", label: "足あと" },
  { href: "/matches", icon: "💬", label: "マッチ" },
  { href: "/notifications", icon: "🔔", label: "通知" },
  { href: "/mypage", icon: "👤", label: "マイページ" },
] as const;

// ============ スワイプカードコンポーネント ============

interface SwipeCardProps {
  profile: DBProfile;
  photos: DBPhoto[];
  currentUser: DBProfile;
  onLike: () => void;
  onSkip: () => void;
  onTap: () => void;
}

function SwipeCard({ profile, photos, currentUser, onLike, onSkip, onTap }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // ドラッグ状態
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState<"left" | "right" | null>(null);
  const didDrag = useRef(false);

  const rotation = offsetX * 0.08; // 最大約8°
  const likeOpacity = Math.min(offsetX / SWIPE_THRESHOLD, 1);
  const skipOpacity = Math.min(-offsetX / SWIPE_THRESHOLD, 1);

  const mainPhoto = photos[0]?.photo_url ?? null;
  const compat = getCompatibility(currentUser.mbti_type, profile.mbti_type);

  // ドラッグ開始（mouse / touch 共通）
  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    didDrag.current = false;
    setIsDragging(true);
  };

  // ドラッグ中
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (dragStartX.current === null) return;
      const dx = clientX - dragStartX.current;
      if (Math.abs(dx) > 5) didDrag.current = true;
      setOffsetX(dx);
    },
    []
  );

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    if (dragStartX.current === null) return;
    setIsDragging(false);

    if (!didDrag.current) {
      // タップ判定
      setOffsetX(0);
      dragStartX.current = null;
      onTap();
      return;
    }

    if (offsetX > SWIPE_THRESHOLD) {
      setIsFlying("right");
      setTimeout(() => { onLike(); setOffsetX(0); setIsFlying(null); }, 300);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      setIsFlying("left");
      setTimeout(() => { onSkip(); setOffsetX(0); setIsFlying(null); }, 300);
    } else {
      setOffsetX(0);
    }
    dragStartX.current = null;
  }, [offsetX, onLike, onSkip, onTap]);

  // マウスイベント
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => handleDragMove(e.clientX);
    const up = () => handleDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // タッチイベント
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    handleDragStart(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };
  const onTouchEnd = () => handleDragEnd();

  // フライアニメーション用 translateX
  const flyX = isFlying === "right" ? 600 : isFlying === "left" ? -600 : offsetX;
  const transition = isFlying
    ? "transform 0.3s ease-out, opacity 0.3s"
    : isDragging
    ? "none"
    : "transform 0.25s ease-out";
  const flyOpacity = isFlying ? 0 : 1;

  return (
    <div
      ref={cardRef}
      className="relative bg-white rounded-2xl shadow-xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${flyX}px) rotate(${rotation}deg)`,
        transition,
        opacity: flyOpacity,
        touchAction: "none",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 写真エリア */}
      <div className="relative h-80 bg-gradient-to-br from-pink-400 to-purple-500">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={profile.name}
            fill
            className="object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl">
              {profile.gender === "female" ? "👩" : profile.gender === "male" ? "👨" : "🧑"}
            </span>
          </div>
        )}

        {/* LIKE オーバーレイ */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="border-4 border-green-400 rounded-xl px-6 py-3 rotate-[-20deg]">
            <span className="text-green-400 text-4xl font-black tracking-widest">LIKE</span>
          </div>
        </div>

        {/* SKIP オーバーレイ */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: skipOpacity }}
        >
          <div className="border-4 border-red-400 rounded-xl px-6 py-3 rotate-[20deg]">
            <span className="text-red-400 text-4xl font-black tracking-widest">NOPE</span>
          </div>
        </div>

        {/* MBTIバッジ */}
        <div className="absolute top-3 right-3">
          <span className="bg-purple-600/80 backdrop-blur text-white text-sm font-bold px-3 py-1 rounded-full">
            {profile.mbti_type}
          </span>
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="p-5">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
          <span className="text-gray-400 text-sm">{profile.age}歳</span>
          {profile.location && (
            <span className="text-gray-400 text-xs ml-auto">{profile.location}</span>
          )}
        </div>

        {/* 相性バッジ */}
        <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${compatLabel[compat].color}`}>
          {compatLabel[compat].text}
        </span>

        {profile.bio && (
          <p className="text-gray-500 text-sm line-clamp-2">{profile.bio}</p>
        )}

        {/* タップヒント */}
        <p className="text-center text-xs text-gray-300 mt-3">タップで詳細を見る</p>
      </div>
    </div>
  );
}

// ============ プロフィール詳細モーダル ============

interface ProfileDetailModalProps {
  profile: DBProfile;
  photos: DBPhoto[];
  currentUser: DBProfile;
  onClose: () => void;
  onLike: () => void;
  onSkip: () => void;
}

function ProfileDetailModal({ profile, photos, currentUser, onClose, onLike, onSkip }: ProfileDetailModalProps) {
  const compat = getCompatibility(currentUser.mbti_type, profile.mbti_type);
  const mainPhoto = photos[0]?.photo_url ?? null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー写真 */}
        <div className="relative h-72 bg-gradient-to-br from-pink-400 to-purple-500">
          {mainPhoto ? (
            <Image src={mainPhoto} alt={profile.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">
                {profile.gender === "female" ? "👩" : profile.gender === "male" ? "👨" : "🧑"}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <span className="text-gray-400">{profile.age}歳</span>
            <span className="ml-auto bg-purple-100 text-purple-600 text-sm font-bold px-3 py-1 rounded-full">
              {profile.mbti_type}
            </span>
          </div>

          <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${compatLabel[compat].color}`}>
            {compatLabel[compat].text}
          </span>

          {profile.occupation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>💼</span><span>{profile.occupation}</span>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span><span>{profile.location}</span>
            </div>
          )}
          {profile.height && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📏</span><span>{profile.height}cm</span>
            </div>
          )}
          {profile.hobbies && profile.hobbies.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">趣味</p>
              <div className="flex flex-wrap gap-1">
                {profile.hobbies.map((h, i) => (
                  <span key={i} className="bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full">{h}</span>
                ))}
              </div>
            </div>
          )}
          {profile.bio && (
            <div>
              <p className="text-xs text-gray-400 mb-1">自己紹介</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
          {profile.looking_for && (
            <div>
              <p className="text-xs text-gray-400 mb-1">求める相手</p>
              <p className="text-sm text-gray-700">{profile.looking_for}</p>
            </div>
          )}

          {/* サブ写真 */}
          {photos.length > 1 && (
            <div className="grid grid-cols-3 gap-1">
              {photos.slice(1).map((p) => (
                <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image src={p.photo_url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="sticky bottom-0 bg-white border-t flex gap-3 p-4">
          <button
            onClick={onSkip}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-full text-lg"
          >
            スキップ
          </button>
          <button
            onClick={onLike}
            className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-full text-lg"
          >
            ♥ いいね
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ フィルターモーダル ============

interface FilterModalProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
  onApply: () => void;
}

function FilterModal({ filters, onChange, onClose, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<Filters>(filters);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-center">絞り込み</h3>

        {/* 年齢 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">年齢: {local.minAge}歳 〜 {local.maxAge}歳</p>
          <div className="flex gap-3 items-center">
            <label className="text-xs text-gray-400 w-8">下限</label>
            <input
              type="range" min={18} max={60} value={local.minAge}
              onChange={(e) => setLocal((p) => ({ ...p, minAge: Number(e.target.value) }))}
              className="flex-1 accent-pink-500"
            />
          </div>
          <div className="flex gap-3 items-center mt-1">
            <label className="text-xs text-gray-400 w-8">上限</label>
            <input
              type="range" min={18} max={60} value={local.maxAge}
              onChange={(e) => setLocal((p) => ({ ...p, maxAge: Number(e.target.value) }))}
              className="flex-1 accent-pink-500"
            />
          </div>
        </div>

        {/* 性別 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">性別</p>
          <div className="flex gap-2">
            {(["", "male", "female", "other"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setLocal((p) => ({ ...p, gender: g }))}
                className={`flex-1 text-xs py-2 rounded-full border transition-colors ${
                  local.gender === g
                    ? "bg-pink-500 text-white border-pink-500"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {g === "" ? "全て" : g === "male" ? "男性" : g === "female" ? "女性" : "その他"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-full font-bold">
            キャンセル
          </button>
          <button
            onClick={() => { onChange(local); onApply(); onClose(); }}
            className="flex-1 bg-pink-500 text-white py-3 rounded-full font-bold"
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ ボトムナビ ============

interface BottomNavProps {
  current: string;
  unreadNotifications: number;
}

function BottomNav({ current, unreadNotifications }: BottomNavProps) {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = current === item.href;
          const showBadge = item.href === "/notifications" && unreadNotifications > 0;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? "text-pink-500" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <span className="text-2xl leading-none">{item.icon}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* iOS セーフエリア用パディング */}
      <div className="h-safe-area-bottom" />
    </nav>
  );
}

// ============ メインページ ============

export default function DiscoverPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<DBProfile | null>(null);
  const [users, setUsers] = useState<DBProfile[]>([]);
  const [photoMap, setPhotoMap] = useState<Record<string, DBPhoto[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // プロフィール & ユーザー一覧の初期ロード
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const profile = await getMyProfile();
      if (!profile) { router.push("/register"); return; }

      setCurrentUser(profile);
      await updateLastActive(profile.id);

      const [compatible, notifCount] = await Promise.all([
        getCompatibleUsers(profile.id, profile.mbti_type, {
          minAge: filters.minAge,
          maxAge: filters.maxAge,
          gender: filters.gender || undefined,
        }),
        getUnreadNotificationCount(profile.id),
      ]);

      setUsers(compatible);
      setUnreadCount(notifCount);
      setLoading(false);

      // 最初の数枚分の写真を先読み
      await preloadPhotos(compatible.slice(0, 5));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const preloadPhotos = async (targets: DBProfile[]) => {
    const results = await Promise.all(
      targets.map(async (u) => ({ id: u.id, photos: await getPhotos(u.id) }))
    );
    setPhotoMap((prev) => {
      const next = { ...prev };
      results.forEach(({ id, photos }) => { next[id] = photos; });
      return next;
    });
  };

  // フィルター適用時に再取得
  const applyFilters = async () => {
    if (!currentUser) return;
    setLoading(true);
    setCurrentIndex(0);
    const compatible = await getCompatibleUsers(currentUser.id, currentUser.mbti_type, {
      minAge: filters.minAge,
      maxAge: filters.maxAge,
      gender: filters.gender || undefined,
    });
    setUsers(compatible);
    setPhotoMap({});
    await preloadPhotos(compatible.slice(0, 5));
    setLoading(false);
  };

  // 次のカードの写真を先読み
  useEffect(() => {
    if (!users[currentIndex + 3]) return;
    const next = users[currentIndex + 3];
    if (photoMap[next.id]) return;
    getPhotos(next.id).then((photos) =>
      setPhotoMap((prev) => ({ ...prev, [next.id]: photos }))
    );
  }, [currentIndex, users, photoMap]);

  const target = users[currentIndex];

  const handleLike = async () => {
    if (!target || !currentUser) return;
    setShowDetail(false);
    const { matched } = await sendLike(currentUser.id, target.id);
    if (matched) setMatchPopup(target);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = async () => {
    if (!target || !currentUser) return;
    setShowDetail(false);
    await sendSkip(currentUser.id, target.id);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTap = async () => {
    if (!target || !currentUser) return;
    await addFootprint(currentUser.id, target.id);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-pink-500">MBTI Match</h1>
          <div className="flex gap-2 items-center">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {currentUser?.mbti_type}
            </span>
            <button
              onClick={() => setShowFilter(true)}
              className="text-sm bg-pink-50 text-pink-600 px-3 py-1 rounded-full flex items-center gap-1"
            >
              <span>🔍</span>絞り込み
            </button>
          </div>
        </div>
      </header>

      {/* カードエリア */}
      <div className="max-w-md mx-auto px-4 py-6">
        {!target ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-gray-600">
              相性の良い人を全員チェックしました！<br />
              新しいユーザーが登録されるまでお待ちください。
            </p>
            <button
              onClick={applyFilters}
              className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full text-sm"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <>
            <SwipeCard
              key={target.id}
              profile={target}
              photos={photoMap[target.id] ?? []}
              currentUser={currentUser!}
              onLike={handleLike}
              onSkip={handleSkip}
              onTap={handleTap}
            />

            {/* 操作ボタン */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <button
                onClick={handleSkip}
                className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-2xl border border-gray-100 active:scale-95 transition-transform"
                aria-label="スキップ"
              >
                ✕
              </button>
              <button
                onClick={handleLike}
                className="w-20 h-20 rounded-full bg-pink-500 shadow-lg flex items-center justify-center text-3xl text-white active:scale-95 transition-transform"
                aria-label="いいね"
              >
                ♥
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              {Math.min(currentIndex + 1, users.length)} / {users.length} 人
            </p>
          </>
        )}
      </div>

      {/* ボトムナビ */}
      <BottomNav current="/discover" unreadNotifications={unreadCount} />

      {/* マッチポップアップ */}
      {matchPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-5xl mb-4">💕</p>
            <h2 className="text-2xl font-bold text-pink-500 mb-2">マッチ成立！</h2>
            <p className="text-gray-600 mb-6">{matchPopup.name}さんとマッチしました！</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchPopup(null)}
                className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-full"
              >
                続ける
              </button>
              <button
                onClick={() => router.push("/matches")}
                className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-full"
              >
                メッセージ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プロフィール詳細モーダル */}
      {showDetail && target && currentUser && (
        <ProfileDetailModal
          profile={target}
          photos={photoMap[target.id] ?? []}
          currentUser={currentUser}
          onClose={() => setShowDetail(false)}
          onLike={handleLike}
          onSkip={handleSkip}
        />
      )}

      {/* フィルターモーダル */}
      {showFilter && (
        <FilterModal
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilter(false)}
          onApply={applyFilters}
        />
      )}

      <InstallBanner />
    </div>
  );
}
