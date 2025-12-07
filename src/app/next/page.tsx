"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNextItems } from "../../hooks/useNextItems";
import { useGenres } from "../../hooks/useGenres";
import Link from "next/link";

import { db } from "../../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { AuthRequired } from "@/components/AuthRequired";

export default function NextPage() {
    const { homeId, loading: authLoading, user } = useAuth();
    const { genres } = useGenres(homeId);
    const { items, loading: nextLoading } = useNextItems(homeId);

    const [message, setMessage] = useState("");

    const [activeGenreId, setActiveGenreId] = useState<string | null>(null);

    // ----------------------------
    // ▼ ローディング処理
    // ----------------------------
    if (authLoading) return <div className="p-4">読み込み中...</div>;
    if (!user) {
        return <AuthRequired />;
    }

    // ★★★ 修正：homeId が null の場合の UI
    if (!homeId) {
        return (
            <div className="p-4">
                <h2 className="text-lg font-bold mb-2">最初に共有設定が必要です</h2>
                <p className="mb-4">
                    共有設定ページでオーナー登録をするか、オーナーユーザーから共有設定を受けてください。
                </p>

                <Link href="/sharing" className="btn btn-primary">
                    共有設定へ
                </Link>
            </div>
        );
    }

    if (nextLoading) return <div className="p-4">読み込み中...</div>;

    // purchaseCount > 0 の商品のみ
    const grouped = genres.map((g) => ({
        ...g,
        items: items.filter(
            (item) => item.genreId === g.id && (item.purchaseCount ?? 0) > 0
        ),
    }));

    // アイテムのあるジャンルだけ表示
    const visibleGenres = grouped.filter((g) => g.items.length > 0);

    // 初期タブ設定
    if (!activeGenreId && visibleGenres.length > 0) {
        setActiveGenreId(visibleGenres[0].id);
    }

    // 表示するジャンルがない
    if (visibleGenres.length === 0) {
        return (
            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">次回購入リスト</h1>
                <p>次回購入リストは空です。</p>
            </div>
        );
    }

    // ----------------------------
    // ▼ 購入済み処理
    // ----------------------------
    const handlePurchased = async (itemId: string) => {
        if (!homeId) return;

        const ref = doc(db, "homes", homeId, "items", itemId);

        await updateDoc(ref, {
            quantity: increment(1),
            purchaseCount: 0,
            updatedAt: new Date(),
        });

        setMessage("購入済みにしました");
        setTimeout(() => setMessage(""), 5000);
    };

    // ----------------------------
    // ▼ 購入やめ（リストから削除）
    // ----------------------------
    const handleCancel = async (itemId: string) => {
        if (!homeId) return;

        const ref = doc(db, "homes", homeId, "items", itemId);

        await updateDoc(ref, {
            purchaseCount: 0,
            updatedAt: new Date(),
        });

        setMessage("購入リストから削除しました");
        setTimeout(() => setMessage(""), 5000);
    };

    const currentGenre = visibleGenres.find((g) => g.id === activeGenreId);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-2">次回購入リスト</h1>

            {message && (
                <p className="text-green-600 mb-3 font-semibold">{message}</p>
            )}

            {/* ▼ ジャンルタブ */}
            <div role="tablist" className="tabs tabs-bordered mb-4">
                {visibleGenres.map((genre) => (
                    <button
                        key={genre.id}
                        role="tab"
                        className={`tab ${activeGenreId === genre.id ? "tab-active" : ""
                            }`}
                        onClick={() => setActiveGenreId(genre.id)}
                    >
                        {genre.name}
                    </button>
                ))}
            </div>

            {/* ▼ 商品一覧 */}
            {currentGenre && currentGenre.items.length > 0 ? (
                <div className="space-y-3">
                    {currentGenre.items.map((item) => (
                        <div
                            key={item.id}
                            className="card bg-base-100 shadow p-4 flex flex-row justify-between items-center"
                        >
                            {/* 商品名リンク */}
                            <Link href={`/items/${item.id}`} className="flex-1">
                                {item.name}
                            </Link>

                            <button
                                className="btn btn-sm btn-success ml-4"
                                onClick={() => handlePurchased(item.id)}
                            >
                                購入済み
                            </button>

                            <button
                                className="btn btn-sm btn-warning ml-2"
                                onClick={() => handleCancel(item.id)}
                            >
                                購入やめ
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p>このジャンルには次回購入予定の商品がありません。</p>
            )}
        </div>
    );
}
