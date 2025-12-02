"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Item } from "../types/firestore";

export const useItems = (homeId: string | null, genreId: string | null) => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!homeId || !genreId) return;

        const q = query(
            collection(db, "homes", homeId, "items"),
            where("genreId", "==", genreId),
            orderBy("order", "asc")
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
    }, [homeId, genreId]);

    return { items, loading };
};
