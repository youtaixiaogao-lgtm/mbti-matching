"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getMyProfile,
  updateProfile,
  getPhotos,
  uploadPhoto,
  deletePhoto,
  DBProfile,
  DBPhoto,
} from "@/lib/supabase-db";
import { MBTI_TYPES } from "@/lib/types";

const HOBBY_OPTIONS = [
  "旅行", "映画", "音楽", "読書", "料理", "スポーツ", "カフェ巡り",
  "写真", "ゲーム", "アニメ", "アウトドア", "ヨガ", "ダンス", "アート",
  "お酒", "ペット", "ドライブ", "カラオケ", "キャンプ", "ファッション",
];

export default function MyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [photos, setPhotos] = useState<DBPhoto[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 編集用フォーム
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [height, setHeight] = useState("");
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const p = await getMyProfile();
      if (!p) { router.push("/register"); return; }
      setProfile(p);
      setName(p.name);
      setBio(p.bio);
      setHeight(p.height?.toString() || "");
      setOccupation(p.occupation || "");
      setLocation(p.location || "");
      setHobbies(p.hobbies || []);
      setLookingFor(p.looking_for || "");
      const ph = await getPhotos(p.id);
      setPhotos(ph);
      setLoading(false);
    })();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    await updateProfile(profile.id, {
      name,
      bio,
      height: height ? parseInt(height) : undefined,
      occupation,
      location,
      hobbies,
      looking_for: lookingFor,
    });
    const p = await getMyProfile();
    if (p) setProfile(p);
    setEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      await uploadPhoto(profile.id, file);
      const ph = await getPhotos(profile.id);
      setPhotos(ph);
    } catch {
      // エラー処理
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("この写真を削除しますか？")) return;
    await deletePhoto(photoId);
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleHobby = (h: string) => {
    setHobbies((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">読み込み中...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">マイページ</h1>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500">キャンセル</button>
              <button onClick={handleSave} className="text-sm bg-pink-500 text-white px-4 py-1 rounded-full">保存</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm text-pink-500 font-medium">編集</button>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 写真 */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">写真</h2>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                {editing && (
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {photos.length < 6 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-pink-300 hover:text-pink-400 transition-colors"
              >
                {uploading ? "..." : "+"}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* プロフィール */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-3xl">
              {profile?.gender === "female" ? "👩" : profile?.gender === "male" ? "👨" : "🧑"}
            </div>
            <div>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-lg border-b border-pink-300 focus:outline-none" />
              ) : (
                <h2 className="font-bold text-lg">{profile?.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                  {profile?.mbti_type}
                </span>
                <span className="text-xs text-gray-400">{profile?.age}歳</span>
              </div>
            </div>
          </div>

          {/* 自己紹介 */}
          <div>
            <label className="text-xs font-medium text-gray-500">自己紹介</label>
            {editing ? (
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-pink-500" />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{profile?.bio || "未設定"}</p>
            )}
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">身長</label>
              {editing ? (
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-pink-500" />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{profile?.height ? `${profile.height}cm` : "未設定"}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">職業</label>
              {editing ? (
                <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="エンジニア" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-pink-500" />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{profile?.occupation || "未設定"}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">居住地</label>
              {editing ? (
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="東京" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-pink-500" />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{profile?.location || "未設定"}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">出会いの目的</label>
              {editing ? (
                <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-pink-500">
                  <option value="">選択してください</option>
                  <option value="serious">真剣な交際</option>
                  <option value="casual">カジュアル</option>
                  <option value="friend">友達探し</option>
                </select>
              ) : (
                <p className="text-sm text-gray-700 mt-1">
                  {profile?.looking_for === "serious" ? "真剣な交際" : profile?.looking_for === "casual" ? "カジュアル" : profile?.looking_for === "friend" ? "友達探し" : "未設定"}
                </p>
              )}
            </div>
          </div>

          {/* 趣味 */}
          <div>
            <label className="text-xs font-medium text-gray-500">趣味</label>
            {editing ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {HOBBY_OPTIONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => toggleHobby(h)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                      hobbies.includes(h)
                        ? "bg-pink-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-pink-100"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(profile?.hobbies || []).length > 0 ? (
                  profile?.hobbies.map((h) => (
                    <span key={h} className="text-xs bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full">{h}</span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">未設定</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 設定 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <button
            onClick={() => router.push("/admin")}
            className="w-full text-left text-sm text-gray-700 py-2 border-b border-gray-100"
          >
            管理画面
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-500 py-2"
          >
            ログアウト
          </button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-md mx-auto flex">
          {[
            { href: "/discover", icon: "🏠", label: "ホーム" },
            { href: "/footprints", icon: "👣", label: "足あと" },
            { href: "/matches", icon: "💬", label: "マッチ" },
            { href: "/notifications", icon: "🔔", label: "通知" },
            { href: "/mypage", icon: "👤", label: "マイページ" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${item.href === "/mypage" ? "text-pink-500" : "text-gray-400"}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
