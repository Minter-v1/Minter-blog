// 보낸 사람(From) 주소 정규화. 서버·테스트 공용 (server-only 아님)
//
// RFC 5322에서 표시 이름은 따옴표 없이 쓸 수 있는 문자(atext)가 정해져 있다.
// `.` `,` `@` `(` `)` `:` `;` 같은 특수문자가 들어간 이름은 큰따옴표로 감싸야 하고,
// Resend는 이를 엄격하게 검증해 `Minter.log <a@b.com>`을 422로 거절한다.
// 환경 변수에 따옴표 없이 넣어도 발송되도록, 필요한 경우에만 감싼다.

// atext(RFC 5322 3.2.3) + 공백. 한글 등 ASCII 밖의 문자는 따옴표 없이 둔다
const BARE_NAME = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~ \u0080-\uFFFF]+$/;

export function formatFrom(raw: string): string {
  const value = raw.trim();
  const m = value.match(/^(.*?)\s*<\s*([^<>\s]+@[^<>\s]+)\s*>$/);
  if (!m) return value; // 이름 없는 주소 (a@b.com)
  const [, rawName, address] = m;
  const name = rawName.trim();
  if (!name) return address;
  if (/^".*"$/.test(name) || BARE_NAME.test(name)) return `${name} <${address}>`;
  return `"${name.replace(/(["\\])/g, "\\$1")}" <${address}>`;
}
