import "./globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "おうちで在庫くん",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {/* Drawer 全体ラップ */}
          <div className="drawer">
            {/* Drawer toggle */}
            <input id="main-drawer" type="checkbox" className="drawer-toggle" />

            {/* メイン内容 */}
            <div className="drawer-content flex flex-col min-h-screen">
              <Header />
              <main className="grow">{children}</main>
              <Footer />
            </div>

            {/* Drawer サイドメニュー */}
            <div className="drawer-side z-50">
              <label htmlFor="main-drawer" className="drawer-overlay"></label>
              <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base">
                <li><a href="/">在庫リスト(TOP)</a></li>
                <li><a href="/next">次回購入リスト</a></li>
                <li><a href="/genres">ジャンル設定</a></li>
                <li><a href="/sharing">共有設定</a></li>
                <li>
                  <form action="/login" method="get">
                    <button
                      type="button"
                      onClick={async () => {
                        const { logout } = await import("../context/AuthContext").then((m) => m.useAuth());
                        await logout();
                        // /login へ
                        window.location.href = "/login";
                      }}
                    >
                      ログアウト
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
