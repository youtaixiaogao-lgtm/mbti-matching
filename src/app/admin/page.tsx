"use client";

import { useState, useEffect } from "react";
import { getAllProfiles, getAllMatches, getAllLikes, DBProfile } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

type Tab = "users" | "matches" | "likes" | "stats";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("users");
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [matches, setMatches] = useState<{ id: string; user1_id: string; user2_id: string; created_at: string }[]>([]);
  const [likes, setLikes] = useState<{ id: string; from_user_id: string; to_user_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // 簡易パスワード認証（環境変数 or ハードコード）
  const ADMIN_PASSWORD = "mbti-admin-2026";

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      loadData();
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [p, m, l] = await Promise.all([
      getAllProfiles(),
      getAllMatches(),
      getAllLikes(),
    ]);
    setProfiles(p);
    setMatches(m);
    setLikes(l);
    setLoading(false);
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    await supabase.from("profiles").update({ is_active: !isActive }).eq("id", userId);
    loadData();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("このユーザーを削除しますか？")) return;
    await supabase.from("profiles").delete().eq("id", userId);
    loadData();
  };

  const getName = (id: string) => profiles.find((p) => p.id === id)?.name || "不明";

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
          <h1 className="text-xl font-bold text-center mb-4">管理画面</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="管理パスワード"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-lg transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">MBTI Match 管理画面</h1>
          <button onClick={() => setAuthed(false)} className="text-sm text-gray-300 hover:text-white">
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {([
            ["users", "ユーザー"],
            ["matches", "マッチ"],
            ["likes", "いいね"],
            ["stats", "統計"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-gray-800 text-white" : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={loadData}
            className="ml-auto px-4 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-200"
          >
            更新
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-8">読み込み中...</p>
        ) : (
          <>
            {/* ユーザー一覧 */}
            {tab === "users" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3">名前</th>
                      <th className="text-left px-4 py-3">年齢</th>
                      <th className="text-left px-4 py-3">性別</th>
                      <th className="text-left px-4 py-3">MBTI</th>
                      <th className="text-left px-4 py-3">状態</th>
                      <th className="text-left px-4 py-3">登録日</th>
                      <th className="text-left px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">{p.age}</td>
                        <td className="px-4 py-3">
                          {p.gender === "male" ? "男" : p.gender === "female" ? "女" : "他"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-bold">
                            {p.mbti_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            p.is_active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                          }`}>
                            {p.is_active ? "有効" : "停止"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(p.created_at).toLocaleDateString("ja-JP")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleUserActive(p.id, p.is_active)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                            >
                              {p.is_active ? "停止" : "有効化"}
                            </button>
                            <button
                              onClick={() => deleteUser(p.id)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded"
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {profiles.length === 0 && (
                  <p className="text-gray-400 text-center py-8">ユーザーがいません</p>
                )}
              </div>
            )}

            {/* マッチ一覧 */}
            {tab === "matches" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3">ユーザー1</th>
                      <th className="text-left px-4 py-3">ユーザー2</th>
                      <th className="text-left px-4 py-3">マッチ日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-4 py-3">{getName(m.user1_id)}</td>
                        <td className="px-4 py-3">{getName(m.user2_id)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(m.created_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {matches.length === 0 && (
                  <p className="text-gray-400 text-center py-8">マッチがありません</p>
                )}
              </div>
            )}

            {/* いいね一覧 */}
            {tab === "likes" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3">送信者</th>
                      <th className="text-left px-4 py-3">受信者</th>
                      <th className="text-left px-4 py-3">日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {likes.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-4 py-3">{getName(l.from_user_id)}</td>
                        <td className="px-4 py-3">{getName(l.to_user_id)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(l.created_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {likes.length === 0 && (
                  <p className="text-gray-400 text-center py-8">いいねがありません</p>
                )}
              </div>
            )}

            {/* 統計 */}
            {tab === "stats" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <p className="text-3xl font-bold text-pink-500">{profiles.length}</p>
                  <p className="text-sm text-gray-500 mt-1">総ユーザー数</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <p className="text-3xl font-bold text-purple-500">{matches.length}</p>
                  <p className="text-sm text-gray-500 mt-1">マッチ数</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <p className="text-3xl font-bold text-blue-500">{likes.length}</p>
                  <p className="text-sm text-gray-500 mt-1">いいね数</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {profiles.filter((p) => p.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">アクティブユーザー</p>
                </div>

                {/* MBTIタイプ別分布 */}
                <div className="col-span-2 md:col-span-4 bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-bold mb-4">MBTIタイプ別分布</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"].map((type) => {
                      const count = profiles.filter((p) => p.mbti_type === type).length;
                      return (
                        <div key={type} className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-bold text-purple-600">{type}</p>
                          <p className="text-lg font-bold">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
