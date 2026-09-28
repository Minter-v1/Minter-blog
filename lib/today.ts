// "오늘 정리한 기록": 그날(KST) 작성 완료한 글 + 그날 고친 예전 글. 홈·/today·리마인드 메일이 같이 쓴다.
import { addDays, isoDay, parseDay, todayInSeoul } from "./week";

export const seoulToday = () => isoDay(todayInSeoul());
export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && parseDay(s) !== null;
export const shiftDay = (day: string, n: number) => isoDay(addDays(parseDay(day)!, n));

export function formatDay(day: string) {
  const d = parseDay(day);
  if (!d) return day;
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${"일월화수목금토"[d.getUTCDay()]}요일`;
}

export type DayKind = "new" | "updated";
type Dated = { date: string; updated?: string; created?: string; title: string };

/** 그날 정리한 글: 새로 쓴 글을 먼저(적은 순서대로), 고친 글은 뒤에 */
export function entriesOfDay<T extends Dated>(entries: T[], day: string): { entry: T; kind: DayKind }[] {
  return entries
    .flatMap((entry): { entry: T; kind: DayKind }[] =>
      entry.date === day ? [{ entry, kind: "new" }] : entry.updated === day ? [{ entry, kind: "updated" }] : [],
    )
    .sort(
      (a, b) =>
        (a.kind === b.kind ? 0 : a.kind === "new" ? -1 : 1) ||
        (a.entry.created ?? "").localeCompare(b.entry.created ?? "") ||
        a.entry.title.localeCompare(b.entry.title, "ko"),
    );
}
