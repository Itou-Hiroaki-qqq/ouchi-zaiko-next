"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGenres } from "../hooks/useGenres";
import { useItems } from "../hooks/useItems";
import Link from "next/link";

import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function HomePage() {
  const { homeId, loading: authLoading, user } = useAuth();

  const [activeGenreId, setActiveGenreId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const { genres, loading: genreLoading } = useGenres(homeId);
  const { items, loading: itemLoading } = useItems(homeId, activeGenreId);

  // ▼ 初期ジャンル設定（Hooks の中）
  useEffect(() => {
    if (genres.length > 0 && !activeGenreId) {
      setActiveGenreId(genres[0].id);
    }
  }, [genres, activeGenreId]);

  // ▼ 商品追加
  const handleAddItem = async () => {
    if (!newItem.trim() || !homeId || !activeGenreId) return;

    await addDoc(collection(db, "homes", homeId, "items"), {
      name: newItem.trim(),
      genreId: activeGenreId,
      quantity: 0,
      purchaseCount: 0,
      memo: "",
      order: items.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setNewItem("");
  };

  // ----------------------------
  // ▼ UI 分岐（Hooks の後に 1 回だけ）
  // ----------------------------

  if (authLoading) {
    return <div className="p-4">読み込み中...</div>;
  }

  if (!user) {
    return <div className="p-4">ログインが必要です。</div>;
  }

  if (!homeId) {
    return <div className="p-4">データを準備中...</div>;
  }

  if (genreLoading) {
    return <div className="p-4">ジャンルを読み込み中...</div>;
  }

  if (genres.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">在庫リスト</h1>
        <p>ジャンルが登録されていません。「ジャンル設定」から作成してください。</p>
      </div>
    );
  }

  if (!activeGenreId) {
    return <div className="p-4">ジャンルを準備中...</div>;
  }

  // ----------------------------
  // ▼ 通常画面（ここだけが最終的な画面）
  // ----------------------------
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">在庫リスト</h1>

      {/* ▼ ジャンルタブ */}
      <div role="tablist" className="tabs tabs-bordered mb-4">
        {genres.map((genre) => (
          <button
            key={genre.id}
            role="tab"
            className={`tab ${activeGenreId === genre.id ? "tab-active" : ""}`}
            onClick={() => setActiveGenreId(genre.id)}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* ▼ 商品登録フォーム */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="商品名を入力"
          className="input input-bordered w-full"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAddItem}>
          登録
        </button>
      </div>

      {/* ▼ 商品一覧 */}
      {itemLoading ? (
        <p>読み込み中...</p>
      ) : items.length === 0 ? (
        <p>登録されている商品はありません。</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="card bg-base-100 shadow p-4 flex flex-row justify-between items-center"
            >
              <button className="btn btn-sm btn-accent" disabled>
                次回購入
              </button>

              <Link href={`/items/${item.id}`} className="flex-1 mx-4">
                {item.name}
              </Link>

              <div className="flex items-center gap-2">
                <button className="btn btn-sm" disabled>
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button className="btn btn-sm" disabled>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
