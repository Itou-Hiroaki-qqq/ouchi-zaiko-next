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
    quantity: number;
    note: string;
    totalPurchased: number;
    order: number;
    createdAt: any; // Firestore Timestamp
}
