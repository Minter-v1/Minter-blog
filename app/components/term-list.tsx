"use client";

import { useMemo, useState } from "react";
import type { Term } from "@/lib/dictionary";
import type { Tag } from "@/lib/tags";
import { ArrowUpRight, ChevronDown } from "./icons";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso || "날짜 없음";
  const day = "일월화수목금토"[new Date(y, m - 1, d).getDay()];
  const thisYear = new Date().getFullYear();
  return `${y === thisYear ? "" : `${y}년 `}${m}월 ${d}일 ${day}요일`;
}

export function TermList({ terms, tags }: { terms: Term[]; tags: Tag[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  // tags.json 순서를 따르되, 파일에 없는 태그가 md에 쓰여 있으면 뒤에 붙인다
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>(tags.map((t) => [t.name, 0]));
    for (const term of terms) for (const t of term.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].filter(([, n]) => n > 0);
  }, [terms, tags]);

  // 정리는 주 1회 몰아서 하니까 등록일별로 묶어 보여준다
  const groups = useMemo(() => {
    const visible = filter ? terms.filter((t) => t.tags.includes(filter)) : terms;
    const map = new Map<string, Term[]>();
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map];
  }, [terms, filter]);

  function toggle(slug: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
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
      <div className="-mx-1 flex flex-wrap gap-2 px-1">
        <Chip active={filter === null} onClick={() => setFilter(null)} label="전체" count={terms.length} />
        {tagCounts.map(([name, count]) => (
          <Chip
            key={name}
            active={filter === name}
            onClick={() => setFilter(filter === name ? null : name)}
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
              {items.map((term) => {
                const isOpen = open.has(term.slug);
                return (
                  <li key={term.slug} className={`rounded-2xl transition-colors ${isOpen ? "bg-fill" : ""}`}>
                    <button
                      type="button"
                      onClick={() => toggle(term.slug)}
                      aria-expanded={isOpen}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition-colors ${
                        isOpen ? "" : "hover:bg-fill"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.02em]">
                        {term.title}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        {term.tags.map((t) => (
                          <span key={t} className="rounded-md bg-fill-strong/70 px-1.5 py-0.5 text-[12px] font-medium text-text-2">
                            {t}
                          </span>
                        ))}
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-text-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="animate-[fade-in_150ms_ease-out] px-3 pb-4">
                        <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-text-2">{term.description}</p>
                        {term.images.length > 0 && (
                          <div className="mt-3 grid gap-2">
                            {term.images.map((src, i) => (
                              // eslint-disable-next-line @next/next/no-img-element -- raw.githubusercontent 원본 그대로 표시
                              <img
                                key={src}
                                src={src}
                                alt={`${term.title} ${i + 1}`}
                                loading="lazy"
                                className="max-h-[440px] w-auto max-w-full rounded-xl bg-surface"
                              />
                            ))}
                          </div>
                        )}
                        <a
                          href={term.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-medium text-text-3 hover:text-primary"
                        >
                          GitHub에서 보기
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </div>
                    )}
                  </li>
                );
              })}
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
