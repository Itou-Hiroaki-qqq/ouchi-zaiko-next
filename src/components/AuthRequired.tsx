"use client";

import Link from "next/link";

export function AuthRequired() {
    return (
        <div className="p-4 text-center space-y-4">
            <p className="text-lg font-semibold">ログインが必要です。</p>

            <div className="flex flex-col gap-3 w-48 mx-auto">
                <Link href="/register" className="btn btn-primary">
                    新規登録へ
                </Link>

                <Link href="/login" className="btn btn-secondary">
                    ログインへ
                </Link>
            </div>
        </div>
    );
}
