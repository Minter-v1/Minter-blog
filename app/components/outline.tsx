"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "./icons";

type Item = { level: number; text: string; el: HTMLElement };

// 제목 요소의 레벨: <h2> 자신이거나, BlockNote처럼 <div> 안에 <h2>가 든 경우
function levelOf(el: HTMLElement) {
  const tag = /^H\d$/.test(el.tagName) ? el.tagName : (el.querySelector("h1, h2, h3, h4, h5, h6")?.tagName ?? "H1");
  return Number(tag[1]);
}

const ACTIVE_OFFSET = 120; // 화면 위에서 이만큼 지난 제목을 "지금 읽는 중"으로 본다

/** selector로 제목 요소를 모으고 현재 읽는 위치를 추적한다. version이 바뀌면 다시 수집(에디터 입력 반영용). */
function useHeadings(selector: string, version: number) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      const els = [...document.querySelectorAll<HTMLElement>(selector)];
      setItems(
        els
          .map((el) => ({ el, level: levelOf(el), text: el.textContent?.trim() ?? "" }))
          .filter((i) => i.text && i.level <= 3),
      );
    }, 150);
    return () => clearTimeout(t);
  }, [selector, version]);

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = 0;
        items.forEach((item, i) => {
          if (item.el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = i;
        });
        // 끝까지 내렸으면 마지막 제목
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items.length - 1;
        setActive(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [items]);

  return { items, active };
}

function scrollToHeading(item: Item) {
  const top = item.el.getBoundingClientRect().top + window.scrollY - ACTIVE_OFFSET + 24;
  window.scrollTo({ top, behavior: "smooth" });
}

function OutlineList(props: { items: Item[]; active: number; onPick?: () => void; className?: string }) {
  const minLevel = Math.min(...props.items.map((i) => i.level));
  return (
    <ul className={`border-l-2 border-fill-strong ${props.className ?? ""}`}>
      {props.items.map((item, i) => {
        const on = i === props.active;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => {
                scrollToHeading(item);
                props.onPick?.();
              }}
              aria-current={on ? "location" : undefined}
              className={`-ml-[2px] block w-full rounded-r-lg border-l-2 py-1.5 pr-2 text-left text-[13px] leading-[1.45] transition-colors ${
                on
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-text-3 hover:border-text-3 hover:bg-fill hover:text-text"
              }`}
              style={{ paddingLeft: 14 + (item.level - minLevel) * 12 }}
            >
              {item.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 읽기 화면용: 본문 옆 sticky 칼럼에 항상 펼쳐 둔다. */
export function Outline({ selector, version = 0 }: { selector: string; version?: number }) {
  const { items, active } = useHeadings(selector, version);
  if (items.length < 2) return null;
  return (
    <nav aria-label="목차">
      <p className="mb-3 text-[13px] font-semibold text-text-3">목차</p>
      <OutlineList items={items} active={active} className="max-h-[calc(100vh-160px)] overflow-y-auto" />
    </nav>
  );
}

/** 작성 화면용: 에디터 폭을 뺏지 않도록 버튼을 누르면 펼쳐지는 팝오버. */
export function OutlinePopover({ selector, version = 0 }: { selector: string; version?: number }) {
  const { items, active } = useHeadings(selector, version);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length < 2) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold transition-colors ${
          open ? "bg-fill-strong text-text" : "bg-fill text-text-2 hover:bg-fill-strong"
        }`}
      >
        목차
        <span className="text-text-3 tabular-nums">{items.length}</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <nav
          aria-label="목차"
          className="absolute top-full right-0 z-40 mt-2 w-64 animate-[fade-in_120ms_ease-out] rounded-2xl bg-surface p-3 shadow-[0_8px_30px_rgba(0,23,51,0.14)]"
        >
          <OutlineList items={items} active={active} className="max-h-[60vh] overflow-y-auto" />
        </nav>
      )}
    </div>
  );
}
