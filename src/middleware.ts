import { NextRequest, NextResponse } from "next/server";

// Lightweight JWT decode for Edge runtime (no crypto verification needed here —
// real verification happens in API route guards via jsonwebtoken in Node.js runtime)
function decodeJwtPayload(token: string): { userId?: string; roles?: string[] } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", req.url));
    }
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.roles?.includes("admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
