"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    // フォーム状態
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");

        if (!email || !password) {
            setError("メールアドレスとパスワードを入力してください");
            return;
        }

        try {
            // ★★★ 永続化セットは不要（AuthContext が自動で IndexedDB に設定）
            await signInWithEmailAndPassword(auth, email, password);

            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("ログインに失敗しました：" + err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card bg-base-100 shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">ログインページ</h2>

                {error && <p className="text-red-500 mb-3">{error}</p>}

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

                {/* ★★★ Remember Me は削除または無効化（今は動かないため） */}
                {/* 将来 remember-me を実装したい場合は再追加可能 */}

                {/* Buttons */}
                <div className="flex justify-between items-center">
                    <Link href="/register" className="text-sm text-blue-600 underline">
                        新規登録はこちら
                    </Link>

                    <button className="btn btn-primary" onClick={handleLogin}>
                        ログイン
                    </button>
                </div>
            </div>
        </div>
    );
}
