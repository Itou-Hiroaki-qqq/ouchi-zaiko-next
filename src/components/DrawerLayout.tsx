"use client";

import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

export default function DrawerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="drawer">
            <input id="main-drawer" type="checkbox" className="drawer-toggle" />

            {/* メイン */}
            <div className="drawer-content flex flex-col min-h-screen">
                <Header />
                <main className="grow">{children}</main>
                <Footer />
            </div>

            {/* サイドメニュー */}
            <div className="drawer-side z-50">
                <label htmlFor="main-drawer" className="drawer-overlay"></label>
                <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base">
                    <li><Link href="/">在庫リスト(TOP)</Link></li>
                    <li><Link href="/next">次回購入リスト</Link></li>
                    <li><Link href="/genres">ジャンル設定</Link></li>
                    <li><Link href="/sharing">共有設定</Link></li>
                    <li><Link href="/login">ログアウト</Link></li>
                </ul>
            </div>
        </div>
    );
}
