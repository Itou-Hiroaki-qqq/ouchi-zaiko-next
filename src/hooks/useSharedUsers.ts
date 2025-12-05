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

export const useSharedUsers = (homeId: string | null, currentUid: string | null) => {
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const fetchOwnerAndMembers = async () => {
            if (!homeId || !currentUid) {
                setSharedUsers([]);
                setLoading(false);
                return;
            }

            // ① homes/{homeId} を取得 → ownerId を取り出す
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

            // ② users ではなく、members を購読（← Firestore ルール的に必要）
            const membersRef = collection(db, "homes", homeId, "members");

            unsubscribe = onSnapshot(membersRef, async (snapshot) => {
                const members = snapshot.docs.map((d) => ({
                    uid: d.id,
                    ...(d.data() as any),
                }));

                // ③ オーナー以外を共有ユーザーとする
                const filtered = members.filter((m) => m.uid !== ownerId);

                // もし name/email を表示したいなら users/{uid} を個別 GET（オーナーのみ可）
                const detailedUsers: SharedUser[] = [];

                for (const m of filtered) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", m.uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data() as any;
                            detailedUsers.push({
                                uid: m.uid,
                                name: data.name,
                                email: data.email,
                            });
                        } else {
                            detailedUsers.push({ uid: m.uid });
                        }
                    } catch {
                        detailedUsers.push({ uid: m.uid });
                    }
                }

                setSharedUsers(detailedUsers);
                setLoading(false);
            });
        };

        fetchOwnerAndMembers();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [homeId, currentUid]);

    return { sharedUsers, loading };
};
