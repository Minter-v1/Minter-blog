export type Tag = { name: string; hint?: string };

export const MAX_TAGS_PER_TERM = 3;

export const DEFAULT_TAGS: Tag[] = [
  { name: "네트워크통신", hint: "CDN, DNS, 프로토콜, 로드밸런싱" },
  { name: "데이터저장", hint: "Redis, cache, DB, 스트림" },
  { name: "아키텍처패턴", hint: "폴백함수, 메시지큐, 이벤트, MSA" },
  { name: "운영모니터링", hint: "로그, 알림, 트레이싱" },
  { name: "도구실습", hint: "CLI, 프레임워크 사용법, k8s, terraform" },
  { name: "CS기초", hint: "알고리즘, OS, 자료구조" },
  { name: "채용", hint: "레쥬메, 면접, 인적성" },
];

// tags.json은 ["이름", ...] 또는 [{ "name": "이름", "hint": "예시" }, ...] 둘 다 허용
export function parseTags(source: string | null): Tag[] {
  if (!source) return DEFAULT_TAGS;
  try {
    const data: unknown = JSON.parse(source);
    if (!Array.isArray(data)) return DEFAULT_TAGS;
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
    return DEFAULT_TAGS;
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
