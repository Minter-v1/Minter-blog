export type Tag = { name: string; hint?: string };

// 컬렉션마다 {폴더}/tags.json. 파일이 없으면 컬렉션 기본 태그(lib/collections.ts)
// ["이름", ...] 또는 [{ "name": "이름", "hint": "예시" }, ...] 둘 다 허용
export function parseTags(source: string | null, defaults: Tag[]): Tag[] {
  if (!source) return defaults;
  try {
    const data: unknown = JSON.parse(source);
    if (!Array.isArray(data)) return defaults;
    return data
      .map((item): Tag | null => {
        if (typeof item === "string") return { name: item };
        if (item && typeof item === "object" && typeof item.name === "string") {
          return typeof item.hint === "string" ? { name: item.name, hint: item.hint } : { name: item.name };
        }
        return null;
      })
      .filter((t): t is Tag => t !== null);
  } catch {
    return defaults;
  }
}

export function serializeTags(tags: Tag[]): string {
  return JSON.stringify(tags, null, 2) + "\n";
}

// 프론트매터의 flow 리스트를 깨뜨리는 문자는 금지
export function validateTagName(raw: string): string | null {
  const name = raw.normalize("NFC").trim();
  if (!name) return "태그 이름을 입력해 주세요.";
  if (name.length > 20) return "태그 이름은 20자까지 쓸 수 있어요.";
  if (/[,\[\]"'#:]/.test(name)) return "태그 이름에 , [ ] \" ' # : 는 쓸 수 없어요.";
  return null;
}
