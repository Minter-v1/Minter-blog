"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";
import { COLLECTIONS, entryHref, type CollectionId } from "@/lib/collections";
import { horizontalLoop } from "@/lib/gsap-loop";
import { CollectionIcon } from "../collection-icon";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type MarqueeItem = { collection: CollectionId; slug: string; title: string; description: string; date: string };

const MIN_PER_ROW = 8; // 화면을 채우고도 남도록 한 줄에 최소 이만큼 (부족하면 반복)
const MIN_TO_FLOW = 5; // 게시물이 이보다 적으면 흐르지 않고 한 줄로 가만히 (같은 카드 반복 방지)
const SPEED = 0.45; // horizontalLoop 속도 (1 = 초당 100px)
const PPS = SPEED * 100; // 타임라인 1초 = 이동 px

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
 * - 줄을 잡아 좌우로 밀 수 있다(#126): 잡으면 멈추고 손을 따라가다, 놓으면 미는 속도만큼 미끄러진 뒤 원래 흐름으로
 *   끌었을 땐 카드 클릭을 막고, 터치는 세로 스크롤을 그대로 둔다
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
            speed: SPEED,
            reversed: i === 1,
            paddingRight: 16,
          });
          const dir = i === 1 ? -1 : 1;
          // 올리면 느려지고, 떼면 원래 속도로
          const slow = () => gsap.to(tl, { timeScale: 0.08 * dir, duration: 0.6, ease: "power2.out", overwrite: true });
          const resume = () => gsap.to(tl, { timeScale: dir, duration: 0.8, ease: "power2.inOut", overwrite: true });
          row.addEventListener("pointerenter", slow);
          row.addEventListener("pointerleave", resume);

          // 잡아 끌기: 끈 거리(px)만큼 타임라인 시간을 옮긴다 (오른쪽으로 끌면 시간이 줄어 카드가 오른쪽으로)
          const wrapTime = gsap.utils.wrap(0, tl.duration());
          const state = { busy: false };
          let drag: { x: number; y: number; t: number; lastX: number; lastAt: number; v: number; axis: "x" | "y" | null } | null = null;
          let dragged = false;
          let glide: gsap.core.Tween | null = null;
          const down = (e: PointerEvent) => {
            if (e.button !== 0) return;
            glide?.kill();
            dragged = false;
            drag = { x: e.clientX, y: e.clientY, t: tl.time(), lastX: e.clientX, lastAt: performance.now(), v: 0, axis: e.pointerType === "mouse" ? "x" : null };
          };
          const move = (e: PointerEvent) => {
            if (!drag) return;
            const dx = e.clientX - drag.x;
            const dy = e.clientY - drag.y;
            if (!drag.axis) {
              // 터치: 먼저 크게 움직인 방향으로 정한다. 세로면 스크롤에 맡긴다
              if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
              drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
              if (drag.axis === "y") return void (drag = null);
            }
            if (!dragged) {
              if (Math.abs(dx) < 5) return;
              dragged = true;
              state.busy = true;
              tl.paused(true);
              row.setPointerCapture(e.pointerId);
              row.classList.add("is-dragging");
            }
            const now = performance.now();
            drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastAt);
            drag.lastX = e.clientX;
            drag.lastAt = now;
            tl.time(wrapTime(drag.t - dx / PPS));
          };
          const up = () => {
            if (!drag) return;
            const v = drag.v; // px/ms
            drag = null;
            row.classList.remove("is-dragging");
            if (!dragged) return;
            const proxy = { t: tl.time() };
            glide = gsap.to(proxy, {
              t: proxy.t - (gsap.utils.clamp(-3, 3, v) * 320) / PPS,
              duration: 0.9,
              ease: "power3.out",
              onUpdate: () => void tl.time(wrapTime(proxy.t)),
              onComplete: () => {
                state.busy = false;
                tl.paused(false);
                (row.matches(":hover") ? slow : resume)();
              },
            });
          };
          // 끌고 난 뒤의 클릭은 카드로 이동하지 않게
          const click = (e: MouseEvent) => {
            if (!dragged) return;
            e.preventDefault();
            e.stopPropagation();
            dragged = false;
          };
          row.addEventListener("pointerdown", down);
          row.addEventListener("pointermove", move);
          row.addEventListener("pointerup", up);
          row.addEventListener("pointercancel", up);
          row.addEventListener("click", click, true);
          const off = () => {
            glide?.kill();
            row.removeEventListener("pointerdown", down);
            row.removeEventListener("pointermove", move);
            row.removeEventListener("pointerup", up);
            row.removeEventListener("pointercancel", up);
            row.removeEventListener("click", click, true);
          };
          return { tl, dir, row, slow, resume, state, off };
        });

        // 스크롤 속도만큼 가속 → 부드럽게 원래 속도로
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 400);
            for (const { tl, dir, row, state } of loops) {
              if (row.matches(":hover") || state.busy) continue;
              gsap.fromTo(tl, { timeScale: boost * dir }, { timeScale: dir, duration: 1, ease: "power2.out", overwrite: true });
            }
          },
        });

        // 등장: 두 줄이 양옆에서 미끄러져 들어온다
        gsap.from("[data-row]", { x: (i: number) => (i === 0 ? 80 : -80), autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1 });

        return () => {
          st.kill();
          for (const { row, slow, resume, off } of loops) {
            row.removeEventListener("pointerenter", slow);
            row.removeEventListener("pointerleave", resume);
            off();
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
      className={`relative -mx-4 space-y-4 py-2 sm:-mx-6 ${flow ? "overflow-hidden motion-reduce:overflow-x-auto" : "overflow-x-auto [scrollbar-width:none]"}`}
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
        <div
          key={r}
          data-row
          className={`flex w-max gap-3 px-4 sm:gap-4 sm:px-6 ${flow ? "marquee-row touch-pan-y select-none" : ""}`}
        >
          {row.map((e, i) => {
            const c = COLLECTIONS[e.collection];
            return (
              <Link
                key={`${e.collection}/${e.slug}/${i}`}
                data-card
                href={entryHref(e.collection, e.slug)}
                draggable={false}
                className="group flex w-[264px] shrink-0 sm:w-[296px] flex-col rounded-[24px] bg-surface p-5 transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,23,51,0.1)]"
              >
                <div className="flex items-center gap-2.5">
                  <CollectionIcon id={c.id} className="flex size-10 items-center justify-center rounded-[14px] bg-fill text-[22px]" />
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
