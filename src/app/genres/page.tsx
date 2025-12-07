"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useGenres } from "../../hooks/useGenres";
import { db } from "../../lib/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthRequired } from "../../components/AuthRequired";

export default function GenresPage() {
    const { homeId, loading: authLoading, user } = useAuth();
    const { genres, loading } = useGenres(homeId);
    const [newGenre, setNewGenre] = useState("");
    const [message, setMessage] = useState("");
    const searchParams = useSearchParams();

    // ----------------------------
    // ▼ ローディング
    // ----------------------------
    if (authLoading) return <div className="p-4">読み込み中...</div>;
    if (!user) {
        return <AuthRequired />;
    }

    // ★★★ 修正：共有解除後の homeId=null を正しく処理
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
    // ▼ 編集から戻ったときのメッセージ
    // ----------------------------
    useEffect(() => {
        if (searchParams.get("updated") === "1") {
            setMessage("ジャンルを更新しました。");
            setTimeout(() => setMessage(""), 5000);
        }
    }, [searchParams]);

    // ----------------------------
    // ▼ ジャンル追加
    // ----------------------------
    const handleAdd = async () => {
        if (!newGenre.trim()) return;

        await addDoc(collection(db, "homes", homeId, "genres"), {
            name: newGenre.trim(),
            order: genres.length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        setNewGenre("");

        setMessage("ジャンルを追加しました");
        setTimeout(() => setMessage(""), 5000);
    };

    // ----------------------------
    // ▼ ジャンル削除
    // ----------------------------
    const handleDelete = async (id: string) => {
        const ok = confirm("削除してよろしいですか？");
        if (!ok) return;

        await deleteDoc(doc(db, "homes", homeId, "genres", id));

        setMessage("ジャンルを削除しました");
        setTimeout(() => setMessage(""), 5000);
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
                <button className="btn btn-primary" onClick={handleAdd}>
                    追加
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
                                >
                                    削除
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
