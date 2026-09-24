"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Activity as ActivityData } from "@/lib/activity";
import { COLLECTION_LIST, COLLECTIONS, type CollectionId } from "@/lib/collections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BAR_HEIGHT = 152;

export function Activity(props: { data: ActivityData; goals: Record<CollectionId, number> }) {
  const { weeks, thisWeek, streak } = props.data;
  const root = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const total = Object.values(thisWeek).reduce((a, b) => a + b, 0);
  const goal = Object.values(props.goals).reduce((a, b) => a + b, 0);
  const ratio = Math.min(1, total / Math.max(1, goal));
  const maxTotal = Math.max(4, ...weeks.map((w) => w.total));
  const current = weeks.length - 1;

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 80%", once: true } });
        const num = root.current!.querySelector<HTMLElement>("[data-total]")!;
        const obj = { v: 0 };
        tl.to(obj, { v: total, duration: 0.9, ease: "power2.out", onUpdate: () => (num.textContent = String(Math.round(obj.v))) })
          .from("[data-progress]", { scaleX: 0, duration: 1, ease: "power3.out" }, 0)
          .from("[data-bar]", { scaleY: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.02 }, 0.1)
          .from("[data-streak]", { autoAlpha: 0, y: 8, duration: 0.4 }, 0.5);
      });
    },
    { scope: root },
  );

  const hovered = hover != null ? weeks[hover] : null;

  return (
    <section ref={root} className="grid grid-cols-[280px_minmax(0,1fr)] gap-12 rounded-[28px] bg-surface p-8">
      <div>
        <p className="text-[15px] font-semibold text-text-3">이번 주 기록</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span data-total className="text-[44px] leading-none font-bold tracking-[-0.04em] tabular-nums">
            {total}
          </span>
          <span className="text-[20px] font-bold">개</span>
          <span className="ml-2 text-[14px] font-medium text-text-3">목표 {goal}개</span>
        </p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-fill">
          <div data-progress className="h-full origin-left rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
        </div>

        <ul className="mt-6 space-y-2.5">
          {COLLECTION_LIST.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5 text-[14px]">
              <span className="tossface text-[18px]">{c.emoji}</span>
              <span className="flex-1 font-medium text-text-2">{c.label}</span>
              <span className="font-semibold tabular-nums">
                {thisWeek[c.id]}
                <span className="font-medium text-text-3"> / {props.goals[c.id]}</span>
              </span>
            </li>
          ))}
        </ul>

        {streak > 0 && (
          <p data-streak className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[13px] font-semibold text-text-2">
            <span className="tossface text-[15px]">🔥</span>
            {streak}주 연속
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-text-3">최근 26주</p>
        <div className="relative mt-8" onPointerLeave={() => setHover(null)}>
          <div className="flex items-end gap-[6px]" style={{ height: BAR_HEIGHT }}>
            {weeks.map((w, i) => {
              const h = w.total === 0 ? 6 : Math.max(12, (w.total / maxTotal) * BAR_HEIGHT);
              const color =
                w.total === 0 ? "bg-fill-strong" : i === current || hover === i ? "bg-primary" : "bg-[#90c2ff]";
              return (
                <button
                  key={w.start}
                  type="button"
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  aria-label={`${w.label} ${w.total}개`}
                  className="flex h-full flex-1 items-end outline-none"
                >
                  <span
                    data-bar
                    className={`block w-full origin-bottom rounded-[6px] transition-colors duration-150 ${color}`}
                    style={{ height: h }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-[6px]">
            {weeks.map((w, i) => (
              <span
                key={w.start}
                className={`flex-1 overflow-visible text-[11px] whitespace-nowrap ${i === current ? "font-semibold text-primary" : "text-text-3"}`}
              >
                {i === current ? "이번 주" : w.monthLabel}
              </span>
            ))}
          </div>

          {hovered && (
            <div
              className="absolute bottom-full z-10 w-[240px] animate-[fade-in_120ms_ease-out] pb-2"
              style={{ left: `clamp(0px, calc(${((hover! + 0.5) / weeks.length) * 100}% - 120px), calc(100% - 240px))` }}
            >
              <div className="rounded-2xl bg-text px-4 py-3 text-white shadow-[0_8px_24px_rgba(0,23,51,0.2)]">
                <p className="text-[12px] font-semibold text-white/60">
                  {hovered.label} · <span className="text-white">{hovered.total}개</span>
                </p>
                {hovered.items.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {hovered.items.slice(0, 5).map((it, k) => (
                      <li key={`${it.href}-${k}`}>
                        <Link href={it.href} className="flex items-center gap-2 py-0.5 text-[13px] font-medium hover:underline">
                          <span className="tossface text-[13px]">{COLLECTIONS[it.collection].emoji}</span>
                          <span className={`truncate ${it.collection === "git" ? "font-mono text-[12px]" : ""}`}>{it.title}</span>
                        </Link>
                      </li>
                    ))}
                    {hovered.items.length > 5 && <li className="text-[12px] text-white/60">외 {hovered.items.length - 5}개</li>}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
