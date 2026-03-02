"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useGenres } from "../../hooks/useGenres";
import { db } from "../../lib/firebase";
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { AuthRequired } from "../../components/AuthRequired";

export default function GenresPage() {
    const { homeId, loading: authLoading, user } = useAuth();
    const { genres, loading } = useGenres(homeId);

    const [newGenre, setNewGenre] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ----------------------------
    // ▼ ローディング
    // ----------------------------
    if (authLoading) return <div className="p-4">読み込み中...</div>;
    if (!user) {
        return <AuthRequired />;
    }

    // ★★★ 共有解除後の homeId=null を正しく処理
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

    // ----------------------------
    // ▼ ジャンル追加
    // ----------------------------
    const handleAdd = async () => {
        if (!newGenre.trim()) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "homes", homeId, "genres"), {
                name: newGenre.trim(),
                order: genres.length,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setNewGenre("");
            setMessage("ジャンルを追加しました");
            setTimeout(() => setMessage(""), 5000);
        } catch (e) {
            console.error("ジャンル追加エラー:", e);
            setMessage("追加に失敗しました");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ----------------------------
    // ▼ ジャンル削除（紐づくアイテムも削除）
    // ----------------------------
    const handleDelete = async (id: string) => {
        const ok = confirm("削除してよろしいですか？\nこのジャンルに属する商品もすべて削除されます。");
        if (!ok) return;
        if (deletingId) return;

        setDeletingId(id);
        try {
            // ① 紐づくアイテムを全て削除
            const itemsQuery = query(
                collection(db, "homes", homeId, "items"),
                where("genreId", "==", id)
            );
            const itemsSnapshot = await getDocs(itemsQuery);
            await Promise.all(itemsSnapshot.docs.map((d) => deleteDoc(d.ref)));

            // ② ジャンル自体を削除
            await deleteDoc(doc(db, "homes", homeId, "genres", id));

            setMessage("ジャンルと関連する商品を削除しました");
            setTimeout(() => setMessage(""), 5000);
        } catch (e) {
            console.error("ジャンル削除エラー:", e);
            setMessage("削除に失敗しました");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setDeletingId(null);
        }
    };

    // ----------------------------
    // ▼ UI
    // ----------------------------
    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">ジャンル一覧</h1>

            {message && <p className="text-green-600">{message}</p>}

            {/* ジャンル追加フォーム */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="新しいジャンル名"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "追加中..." : "追加"}
                </button>
            </div>

            {/* ジャンル一覧 */}
            {loading ? (
                <p>読み込み中...</p>
            ) : genres.length === 0 ? (
                <p>ジャンルがありません</p>
            ) : (
                <ul className="space-y-3">
                    {genres.map((genre) => (
                        <li
                            key={genre.id}
                            className="card bg-base-100 shadow p-3 flex justify-between items-center"
                        >
                            <span>ジャンル名：{genre.name}</span>

                            <div className="flex gap-3 mt-2.5">
                                <Link
                                    href={`/genres/${genre.id}/edit`}
                                    className="btn btn-sm btn-neutral"
                                >
                                    編集
                                </Link>

                                <button
                                    className="btn btn-sm btn-outline btn-error"
                                    onClick={() => handleDelete(genre.id)}
                                    disabled={deletingId === genre.id}
                                >
                                    {deletingId === genre.id ? "削除中..." : "削除"}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
