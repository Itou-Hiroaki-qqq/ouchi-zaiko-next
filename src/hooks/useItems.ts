"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Item } from "../types/firestore";

export const useItems = (homeId: string | null, genreId: string | null) => {
    console.log("useItems start; homeId =", homeId, "genreId =", genreId);
    
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 条件がそろっていない場合は即リセット
        if (!homeId || !genreId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, "homes", homeId, "items"),
            where("genreId", "==", genreId),
            orderBy("order", "asc") // Firestore側は登録順で取得
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Firestore から取得
            const rawList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Item[];

            // ▼ purchaseCount が存在しない場合は 0 扱い
            const normalized = rawList.map((item) => ({
                ...item,
                purchaseCount: item.purchaseCount ?? 0,
            }));

            // ▼ 並び替え：purchaseCount 降順 → order 昇順
            const sorted = normalized.sort((a, b) => {
                if ((b.purchaseCount ?? 0) !== (a.purchaseCount ?? 0)) {
                    return (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0);
                }
                return a.order - b.order;
            });

            setItems(sorted);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [homeId, genreId]);

    return { items, loading };
};
