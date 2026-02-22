# おうちで在庫くん

家庭の在庫を簡単に管理するWebアプリです。ジャンルごとに商品を登録し、数量・定数・次回購入リストを一元管理できます。PWA対応でスマートフォンからも利用できます。

## 主な機能

- **在庫リスト** … ジャンル別の商品一覧。数量の増減・定数（標準在庫数）の入力、次回購入リストへの追加が可能
- **次回購入リスト** … 買い忘れ防止用。在庫リストから「次回購入」で追加し、購入済みにすると在庫数量が+1
- **ジャンル設定** … 食品・日用品などジャンルの追加・編集・削除
- **共有設定** … 1つの「おうち」を複数ユーザーで共有。オーナー登録やメール招待でメンバーを追加
- **商品詳細** … 商品名・メモの編集、商品の削除

## 技術スタック

- **フロント** … [Next.js](https://nextjs.org) 16（App Router）、[React](https://react.dev/) 19、[TypeScript](https://www.typescriptlang.org/)
- **スタイル** … [Tailwind CSS](https://tailwindcss.com/) 4、[DaisyUI](https://daisyui.com/)
- **バックエンド** … [Firebase](https://firebase.google.com/)（Authentication / Firestore）
- **PWA** … [next-pwa](https://github.com/shadowwalker/next-pwa)（オフライン・ホーム画面追加対応）

## 必要な環境

- Node.js 18.x 以上（推奨: 20.x）
- npm / yarn / pnpm / bun のいずれか

## セットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <リポジトリURL>
cd ouchi-zaiko-next
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` を作成し、Firebaseの設定を記述します。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Firebase Console の「プロジェクトの設定」→「一般」→「マイアプリ」から、上記の値を取得できます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 4. 本番ビルド・起動

```bash
npm run build
npm start
```

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動（Hot Reload） |
| `npm run build` | 本番用ビルド（webpack使用） |
| `npm start` | 本番サーバー起動 |

## プロジェクト構成（抜粋）

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 在庫リスト（TOP）
│   ├── next/page.tsx       # 次回購入リスト
│   ├── genres/             # ジャンル設定
│   ├── sharing/page.tsx    # 共有設定
│   ├── items/[id]/         # 商品詳細
│   ├── login/              # ログイン
│   └── register/           # 新規登録
├── components/             # 共通コンポーネント（Header, Footer, DrawerLayout など）
├── context/                # AuthContext（Firebase Auth + homeId）
├── hooks/                  # useItems, useGenres, useNextItems, useSharedUsers など
├── lib/                    # Firebase 初期化、認証Cookie
└── types/                  # Firestore 型定義
```

## Firebase 側の準備

- **Authentication** … メール/パスワード（またはお好みのプロバイダ）を有効化
- **Firestore** … セキュリティルールを設定し、`homes` / `users` コレクションを想定したルールを記述してください（本リポジトリにはルールファイルは含まれていません）

## ライセンス

このプロジェクトはプライベート利用を想定しています。利用・改変の際はリポジトリのライセンス表記に従ってください。
