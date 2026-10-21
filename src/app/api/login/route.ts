import { NextResponse } from "next/server";
import { SESSION_COOKIE, safeEqual, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.json({ success: true });
  let body: { password?: unknown } = {};
  try { body = await request.json(); } catch {}
  const given = typeof body.password === "string" ? body.password : "";
  if (!safeEqual(given, password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(password), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
