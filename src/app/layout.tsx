import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import DrawerLayout from "../components/DrawerLayout";

export const metadata = {
  title: "おうちで在庫くん",
  description: "おうちの在庫管理アプリ",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />

        {/* ▼ PWA 追加部分 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />

        {/* iOS PWA 対応（省略可能だが推奨） */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>

      <body>
        <AuthProvider>
          <DrawerLayout>{children}</DrawerLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
