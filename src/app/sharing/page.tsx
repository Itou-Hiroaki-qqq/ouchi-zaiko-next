"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

import { useSharedUsers } from "../../hooks/useSharedUsers"; // ★ 追加

type OwnerInfo = {
    name?: string;
    email?: string;
};

export default function SharingPage() {
    const { homeId, user, loading: authLoading } = useAuth();

    const [pageLoading, setPageLoading] = useState(true);
    const [isOwner, setIsOwner] = useState<boolean | null>(null);
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);

    // 追加フォーム
    const [inputEmail, setInputEmail] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ▼ useSharedUsers（オーナー以外は sharedUsers = []）
    const { sharedUsers, loading: sharedLoading } = useSharedUsers(
        homeId,
        user?.uid ?? null
    );

    // ----------------------------
    // ▼ ホーム情報から ownerId を取得
    // ----------------------------
    useEffect(() => {
        if (!homeId || !user) return;

        const fetchHome = async () => {
            const ref = doc(db, "homes", homeId);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                setIsOwner(null);
                setPageLoading(false);
                return;
            }

            const data = snap.data() as { ownerId?: string };
            const ownerUid = data.ownerId;

            if (!ownerUid) {
                setIsOwner(null);
                setPageLoading(false);
                return;
            }

            // 自分がオーナーか？
            if (user.uid === ownerUid) {
                setIsOwner(true);
                setOwnerInfo({
                    name: user.displayName ?? "",
                    email: user.email ?? "",
                });
            } else {
                setIsOwner(false);

                // オーナーの users/{ownerId} 情報を取得
                const ownerRef = doc(db, "users", ownerUid);
                const ownerSnap = await getDoc(ownerRef);

                if (ownerSnap.exists()) {
                    const ownerData = ownerSnap.data() as any;
                    setOwnerInfo({
                        name: ownerData.name,
                        email: ownerData.email,
                    });
                }
            }

            setPageLoading(false);
        };

        fetchHome();
    }, [homeId, user]);

    // ----------------------------
    // ▼ メッセージ表示ヘルパー
    // ----------------------------
    const showInfo = (msg: string) => {
        setInfoMessage(msg);
        setErrorMessage("");
        setTimeout(() => setInfoMessage(""), 5000);
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setInfoMessage("");
    };

    // ----------------------------
    // ▼ 共有ユーザー追加
    // ----------------------------
    const handleAddSharedUser = async () => {
        if (!homeId) return;
        const email = inputEmail.trim();
        if (!email) return;

        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);

            if (snap.empty) {
                showError("そのアドレスは登録されていません");
                return;
            }

            const targetDoc = snap.docs[0];
            const data = targetDoc.data() as any;
            const targetUid: string = data.uid ?? targetDoc.id;

            if (data.homeId === homeId) {
                showInfo("すでにこのおうちと共有されています");
                setInputEmail("");
                return;
            }

            await updateDoc(doc(db, "users", targetUid), { homeId });

            setInputEmail("");
            showInfo("共有ユーザーを追加しました");
        } catch (err) {
            console.error(err);
            showError("共有ユーザーの追加に失敗しました");
        }
    };

    // ----------------------------
    // ▼ 共有解除
    // ----------------------------
    const handleRemoveSharedUser = async (uid: string) => {
        const ok = confirm("この共有を解除しますか？");
        if (!ok) return;

        try {
            await updateDoc(doc(db, "users", uid), { homeId: null });
            showInfo("共有を解除しました");
        } catch (err) {
            console.error(err);
            showError("共有の解除に失敗しました");
        }
    };

    // ----------------------------
    // ▼ 認証チェック
    // ----------------------------
    if (authLoading) return <div className="p-4">読み込み中...</div>;
    if (!user) return <div className="p-4">ログインが必要です。</div>;
    if (!homeId) return <div className="p-4">データを準備中...</div>;
    if (pageLoading || isOwner === null)
        return <div className="p-4">読み込み中...</div>;

    // ============================
    // ▼ オーナー画面
    // ============================
    if (isOwner) {
        return (
            <div className="p-4 max-w-xl mx-auto">
                <h1 className="text-xl font-bold mb-4">共有ユーザー管理</h1>

                {infoMessage && <p className="text-green-600 mb-2">{infoMessage}</p>}
                {errorMessage && <p className="text-red-600 mb-2">{errorMessage}</p>}

                {/* 追加フォーム */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="email"
                        className="input input-bordered w-full"
                        placeholder="共有するユーザーのメールアドレス"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleAddSharedUser}>
                        追加
                    </button>
                </div>

                {/* 共有ユーザー一覧 */}
                {sharedLoading ? (
                    <p>読み込み中...</p>
                ) : sharedUsers.length === 0 ? (
                    <p>現在、共有ユーザーはいません。</p>
                ) : (
                    <ul className="space-y-3">
                        {sharedUsers.map((u) => (
                            <li
                                key={u.uid}
                                className="card bg-base-100 shadow p-3 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold">{u.name || "(未設定)"}</p>
                                    <p className="text-sm text-gray-600">{u.email}</p>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline btn-error"
                                    onClick={() => handleRemoveSharedUser(u.uid)}
                                >
                                    解除
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    // ============================
    // ▼ 共有されているユーザー画面
    // ============================
    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-xl font-bold mb-4">
                あなたを共有しているオーナー
            </h1>

            {ownerInfo ? (
                <div className="card bg-base-100 shadow p-4">
                    <p className="font-semibold mb-1">{ownerInfo.name || "(未設定)"}</p>
                    <p className="text-sm text-gray-600">{ownerInfo.email}</p>
                </div>
            ) : (
                <p>オーナー情報を取得できませんでした。</p>
            )}
        </div>
    );
}
