"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut, browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { auth } from "../lib/firebase";
import { setupAuthCookieListener } from "../lib/authCookies";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    setRemember: (remember: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    setRemember: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 永続化設定（rememberMe が設定された後に呼ばれる）
    const setRemember = async (remember: boolean) => {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    };

    const logout = async () => {
        await signOut(auth);
    };

    useEffect(() => {
        setupAuthCookieListener();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout, setRemember }}>
            {children}
        </AuthContext.Provider>
    );
};
