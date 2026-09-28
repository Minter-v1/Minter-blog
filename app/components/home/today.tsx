import Link from "next/link";
import { entryHref, type CollectionId } from "@/lib/collections";
import type { DayKind } from "@/lib/today";
import { CollectionIcon } from "../collection-icon";
import { ChevronRight } from "../icons";

export type TodayItem = { collection: CollectionId; slug: string; title: string; description: string; kind: DayKind };

// 홈: 오늘 정리한 기록만 따로. 없으면 섹션 자체를 숨긴다
export function TodaySection({ items }: { items: TodayItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4 px-1">
        <h2 className="text-[20px] font-bold tracking-[-0.03em]">
          오늘 정리한 기록<span className="ml-1.5 text-primary tabular-nums">{items.length}</span>
        </h2>
        <Link
          href="/today"
          className="inline-flex items-center gap-0.5 text-[14px] font-semibold text-text-2 transition-colors hover:text-text"
        >
          몰아 읽기
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <ul className="rounded-[24px] bg-surface p-2 sm:p-3">
        {items.map((it) => (
          <li key={`${it.collection}/${it.slug}`}>
            <Link
              href={entryHref(it.collection, it.slug)}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-fill sm:gap-4"
            >
              <CollectionIcon
                id={it.collection}
                className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-fill text-[20px]"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary ${
                    it.collection === "git" ? "font-mono text-[15px]" : "text-[16px]"
                  }`}
                >
                  {it.title}
                </p>
                <p className="mt-0.5 truncate text-[14px] text-text-3">{it.description}</p>
              </div>
              {it.kind === "updated" && <span className="shrink-0 text-[12px] font-medium text-text-3">수정</span>}
              <ChevronRight className="size-4 shrink-0 text-text-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
