"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    // フォームの状態
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");

        if (!name || !email || !password || !confirm) {
            setError("全ての項目を入力してください");
            return;
        }

        if (password !== confirm) {
            setError("パスワードが一致しません");
            return;
        }

        try {
            // Firebase Auth の登録
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 表示名（name）を設定
            await updateProfile(userCredential.user, { displayName: name });

            // 1. home を作成
            const homeRef = await addDoc(collection(db, "homes"), {
                ownerId: userCredential.user.uid,
                createdAt: new Date(),
            });

            // homeId を取得
            const homeId = homeRef.id;

            // 2. homes/{homeId}/members/{uid} を作成
            await setDoc(doc(db, "homes", homeId, "members", userCredential.user.uid), {
                role: "owner",
                joinedAt: new Date(),
            });

            // 3. Firestore にユーザー情報を保存
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                name,
                email,
                homeId,
                createdAt: new Date(),
            });

            // 登録完了 → トップページへ
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("登録に失敗しました：" + err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card bg-base-100 shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">新規登録ページ</h2>

                {error && <p className="text-red-500 mb-3">{error}</p>}

                <label className="form-control w-full mb-3">
                    <span className="label-text">Name</span>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <label className="form-control w-full mb-3">
                    <span className="label-text">Email</span>
                    <input
                        type="email"
                        className="input input-bordered w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>

                <label className="form-control w-full mb-3">
                    <span className="label-text">Password</span>
                    <input
                        type="password"
                        className="input input-bordered w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <label className="form-control w-full mb-3">
                    <span className="label-text">Confirm Password</span>
                    <input
                        type="password"
                        className="input input-bordered w-full"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </label>

                <div className="flex justify-between items-center mt-4">
                    <Link href="/login" className="text-sm text-blue-600 underline">
                        ログインはこちら
                    </Link>

                    <button className="btn btn-primary" onClick={handleSubmit}>
                        登録する
                    </button>
                </div>
            </div>
        </div>
    );
}
