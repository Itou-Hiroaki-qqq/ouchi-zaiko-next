import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("authToken")?.value;

    const { pathname } = request.nextUrl;

    // 未ログインでもアクセスOKのページ
    const publicPaths = ["/login", "/register", "/favicon.ico"];

    // public に含まれていれば許可
    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // token がない → 未ログイン → /login へ
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // それ以外は通す
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|images|favicon.ico).*)"
    ],
};
