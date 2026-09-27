"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { EntrySummary } from "@/lib/archive";
import { COLLECTION_LIST, COLLECTIONS, type CollectionId } from "@/lib/collections";
import { useAuthed } from "./auth";
import { Highlight } from "./highlight";
import { ChevronRight, Close, Search } from "./icons";
import { CollectionIcon } from "./collection-icon";

// 작성 중인 글(나만 보임)을 브라우저에서 한 번 불러와 헤더·목록이 나눠 쓴다.
// 공개 페이지는 CDN 캐시라서 서버가 그려 줄 수 없다.
let drafts: EntrySummary[] | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  pending ??= fetch("/api/drafts", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<{ drafts: EntrySummary[] }>) : { drafts: [] }))
    .then((d) => {
      drafts = d.drafts;
      listeners.forEach((l) => l());
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** 글을 저장·삭제한 뒤 호출: 헤더 숫자와 목록을 새로 */
export function refreshDrafts() {
  if (drafts !== null || pending) load();
}

/** 로그인했으면 작성 중인 글(오래된 순), 아니면 빈 목록. 아직 모르면 null */
export function useDrafts(): EntrySummary[] | null {
  const authed = useAuthed();
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => drafts,
    () => null,
  );
  useEffect(() => {
    if (authed && drafts === null) load();
  }, [authed]);
  if (authed === false) return [];
  return authed ? value : null;
}

// 작성 중인 글은 공개 상세가 없으니 이어 쓰는 화면으로
export const draftHref = (e: Pick<EntrySummary, "collection" | "slug">) =>
  `/write?c=${e.collection}&edit=${encodeURIComponent(e.slug)}`;

function todayInSeoul() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

/** 적어둔 지 얼마나 됐는지: 오늘 / 2일째 / 15일째 */
export function draftAge(date: string) {
  const days = Math.round((Date.parse(todayInSeoul()) - Date.parse(date)) / 86_400_000);
  if (!Number.isFinite(days)) return "";
  return days <= 0 ? "오늘" : `${days + 1}일째`;
}

/** 헤더: 로그인했고 작성 중인 글이 있을 때만 */
export function DraftsLink({ active }: { active?: boolean }) {
  const list = useDrafts();
  if (!list || list.length === 0) return null;
  return (
    <Link
      href="/drafts"
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${active ? "bg-fill-strong/70 text-text" : "hover:bg-fill-strong/60"}`}
    >
      {/* 휴대폰 헤더는 좁아서 연필 이모지로 */}
      <span className="tossface sm:hidden" aria-label="작성 중">
        ✏️
      </span>
      <span className="hidden sm:inline">작성 중</span>
      <span className="ml-1 font-semibold text-primary tabular-nums">{list.length}</span>
    </Link>
  );
}

/** 작성 중인 글 한 줄: 흐린 제목 + 적어둔 지 며칠째 + 늘 보이는 '이어 쓰기' */
export function DraftRow({ entry, words, showCollection }: { entry: EntrySummary; words: string[]; showCollection?: boolean }) {
  const c = COLLECTIONS[entry.collection];
  return (
    <li>
      <Link
        href={draftHref(entry)}
        className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-[background-color,transform] duration-150 hover:bg-fill active:scale-[0.99] sm:gap-4"
      >
        {showCollection && (
          <CollectionIcon id={c.id} className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fill text-[18px]" title={c.label} />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[16px] font-semibold tracking-[-0.02em] text-text-2 transition-colors group-hover:text-text ${
              entry.collection === "git" ? "font-mono text-[15px]" : ""
            }`}
          >
            <Highlight text={entry.title} words={words} />
          </p>
          <p className="mt-0.5 truncate text-[14px] text-text-3">
            {entry.description ? <Highlight text={entry.description} words={words} /> : "한 줄 요약은 아직이에요"}
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-medium text-text-3 tabular-nums" suppressHydrationWarning>
          {draftAge(entry.date)}
        </span>
        <span className="hidden shrink-0 items-center gap-0.5 text-[13px] font-semibold text-primary sm:inline-flex">
          이어 쓰기
          <ChevronRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
        <ChevronRight className="size-4 shrink-0 text-primary sm:hidden" />
      </Link>
    </li>
  );
}

function matches(entry: EntrySummary, words: string[]) {
  if (words.length === 0) return true;
  const hay = [entry.title, entry.description, ...entry.tags, ...Object.values(entry.extra)].join("\n").toLowerCase();
  return words.every((w) => hay.includes(w));
}

/** /drafts: 전 컬렉션의 작성 중인 글. 오래된 순, 컬렉션 칩·검색으로 좁혀 보기 */
export function DraftBoard(props: { drafts: EntrySummary[] }) {
  const [filter, setFilter] = useState<CollectionId | null>(null);
  const [query, setQuery] = useState("");
  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const visible = props.drafts.filter((e) => (!filter || e.collection === filter) && matches(e, words));

  if (props.drafts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[16px] font-semibold text-text-3">작성 중인 글이 없어요</p>
        <Link href="/write" className="mt-4 inline-block rounded-xl bg-fill px-4 py-2 text-[14px] font-semibold text-text-2 hover:bg-fill-strong">
          새 글 쓰기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-text-3" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="제목, 요약으로 검색"
          className="h-12 w-full rounded-2xl bg-fill pr-12 pl-11 text-[16px] outline-none transition-shadow placeholder:text-text-3 focus:bg-surface focus:ring-2 focus:ring-primary sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-fill-strong text-text-2 hover:bg-text-3 hover:text-white"
          >
            <Close className="size-3" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={filter === null} onClick={() => setFilter(null)} label="전체" count={props.drafts.length} />
        {COLLECTION_LIST.map((col) => {
          const count = props.drafts.filter((e) => e.collection === col.id).length;
          if (count === 0) return null;
          return (
            <Chip
              key={col.id}
              active={filter === col.id}
              onClick={() => setFilter(filter === col.id ? null : col.id)}
              label={
                <>
                  <CollectionIcon id={col.id} className="mr-1" />
                  {col.label}
                </>
              }
              count={count}
            />
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-14 text-center text-[15px] text-text-3">
          {words.length ? `‘${query.trim()}’에 맞는 글이 없어요` : "이 컬렉션엔 작성 중인 글이 없어요"}
        </p>
      ) : (
        <ul className="mt-5">
          {visible.map((e) => (
            <DraftRow key={e.ref} entry={e} words={words} showCollection />
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip(props: { active: boolean; onClick: () => void; label: React.ReactNode; count: number }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      className={`inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-semibold transition-colors ${
        props.active ? "bg-text text-white" : "bg-fill text-text-2 hover:bg-fill-strong"
      }`}
    >
      {props.label}
      <span className={`ml-1 tabular-nums ${props.active ? "text-white/60" : "text-text-3"}`}>{props.count}</span>
    </button>
  );
}
