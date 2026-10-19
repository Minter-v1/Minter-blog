import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// 관리자 비밀번호 해시 (#118): scrypt + 무작위 salt
// 형식: scrypt:N:r:p:salt:hash (salt · hash는 base64url)
// `$`를 쓰지 않는다. Next.js가 .env 값의 `$이름`을 다른 변수로 바꿔 넣기 때문
// 만드는 명령: npm run hash-password (scripts/hash-password.mjs, 같은 형식)

const KEYLEN = 32;

export function hashPassword(password: string, N = 16384, r = 8, p = 1): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.trim().split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltRaw, hashRaw] = parts;
  const expected = Buffer.from(hashRaw, "base64url");
  if (expected.length !== KEYLEN) return false;
  try {
    const actual = scryptSync(password, Buffer.from(saltRaw, "base64url"), KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
