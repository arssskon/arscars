import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./auth";

export function getUserPayload(req: NextRequest): JwtPayload | null {
  // Try cookie first
  const cookieToken = req.cookies.get("auth-token")?.value;
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) return payload;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) return payload;
  }

  return null;
}
