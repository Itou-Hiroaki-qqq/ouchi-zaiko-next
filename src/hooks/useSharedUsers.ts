"use client";

import { useEffect, useState } from "react";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export type SharedUser = {
    uid: string;
    name?: string;
    email?: string;
};

export const useSharedUsers = (
    homeId: string | null,
    currentUid: string | null
) => {
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const fetchMembers = async () => {
            if (!homeId || !currentUid) {
                setSharedUsers([]);
                setLoading(false);
                return;
            }

            // ① homes/{homeId} から ownerId を取得
            const homeRef = doc(db, "homes", homeId);
            const homeSnap = await getDoc(homeRef);

            if (!homeSnap.exists()) {
                setSharedUsers([]);
                setLoading(false);
                return;
            }

            const { ownerId } = homeSnap.data() as { ownerId?: string };
            if (!ownerId) {
                setSharedUsers([]);
                setLoading(false);
                return;
            }

            // ② オーナーの場合 → members コレクション全体を購読
            if (currentUid === ownerId) {
                const membersRef = collection(db, "homes", homeId, "members");

                unsubscribe = onSnapshot(membersRef, (snapshot) => {
                    const members = snapshot.docs.map((d) => ({
                        uid: d.id,
                        ...(d.data() as any),
                    }));

                    // オーナー以外を共有ユーザーとみなす
                    const filtered = members
                        .filter((m) => m.uid !== ownerId)
                        .map((m) => ({
                            uid: m.uid,
                            name: m.name ?? "",
                            email: m.email ?? "",
                        }));

                    setSharedUsers(filtered);
                    setLoading(false);
                });

                return;
            }

            // ③ 共有ユーザーの場合 → 自分自身の members ドキュメントだけ購読
            const myMemberRef = doc(db, "homes", homeId, "members", currentUid);

            unsubscribe = onSnapshot(myMemberRef, async (snap) => {
                if (!snap.exists()) {
                    setSharedUsers([]);
                    setLoading(false);
                    return;
                }

                // members/{uid} → user 情報を users/{uid} から取得
                const userDoc = await getDoc(doc(db, "users", currentUid));

                if (userDoc.exists()) {
                    const data = userDoc.data() as any;

                    setSharedUsers([
                        {
                            uid: currentUid,
                            name: data.name ?? "",
                            email: data.email ?? "",
                        },
                    ]);
                } else {
                    setSharedUsers([{ uid: currentUid }]);
                }

                setLoading(false);
            });
        };

        fetchMembers();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [homeId, currentUid]);

    return { sharedUsers, loading };
};
