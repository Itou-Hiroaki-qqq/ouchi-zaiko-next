"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Genre } from "../types/firestore";

export const useGenres = (homeId: string | null) => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // homeId が無い場合は即リセットして終了
        if (!homeId) {
            setGenres([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, "homes", homeId, "genres"),
            orderBy("order", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Genre[];

            setGenres(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [homeId]);

    return { genres, loading };
};

