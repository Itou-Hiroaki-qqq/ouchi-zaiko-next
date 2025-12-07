"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    FirestoreError,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Genre } from "../types/firestore";

export const useGenres = (homeId: string | null) => {
    console.log("useGenres start; homeId =", homeId);

    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        // ★★★ エラーを拾える onSnapshot の第二引数を追加 ★★★
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Genre[];

                setGenres(list);
                setLoading(false);
            },
            (error: FirestoreError) => {
                console.error("useGenres snapshot error:", error);

                // ★ エラー時でも画面が固まらないようにする
                setGenres([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [homeId]);

    return { genres, loading };
};
