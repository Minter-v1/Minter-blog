import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { loadArchive, type Entry } from "./archive";
import { githubEnv } from "./env";
import { commitFiles, ConflictError, readTextFile } from "./github";
import {
  completeReview,
  groupSchedules,
  parseReviewLog,
  REVIEW_TOTAL,
  scheduleOf,
  serializeReviewLog,
  type ReviewLog,
  type ReviewSchedule,
} from "./review";
import { seoulToday } from "./today";

// 복습 기록은 데이터 repo 루트의 review.json 하나에 둔다 (별도 DB 없이 글과 같은 커밋 흐름)
const REVIEW_FILE = "review.json";

// 복습 기록은 공개 페이지와 무관하므로 아카이브와 다른 캐시 태그를 쓴다.
// 복습 완료를 눌러도 공개 페이지(ISR)가 다시 만들어지지 않도록
const REVIEW_TAG = "review";
export const loadReviewLog = unstable_cache(
  async () => parseReviewLog(await readTextFile(REVIEW_FILE, githubEnv().branch)),
  ["review-log"],
  { tags: [REVIEW_TAG], revalidate: 300 },
);

export type ReviewItem = ReviewSchedule & Pick<Entry, "collection" | "slug" | "title" | "description">;

/** 공개된 글 전체의 복습 일정. 작성 중인 글은 대상이 아니다 */
export async function loadReviewItems(today = seoulToday()): Promise<ReviewItem[]> {
  const [{ entries }, log] = await Promise.all([loadArchive(), loadReviewLog()]);
  return entries.map((e) => ({
    ...scheduleOf(e, log, today),
    collection: e.collection,
    slug: e.slug,
    title: e.title,
    description: e.description,
  }));
}

export async function loadReviewGroups(today = seoulToday()) {
  return groupSchedules(await loadReviewItems(today)) as {
    today: ReviewItem[];
    upcoming: ReviewItem[];
    done: ReviewItem[];
  };
}

/** 복습 완료: 단계 +1, 마지막 복습일 = 오늘. 커밋 1개 */
export async function markReviewed(ref: string): Promise<ReviewLog[string]> {
  const { entries } = await loadArchive();
  const entry = entries.find((e) => e.ref === ref);
  if (!entry) throw new ConflictError("복습할 글을 찾을 수 없어요.");
  const today = seoulToday();
  let record: ReviewLog[string] | undefined;

  await commitFiles(
    () => `review: ${ref} (${record!.stage}/${REVIEW_TOTAL})`,
    async ({ headSha }) => {
      const log = parseReviewLog(await readTextFile(REVIEW_FILE, headSha));
      const schedule = scheduleOf(entry, log, today);
      if (schedule.done) throw new ConflictError("이미 복습을 모두 마친 글이에요.");
      if (schedule.days < 0) throw new ConflictError(`아직 복습할 날이 아니에요. (${schedule.due})`);
      const next = completeReview(log, ref, today);
      record = next[ref];
      return [{ path: REVIEW_FILE, text: serializeReviewLog(next) }];
    },
  );
  revalidateTag(REVIEW_TAG, { expire: 0 });
  return record!;
}
