import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";
import { isAuthEnabled } from "@/lib/auth/isAuthEnabled";

export async function middleware(request: NextRequest) {
    // Portable/offline default: allow anonymous usage when auth isn't configured.
    if (!isAuthEnabled()) {
        return NextResponse.next();
    }

    // Only enforce redirects for normal page navigations.
    // Server Actions / RSC requests are often POST or have non-HTML Accept headers.
    if (request.method !== 'GET') {
        return NextResponse.next();
    }

    const accept = request.headers.get('accept') ?? '';
    if (!accept.includes('text/html')) {
        return NextResponse.next();
    }

    const sessionCookie = getSessionCookie(request);

    // Check cookie presence - prevents obviously unauthorized users
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
    ],
};
