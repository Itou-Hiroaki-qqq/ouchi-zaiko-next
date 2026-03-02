"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Item } from "../types/firestore";

export const useItems = (homeId: string | null, genreId: string | null) => {
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
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                purchaseCount: (doc.data().purchaseCount ?? 0),
            })) as Item[];

            setItems(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [homeId, genreId]);

    return { items, loading };
};
