"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "./icons";

// BlockNote 코드 블록의 기본 <select>(언어 50개가 한 줄로)를 숨기고, 그 자리에 검색되는 언어 선택기를 띄운다.
// 고르면 원래 <select>에 값을 넣고 change 이벤트를 보내서 BlockNote가 블록을 갱신하게 한다.

const POPULAR = ["shellscript", "typescript", "javascript", "json", "yaml", "python", "java", "kotlin", "sql", "mermaid", "text"];
const ALIASES: Record<string, string[]> = {
  shellscript: ["bash", "sh", "shell", "zsh"],
  typescript: ["ts"],
  javascript: ["js"],
  python: ["py"],
  yaml: ["yml"],
  markdown: ["md"],
  csharp: ["c#", "cs"],
  cpp: ["c++"],
  text: ["plain"],
};

type Lang = { id: string; name: string };

// 원래 <select>에 값을 넣고 change를 보내면 BlockNote가 블록 언어를 바꾼다
function applyLanguage(select: HTMLSelectElement, id: string) {
  select.value = id;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * 에디터 안의 코드 블록 <select> 자리에 선택기를 겹쳐 띄운다.
 * 에디터 DOM 안에는 아무것도 넣지 않는다 — ProseMirror가 바뀐 DOM을 보고 블록을 다시 그리면서 무한 반복에 빠진다.
 * 그래서 에디터 바깥(root 기준 absolute)에 두고, 에디터가 바뀔 때마다 위치만 다시 잰다.
 */
export function CodeLangPickers({ root }: { root: HTMLElement | null }) {
  const [slots, setSlots] = useState<{ select: HTMLSelectElement; top: number; left: number }[]>([]);

  useEffect(() => {
    const editor = root?.querySelector<HTMLElement>(".bn-container");
    if (!root || !editor) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const base = root.getBoundingClientRect();
        const next = [...editor.querySelectorAll<HTMLSelectElement>('[data-content-type="codeBlock"] select')].map((select) => {
          const r = select.getBoundingClientRect();
          return { select, top: Math.round(r.top - base.top), left: Math.round(r.left - base.left) };
        });
        setSlots((prev) =>
          prev.length === next.length &&
          prev.every((p, i) => p.select === next[i].select && p.top === next[i].top && p.left === next[i].left)
            ? prev
            : next,
        );
      });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(editor, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(measure);
    ro.observe(editor);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      ro.disconnect();
    };
  }, [root]);

  return (
    <>
      {slots.map(({ select, top, left }, i) => (
        <div key={i} className="absolute z-10" style={{ top, left }}>
          <Picker key={select.value + i} select={select} />
        </div>
      ))}
    </>
  );
}

function Picker({ select }: { select: HTMLSelectElement }) {
  const langs = useMemo<Lang[]>(() => [...select.options].map((o) => ({ id: o.value, name: o.text })), [select]);
  const [value, setValue] = useState(select.value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 되돌리기 등으로 BlockNote가 값을 바꿔도 따라가도록
  useEffect(() => {
    const sync = () => setValue(select.value);
    select.addEventListener("change", sync);
    return () => select.removeEventListener("change", sync);
  }, [select]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const popular = POPULAR.map((id) => langs.find((l) => l.id === id)).filter((l): l is Lang => !!l);
      return [
        { heading: "자주 쓰는", items: popular },
        { heading: "전체", items: langs.filter((l) => !POPULAR.includes(l.id)).sort((a, b) => a.name.localeCompare(b.name)) },
      ];
    }
    const hits = langs
      .map((l) => {
        const keys = [l.name.toLowerCase(), l.id, ...(ALIASES[l.id] ?? [])];
        const rank = keys.some((k) => k === q) ? 0 : keys.some((k) => k.startsWith(q)) ? 1 : keys.some((k) => k.includes(q)) ? 2 : -1;
        return { l, rank };
      })
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.l.name.localeCompare(b.l.name))
      .map((x) => x.l);
    return [{ heading: "검색 결과", items: hits }];
  }, [langs, query]);
  const options = results.flatMap((g) => g.items);

  function show() {
    const r = buttonRef.current!.getBoundingClientRect();
    // 화면 아래가 모자라면 위로
    const top = window.innerHeight - r.bottom < 340 ? Math.max(8, r.top - 336) : r.bottom + 6;
    setPos({ top, left: Math.min(r.left, window.innerWidth - 248) });
    setQuery("");
    setCursor(0);
    setOpen(true);
  }

  function choose(id: string) {
    applyLanguage(select, id);
    setValue(id);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const current = langs.find((l) => l.id === value);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.preventDefault()} // 에디터 커서를 뺏지 않도록
        onClick={() => (open ? setOpen(false) : show())}
        className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-text-3 transition-colors hover:bg-fill-strong/70 hover:text-text-2"
      >
        {current?.name ?? value}
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
            <div
              className="fixed z-50 w-60 animate-[fade-in_120ms_ease-out] rounded-2xl bg-surface p-2 shadow-[0_8px_30px_rgba(0,23,51,0.16)]"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-3" />
                <input
                  autoFocus
                  value={query}
                  placeholder="언어 검색 (bash, ts …)"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCursor(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setCursor((c) => Math.min(c + 1, options.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setCursor((c) => Math.max(c - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (options[cursor]) choose(options[cursor].id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setOpen(false);
                    }
                  }}
                  className="h-9 w-full rounded-xl bg-fill pr-3 pl-8 text-[16px] outline-none placeholder:text-text-3 focus:ring-2 focus:ring-primary sm:text-[13px]"
                />
              </div>
              <div ref={listRef} className="mt-1.5 max-h-64 overflow-y-auto">
                {options.length === 0 && <p className="px-2.5 py-3 text-[13px] text-text-3">맞는 언어가 없어요</p>}
                {results.map(
                  (g) =>
                    g.items.length > 0 && (
                      <div key={g.heading}>
                        <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold text-text-3">{g.heading}</p>
                        {g.items.map((l) => {
                          const i = options.indexOf(l);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              data-index={i}
                              onMouseEnter={() => setCursor(i)}
                              onClick={() => choose(l.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                                i === cursor ? "bg-fill" : ""
                              } ${l.id === value ? "font-semibold text-primary" : "text-text"}`}
                            >
                              {l.name}
                              {l.id === value && <Check className="size-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    ),
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
