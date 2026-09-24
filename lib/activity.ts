import { COLLECTION_IDS, entryHref, type CollectionId } from "./collections";
import { addDays, isoDay, parseDay, todayInSeoul, weekStart } from "./week";

export type WeekBucket = {
  start: string; // 주 시작(월요일) YYYY-MM-DD
  label: string; // "9월 넷째 주"
  monthLabel: string | null; // 달이 바뀌는 첫 주에만 "9월"
  counts: Record<CollectionId, number>;
  total: number;
  items: { title: string; collection: CollectionId; href: string }[];
};

export type Activity = {
  weeks: WeekBucket[]; // 오래된 주 → 이번 주
  thisWeek: Record<CollectionId, number>;
  streak: number; // 연속으로 기록한 주
};

const ORDINAL = ["첫째", "둘째", "셋째", "넷째", "다섯째"];

const zero = () => Object.fromEntries(COLLECTION_IDS.map((id) => [id, 0])) as Record<CollectionId, number>;

export function buildActivity(
  entries: { collection: CollectionId; slug: string; title: string; date: string }[],
  weeksBack = 26,
): Activity {
  const current = weekStart(todayInSeoul());
  const first = addDays(current, -7 * (weeksBack - 1));

  const weeks: WeekBucket[] = Array.from({ length: weeksBack }, (_, i) => {
    const start = addDays(first, i * 7);
    // 그 주의 목요일이 속한 달 기준으로 "몇째 주"
    const thu = addDays(start, 3);
    const nth = Math.floor((thu.getUTCDate() - 1) / 7);
    const prevThu = addDays(thu, -7);
    return {
      start: isoDay(start),
      label: `${thu.getUTCMonth() + 1}월 ${ORDINAL[nth]} 주`,
      monthLabel: i === 0 || prevThu.getUTCMonth() !== thu.getUTCMonth() ? `${thu.getUTCMonth() + 1}월` : null,
      counts: zero(),
      total: 0,
      items: [],
    };
  });

  for (const e of entries) {
    const d = parseDay(e.date);
    if (!d) continue;
    const idx = Math.round((weekStart(d).getTime() - first.getTime()) / (7 * 86400000));
    const w = weeks[idx];
    if (!w) continue;
    w.counts[e.collection]++;
    w.total++;
    w.items.push({ title: e.title, collection: e.collection, href: entryHref(e.collection, e.slug) });
  }

  // 이번 주가 아직 비어 있으면 지난주부터 센다 (일요일 정리 전이라도 연속이 끊기지 않게)
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].total > 0) streak++;
    else if (i === weeks.length - 1) continue;
    else break;
  }

  return { weeks, thisWeek: weeks[weeks.length - 1].counts, streak };
}
