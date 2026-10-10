import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, entryHref } from "@/lib/collections";
import { REVIEW_INTERVALS, REVIEW_TOTAL } from "@/lib/review";
import { loadReviewGroups, type ReviewItem } from "@/lib/review-store";
import { formatDay } from "@/lib/today";
import { CollectionIcon } from "../components/collection-icon";
import { ReviewDoneButton, ReviewProgress } from "../components/review";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = { title: "복습" };

// 망각곡선 복습 일정 (나만). 1·3·7·14·30·60일 간격, 복습 완료를 눌러야 다음 단계로
export default async function ReviewPage() {
  if (!(await isAuthed())) redirect("/login");
  const { today, upcoming, done } = await loadReviewGroups();
  const soon = upcoming.filter((i) => i.days >= -7);
  const byDate = new Map<string, ReviewItem[]>();
  for (const i of soon) byDate.set(i.due!, [...(byDate.get(i.due!) ?? []), i]);
  const all = [...today, ...upcoming].sort((a, b) => a.due!.localeCompare(b.due!));

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 sm:px-6">
      <SiteHeader active="review" writeHref="/write" />

      <div className="mt-4 mb-6 px-1">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-[24px] font-bold tracking-[-0.035em] sm:text-[28px]">
            복습
            <span className="ml-2 text-[20px] text-primary tabular-nums">{today.length}</span>
          </h1>
          <Link href="/learning" className="shrink-0 text-[14px] font-semibold text-text-2 hover:text-text">
            복습 방법
          </Link>
        </div>
        <p className="mt-1.5 text-[15px] text-text-3">
          작성 완료한 글을 {REVIEW_INTERVALS.join("·")}일 간격으로 {REVIEW_TOTAL}번 다시 읽어요 · 나만 보여요
        </p>
      </div>

      <section className="rounded-[24px] bg-surface p-4 sm:p-7">
        <h2 className="px-3 text-[17px] font-bold tracking-[-0.02em]">오늘 복습</h2>
        {today.length === 0 ? (
          <p className="px-3 py-10 text-center text-[15px] text-text-3">오늘은 복습할 글이 없어요</p>
        ) : (
          <ul className="mt-2">
            {today.map((i) => (
              <ReviewRow key={i.ref} item={i} action={<ReviewDoneButton refKey={i.ref} />}>
                {i.stage + 1}번째 복습
                {i.days > 0 ? <span className="text-danger"> · {i.days}일 밀림</span> : " · 오늘"}
              </ReviewRow>
            ))}
          </ul>
        )}
      </section>

      {soon.length > 0 && (
        <section className="mt-6 rounded-[24px] bg-surface p-4 sm:p-7">
          <h2 className="px-3 text-[17px] font-bold tracking-[-0.02em]">다가오는 복습</h2>
          <p className="mt-1 px-3 text-[13px] text-text-3">앞으로 7일</p>
          <div className="mt-3 space-y-5">
            {[...byDate].map(([date, items]) => (
              <div key={date}>
                <h3 className="mb-1 px-3 text-[13px] font-semibold text-text-3">
                  {formatDay(date)} <span className="ml-1 font-medium">· {-items[0].days}일 뒤</span>
                </h3>
                <ul>
                  {items.map((i) => (
                    <ReviewRow key={i.ref} item={i}>
                      {i.stage + 1}번째 복습
                    </ReviewRow>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-[24px] bg-surface p-4 sm:p-7">
        <h2 className="px-3 text-[17px] font-bold tracking-[-0.02em]">전체 일정</h2>
        {all.length === 0 && done.length === 0 ? (
          <p className="px-3 py-10 text-center text-[15px] text-text-3">작성 완료한 글이 없어요</p>
        ) : (
          <ul className="mt-2">
            {all.map((i) => (
              <ReviewRow key={i.ref} item={i}>
                다음 복습 {formatDay(i.due!)}
              </ReviewRow>
            ))}
            {done.map((i) => (
              <ReviewRow key={i.ref} item={i}>
                복습 완료
              </ReviewRow>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewRow(props: { item: ReviewItem; action?: React.ReactNode; children: React.ReactNode }) {
  const { item } = props;
  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-3 sm:gap-4">
      <CollectionIcon
        id={item.collection}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fill text-[18px]"
      />
      <Link href={entryHref(item.collection, item.slug)} className="group min-w-0 flex-1">
        <p
          className={`truncate font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary ${
            item.collection === "git" ? "font-mono text-[15px]" : "text-[16px]"
          }`}
          title={COLLECTIONS[item.collection].label}
        >
          {item.title}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[13px] text-text-3">
          <ReviewProgress stage={item.stage} />
          <span className="truncate">{props.children}</span>
        </p>
      </Link>
      {props.action}
    </li>
  );
}
