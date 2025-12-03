import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "おうちで在庫くん",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* Material Icons 読み込み */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {/* DaisyUI Drawer レイアウト */}
          <div className="drawer">
            {/* Drawer トグル */}
            <input id="main-drawer" type="checkbox" className="drawer-toggle" />

            {/* メインコンテンツ */}
            <div className="drawer-content flex flex-col min-h-screen">
              <Header />
              <main className="grow">{children}</main>
              <Footer />
            </div>

            {/* サイドメニュー（★ここから onClick を全部消している） */}
            <div className="drawer-side z-50">
              <label htmlFor="main-drawer" className="drawer-overlay"></label>
              <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base">
                <li>
                  <Link href="/">在庫リスト(TOP)</Link>
                </li>
                <li>
                  <Link href="/next">次回購入リスト</Link>
                </li>
                <li>
                  <Link href="/genres">ジャンル設定</Link>
                </li>
                <li>
                  <Link href="/sharing">共有設定</Link>
                </li>
                {/* ★いったん単なるリンクにしておく（ログアウト処理は後でClient側に切り出す） */}
                <li>
                  <Link href="/login">ログアウト</Link>
                </li>
              </ul>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
