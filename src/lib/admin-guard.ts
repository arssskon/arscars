import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin, JwtPayload } from "./auth";

export function getAdminPayload(
  req: NextRequest
): { payload: JwtPayload } | { error: NextResponse } {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("auth-token")?.value;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  const payload = verifyToken(token);
  if (!payload)
    return {
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  if (!isAdmin(payload))
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };

  return { payload };
}
