// 망각곡선 기반 복습 일정 (간격 반복). 서버·클라이언트 공용 — 계산만 하고 저장은 lib/review-store.ts
//
// - 작성 완료한 글을 1·3·7·14·30·60일 간격으로 6번 복습하면 끝
// - "복습 완료"를 눌러야 다음 단계로 넘어가고, 다음 복습일은 실제로 복습한 날부터 센다
// - 복습일이 지나도 안 하면 '밀림'으로 계속 남는다
import { addDays, isoDay, parseDay } from "./week";

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const REVIEW_TOTAL = REVIEW_INTERVALS.length;

// 이 기능을 배포한 날. 그 전에 쓴 글은 작성일 대신 이 날부터 일정을 시작한다
// (작성일 기준이면 기존 글이 한꺼번에 '밀림'이 되므로)
export const REVIEW_SINCE = "2026-10-07";

/** 데이터 repo의 review.json: 글(ref)마다 마친 복습 횟수와 마지막 복습일 */
export type ReviewRecord = { stage: number; last: string };
export type ReviewLog = Record<string, ReviewRecord>;

export type ReviewTarget = { ref: string; date: string };

export type ReviewSchedule = {
  ref: string;
  stage: number; // 마친 복습 횟수 (0~6)
  done: boolean; // 6회 모두 마침
  due: string | null; // 다음 복습일 (done이면 null)
  days: number; // 오늘 - 복습일. 양수면 밀린 날 수, 0이면 오늘, 음수면 남은 날 수
};

const dayDiff = (a: string, b: string) => Math.round((parseDay(a)!.getTime() - parseDay(b)!.getTime()) / 86_400_000);

export function scheduleOf(target: ReviewTarget, log: ReviewLog, today: string): ReviewSchedule {
  const record = log[target.ref];
  const stage = Math.min(record?.stage ?? 0, REVIEW_TOTAL);
  if (stage >= REVIEW_TOTAL) return { ref: target.ref, stage, done: true, due: null, days: 0 };
  // 기준일: 마지막 복습일, 아직 한 번도 안 했으면 작성일 (배포일 이전 글은 배포일)
  const base = record?.last ?? (target.date < REVIEW_SINCE ? REVIEW_SINCE : target.date);
  const due = isoDay(addDays(parseDay(base)!, REVIEW_INTERVALS[stage]));
  return { ref: target.ref, stage, done: false, due, days: dayDiff(today, due) };
}

/** 오늘 복습할 글(밀린 것 먼저, 오래 밀린 순)과 예정, 완료로 나눈다 */
export function groupSchedules(schedules: ReviewSchedule[]) {
  const pending = schedules.filter((s) => !s.done);
  return {
    today: pending.filter((s) => s.days >= 0).sort((a, b) => b.days - a.days || a.ref.localeCompare(b.ref)),
    upcoming: pending.filter((s) => s.days < 0).sort((a, b) => b.days - a.days || a.ref.localeCompare(b.ref)),
    done: schedules.filter((s) => s.done),
  };
}

/** 복습 완료 처리 결과 — 단계 +1, 마지막 복습일 = 오늘 */
export function completeReview(log: ReviewLog, ref: string, today: string): ReviewLog {
  const stage = Math.min((log[ref]?.stage ?? 0) + 1, REVIEW_TOTAL);
  return { ...log, [ref]: { stage, last: today } };
}

export function parseReviewLog(text: string | null): ReviewLog {
  if (!text) return {};
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const log: ReviewLog = {};
    for (const [ref, v] of Object.entries(raw)) {
      const r = v as Partial<ReviewRecord>;
      if (typeof r?.stage === "number" && typeof r?.last === "string" && parseDay(r.last)) {
        log[ref] = { stage: r.stage, last: r.last };
      }
    }
    return log;
  } catch {
    return {};
  }
}

export const serializeReviewLog = (log: ReviewLog) =>
  JSON.stringify(Object.fromEntries(Object.entries(log).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n";
