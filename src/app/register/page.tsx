"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, addDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

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
            // ============================
            // ① Auth ユーザー作成
            // ============================
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const uid = userCredential.user.uid;

            // 表示名セット
            await updateProfile(userCredential.user, { displayName: name });

            // ============================
            // ② homes の作成
            // ============================
            const homeRef = await addDoc(collection(db, "homes"), {
                ownerId: uid,
                createdAt: new Date(),
            });

            const homeId = homeRef.id;

            // ownerId が確実に書き込まれているかチェック（Firestore の反映遅延対策）
            const homeSnap = await getDoc(homeRef);
            if (!homeSnap.exists()) {
                throw new Error("home の作成確認に失敗しました");
            }

            // ============================
            // ③ members 追加（オーナー）
            // ============================
            await setDoc(doc(db, "homes", homeId, "members", uid), {
                role: "owner",
                joinedAt: new Date(),
            });

            // ============================
            // ④ users にユーザー情報を作成
            // ============================
            await setDoc(doc(db, "users", uid), {
                uid,
                name,
                email,
                homeId,
                createdAt: new Date(),
            });

            // ============================
            // ⑤ AuthContext へ反映待ち
            // ============================
            await auth.updateCurrentUser(userCredential.user);
            await new Promise((resolve) => setTimeout(resolve, 300));

            router.push("/");

        } catch (err: any) {
            console.error(err);

            // FirebaseError のメッセージは長すぎるので一部だけ抽出
            const msg =
                typeof err?.message === "string"
                    ? err.message.replace("Firebase:", "").trim()
                    : "不明なエラー";

            setError("登録に失敗しました：" + msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card bg-base-100 shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">新規登録ページ</h2>

                {error && <p className="text-red-500 mb-3">{error}</p>}

                {/* Name */}
                <label className="form-control w-full mb-3">
                    <span className="label-text">Name</span>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                {/* Email */}
                <label className="form-control w-full mb-3">
                    <span className="label-text">Email</span>
                    <input
                        type="email"
                        className="input input-bordered w-full"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>

                {/* Password */}
                <label className="form-control w-full mb-3">
                    <span className="label-text">Password</span>
                    <input
                        type="password"
                        className="input input-bordered w-full"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                {/* Confirm */}
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
