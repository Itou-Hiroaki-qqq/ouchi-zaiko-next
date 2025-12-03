"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
    const { logout } = useAuth();
    const router = useRouter();

    // ログアウト + drawer を閉じて /login に遷移
    const handleLogout = async () => {
        // Drawer を閉じる
        const drawer = document.getElementById("main-menu") as HTMLInputElement | null;
        if (drawer) drawer.checked = false;

        // Firebase ログアウト
        await logout();

        // ログインページへ遷移
        router.push("/login");
    };

    return (
        <div className="drawer-end drawer z-50">
            {/* ▼ drawer トグル */}
            <input id="main-menu" type="checkbox" className="drawer-toggle" />

            {/* ▼ 通常のヘッダーコンテンツ */}
            <div className="drawer-content">
                <header className="bg-base-100 shadow-md px-4 py-3 flex items-center justify-between relative">
                    {/* 左側：タイトル */}
                    <h1 className="text-xl font-bold">
                        <Link href="/">おうちで在庫くん</Link>
                    </h1>

                    {/* ▼ PCナビゲーション（md以上で表示） */}
                    <nav className="hidden md:flex gap-6 text-lg items-center">
                        <Link href="/" className="hover:text-primary hover:underline transition-all">
                            在庫リスト
                        </Link>
                        <Link href="/next" className="hover:text-primary hover:underline transition-all">
                            次回購入リスト
                        </Link>
                        <Link href="/genres" className="hover:text-primary hover:underline transition-all">
                            ジャンル設定
                        </Link>
                        <Link href="/sharing" className="hover:text-primary hover:underline transition-all">
                            共有設定
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="hover:text-primary hover:underline transition-all text-red-600"
                        >
                            ログアウト
                        </button>
                    </nav>

                    {/* ▼ ハンバーガー（SPのみ表示） */}
                    <div className="md:hidden">
                        <label htmlFor="main-menu" className="btn btn-ghost drawer-button">
                            <span className="material-icons text-3xl">menu</span>
                        </label>
                    </div>
                </header>
            </div>

            {/* ▼ 右からスライドインするメニュー */}
            <div className="drawer-side drawer-end">
                <label htmlFor="main-menu" className="drawer-overlay"></label>

                <div className="w-72 min-h-full bg-base-200 p-4 relative">
                    {/* 右上クローズボタン */}
                    <label
                        htmlFor="main-menu"
                        className="absolute right-4 top-4 cursor-pointer text-3xl"
                    >
                        ✕
                    </label>

                    {/* メニュー本体 */}
                    <ul className="menu pt-12 text-lg">
                        <li>
                            <Link
                                href="/"
                                className="hover:text-primary hover:underline transition-all"
                            >
                                在庫リスト（TOP）
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/next"
                                className="hover:text-primary hover:underline transition-all"
                            >
                                次回購入リスト
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/genres"
                                className="hover:text-primary hover:underline transition-all"
                            >
                                ジャンル設定
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/sharing"
                                className="hover:text-primary hover:underline transition-all"
                            >
                                共有設定
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                className="hover:text-primary hover:underline transition-all text-red-600"
                            >
                                ログアウト
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
