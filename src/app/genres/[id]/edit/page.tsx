"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";

export default function GenreEditPage() {
    const router = useRouter();
    const params = useParams();
    const { homeId } = useAuth();

    const genreId = params.id as string;

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);

    // Firestore から現在のジャンル名を取得
    useEffect(() => {
        if (!homeId) return;

        const fetchData = async () => {
            const ref = doc(db, "homes", homeId, "genres", genreId);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                setName(snap.data().name);
            }

            setLoading(false);
        };

        fetchData();
    }, [homeId, genreId]);

    const handleUpdate = async () => {
        if (!name.trim()) return;

        const ref = doc(db, "homes", homeId!, "genres", genreId);

        await updateDoc(ref, {
            name: name.trim(),
            updatedAt: serverTimestamp(),
        });

        // 編集後に一覧ページへ戻る + メッセージ表示
        router.push("/genres?updated=1");
    };

    const handleCancel = () => {
        router.push("/genres");
    };

    if (loading) {
        return <div className="p-4">読み込み中...</div>;
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">ジャンル編集</h1>

            <label className="form-control w-full mb-4">
                <span className="label-text">ジャンル名</span>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </label>

            <div className="flex justify-between mt-4">
                <button className="btn btn-secondary" onClick={handleCancel}>
                    戻る
                </button>

                <button className="btn btn-primary" onClick={handleUpdate}>
                    更新
                </button>
            </div>
        </div>
    );
}
