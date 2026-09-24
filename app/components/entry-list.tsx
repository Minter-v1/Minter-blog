"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { EntrySummary } from "@/lib/archive";
import { COLLECTIONS, entryHref, type CollectionId } from "@/lib/collections";
import type { Tag } from "@/lib/tags";
import { Check, ChevronRight, Close, Search } from "./icons";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso || "날짜 없음";
  const day = "일월화수목금토"[new Date(y, m - 1, d).getDay()];
  const thisYear = new Date().getFullYear();
  return `${y === thisYear ? "" : `${y}년 `}${m}월 ${d}일 ${day}요일`;
}

// 검색어를 공백으로 나눠, 모든 단어가 제목·설명·태그·추가 필드(사용법, 에러 메시지) 어딘가에 있으면 통과
function matches(entry: EntrySummary, words: string[]) {
  if (words.length === 0) return true;
  const hay = [entry.title, entry.description, ...entry.tags, ...Object.values(entry.extra)].join("\n").toLowerCase();
  return words.every((w) => hay.includes(w));
}

function Highlight({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-[3px] bg-[#fff3c4] text-inherit">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function EntryList(props: {
  collection: CollectionId;
  entries: EntrySummary[];
  tags: Tag[];
  initialTag: string | null;
  initialQuery: string;
}) {
  const { entries, tags } = props;
  const c = COLLECTIONS[props.collection];
  const [filter, setFilter] = useState<string | null>(props.initialTag);
  const [query, setQuery] = useState(props.initialQuery);
  const searchRef = useRef<HTMLInputElement>(null);

  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

  // "/" 키로 검색창 포커스 (입력 중일 때는 제외)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 새로고침·공유해도 필터와 검색어가 유지되도록 주소만 바꾼다 (서버 재요청 없음)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter) params.set("tag", filter);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/${c.id}?${qs}` : `/${c.id}`);
  }, [filter, query, c.id]);

  // tags.json 순서를 따르되, 파일에 없는 태그가 md에 쓰여 있으면 뒤에 붙인다
  const tagOrder = useMemo(() => {
    const names = tags.map((t) => t.name);
    for (const e of entries) for (const t of e.tags) if (!names.includes(t)) names.push(t);
    return names;
  }, [entries, tags]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>(tagOrder.map((t) => [t, 0]));
    for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].filter(([, n]) => n > 0);
  }, [entries, tagOrder]);

  const visible = useMemo(
    () => entries.filter((e) => (!filter || e.tags.includes(filter)) && matches(e, words)),
    [entries, filter, words],
  );

  // 날짜별(주 1회 몰아서 정리) 또는 분류별(치트시트)로 묶는다
  const groups = useMemo(() => {
    const map = new Map<string, EntrySummary[]>();
    if (c.listStyle === "cheatsheet") {
      for (const t of [...tagOrder, "기타"]) map.set(t, []);
      for (const e of visible) {
        const key = e.tags.find((t) => !filter || t === filter) ?? "기타";
        map.get(key)!.push(e);
      }
      for (const [k, v] of map) {
        if (v.length === 0) map.delete(k);
        else v.sort((a, b) => a.title.localeCompare(b.title));
      }
    } else {
      for (const e of visible) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    }
    return [...map];
  }, [visible, c.listStyle, tagOrder, filter]);

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[16px] font-semibold text-text-3">등록된 {c.itemLabel}이(가) 없어요</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-text-3" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder={
            c.listStyle === "cheatsheet" ? "명령어, 옵션, 설명으로 검색" : `${c.itemLabel} 검색 — 제목, 설명, ${c.tagLabel}`
          }
          className="h-12 w-full rounded-2xl bg-fill pr-20 pl-11 text-[15px] outline-none transition-shadow placeholder:text-text-3 focus:bg-surface focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
            aria-label="검색어 지우기"
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-fill-strong text-text-2 hover:bg-text-3 hover:text-white"
          >
            <Close className="size-3" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rounded-md bg-surface px-2 py-0.5 text-[12px] font-semibold text-text-3">
            /
          </kbd>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={filter === null} onClick={() => setFilter(null)} label="전체" count={entries.length} />
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

      {visible.length === 0 ? (
        <p className="py-14 text-center text-[15px] text-text-3">
          {words.length ? `‘${query.trim()}’에 맞는 ${c.itemLabel}이(가) 없어요` : `이 ${c.tagLabel}에는 아직 없어요`}
        </p>
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map(([group, items]) => (
            <section key={group}>
              <h3 className="mb-1 px-3 text-[13px] font-semibold text-text-3">
                {c.listStyle === "cheatsheet" ? group : formatDate(group)}
                <span className="ml-1.5 tabular-nums">{items.length}</span>
              </h3>
              <ul>
                {items.map((e) =>
                  c.listStyle === "cheatsheet" ? (
                    <CheatRow key={e.slug} entry={e} words={words} />
                  ) : (
                    <DateRow key={e.slug} entry={e} words={words} />
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRow({ entry, words }: { entry: EntrySummary; words: string[] }) {
  return (
    <li>
      <Link
        href={entryHref(entry.collection, entry.slug)}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-[background-color,transform] duration-150 hover:bg-fill active:scale-[0.99] active:bg-fill-strong"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
            <Highlight text={entry.title} words={words} />
          </p>
          <p className="mt-0.5 truncate text-[14px] text-text-3">
            <Highlight text={entry.description} words={words} />
          </p>
        </div>
        <span className="flex shrink-0 gap-1">
          {entry.tags.map((t) => (
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
  );
}

// Git 치트시트 한 줄: 명령어 · 설명 · 사용법(복사 버튼)
function CheatRow({ entry, words }: { entry: EntrySummary; words: string[] }) {
  const usage = entry.extra.usage || entry.title;
  const [copied, setCopied] = useState(false);

  return (
    <li className="group relative rounded-2xl px-3 py-3 transition-colors hover:bg-fill">
      {/* 줄 전체를 누르면 상세로. 복사 버튼은 그 위에 따로 */}
      <Link href={entryHref(entry.collection, entry.slug)} className="absolute inset-0 rounded-2xl" aria-label={entry.title} />
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-[15px] font-semibold transition-colors group-hover:text-primary">
          <Highlight text={entry.title} words={words} />
        </span>
        <span className="min-w-0 truncate text-[14px] text-text-3">
          <Highlight text={entry.description} words={words} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 truncate rounded-lg bg-[#f7f8fa] px-3 py-1.5 font-mono text-[13px] text-text-2 transition-colors group-hover:bg-surface">
          <Highlight text={usage} words={words} />
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(usage);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          aria-label={`${usage} 복사`}
          className={`relative z-10 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12px] font-semibold transition-colors ${
            copied ? "bg-primary-weak text-primary" : "bg-fill text-text-2 hover:bg-fill-strong group-hover:bg-surface"
          }`}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              복사됨
            </>
          ) : (
            "복사"
          )}
        </button>
      </div>
    </li>
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
