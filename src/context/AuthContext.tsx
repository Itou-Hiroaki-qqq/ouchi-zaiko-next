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
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { setupAuthCookieListener } from "../lib/authCookies";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    homeId: string | null;
    logout: () => Promise<void>;
    setRemember: (remember: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    homeId: null,
    logout: async () => { },
    setRemember: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [homeId, setHomeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const setRemember = async (remember: boolean) => {
        await setPersistence(
            auth,
            remember ? browserLocalPersistence : browserSessionPersistence
        );
    };

    const logout = async () => {
        await signOut(auth);
    };

    useEffect(() => {
        setupAuthCookieListener();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setHomeId(null);
                setLoading(false);
                return;
            }

            // ← ここでは loading を false にせず、Firestore 読み込みを待つ
            try {
                let userData = null;

                // Firestore の /users/{uid} が作成されるまで少し待機
                for (let i = 0; i < 5; i++) {   // 最大5回リトライ（500ms）
                    const snap = await getDoc(doc(db, "users", currentUser.uid));
                    if (snap.exists()) {
                        userData = snap.data();
                        break;
                    }
                    await new Promise((res) => setTimeout(res, 100)); // 100ms待つ
                }

                if (userData) {
                    setHomeId(userData.homeId ?? null);
                } else {
                    console.warn("Firestore の users ドキュメントがまだ取得できませんでした");
                    setHomeId(null);
                }

            } finally {
                setLoading(false);  // ← homeId をセットした後に初めて loading を解除！
            }
        });

        return () => unsubscribe();
    }, []);


    return (
        <AuthContext.Provider
            value={{ user, loading, homeId, logout, setRemember }}
        >
            {children}
        </AuthContext.Provider>
    );
};
