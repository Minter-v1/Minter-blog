import type { Metadata } from "next";
import Link from "next/link";
import { loadArchive } from "@/lib/archive";
import { COLLECTIONS, entryHref } from "@/lib/collections";
import { entriesOfDay, formatDay, isDay, seoulToday, shiftDay } from "@/lib/today";
import { Article } from "../components/article";
import { CollectionIcon } from "../components/collection-icon";
import { ChevronRight } from "../components/icons";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = { title: "오늘 정리한 기록" };

// 그날 정리한 글의 본문을 한 페이지에 이어 붙인다 — 자기 전에 스크롤만으로 몰아 읽기.
// /today → 오늘, /today?d=2026-09-27 → 그날 (리마인드 메일은 날짜를 박아서 보낸다)
export default async function TodayPage(props: PageProps<"/today">) {
  const { d } = await props.searchParams;
  const today = seoulToday();
  const day = isDay(d) ? d : today;
  const archive = await loadArchive();
  const items = entriesOfDay(archive.entries, day);
  const isToday = day === today;

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 sm:px-6">
      <SiteHeader />

      <div className="mt-4 mb-6 flex items-end justify-between gap-4 px-1">
        <div>
          <p className="text-[14px] font-semibold text-text-3">{formatDay(day)}</p>
          <h1 className="mt-1 text-[24px] font-bold tracking-[-0.035em] sm:text-[28px]">
            {isToday ? "오늘" : "이날"} 정리한 기록
            <span className="ml-2 text-[20px] text-primary tabular-nums">{items.length}</span>
          </h1>
        </div>
        <nav className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-text-2">
          <Link href={`/today?d=${shiftDay(day, -1)}`} className="rounded-lg px-2.5 py-1.5 hover:bg-fill-strong/60">
            ‹ 전날
          </Link>
          {!isToday && (
            <Link href={`/today?d=${shiftDay(day, 1)}`} className="rounded-lg px-2.5 py-1.5 hover:bg-fill-strong/60">
              다음날 ›
            </Link>
          )}
        </nav>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] bg-surface py-16 text-center">
          <p className="text-[16px] font-semibold text-text-3">{isToday ? "오늘" : "이날"} 정리한 기록이 없어요</p>
        </div>
      ) : (
        <>
          {/* 목차: 몇 개를 읽을지 먼저 보이게 */}
          {items.length > 1 && (
            <ol className="mb-6 rounded-[24px] bg-surface p-2 sm:p-3">
              {items.map(({ entry: e, kind }, i) => (
                <li key={e.ref}>
                  <a
                    href={`#${encodeURIComponent(e.ref)}`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-fill"
                  >
                    <span className="w-5 shrink-0 text-center text-[13px] font-semibold text-text-3 tabular-nums">{i + 1}</span>
                    <CollectionIcon id={e.collection} className="text-[16px]" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{e.title}</span>
                    {kind === "updated" && <span className="shrink-0 text-[12px] font-medium text-text-3">수정</span>}
                  </a>
                </li>
              ))}
            </ol>
          )}

          <div className="space-y-6">
            {items.map(({ entry: e, kind }) => {
              const c = COLLECTIONS[e.collection];
              return (
                <article
                  key={e.ref}
                  id={e.ref}
                  className="scroll-mt-6 rounded-[24px] bg-surface px-5 pt-7 pb-10 sm:rounded-[28px] sm:px-12 sm:pt-11 sm:pb-14"
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-text-3">
                    <CollectionIcon id={e.collection} className="text-[15px]" />
                    {c.label}
                    {kind === "updated" && <span className="font-medium">· 수정</span>}
                  </p>
                  <h2
                    className={`mt-3 leading-tight font-bold tracking-[-0.035em] ${
                      e.collection === "git" ? "font-mono text-[22px] break-all sm:text-[28px]" : "text-[24px] sm:text-[30px]"
                    }`}
                  >
                    {e.title}
                  </h2>
                  <p className="mt-3 text-[17px] leading-[1.6] font-medium tracking-[-0.02em] text-text-2">{e.description}</p>
                  {c.extraFields.map(
                    (f) =>
                      e.extra[f.key] && (
                        <p
                          key={f.key}
                          className={`mt-4 overflow-x-auto rounded-2xl bg-[#f7f8fa] px-4 py-3 text-[13px] leading-relaxed sm:text-[14px] ${
                            f.mono ? "font-mono" : ""
                          }`}
                        >
                          {e.extra[f.key]}
                        </p>
                      ),
                  )}
                  {e.body && (
                    <>
                      <hr className="my-8 border-line" />
                      <Article markdown={e.body} rawBase={archive.rawBase[e.collection]} />
                    </>
                  )}
                  <Link
                    href={entryHref(e.collection, e.slug)}
                    className="mt-8 inline-flex items-center gap-0.5 text-[14px] font-semibold text-text-3 transition-colors hover:text-text-2"
                  >
                    이 글만 보기
                    <ChevronRight className="size-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
