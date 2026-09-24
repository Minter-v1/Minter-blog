"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";
import { COLLECTIONS, entryHref, type CollectionId } from "@/lib/collections";
import { horizontalLoop } from "@/lib/gsap-loop";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type MarqueeItem = { collection: CollectionId; slug: string; title: string; description: string; date: string };

const MIN_PER_ROW = 8; // 화면을 채우고도 남도록 한 줄에 최소 이만큼 (부족하면 반복)
const MIN_TO_FLOW = 5; // 게시물이 이보다 적으면 흐르지 않고 한 줄로 가만히 (같은 카드 반복 방지)

function fill(items: MarqueeItem[]) {
  if (items.length === 0) return [];
  const out: MarqueeItem[] = [];
  while (out.length < MIN_PER_ROW) out.push(...items);
  return out;
}

function formatDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return m && d ? `${m}월 ${d}일` : iso;
}

/**
 * 최근 기록 카드가 두 줄로 흐른다(윗줄 ←, 아랫줄 →).
 * - 줄에 마우스를 올리면 거의 멈출 만큼 느려진다
 * - 스크롤을 빠르게 하면 그 속도만큼 잠깐 빨라졌다가 돌아온다
 * - 동작 줄이기 설정이면 흐르지 않고 가로 스크롤로 본다
 * - 게시물이 적으면(MIN_TO_FLOW 미만) 흐르지 않고 한 줄로 보여준다
 */
export function EntryMarquee({ items }: { items: MarqueeItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const flow = items.length >= MIN_TO_FLOW;
  const rows = flow ? [fill(items.filter((_, i) => i % 2 === 0)), fill(items.filter((_, i) => i % 2 === 1))] : [items];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!flow) {
          gsap.from("[data-card]", { y: 20, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 });
          return;
        }
        const loops = gsap.utils.toArray<HTMLElement>("[data-row]").map((row, i) => {
          const tl = horizontalLoop(gsap.utils.toArray<HTMLElement>("[data-card]", row), {
            speed: 0.45,
            reversed: i === 1,
            paddingRight: 16,
          });
          const dir = i === 1 ? -1 : 1;
          // 올리면 느려지고, 떼면 원래 속도로
          const slow = () => gsap.to(tl, { timeScale: 0.08 * dir, duration: 0.6, ease: "power2.out", overwrite: true });
          const resume = () => gsap.to(tl, { timeScale: dir, duration: 0.8, ease: "power2.inOut", overwrite: true });
          row.addEventListener("pointerenter", slow);
          row.addEventListener("pointerleave", resume);
          return { tl, dir, row, slow, resume };
        });

        // 스크롤 속도만큼 가속 → 부드럽게 원래 속도로
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 400);
            for (const { tl, dir, row } of loops) {
              if (row.matches(":hover")) continue;
              gsap.fromTo(tl, { timeScale: boost * dir }, { timeScale: dir, duration: 1, ease: "power2.out", overwrite: true });
            }
          },
        });

        // 등장: 두 줄이 양옆에서 미끄러져 들어온다
        gsap.from("[data-row]", { x: (i: number) => (i === 0 ? 80 : -80), autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1 });

        return () => {
          st.kill();
          for (const { row, slow, resume } of loops) {
            row.removeEventListener("pointerenter", slow);
            row.removeEventListener("pointerleave", resume);
          }
        };
      });
    },
    { scope: root, dependencies: [flow] },
  );

  if (items.length === 0) return null;

  return (
    <div
      ref={root}
      className="relative -mx-6 space-y-4 overflow-hidden py-2 motion-reduce:overflow-x-auto"
      // 흐를 때만 양끝을 배경색으로 흐리게
      style={
        flow
          ? {
              maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }
          : undefined
      }
    >
      {rows.map((row, r) => (
        <div key={r} data-row className="flex gap-4 px-6">
          {row.map((e, i) => {
            const c = COLLECTIONS[e.collection];
            return (
              <Link
                key={`${e.collection}/${e.slug}/${i}`}
                data-card
                href={entryHref(e.collection, e.slug)}
                className="group flex w-[296px] shrink-0 flex-col rounded-[24px] bg-surface p-5 transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,23,51,0.1)]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="tossface flex size-10 items-center justify-center rounded-[14px] bg-fill text-[22px]">
                    {c.emoji}
                  </span>
                  <span className="text-[13px] font-semibold text-text-3">{c.label}</span>
                  <span className="ml-auto text-[12px] text-text-3 tabular-nums">{formatDate(e.date)}</span>
                </div>
                <p
                  className={`mt-4 truncate font-bold tracking-[-0.02em] transition-colors group-hover:text-primary ${
                    e.collection === "git" ? "font-mono text-[16px]" : "text-[17px]"
                  }`}
                >
                  {e.title}
                </p>
                <p className="mt-1 line-clamp-2 min-h-[42px] text-[14px] leading-[1.5] text-text-3">{e.description}</p>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
