import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { adminPassword } from "@/lib/env";

export async function POST(request: Request) {
  if (!adminPassword()) {
    return NextResponse.json({ error: "서버에 ADMIN_PASSWORD가 설정되지 않았습니다." }, { status: 500 });
  }
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    // 무작위 대입 속도 늦추기
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "비밀번호가 맞지 않아요." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return NextResponse.json({ ok: true });
}
