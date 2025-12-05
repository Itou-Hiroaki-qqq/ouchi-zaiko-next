// ジャンル
export interface Genre {
    id: string;
    name: string;
    order: number;
    createdAt: any; // Firestore Timestamp
}

// 商品
export interface Item {
    id: string;
    name: string;
    genreId: string;

    // 現在画面で扱っている在庫数量
    quantity: number;

    // メモ系フィールド
    // 実際の Firestore では "memo" というフィールド名で保存しているので、
    // それに合わせて memo を追加。過去の互換のため note も残しておく。
    memo?: string;
    note?: string;

    // 次回購入リスト用のカウント
    // 0 より大きい場合、/next に表示される
    purchaseCount?: number;

    // 将来の「累計購入数」用として残しているフィールド（未使用なら 0 扱いでもOK）
    totalPurchased?: number;

    // 並び順
    order: number;

    // 作成日時・更新日時
    createdAt: any; // Firestore Timestamp
    updatedAt?: any; // Firestore Timestamp
}
