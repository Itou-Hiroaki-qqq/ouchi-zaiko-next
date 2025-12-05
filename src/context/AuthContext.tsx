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

            // Firestore 読み込みを待つ
            try {
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists()) {
                    setHomeId(snap.data().homeId ?? null);
                } else {
                    setHomeId(null);
                }
            } finally {
                // ← Firestore 読み込み後に loading を解除
                setLoading(false);
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
