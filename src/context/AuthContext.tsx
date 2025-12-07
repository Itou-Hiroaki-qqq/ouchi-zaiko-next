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
    indexedDBLocalPersistence,   // ★★★ 追加：IndexedDB 永続化を使用
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { setupAuthCookieListener } from "../lib/authCookies";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    homeId: string | null;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    homeId: null,
    logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [homeId, setHomeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        await signOut(auth);
    };

    // -------------------------------
    // ★★★ ここが重要：永続化を IndexedDB に統一
    // -------------------------------
    useEffect(() => {
        setPersistence(auth, indexedDBLocalPersistence)
            .then(() => console.log("Auth persistence set: IndexedDB"))
            .catch((err) =>
                console.error("Failed to set Auth persistence:", err)
            );
    }, []);

    // Auth Cookie Listener (必要なら保持)
    useEffect(() => {
        setupAuthCookieListener();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("AuthStateChanged triggered. currentUser =", currentUser?.uid);

            // 未ログイン
            if (!currentUser) {
                setUser(null);
                setHomeId(null);
                setLoading(false);
                return;
            }

            // ログインユーザーセット
            setUser(currentUser);

            try {
                let userData = null;

                // users/{uid} を最大5回リトライ
                for (let i = 0; i < 5; i++) {
                    console.log(`Trying to read users/${currentUser.uid}`);

                    const ref = doc(db, "users", currentUser.uid);
                    const snap = await getDoc(ref);

                    if (snap.exists()) {
                        console.log("users doc found:", snap.data());
                        userData = snap.data();
                        break;
                    } else {
                        console.log("users doc NOT found. retry...");
                        await new Promise((res) => setTimeout(res, 120));
                    }
                }

                if (!userData) {
                    console.warn("ERROR: users/{uid} が取得できませんでした");
                    setHomeId(null);
                } else {
                    console.log("Setting homeId:", userData.homeId);
                    setHomeId(userData.homeId ?? null);
                }

            } catch (e) {
                console.error("AuthContext Firestore read ERROR:", e);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, loading, homeId, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};
