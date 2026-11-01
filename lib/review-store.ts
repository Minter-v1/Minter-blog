import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { loadArchive, type Entry } from "./archive";
import { githubEnv } from "./env";
import { commitFiles, ConflictError, readTextFile } from "./github";
import { STEPS, stepOf, stepPostsOf, type StepId } from "./learning-steps";
import { plainExcerpt } from "./plain-text";
import {
  completeReview,
  groupSchedules,
  parseReviewLog,
  REVIEW_FILE,
  REVIEW_TOTAL,
  scheduleOf,
  serializeReviewLog,
  skipSteps,
  type ReviewLog,
  type ReviewSchedule,
} from "./review";
import { nextStepOf, withStepPosts, type StepSuggestion } from "./step-review";
import { seoulToday } from "./today";

// 복습 기록은 데이터 repo 루트의 review.json 하나에 둔다 (별도 DB 없이 글과 같은 커밋 흐름)

// 복습 기록은 공개 페이지와 무관하므로 아카이브와 다른 캐시 태그를 쓴다.
// 복습 완료를 눌러도 공개 페이지(ISR)가 다시 만들어지지 않도록
const REVIEW_TAG = "review";
export const loadReviewLog = unstable_cache(
  async () => parseReviewLog(await readTextFile(REVIEW_FILE, githubEnv().branch)),
  ["review-log"],
  { tags: [REVIEW_TAG], revalidate: 300 },
);

/** review.json 을 다른 경로(글 이동 등)에서 바꿨을 때 */
export function invalidateReview() {
  revalidateTag(REVIEW_TAG, { expire: 0 });
}

type EntryLink = Pick<Entry, "collection" | "slug" | "title">;

export type ReviewItem = ReviewSchedule &
  EntryLink &
  Pick<Entry, "description"> & {
    excerpt: string; // 본문 앞부분 평문 요약 (메일에서 바로 복습할 수 있도록)
    steps: (EntryLink & { step: StepId })[]; // 용어에서 이어 쓴 단계 글 (단계 글은 따로 복습하지 않고 용어 옆에 링크로)
  };

/** 다음 학습 단계 제안 (#135). 용어 정보와 함께 */
export type StepItem = StepSuggestion &
  EntryLink &
  Pick<Entry, "description"> & {
    drafting: boolean; // 이 단계 글을 작성 중
  };

const link = (e: Entry): EntryLink => ({ collection: e.collection, slug: e.slug, title: e.title });

/** 단계 글 공개를 복습 완료로 반영한 기록 */
const effectiveLog = (log: ReviewLog, entries: Entry[]) => withStepPosts(log, entries);

/** 복습할 글: 공개된 글 중 단계 글을 뺀 것. 작성 중인 글은 대상이 아니다 */
const reviewTargets = (entries: Entry[]) => entries.filter((e) => !stepOf(e));

/** 공개된 글 전체의 복습 일정 */
export async function loadReviewItems(today = seoulToday()): Promise<ReviewItem[]> {
  const [{ entries }, raw] = await Promise.all([loadArchive(), loadReviewLog()]);
  const log = effectiveLog(raw, entries);
  return reviewTargets(entries).map((e) => {
    const posts = stepPostsOf(e.ref, entries);
    return {
      ...scheduleOf(e, log, today),
      ...link(e),
      description: e.description,
      excerpt: plainExcerpt(e.body),
      steps: STEPS.flatMap((s) => (posts[s.id] ? [{ ...link(posts[s.id]!), step: s.id }] : [])),
    };
  });
}

/** 오늘 쓸 차례인 다음 단계 (밀린 것 먼저, 오래 밀린 순) */
export async function loadStepItems(today = seoulToday()): Promise<StepItem[]> {
  const [{ entries, drafts }, raw] = await Promise.all([loadArchive(), loadReviewLog()]);
  return entries
    .flatMap((e) => {
      const next = nextStepOf(e, stepPostsOf(e.ref, entries), raw, today);
      if (!next || next.days < 0) return [];
      const drafting = !!stepPostsOf(e.ref, drafts)[next.step];
      return [{ ...next, ...link(e), description: e.description, drafting }];
    })
    .sort((a, b) => b.days - a.days || a.ref.localeCompare(b.ref));
}

export async function loadReviewGroups(today = seoulToday()) {
  const [items, steps] = await Promise.all([loadReviewItems(today), loadStepItems(today)]);
  return {
    ...(groupSchedules(items) as {
      today: ReviewItem[];
      upcoming: ReviewItem[];
      done: ReviewItem[];
    }),
    steps,
  };
}

/** 복습 완료: 단계 +1, 마지막 복습일 = 오늘. 커밋 1개 */
export async function markReviewed(ref: string): Promise<ReviewLog[string]> {
  const { entries } = await loadArchive();
  const entry = reviewTargets(entries).find((e) => e.ref === ref);
  if (!entry) throw new ConflictError("복습할 글을 찾을 수 없어요.");
  const today = seoulToday();
  let record: ReviewLog[string] | undefined;

  await commitFiles(
    () => `review: ${ref} (${record!.stage}/${REVIEW_TOTAL})`,
    async ({ headSha }) => {
      const raw = parseReviewLog(await readTextFile(REVIEW_FILE, headSha));
      const log = effectiveLog(raw, entries);
      const schedule = scheduleOf(entry, log, today);
      if (schedule.done) throw new ConflictError("이미 복습을 모두 마친 글이에요.");
      if (schedule.days < 0) throw new ConflictError(`아직 복습할 날이 아니에요. (${schedule.due})`);
      // 단계 글로 마친 단계까지 반영해 +1, 이 글의 기록만 바꾼다
      record = completeReview(log, ref, today)[ref];
      return [
        {
          path: REVIEW_FILE,
          text: serializeReviewLog({ ...raw, [ref]: record }),
        },
      ];
    },
  );
  revalidateTag(REVIEW_TAG, { expire: 0 });
  return record!;
}

/** 학습 단계 건너뛰기 (#135): 한 단계만, 또는 "이 글은 여기까지"(all)로 남은 단계 전부. 커밋 1개 */
export async function skipStep(ref: string, which: StepId | "all"): Promise<ReviewLog[string]> {
  const { entries } = await loadArchive();
  const entry = entries.find((e) => e.ref === ref && e.collection === "terms");
  if (!entry) throw new ConflictError("용어를 찾을 수 없어요.");
  const posts = stepPostsOf(entry.ref, entries);
  const steps = (which === "all" ? STEPS.map((s) => s.id) : [which]).filter((s) => !posts[s]);
  if (steps.length === 0) throw new ConflictError("이미 쓴 단계예요.");
  const today = seoulToday();
  let record: ReviewLog[string] | undefined;

  await commitFiles(
    () => `review: ${ref} 학습 단계 건너뛰기 (${steps.join(", ")})`,
    async ({ headSha }) => {
      const raw = parseReviewLog(await readTextFile(REVIEW_FILE, headSha));
      record = skipSteps(raw, entry, steps, today)[ref];
      return [
        {
          path: REVIEW_FILE,
          text: serializeReviewLog({ ...raw, [ref]: record }),
        },
      ];
    },
  );
  revalidateTag(REVIEW_TAG, { expire: 0 });
  return record!;
}
