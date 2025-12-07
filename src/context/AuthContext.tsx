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

            console.log("AuthStateChanged triggered. currentUser =", currentUser?.uid);

            // ① uid が未確定のとき → Firestore に触らない（PermissionDenied防止）
            if (!currentUser?.uid) {
                console.log("currentUser.uid が未確定のため Firestore にアクセスしません");
                setUser(null);
                setHomeId(null);
                setLoading(false);
                return;
            }

            // user はここで初めてセット（hooks が早く動きすぎるのを防ぐ）
            setUser(currentUser);

            try {
                let userData = null;

                // ② /users/{uid} を最大5回リトライ（Auth と Firestore の同期遅延に対応）
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
                    console.warn("ERROR: users/{uid} が最後まで取得できませんでした");
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
            value={{ user, loading, homeId, logout, setRemember }}
        >
            {children}
        </AuthContext.Provider>
    );
};
