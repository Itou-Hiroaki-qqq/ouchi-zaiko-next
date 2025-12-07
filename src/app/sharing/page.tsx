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
    setDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

import { useSharedUsers } from "../../hooks/useSharedUsers";

type OwnerInfo = {
    name?: string;
    email?: string;
};

export default function SharingPage() {
    const { homeId, user, loading: authLoading } = useAuth();

    const [pageLoading, setPageLoading] = useState(true);
    const [isOwner, setIsOwner] = useState<boolean | null>(null);
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);

    const [inputEmail, setInputEmail] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const { sharedUsers, loading: sharedLoading } = useSharedUsers(
        homeId,
        user?.uid ?? null
    );

    // ----------------------------
    // ▼ おうちを新規作成（homeId=null の人向け）
    // ----------------------------
    const handleCreateHome = async () => {
        if (!user) return;

        try {
            const newHomeRef = doc(collection(db, "homes"));
            const newHomeId = newHomeRef.id;

            await setDoc(newHomeRef, {
                ownerId: user.uid,
                ownerName: user.displayName ?? user.email ?? "",
                ownerEmail: user.email ?? "",
                createdAt: new Date(),
            });

            await updateDoc(doc(db, "users", user.uid), {
                homeId: newHomeId,
            });

            // オーナー自身を members に追加
            await setDoc(doc(db, "homes", newHomeId, "members", user.uid), {
                role: "owner",
                joinedAt: new Date(),
                name: user.displayName ?? "",
                email: user.email ?? "",
            });

            setInfoMessage("新しいおうちを作成しました。ページを再読み込みしてください。");
        } catch (err) {
            console.error(err);
            setErrorMessage("おうちの作成に失敗しました");
        }
    };

    // ----------------------------
    // ▼ ホーム情報から owner 情報を取得
    // ----------------------------
    useEffect(() => {
        if (!homeId || !user) {
            setPageLoading(false);
            return;
        }

        const fetchHome = async () => {
            const ref = doc(db, "homes", homeId);
            const snap = await getDoc(ref);

            if (!snap.exists()) {
                setIsOwner(null);
                setPageLoading(false);
                return;
            }

            const data = snap.data() as {
                ownerId?: string;
                ownerName?: string;
                ownerEmail?: string;
            };

            const ownerUid = data.ownerId;

            if (!ownerUid) {
                setIsOwner(null);
                setPageLoading(false);
                return;
            }

            if (user.uid === ownerUid) {
                setIsOwner(true);
                setOwnerInfo({
                    name: data.ownerName ?? user.displayName ?? "",
                    email: data.ownerEmail ?? user.email ?? "",
                });
            } else {
                setIsOwner(false);
                setOwnerInfo({
                    name: data.ownerName ?? "(未設定)",
                    email: data.ownerEmail ?? "",
                });
            }

            setPageLoading(false);
        };

        fetchHome();
    }, [homeId, user]);

    // ----------------------------
    // ▼ メッセージ表示
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
            const targetUid = data.uid ?? targetDoc.id;

            if (data.homeId === homeId) {
                showInfo("すでにこのおうちと共有されています");
                setInputEmail("");
                return;
            }

            await updateDoc(doc(db, "users", targetUid), { homeId });

            await setDoc(doc(db, "homes", homeId, "members", targetUid), {
                role: "shared",
                joinedAt: new Date(),
                name: data.name ?? "",
                email: data.email ?? "",
            });

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
        if (!homeId) return;

        const ok = confirm("この共有を解除しますか？");
        if (!ok) return;

        try {
            await updateDoc(doc(db, "users", uid), { homeId: null });
            await deleteDoc(doc(db, "homes", homeId, "members", uid));

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

    // ============================================================
    // ▼ homeId が null の場合：あなたの指定どおりに表示
    // ============================================================
    if (!homeId) {
        return (
            <div className="p-4 max-w-2xl mx-auto">
                <h2 className="text-lg font-bold mb-2">共有設定ページ</h2>
                <p className="mb-4">
                    自分をオーナーに設定する場合は、以下のオーナー登録ボタンを押してください<br />
                    他のユーザーの共有に入る場合は、オーナーユーザーから共有設定を受けてください。
                </p>

                {infoMessage && <p className="text-green-600 mb-2">{infoMessage}</p>}
                {errorMessage && <p className="text-red-600 mb-2">{errorMessage}</p>}

                <button className="btn btn-primary" onClick={handleCreateHome}>
                    オーナー登録
                </button>
            </div>
        );
    }

    // ----------------------------
    // ▼ 読み込み中
    // ----------------------------
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
    // ▼ 共有ユーザー画面
    // ============================
    return (
        <div className="p-4 max-w-xl mx-auto">
            <h1 className="text-xl font-bold mb-4">あなたを共有しているオーナー</h1>

            {ownerInfo ? (
                <div className="card bg-base-100 shadow p-4">
                    <p className="font-semibold mb-1">{ownerInfo.name}</p>
                    <p className="text-sm text-gray-600">{ownerInfo.email}</p>
                </div>
            ) : (
                <p>オーナー情報を取得できませんでした。</p>
            )}
        </div>
    );
}
