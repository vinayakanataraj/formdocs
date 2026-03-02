import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const SESSION_COOKIE = "formdocs_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET environment variable is not set");
  return secret;
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session?.value) return false;
    return verifySessionToken(session.value);
  } catch {
    return false;
  }
}

export async function isAdminRequestValid(req: NextRequest): Promise<boolean> {
  // Check cookie first (browser requests)
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  if (sessionCookie?.value) {
    return verifySessionToken(sessionCookie.value);
  }

  // Check Bearer token (API clients)
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    // Allow raw secret as Bearer token (for simple integrations)
    try {
      const secret = getAdminSecret();
      if (token === secret) return true;
    } catch {}
    // Also allow JWT token as Bearer
    return verifySessionToken(token);
  }

  return false;
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

// For middleware (Edge Runtime) — synchronous check using raw cookie value
export async function isAuthenticatedInMiddleware(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return verifySessionToken(token);
}
