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
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <DrawerLayout>{children}</DrawerLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
