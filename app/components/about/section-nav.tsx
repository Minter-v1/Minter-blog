"use client";

import { useEffect, useRef, useState } from "react";

export type SectionLink = { id: string; emoji: string; title: string };

// About 섹션 바로가기 (#79). 스크롤하면 화면 위에 붙고, 지금 보고 있는 섹션을 표시한다
export function SectionNav({ sections }: { sections: SectionLink[] }) {
  const [active, setActive] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  // 칩을 눌러 이동하는 동안(그리고 페이지 끝이라 더 못 내려가도) 누른 섹션을 유지. 직접 스크롤하면 풀린다
  const picked = useRef<string | null>(null);

  // 화면 위 기준선(고정 헤더 + 칩 줄 아래)을 지난 섹션 중 가장 아래 것이 현재 섹션.
  // 기술 스택·자격증처럼 나란히 놓여 위치가 같으면 앞의 것
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (picked.current) return setActive(picked.current);
      const headerH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h",
          ),
        ) || 72;
      const line = headerH + 80;
      let current: string | null = null;
      let best = -Infinity;
      for (const s of sections) {
        const top = document.getElementById(s.id)?.getBoundingClientRect().top;
        if (top === undefined || top > line) continue;
        if (top > best + 1) {
          best = top;
          current = s.id;
        }
      }
      // 맨 아래까지 내리면 마지막 섹션
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      )
        current = sections.at(-1)?.id ?? current;
      setActive(current);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    const release = () => {
      picked.current = null;
    };
    const userInput = ["wheel", "touchstart", "keydown"] as const;
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    userInput.forEach((t) =>
      window.addEventListener(t, release, { passive: true }),
    );
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      userInput.forEach((t) => window.removeEventListener(t, release));
    };
  }, [sections]);

  // 현재 칩이 가로 스크롤 밖이면 보이게
  useEffect(() => {
    const chip =
      active &&
      bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!chip || !bar.current) return;
    const b = bar.current;
    if (
      chip.offsetLeft < b.scrollLeft ||
      chip.offsetLeft + chip.offsetWidth > b.scrollLeft + b.clientWidth
    )
      b.scrollTo({ left: chip.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    picked.current = id;
    setActive(id);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label="About 섹션"
      className="sticky top-[var(--header-h)] z-30 -mx-4 mt-10 bg-bg/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <div
        ref={bar}
        className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              data-id={s.id}
              onClick={go(s.id)}
              aria-current={on ? "location" : undefined}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors ${
                on
                  ? "bg-primary text-white"
                  : "bg-surface text-text-2 hover:bg-fill-strong/60"
              }`}
            >
              <span className="tossface text-[15px]">{s.emoji}</span>
              {s.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
