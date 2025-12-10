"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGenres } from "../hooks/useGenres";
import { useItems } from "../hooks/useItems";
import Link from "next/link";

import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { AuthRequired } from "@/components/AuthRequired";

export default function HomePage() {
  const { homeId, loading: authLoading, user } = useAuth();

  const [activeGenreId, setActiveGenreId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const { genres, loading: genreLoading } = useGenres(homeId);
  const { items, loading: itemLoading } = useItems(homeId, activeGenreId);

  // ----------------------------
  // ▼ 初期ジャンル設定
  // ----------------------------
  useEffect(() => {
    if (genres.length > 0 && !activeGenreId) {
      setActiveGenreId(genres[0].id);
    }
  }, [genres, activeGenreId]);

  // ----------------------------
  // ▼ 商品追加
  // ----------------------------
  const handleAddItem = async () => {
    if (!homeId || !activeGenreId) return;
    if (!newItem.trim()) return;

    await addDoc(collection(db, "homes", homeId, "items"), {
      name: newItem.trim(),
      genreId: activeGenreId,
      quantity: 0,
      memo: "",
      note: "",
      purchaseCount: 0,
      totalPurchased: 0,
      order: items.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setNewItem("");
  };

  // ----------------------------
  // ▼ 数量更新
  // ----------------------------
  const updateQuantity = async (itemId: string, newQty: number) => {
    if (!homeId) return;

    const safeQty = newQty < 0 ? 0 : newQty;

    await updateDoc(doc(db, "homes", homeId, "items", itemId), {
      quantity: safeQty,
      updatedAt: new Date(),
    });
  };

  const handleIncrease = (itemId: string, currentQty: number) => {
    updateQuantity(itemId, (currentQty ?? 0) + 1);
  };

  const handleDecrease = (itemId: string, currentQty: number) => {
    if ((currentQty ?? 0) <= 0) return;
    updateQuantity(itemId, (currentQty ?? 0) - 1);
  };

  const handleQuantityInputChange = (itemId: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    if (num < 0) return;
    updateQuantity(itemId, num);
  };

  // ----------------------------
  // ▼ 次回購入リストへ追加
  // ----------------------------
  const handleAddToNext = async (itemId: string, currentCount?: number) => {
    if (!homeId) return;

    const nextCount = currentCount && currentCount > 0 ? currentCount : 1;

    await updateDoc(doc(db, "homes", homeId, "items", itemId), {
      purchaseCount: nextCount,
      updatedAt: new Date(),
    });

    alert("次回購入リストに追加しました");
  };

  // ----------------------------
  // ▼ UI 分岐
  // ----------------------------

  if (authLoading) return <div className="p-4">読み込み中...</div>;
  if (!user) return <AuthRequired />;

  if (!homeId) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-2">最初に共有設定が必要です</h2>
        <p className="mb-4">
          共有設定ページでオーナー登録をするか、
          オーナーユーザーから共有設定を受けてください。
        </p>

        <Link href="/sharing" className="btn btn-primary">
          共有設定へ
        </Link>
      </div>
    );
  }

  if (genreLoading) return <div className="p-4">読み込み中...</div>;

  if (genres.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">在庫リスト</h1>
        <p>
          ジャンルが登録されていません。
          まずは「ジャンル設定」からジャンルを追加してください。
        </p>
      </div>
    );
  }

  if (!activeGenreId) return <div className="p-4">読み込み中...</div>;

  // ----------------------------
  // ▼ 並び替え（最重要ロジック）
  // ----------------------------
  const sortedItems = [...items].sort((a, b) => {
    const qtyA = a.quantity ?? 0;
    const qtyB = b.quantity ?? 0;

    // 最優先：数量 0 の商品を上に
    if (qtyA === 0 && qtyB !== 0) return -1;
    if (qtyA !== 0 && qtyB === 0) return 1;

    // 次：登録順
    return (a.order ?? 0) - (b.order ?? 0);
  });

  // ----------------------------
  // ▼ 通常画面
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
      ) : sortedItems.length === 0 ? (
        <p>登録されている商品はありません。</p>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const qty = item.quantity ?? 0;
            const isZero = qty === 0;

            return (
              <div
                key={item.id}
                className={
                  "card shadow p-2 flex flex-row justify-between items-center " +
                  (isZero ? "bg-base-200 text-gray-400" : "bg-base-100")
                }
              >
                {/* ▼ 次回購入（2行表示） */}
                <button
                  className="btn bg-accent text-white min-h-8 h-auto px-2 py-1 flex flex-col leading-tight text-xs"
                  onClick={() => handleAddToNext(item.id, item.purchaseCount)}
                >
                  <span>次回</span>
                  <span>購入</span>
                </button>

                {/* 商品名 */}
                <Link
                  href={`/items/${item.id}`}
                  className={`flex-1 mx-4 underline-offset-2 ${
                    isZero
                      ? "text-gray-400 hover:text-gray-600 hover:underline"
                      : "hover:underline"
                  }`}
                >
                  {item.name}
                </Link>

                {/* ▼ 数量エリア */}
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-xs"
                    onClick={() => handleDecrease(item.id, qty)}
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min={0}
                    className={
                      "input input-bordered w-10 text-center " +
                      (isZero ? "text-gray-400" : "")
                    }
                    value={qty}
                    onChange={(e) =>
                      handleQuantityInputChange(item.id, e.target.value)
                    }
                  />

                  <button
                    className="btn btn-xs"
                    onClick={() => handleIncrease(item.id, qty)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
