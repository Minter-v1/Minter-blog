import Link from "next/link";
import type { Entry } from "@/lib/archive";
import { entryHref, type Ref } from "@/lib/collections";
import { skipsHandsOn, stepName, stepOf, stepPostsOf, STEPS, stepWriteHref } from "@/lib/learning-steps";
import { AuthOnly } from "./auth";
import { ChevronRight } from "./icons";

const chip = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors";
const star = <span aria-hidden className="star-mark size-2.5 shrink-0 bg-current" />;

const refHref = (ref: Ref) => {
  const i = ref.indexOf("/");
  return entryHref(ref.slice(0, i) as Entry["collection"], ref.slice(i + 1));
};

/**
 * 글 상세의 학습 단계 줄 (#133)
 * - 용어 글: Quick(이 글) → Hands-on → Deep Dive. 공개된 단계 글은 링크, 아직 없는 단계는 나만 보이는 '쓰기'
 * - 단계 글: 어느 용어에서 이어 쓴 글인지
 * 공개 페이지(CDN 캐시)라 작성 중인 단계 글은 보여 주지 않는다. '쓰기'를 누르면 이미 있는 글이면 그 글로 넘어간다
 */
export function LearningSteps({ entry, entries }: { entry: Entry; entries: Entry[] }) {
  const own = stepOf(entry);
  if (own) {
    const source = entries.find((e) => e.ref === own.source);
    if (!source) return null;
    return (
      <p className="mt-5 flex items-center gap-1.5 text-[14px] text-text-3">
        <span className="text-primary">{star}</span>
        <Link href={refHref(source.ref)} className="font-semibold text-primary hover:underline">
          {source.title}
        </Link>
        에서 이어 쓴 {stepName(own.step)}
      </p>
    );
  }
  if (entry.collection !== "terms") return null;

  const posts = stepPostsOf(entry.ref, entries);
  const steps = STEPS.filter((s) => !(s.id === "hands-on" && skipsHandsOn(entry.extra)));
  const row = (
    <div className="mt-5 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[13px] font-semibold text-text-3">학습 단계</span>
      <span className={`${chip} bg-primary text-white`}>
        {star}
        Quick
      </span>
      {steps.map((s) => {
        const post = posts[s.id];
        if (post)
          return (
            <Link key={s.id} href={refHref(post.ref)} className={`${chip} bg-primary-weak text-primary hover:bg-[#e2dbf5]`}>
              {star}
              {s.name}
              <ChevronRight className="size-3.5" />
            </Link>
          );
        return (
          <AuthOnly key={s.id}>
            <Link
              href={stepWriteHref(s.id, entry.ref)}
              title={s.hint}
              className={`${chip} border border-dashed border-fill-strong text-text-3 hover:border-primary hover:text-primary`}
            >
              + {s.name} 쓰기
            </Link>
          </AuthOnly>
        );
      })}
    </div>
  );
  // 공개된 단계 글이 없으면 줄 전체를 나만 보이게
  return steps.some((s) => posts[s.id]) ? row : <AuthOnly>{row}</AuthOnly>;
}
