"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="navbar bg-base-100 shadow-md px-4">
            {/* タイトル（左側） */}
            <div className="flex-1">
                <Link href="/" className="text-xl font-bold">
                    おうちで在庫くん
                </Link>
            </div>

            {/* ハンバーガーメニュー（右側） */}
            <div className="flex-none">
                {/* Drawer toggle */}
                <label htmlFor="main-drawer" className="btn btn-ghost btn-circle">
                    <span className="material-icons text-3xl">menu</span>
                </label>
            </div>
        </div>
    );
}
