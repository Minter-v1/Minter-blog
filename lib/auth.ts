import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminPassword, adminPasswordHash, sessionSecret } from "./env";
import { verifyPassword } from "./password-hash";

export const SESSION_COOKIE = "itd_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

// 서명 키는 SESSION_SECRET (없으면 예전처럼 ADMIN_PASSWORD). 키를 바꾸면 기존 세션은 전부 무효가 된다.
function sign(expiresAt: number, secret: string) {
  return createHmac("sha256", secret).update(`itd:${expiresAt}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const hash = adminPasswordHash();
  if (hash) return verifyPassword(input, hash);
  const password = adminPassword();
  if (!password) return false;
  return safeEqual(input, password);
}

export function createSessionToken(): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET이 설정되지 않았습니다.");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expRaw, sig] = token.split(".");
  const expiresAt = Number(expRaw);
  if (!sig || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Date.now() / 1000) return false;
  return safeEqual(sig, sign(expiresAt, secret));
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
