"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGenres } from "../hooks/useGenres";
import { useItems } from "../hooks/useItems";
import Link from "next/link";

export default function HomePage() {
  const { homeId, loading } = useAuth();

  // 選択中のジャンルID
  const [activeGenreId, setActiveGenreId] = useState<string | null>(null);

  // Firestore: ジャンル一覧
  const { genres, loading: genreLoading } = useGenres(homeId);

  // Firestore: 商品一覧
  const { items, loading: itemLoading } = useItems(homeId, activeGenreId);

  // ▼ 初期ジャンル選択（最初の1回だけ）
  useEffect(() => {
    if (!activeGenreId && genres.length > 0) {
      setActiveGenreId(genres[0].id);
    }
  }, [genres, activeGenreId]);

  // ▼ ロード中
  if (loading || genreLoading) {
    return <div className="p-4">読み込み中...</div>;
  }

  // ▼ ジャンルが1つもない場合
  if (genres.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">在庫リスト</h1>
        <p>
          ジャンルが登録されていません。まずは「ジャンル設定」からジャンルを追加してください。
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">在庫リスト</h1>

      {/* ▼ ジャンルタブ（a → button に変更） */}
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

      {/* ▼ 商品登録フォーム（後で実装するので disabled） */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="商品名を入力"
          className="input input-bordered w-full"
          disabled
        />
        <button className="btn btn-primary" disabled>
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
              {/* ▼ 次回購入ボタン（後で実装） */}
              <button className="btn btn-sm btn-accent" disabled>
                次回購入
              </button>

              {/* ▼ 商品名（クリックで商品設定ページへ） */}
              <Link href={`/items/${item.id}`} className="flex-1 mx-4">
                {item.name}
              </Link>

              {/* ▼ 数量（後で実装） */}
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
