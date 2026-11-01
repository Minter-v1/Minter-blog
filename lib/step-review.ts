// 학습 단계를 복습 일정에 얹는다 (#135). 서버·클라이언트 공용 — 계산만
//
// - 용어(Quick)를 쓴 다음 날(1번째 복습) Hands-on, 그로부터 3일 뒤(2번째 복습, 4일째쯤) Deep Dive를 제안
// - 앞 단계가 남아 있으면 다음 단계는 나오지 않는다 (두 단계가 한꺼번에 쌓이지 않게)
// - 단계 글을 공개하면 그 단계에 해당하는 복습을 마친 것으로 친다. 단계 글 자체는 복습 대상이 아니다
// - 쓰거나 건너뛸 때까지 '밀림'으로 남는다. 손으로 해 볼 게 없는 용어(handsOn: none)는 Hands-on을 건너뛴다
import type { Ref } from "./collections";
import { skipsHandsOn, stepOf, STEPS, type StepId } from "./learning-steps";
import { dayDiff, REVIEW_INTERVALS, type ReviewLog, type ReviewRecord } from "./review";
import { addDays, isoDay, parseDay } from "./week";

// 이 기능을 배포한 날. 그 전에 쓴 용어는 자동으로 제안하지 않는다 (기존 용어가 한꺼번에 '밀림'이 되므로).
// 용어 글의 학습 단계 줄에서는 언제든 쓸 수 있다
export const STEPS_SINCE = "2026-11-01";

// 메일에 넣는 다음 단계 제안 수 (오래 밀린 것부터)
export const STEP_MAIL_LIMIT = 2;

type Post = { ref: Ref; collection: string; date: string; extra: Record<string, string> };
type Term = Post;

export type StepSuggestion = {
  ref: Ref; // 출발한 용어
  step: StepId;
  due: string;
  days: number; // 오늘 - 제안일. 양수면 밀린 날 수
};

const max = (a: string, b: string) => (a > b ? a : b);
const plus = (day: string, n: number) => isoDay(addDays(parseDay(day)!, n));

/** 공개된 단계 글로 마친 복습 단계를 반영한 기록. Hands-on 글 → 1번째, Deep Dive 글 → 2번째 복습까지 완료 */
export function withStepPosts(log: ReviewLog, entries: Post[]): ReviewLog {
  const out = { ...log };
  for (const e of entries) {
    const own = stepOf(e);
    if (!own) continue;
    const stage = STEPS.findIndex((s) => s.id === own.step) + 1;
    const record: ReviewRecord | undefined = out[own.source];
    if (record && record.stage >= stage) continue;
    out[own.source] = { ...record, stage, last: record ? max(record.last, e.date) : e.date };
  }
  return out;
}

/** 이 용어에서 지금 쓸 차례인 단계. 모두 썼거나 건너뛰었으면, 또는 자동 제안 대상이 아니면 null */
export function nextStepOf(
  term: Term,
  posts: Partial<Record<StepId, Post>>,
  log: ReviewLog,
  today: string,
): StepSuggestion | null {
  if (term.collection !== "terms" || term.date < STEPS_SINCE) return null;
  const skipped = log[term.ref]?.skipped ?? {};
  let prev = term.date; // 앞 단계를 마친 날
  let since = 0; // 용어를 쓴 날부터 센 복습 간격 합
  for (const [i, s] of STEPS.entries()) {
    since += REVIEW_INTERVALS[i];
    const finished =
      posts[s.id]?.date ?? skipped[s.id] ?? (s.id === "hands-on" && skipsHandsOn(term.extra) ? term.date : undefined);
    if (finished) {
      prev = max(prev, finished);
      continue;
    }
    // 복습 간격대로 제안하되, 앞 단계를 늦게 마쳤으면 그날부터 다시 센다
    const due = max(plus(term.date, since), plus(prev, REVIEW_INTERVALS[i]));
    return { ref: term.ref, step: s.id, due, days: dayDiff(today, due) };
  }
  return null;
}
