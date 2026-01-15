"use client";

import { useEffect, useState, useRef } from "react";
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
import { Item } from "../types/firestore";

export default function HomePage() {
  const { homeId, loading: authLoading, user } = useAuth();

  const [activeGenreId, setActiveGenreId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");
  const [sortedItems, setSortedItems] = useState<Item[]>([]);
  const prevGenreIdRef = useRef<string | null>(null);
  const prevItemLoadingRef = useRef(true);

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
  // ▼ 並び替え（画面遷移・リロード時のみ適用）
  // ----------------------------
  useEffect(() => {
    // ジャンル変更時、または初回ロード完了時にのみ並び替えを適用
    const genreChanged = prevGenreIdRef.current !== activeGenreId;
    const initialLoadComplete = prevItemLoadingRef.current && !itemLoading;

    if (!genreChanged && !initialLoadComplete) {
      // 数量変更や商品追加による更新の場合は、sortedItemsを更新するが並び替えはしない
      if (!itemLoading && items.length > 0) {
        setSortedItems((prevSorted) => {
          const prevItemIds = new Set(prevSorted.map((item) => item.id));
          const currentItemIds = new Set(items.map((item) => item.id));
          
          // 新しい商品が追加された場合は並び替えを適用
          const hasNewItems = items.some((item) => !prevItemIds.has(item.id));
          // 商品が削除された場合も並び替えを適用
          const hasRemovedItems = prevSorted.some((item) => !currentItemIds.has(item.id));
          
          if (hasNewItems || hasRemovedItems) {
            // 商品の追加・削除があった場合は並び替えを適用
            const sorted = [...items].sort((a, b) => {
              const qtyA = a.quantity ?? 0;
              const qtyB = b.quantity ?? 0;
              if (qtyA !== qtyB) {
                return qtyA - qtyB;
              }
              const totalA = a.totalPurchased ?? 0;
              const totalB = b.totalPurchased ?? 0;
              if (totalA !== totalB) {
                return totalB - totalA;
              }
              return (a.order ?? 0) - (b.order ?? 0);
            });
            return sorted;
          }
          
          // 数量変更のみの場合は、数量だけを更新（並び替えはしない）
          return prevSorted.map((sortedItem) => {
            const updatedItem = items.find((item) => item.id === sortedItem.id);
            return updatedItem ? { ...sortedItem, quantity: updatedItem.quantity } : sortedItem;
          });
        });
      }
      prevItemLoadingRef.current = itemLoading;
      return;
    }

    // ジャンル変更時または初回ロード完了時は並び替えを適用
    prevGenreIdRef.current = activeGenreId;
    prevItemLoadingRef.current = itemLoading;

    if (items.length === 0) {
      setSortedItems([]);
      return;
    }

    const sorted = [...items].sort((a, b) => {
      const qtyA = a.quantity ?? 0;
      const qtyB = b.quantity ?? 0;

      // ① 数量が少ないものほど上
      if (qtyA !== qtyB) {
        return qtyA - qtyB;
      }

      // ② 過去の購入数が多いもの
      const totalA = a.totalPurchased ?? 0;
      const totalB = b.totalPurchased ?? 0;
      if (totalA !== totalB) {
        return totalB - totalA;
      }

      // ③ 登録順
      return (a.order ?? 0) - (b.order ?? 0);
    });

    setSortedItems(sorted);
  }, [activeGenreId, itemLoading, items]);

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
  // ▼ 通常画面
  // ----------------------------
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">在庫リスト</h1>

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
                <button
                  className="btn bg-accent text-white min-h-8 h-auto px-2 py-1 flex flex-col leading-tight text-xs"
                  onClick={() => handleAddToNext(item.id, item.purchaseCount)}
                >
                  <span>次回</span>
                  <span>購入</span>
                </button>

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
