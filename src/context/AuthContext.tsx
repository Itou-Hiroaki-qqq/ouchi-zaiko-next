"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    onAuthStateChanged,
    User,
    signOut,
    setPersistence,
    indexedDBLocalPersistence,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { setupAuthCookieListener } from "../lib/authCookies";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    homeId: string | null;
    logout: () => Promise<void>;
    refreshHomeId: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    homeId: null,
    logout: async () => {},
    refreshHomeId: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [homeId, setHomeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        await signOut(auth);
    };

    // homeId を Firestore から再取得する（共有設定後などに使用）
    const refreshHomeId = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            setHomeId(snap.data().homeId ?? null);
        }
    };

    useEffect(() => {
        let unsubscribeAuth: (() => void) | null = null;
        let unsubscribeCookie: (() => void) | null = null;

        // ① まず永続化をIndexedDBに設定し、完了後に各リスナーを登録
        setPersistence(auth, indexedDBLocalPersistence)
            .catch((err) =>
                console.error("Failed to set Auth persistence:", err)
            )
            .finally(() => {
                // ② Cookie同期リスナー
                unsubscribeCookie = setupAuthCookieListener();

                // ③ 認証状態リスナー
                unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
                    if (!currentUser) {
                        setUser(null);
                        setHomeId(null);
                        setLoading(false);
                        return;
                    }

                    setUser(currentUser);

                    try {
                        let userData = null;

                        // users/{uid} を最大5回リトライ（新規登録直後の遅延対策）
                        for (let i = 0; i < 5; i++) {
                            const ref = doc(db, "users", currentUser.uid);
                            const snap = await getDoc(ref);

                            if (snap.exists()) {
                                userData = snap.data();
                                break;
                            } else {
                                await new Promise((res) => setTimeout(res, 120));
                            }
                        }

                        if (!userData) {
                            console.warn("users/{uid} が取得できませんでした");
                            setHomeId(null);
                        } else {
                            setHomeId(userData.homeId ?? null);
                        }

                    } catch (e) {
                        console.error("AuthContext Firestore read ERROR:", e);
                    } finally {
                        setLoading(false);
                    }
                });
            });

        return () => {
            unsubscribeAuth?.();
            unsubscribeCookie?.();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, loading, homeId, logout, refreshHomeId }}
        >
            {children}
        </AuthContext.Provider>
    );
};
