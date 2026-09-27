import Link from "next/link";
import { COLLECTIONS } from "@/lib/collections";
import type { Entry } from "@/lib/archive";

// 작성 페이지 위: 토픽만 적어둔 글(작성 중)을 모아 두고 바로 이어 쓰기
export function DraftTray(props: { drafts: Entry[]; current?: string }) {
  if (props.drafts.length === 0) return null;
  return (
    <nav aria-label="작성 중인 글" className="mb-6 flex items-center gap-4 rounded-[20px] bg-surface py-3 pr-3 pl-6">
      <p className="shrink-0 text-[14px] font-semibold text-text-2">
        작성 중 <span className="ml-0.5 text-primary tabular-nums">{props.drafts.length}</span>
      </p>
      <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
        {props.drafts.map((d) => {
          const active = d.ref === props.current;
          return (
            <li key={d.ref} className="shrink-0">
              <Link
                href={`/write?c=${d.collection}&edit=${encodeURIComponent(d.slug)}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors ${
                  active ? "bg-primary-weak text-primary" : "bg-fill text-text hover:bg-fill-strong"
                }`}
              >
                <span className={active ? "text-primary/70" : "text-text-3"}>{COLLECTIONS[d.collection].shortLabel}</span>
                {d.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
