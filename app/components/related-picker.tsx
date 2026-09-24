"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS, type CollectionId } from "@/lib/collections";
import { Close, Search } from "./icons";

// ref: "git/rebase"처럼 컬렉션을 포함한 식별자
export type RelatedCandidate = { ref: string; collection: CollectionId; title: string; description: string; tags: string[] };

/**
 * 연관 기록 고르기(컬렉션을 넘나든다). 검색어가 없으면 전체 목록(같은 컬렉션에서 태그가 겹치는 것을 맨 위에),
 * 있으면 검색 결과.
 */
export function RelatedPicker(props: {
  collection: CollectionId;
  candidates: RelatedCandidate[];
  selected: string[];
  onChange: (slugs: string[]) => void;
  contextTags: string[];
}) {
  const { candidates, selected, onChange, contextTags } = props;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const byRef = useMemo(() => new Map(candidates.map((c) => [c.ref, c])), [candidates]);

  // 드롭다운 그룹. 검색어가 없으면 같은 태그 추천 + 전체, 있으면 검색 결과
  const groups = useMemo(() => {
    const pool = candidates.filter((c) => !selected.includes(c.ref));
    const q = query.trim().toLowerCase();
    if (q) {
      const hits = pool
        .filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
        // 용어명에 걸린 것을 설명에만 걸린 것보다 위로
        .sort((a, b) => Number(!a.title.toLowerCase().includes(q)) - Number(!b.title.toLowerCase().includes(q)));
      return [{ heading: "검색 결과", items: hits }];
    }
    const suggested = pool
      .map((c) => ({
        c,
        score: c.collection === props.collection ? c.tags.filter((t) => contextTags.includes(t)).length : 0,
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.c);
    const rest = pool.filter((c) => !suggested.includes(c));
    return [
      { heading: `같은 ${COLLECTIONS[props.collection].tagLabel}`, items: suggested },
      { heading: suggested.length ? "그 밖의 기록" : "전체", items: rest },
    ].filter((g) => g.items.length > 0);
  }, [candidates, selected, query, contextTags, props.collection]);

  const options = groups.flatMap((g) => g.items);
  const listRef = useRef<HTMLDivElement>(null);

  // 키보드로 이동한 항목이 스크롤 밖에 있으면 보이게
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function add(ref: string) {
    onChange([...selected, ref]);
    setQuery("");
    setCursor(0);
    inputRef.current?.focus();
  }

  return (
    <div>
      {selected.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {selected.map((ref) => (
            <li
              key={ref}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-primary-weak pr-1.5 pl-3.5 text-[14px] font-semibold text-primary"
            >
              {byRef.get(ref)?.title ?? ref}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== ref))}
                aria-label={`${byRef.get(ref)?.title ?? ref} 연결 해제`}
                className="flex size-6 items-center justify-center rounded-full transition-colors hover:bg-primary/15"
              >
                <Close className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-3" />
        <input
          ref={inputRef}
          value={query}
          placeholder={candidates.length ? "연결할 기록 검색" : "아직 연결할 기록이 없어요"}
          disabled={candidates.length === 0}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)} // Esc로 닫은 뒤 다시 누를 때
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setCursor((c) => Math.min(c + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              if (options[cursor]) add(options[cursor].ref);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Backspace" && !query && selected.length) {
              onChange(selected.slice(0, -1));
            }
          }}
          className="h-11 w-full rounded-2xl bg-fill pr-4 pl-10 text-[14px] outline-none transition-shadow placeholder:text-text-3 focus:bg-surface focus:ring-2 focus:ring-primary disabled:opacity-60"
        />

        {open && (
          <div className="absolute top-full right-0 left-0 z-30 mt-2 animate-[fade-in_120ms_ease-out] rounded-2xl bg-surface p-1.5 shadow-[0_8px_30px_rgba(0,23,51,0.14)]">
            {options.length === 0 ? (
              <p className="px-2.5 py-3 text-[13px] text-text-3">
                {query.trim() ? `‘${query.trim()}’에 맞는 기록이 없어요` : "모든 기록을 이미 연결했어요"}
              </p>
            ) : (
              <div ref={listRef} className="max-h-[320px] overflow-y-auto">
                {groups.map((g) => (
                  <div key={g.heading}>
                    <p className="sticky top-0 bg-surface px-2.5 pt-2 pb-1 text-[12px] font-semibold text-text-3">
                      {g.heading}
                      <span className="ml-1 tabular-nums">{g.items.length}</span>
                    </p>
                    <ul>
                      {g.items.map((c) => {
                        const i = options.indexOf(c);
                        return (
                          <li key={c.ref}>
                            <button
                              type="button"
                              data-index={i}
                              onMouseDown={(e) => e.preventDefault()} // 입력창 blur보다 먼저 선택되도록
                              onMouseEnter={() => setCursor(i)}
                              onClick={() => add(c.ref)}
                              className={`block w-full rounded-xl px-2.5 py-2 text-left transition-colors ${
                                i === cursor ? "bg-fill" : ""
                              }`}
                            >
                              <span className="flex items-baseline gap-1.5">
                                <span className="truncate text-[14px] font-semibold">{c.title}</span>
                                {c.collection !== props.collection && (
                                  <span className="shrink-0 text-[11px] font-semibold text-text-3">
                                    {COLLECTIONS[c.collection].label}
                                  </span>
                                )}
                              </span>
                              <span className="block truncate text-[12px] text-text-3">{c.description}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
