import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, entryHref } from "@/lib/collections";
import { stepName, STEPS, stepWriteHref } from "@/lib/learning-steps";
import { REVIEW_INTERVALS, REVIEW_TOTAL } from "@/lib/review";
import { loadReviewGroups, type ReviewItem, type StepItem } from "@/lib/review-store";
import { formatDay } from "@/lib/today";
import { CollectionIcon } from "../components/collection-icon";
import { ReviewDoneButton, ReviewProgress, StepSkipButton } from "../components/review";
import { SiteHeader } from "../components/site-header";
import { EmptyState } from "../components/loaders";

export const metadata: Metadata = { title: "복습" };

// 망각곡선 복습 일정 (나만). 1·3·7·14·30·60일 간격, 복습 완료를 눌러야 다음 단계로
export default async function ReviewPage() {
  if (!(await isAuthed())) redirect("/login");
  const { today, upcoming, done, steps } = await loadReviewGroups();
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
          <EmptyState emoji="🎉" title="오늘은 복습할 글이 없어요" desc="다음 복습 일정은 아래에서 볼 수 있어요" />
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

      {steps.length > 0 && (
        <section className="mt-6 rounded-[24px] bg-surface p-4 sm:p-7">
          <h2 className="px-3 text-[17px] font-bold tracking-[-0.02em]">
            다음 단계 <span className="ml-1 text-primary tabular-nums">{steps.length}</span>
          </h2>
          <p className="mt-1 px-3 text-[13px] text-text-3">
            용어를 쓴 다음 날 Hands-on, 4일째쯤 Deep Dive · 단계 글을 공개하면 그 회차 복습도 끝나요
          </p>
          <ul className="mt-2">
            {steps.map((s) => (
              <StepRow key={s.ref} item={s} />
            ))}
          </ul>
        </section>
      )}

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
          <EmptyState emoji="🧠" title="작성 완료한 글이 없어요" desc="글을 완료하면 망각곡선에 맞춰 복습 일정이 잡혀요" />
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
    <li className="rounded-2xl px-3 py-3">
      <div className="flex items-center gap-3 sm:gap-4">
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
      </div>
      {/* 용어에서 이어 쓴 단계 글은 따로 복습하지 않고 용어와 함께 */}
      {item.steps.length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-12 text-[13px] text-text-3 sm:pl-[52px]">
          {item.steps.map((s) => (
            <span key={s.step} className="min-w-0 truncate">
              {stepName(s.step)} ·{" "}
              <Link href={entryHref(s.collection, s.slug)} className="font-semibold text-primary hover:underline">
                {s.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

function StepRow({ item }: { item: StepItem }) {
  const name = stepName(item.step);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-3 py-3 sm:gap-x-4">
      <CollectionIcon
        id={item.collection}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fill text-[18px]"
      />
      <Link href={entryHref(item.collection, item.slug)} className="group min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
          {item.title}
        </p>
        <p className="mt-1 truncate text-[13px] text-text-3">
          <span className="font-semibold text-primary">{name}</span> · {STEPS.find((s) => s.id === item.step)!.hint}
          {item.days > 0 ? <span className="text-danger"> · {item.days}일 밀림</span> : " · 오늘"}
        </p>
      </Link>
      <div className="flex w-full shrink-0 flex-wrap justify-end gap-1.5 sm:w-auto">
        <StepSkipButton refKey={item.ref} skip={item.step} label="건너뛰기" />
        <StepSkipButton refKey={item.ref} skip="all" label="이 글은 여기까지" />
        <Link
          href={stepWriteHref(item.step, item.ref)}
          className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-press"
        >
          {name} {item.drafting ? "이어 쓰기" : "쓰기"}
        </Link>
      </div>
    </li>
  );
}
