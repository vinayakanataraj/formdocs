import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getAdminSecret, getSessionCookieOptions } from "@/lib/auth";
import { createHmac, timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const key = Buffer.from("formdocs-secret-compare");
  const hashA = createHmac("sha256", key).update(a).digest();
  const hashB = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    let adminSecret: string;
    try {
      adminSecret = getAdminSecret();
    } catch {
      return NextResponse.json({ error: "Server misconfiguration: ADMIN_SECRET not set" }, { status: 500 });
    }

    if (!secret) {
      return NextResponse.json({ error: "Secret is required" }, { status: 400 });
    }

    if (!safeCompare(String(secret), adminSecret)) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const token = await createSessionToken();
    const opts = getSessionCookieOptions();

    const res = NextResponse.json({ success: true });
    res.cookies.set(opts.name, token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      maxAge: opts.maxAge,
      path: opts.path,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("formdocs_session");
  return res;
}
