"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Term } from "@/lib/dictionary";
import type { Tag } from "@/lib/tags";
import { ChevronRight } from "./icons";

type ListItem = Pick<Term, "slug" | "title" | "description" | "tags" | "date">;

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso || "날짜 없음";
  const day = "일월화수목금토"[new Date(y, m - 1, d).getDay()];
  const thisYear = new Date().getFullYear();
  return `${y === thisYear ? "" : `${y}년 `}${m}월 ${d}일 ${day}요일`;
}

export function TermList(props: { terms: ListItem[]; tags: Tag[]; initialTag: string | null }) {
  const { terms, tags } = props;
  const [filter, setFilter] = useState<string | null>(props.initialTag);

  // tags.json 순서를 따르되, 파일에 없는 태그가 md에 쓰여 있으면 뒤에 붙인다
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>(tags.map((t) => [t.name, 0]));
    for (const term of terms) for (const t of term.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].filter(([, n]) => n > 0);
  }, [terms, tags]);

  // 정리는 주 1회 몰아서 하니까 등록일별로 묶어 보여준다
  const groups = useMemo(() => {
    const visible = filter ? terms.filter((t) => t.tags.includes(filter)) : terms;
    const map = new Map<string, ListItem[]>();
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map];
  }, [terms, filter]);

  function select(tag: string | null) {
    setFilter(tag);
    // 새로고침·공유해도 필터가 유지되도록 주소만 바꾼다 (서버 재요청 없음)
    window.history.replaceState(null, "", tag ? `/?tag=${encodeURIComponent(tag)}` : "/");
  }

  if (terms.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[17px] font-semibold">아직 등록된 용어가 없어요</p>
        <p className="mt-1 text-[14px] text-text-3">이번 주 메모부터 옮겨 볼까요?</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === null} onClick={() => select(null)} label="전체" count={terms.length} />
        {tagCounts.map(([name, count]) => (
          <Chip
            key={name}
            active={filter === name}
            onClick={() => select(filter === name ? null : name)}
            label={name}
            count={count}
          />
        ))}
      </div>

      <div className="mt-6 space-y-7">
        {groups.map(([date, items]) => (
          <section key={date}>
            <h3 className="mb-1 px-3 text-[13px] font-semibold text-text-3">
              {formatDate(date)}
              <span className="ml-1.5 tabular-nums">{items.length}</span>
            </h3>
            <ul>
              {items.map((term) => (
                <li key={term.slug}>
                  <Link
                    href={`/terms/${encodeURIComponent(term.slug)}`}
                    className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-[background-color,transform] duration-150 hover:bg-fill active:scale-[0.99] active:bg-fill-strong"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                        {term.title}
                      </p>
                      <p className="mt-0.5 truncate text-[14px] text-text-3">{term.description}</p>
                    </div>
                    <span className="flex shrink-0 gap-1">
                      {term.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-fill px-1.5 py-0.5 text-[12px] font-medium text-text-2 transition-colors group-hover:bg-surface"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                    <ChevronRight className="-ml-2 size-4 shrink-0 -translate-x-1 text-text-3 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Chip(props: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      className={`h-9 rounded-full px-3.5 text-[14px] font-semibold transition-colors ${
        props.active ? "bg-text text-white" : "bg-fill text-text-2 hover:bg-fill-strong"
      }`}
    >
      {props.label}
      <span className={`ml-1 tabular-nums ${props.active ? "text-white/60" : "text-text-3"}`}>{props.count}</span>
    </button>
  );
}
