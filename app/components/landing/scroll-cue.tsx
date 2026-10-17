"use client";

import { useEffect, useState } from "react";

// 홈 히어로 아래 스크롤 안내 (#112): 가는 세로선을 따라 꼬리 달린 별이 떨어진다 (.scroll-cue-*, globals.css)
// 누르면 target 영역으로 부드럽게 이동, 조금이라도 스크롤하면 사라지고 맨 위로 돌아오면 다시 보인다
export function ScrollCue({ target }: { target: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(target);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }}
      aria-label="주요 프로젝트로 이동"
      tabIndex={hidden ? -1 : 0}
      className={`absolute bottom-40 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2.5 rounded-xl px-3 py-2 transition-opacity duration-300 sm:bottom-44 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="text-[12px] font-semibold tracking-[0.12em] text-text-2">SCROLL</span>
      <span aria-hidden className="relative h-14 w-px bg-gradient-to-b from-white/50 to-white/0">
        <span className="scroll-cue-tail" />
        <span className="scroll-cue-head" />
      </span>
    </button>
  );
}
