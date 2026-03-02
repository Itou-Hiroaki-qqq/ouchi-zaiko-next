import { Timestamp, FieldValue } from "firebase/firestore";

// ジャンル
export interface Genre {
    id: string;
    name: string;
    order: number;
    createdAt: Timestamp | FieldValue;
}

// 商品
export interface Item {
    id: string;
    name: string;
    genreId: string;

    // 現在画面で扱っている在庫数量
    quantity: number;

    // 定数（標準在庫数量）
    standardQuantity?: number;

    // メモ系フィールド
    memo?: string;
    note?: string; // 過去の互換用

    // 次回購入リスト用のカウント（0より大きい場合、/nextに表示）
    purchaseCount?: number;

    // 累計購入数（将来用）
    totalPurchased?: number;

    // 並び順
    order: number;

    // 作成日時・更新日時
    createdAt: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
}
