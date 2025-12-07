"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useItem } from "../../../hooks/useItem";

import { db } from "../../../lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { AuthRequired } from "@/components/AuthRequired";

export default function ItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const itemId = params?.id as string;

    const { homeId, user, loading: authLoading } = useAuth();
    const { item, loading: itemLoading } = useItem(homeId, itemId);

    const [memo, setMemo] = useState("");

    useEffect(() => {
        if (item) {
            setMemo(item.memo ?? item.note ?? "");
        }
    }, [item]);

    // ---------------------------
    // ▼ ローディング・エラー処理
    // ---------------------------
    if (authLoading) return <div className="p-4">認証情報を読み込み中...</div>;
    if (!user) {
        return <AuthRequired />;
    }

    // ★★★ 修正：homeId=null のとき専用 UI を表示
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

    if (itemLoading) return <div className="p-4">商品情報を読み込み中...</div>;

    if (!item) {
        return (
            <div className="p-4">
                <p>商品が見つかりません。</p>
                <Link href="/" className="text-blue-500 underline">
                    ← 戻る
                </Link>
            </div>
        );
    }

    // ---------------------------
    // ▼ Firestore 更新処理
    // ---------------------------
    const handleSave = async () => {
        await updateDoc(doc(db, "homes", homeId, "items", itemId), {
            memo,
            updatedAt: new Date(),
        });
        alert("備考メモを保存しました");
    };

    const handleDelete = async () => {
        if (!confirm("本当にこの商品を完全に削除しますか？この操作は取り消せません")) return;

        await deleteDoc(doc(db, "homes", homeId, "items", itemId));
        alert("削除しました");
        router.push("/");
    };

    // ---------------------------
    // ▼ 表示
    // ---------------------------
    return (
        <div className="p-4 mx-auto max-w-lg space-y-6">
            <h1 className="text-xl font-bold">商品設定ページ</h1>

            {/* 商品名（編集不可） */}
            <div>
                <span className="font-bold">商品名：</span>
                <span>{item.name}</span>
            </div>

            {/* 備考メモ */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-bold">備考メモ</span>
                </label>

                <textarea
                    value={memo}
                    className="textarea textarea-bordered mb-4 block"
                    placeholder="この商品のメモを入力してください"
                    onChange={(e) => setMemo(e.target.value)}
                />
            </div>

            {/* 保存 */}
            <button className="btn btn-primary block" onClick={handleSave}>
                作成
            </button>

            {/* 削除 */}
            <button className="btn btn-error" onClick={handleDelete}>
                この商品を完全に削除する
            </button>

            <Link href="/" className="text-blue-600 underline block pt-4">
                ← 戻る
            </Link>
        </div>
    );
}
