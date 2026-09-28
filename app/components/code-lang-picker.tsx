"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "./icons";
import { Mermaid } from "./mermaid";

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

type Slot = {
  select: HTMLSelectElement;
  top: number; // 선택기 자리 (root 기준)
  left: number;
  blockId: string;
  bottom: number; // 코드 블록 아래끝 (root 기준) — Mermaid 미리보기 자리
  blockLeft: number;
  width: number;
  mermaid: string | null; // 언어가 Mermaid면 코드 원문
};

/**
 * 에디터 안 코드 블록마다: 언어 선택기를 <select> 자리에 겹쳐 띄우고, Mermaid 블록이면 아래에 그림 미리보기를 붙인다.
 * 에디터 DOM 안에는 아무것도 넣지 않는다 — ProseMirror가 바뀐 DOM을 보고 블록을 다시 그리면서 무한 반복에 빠진다.
 * 그래서 에디터 바깥(root 기준 absolute)에 두고, 에디터가 바뀔 때마다 위치만 다시 잰다.
 * 미리보기가 들어갈 공간은 에디터 바깥 <style>로 그 블록에 margin-bottom을 줘서 확보한다.
 */
export function CodeBlockOverlays({ root }: { root: HTMLElement | null }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [heights, setHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    const editor = root?.querySelector<HTMLElement>(".bn-container");
    if (!root || !editor) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const base = root.getBoundingClientRect();
        const next = [...editor.querySelectorAll<HTMLSelectElement>('[data-content-type="codeBlock"] select')].map(
          (select): Slot => {
            const r = select.getBoundingClientRect();
            const block = select.closest<HTMLElement>('[data-content-type="codeBlock"]')!;
            const b = block.getBoundingClientRect();
            return {
              select,
              top: Math.round(r.top - base.top),
              left: Math.round(r.left - base.left),
              blockId: select.closest<HTMLElement>("[data-id]")?.dataset.id ?? "",
              bottom: Math.round(b.bottom - base.top),
              blockLeft: Math.round(b.left - base.left),
              width: Math.round(b.width),
              mermaid: select.value === "mermaid" ? (block.querySelector("code")?.textContent ?? "") : null,
            };
          },
        );
        setSlots((prev) =>
          prev.length === next.length &&
          prev.every((p, i) => (Object.keys(p) as (keyof Slot)[]).every((k) => p[k] === next[i][k]))
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

  const previewIds = slots.filter((s) => s.mermaid !== null && s.blockId).map((s) => s.blockId);
  const css = previewIds
    .map((id) => `[data-id="${CSS.escape(id)}"] > .bn-block > [data-content-type="codeBlock"]{margin-bottom:${(heights[id] ?? 160) + 20}px}`)
    .join("\n");

  return (
    <>
      {css && <style>{css}</style>}
      {slots.map((slot, i) => (
        <Fragment key={i}>
          <div className="absolute z-10" style={{ top: slot.top, left: slot.left }}>
            <Picker key={slot.select.value + i} select={slot.select} />
          </div>
          {slot.mermaid !== null && slot.blockId && (
            <MermaidPreview
              code={slot.mermaid}
              style={{ top: slot.bottom + 8, left: slot.blockLeft, width: slot.width }}
              onHeight={(h) => setHeights((prev) => (prev[slot.blockId] === h ? prev : { ...prev, [slot.blockId]: h }))}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}

// 작성 중 Mermaid 미리보기: 입력이 잠깐 멈추면(0.4초) 다시 그린다
function MermaidPreview(props: { code: string; style: React.CSSProperties; onHeight: (h: number) => void }) {
  const { onHeight } = props;
  const [code, setCode] = useState(props.code);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setCode(props.code), 400);
    return () => clearTimeout(t);
  }, [props.code]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onHeight(Math.ceil(el.getBoundingClientRect().height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight]);

  return (
    <div ref={ref} className="editor-mermaid article absolute" style={props.style} contentEditable={false}>
      <p className="editor-mermaid-label">미리보기</p>
      {code.trim() ? <Mermaid code={code} /> : <p className="editor-mermaid-empty">코드를 입력하면 여기에 그려져요</p>}
    </div>
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
  const popRef = useRef<HTMLDivElement>(null);

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

  function place() {
    const r = buttonRef.current!.getBoundingClientRect();
    // 화면 아래가 모자라면 위로
    const top = window.innerHeight - r.bottom < 340 ? Math.max(8, r.top - 336) : r.bottom + 6;
    return { top, left: Math.min(r.left, window.innerWidth - 248) };
  }

  function show() {
    setPos(place());
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
    const follow = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return; // 언어 목록 안 스크롤
      setPos(place());
    };
    const close = () => setOpen(false);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", follow, true);
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
              ref={popRef}
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
