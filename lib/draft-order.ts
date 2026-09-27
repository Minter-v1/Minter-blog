type Orderable = { date: string; created?: string; title: string };

/** 작성 중인 글 순서: 먼저 적어둔 것부터 (날짜 → 등록 시각 → 제목). 시각이 없는 예전 글은 그날 맨 앞 */
export function oldestFirst(a: Orderable, b: Orderable) {
  return (
    a.date.localeCompare(b.date) || (a.created ?? "").localeCompare(b.created ?? "") || a.title.localeCompare(b.title, "ko")
  );
}
