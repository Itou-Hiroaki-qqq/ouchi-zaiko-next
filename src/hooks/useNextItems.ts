"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Item } from "../types/firestore";

export const useNextItems = (homeId: string | null) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // homeId がなければ終わり
        if (!homeId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, "homes", homeId, "items"),
            where("purchaseCount", ">", 0), // 次回購入対象
            orderBy("purchaseCount", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Item[];

            setItems(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [homeId]);

    return { items, loading };
};
