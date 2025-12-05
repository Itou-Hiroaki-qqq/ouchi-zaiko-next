"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Item } from "../types/firestore";

/**
 * useItem
 * 商品を 1 件だけリアルタイムで取得するカスタムフック
 *
 * @param homeId Firestore の home ID
 * @param itemId Firestore の item ID
 */
export const useItem = (homeId: string | null, itemId: string | null) => {
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // homeId または itemId がなければリセット
        if (!homeId || !itemId) {
            setItem(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        // homes/{homeId}/items/{itemId} を参照
        const ref = doc(db, "homes", homeId, "items", itemId);

        // Firestore リアルタイム購読
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            if (snapshot.exists()) {
                // ドキュメントが存在する場合
                setItem({
                    id: snapshot.id,
                    ...snapshot.data(),
                } as Item);
            } else {
                // ドキュメントが削除されている場合
                setItem(null);
            }

            setLoading(false);
        });

        // クリーンアップ
        return () => unsubscribe();
    }, [homeId, itemId]);

    return { item, loading };
};
