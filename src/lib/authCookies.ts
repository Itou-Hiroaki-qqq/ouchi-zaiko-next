"use client";

import { auth } from "./firebase";
import { onIdTokenChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import Cookies from "js-cookie";

// Firebase Auth のトークンを Cookie に保存する
// 戻り値のunsubscribe関数を必ずcleanupで呼ぶこと
export function setupAuthCookieListener(): () => void {
    return onIdTokenChanged(auth, async (user: User | null) => {
        if (!user) {
            Cookies.remove("authToken");
            return;
        }

        const token = await user.getIdToken();
        Cookies.set("authToken", token, {
            expires: 1, // 1日
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });
    });
}
