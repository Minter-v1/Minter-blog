"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef, useState } from "react";
import { horizontalLoop } from "@/lib/gsap-loop";
import { Check } from "../icons";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type TrailTerm = { title: string; description: string; href: string };
export type TrailCommand = { title: string; usage: string; description: string };

export const MIN_UNIQUE = 1; // 항목이 하나라도 있으면 그 줄을 보여준다 (적으면 반복해서 채움)
const MIN_PER_ROW = 10; // 화면을 채우고도 남도록 반복

function fill<T>(items: T[]) {
  const out: T[] = [];
  while (out.length < MIN_PER_ROW) out.push(...items);
  return out;
}

/**
 * 홈 트레일: 윗줄은 용어명이 큰 글씨로 ←, 아랫줄은 Git 명령어가 터미널 글씨로 →.
 * - 줄에 올리면 거의 멈출 만큼 느려지고, 스크롤을 빠르게 하면 잠깐 빨라진다 (GSAP horizontalLoop)
 * - 동작 줄이기 설정이면 흐르지 않고 가로 스크롤로 본다
 */
export function KeywordTrail(props: { terms: TrailTerm[]; commands: TrailCommand[] }) {
  const root = useRef<HTMLDivElement>(null);
  const showTerms = props.terms.length >= MIN_UNIQUE;
  const showCommands = props.commands.length >= MIN_UNIQUE;

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const loops = gsap.utils.toArray<HTMLElement>("[data-row]").map((row) => {
          const reversed = row.dataset.row === "commands";
          const tl = horizontalLoop(gsap.utils.toArray<HTMLElement>("[data-item]", row), {
            speed: reversed ? 0.5 : 0.35,
            reversed,
            paddingRight: Number(row.dataset.gap ?? 0),
          });
          const dir = reversed ? -1 : 1;
          const slow = () => gsap.to(tl, { timeScale: 0.06 * dir, duration: 0.5, ease: "power2.out", overwrite: true });
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

        gsap.from("[data-row]", { autoAlpha: 0, y: 16, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.3 });

        return () => {
          st.kill();
          for (const { row, slow, resume } of loops) {
            row.removeEventListener("pointerenter", slow);
            row.removeEventListener("pointerleave", resume);
          }
        };
      });
    },
    { scope: root, dependencies: [showTerms, showCommands] },
  );

  if (!showTerms && !showCommands) return null;

  return (
    <div
      ref={root}
      className="relative -mx-6 space-y-5 overflow-hidden py-8 motion-reduce:overflow-x-auto"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      {showTerms && (
        <div data-row="terms" data-gap={40} className="flex items-center gap-10 px-6">
          {fill(props.terms).map((t, i) => (
            <TermWord key={`${t.href}-${i}`} term={t} />
          ))}
        </div>
      )}
      {showCommands && (
        <div data-row="commands" data-gap={12} className="flex items-center gap-3 px-6">
          {fill(props.commands).map((c, i) => (
            <CommandChip key={`${c.title}-${i}`} command={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function TermWord({ term }: { term: TrailTerm }) {
  return (
    <Link data-item href={term.href} className="group relative shrink-0 py-2">
      <span className="text-[44px] leading-none font-bold tracking-[-0.04em] whitespace-nowrap text-[#c5ccd3] transition-colors duration-200 group-hover:text-text">
        {term.title}
      </span>
      {/* 올리면 한 줄 정의 */}
      <span className="pointer-events-none absolute top-full left-0 z-10 mt-2 w-max max-w-[320px] translate-y-1 rounded-2xl bg-text px-4 py-2.5 text-[14px] leading-snug font-medium text-white opacity-0 shadow-[0_8px_24px_rgba(0,23,51,0.2)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {term.description}
      </span>
    </Link>
  );
}

function CommandChip({ command }: { command: TrailCommand }) {
  const [copied, setCopied] = useState(false);
  const text = command.usage || command.title;
  return (
    // 글자를 바꾸면 칩 폭이 달라져 무한 루프 배치가 어긋나므로, 복사 표시는 위에 말풍선으로
    <button
      data-item
      type="button"
      title={`${command.description} — 눌러서 복사`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-[15px] whitespace-nowrap transition-colors duration-200 ${
        copied ? "bg-primary text-white" : "bg-surface text-text-2 hover:bg-text hover:text-white"
      }`}
    >
      <span className="opacity-40">$</span>
      {text}
      <span
        className={`pointer-events-none absolute -top-9 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-lg bg-text px-2.5 py-1 font-sans text-[12px] font-semibold text-white transition-all duration-200 ${
          copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        <Check className="size-3" />
        복사됨
      </span>
    </button>
  );
}
