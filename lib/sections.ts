import { COLLECTION_IDS } from "./collections";

// 블로그 섹션 순서 (#66): 블로그 전체 보기 → 컬렉션 5개 → 학습법을 왼쪽에서 오른쪽으로 본다
export const SECTION_ORDER = ["blog", ...COLLECTION_IDS, "learning"] as const;
export type Section = (typeof SECTION_ORDER)[number];

/** 지금 섹션에서 다른 섹션으로 갈 때의 방향 (1: 오른쪽 섹션, -1: 왼쪽 섹션). 블로그 밖에서 들어오면 0 */
export function sectionDirection(from: string | undefined, to: Section): -1 | 0 | 1 {
  const a = SECTION_ORDER.indexOf(from as Section);
  const b = SECTION_ORDER.indexOf(to);
  if (a < 0 || a === b) return 0;
  return b > a ? 1 : -1;
}
