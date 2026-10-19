"use client";

import { useEffect, useState } from "react";

// 홈 섹션 내비게이션 · 스크롤스파이 (#124)
// - 데스크톱: 화면 오른쪽 가운데 세로 별자리. 지금 구간 별이 빛나고 이름이 보임, 누르면 이동
// - 모바일: 첫 화면을 지나면 헤더 아래 구간 칩 줄
// 첫 화면(밤하늘) 위에서는 밝은 색, 아래 밝은 구간에서는 메인 색
// 지금 구간 이름표는 넓은 화면(2xl)에서만 늘 보이고, 그보다 좁으면 본문과 겹치지 않게 올렸을 때만
const SECTIONS = [
  { id: "top", label: "소개" },
  { id: "projects", label: "주요 프로젝트" },
  { id: "records", label: "학습 기록" },
  { id: "contact", label: "연락" },
];

export function HomeSectionNav() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      // 화면 위에서 40% 지점을 지난 구간 중 마지막 것, 맨 아래면 마지막 구간
      const line = window.innerHeight * 0.4;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = SECTIONS.at(-1)!.id;
      setActive(current);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (id === "top") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    else document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  const onNight = active === "top";

  return (
    <>
      {/* 데스크톱: 세로 별자리 */}
      <nav
        aria-label="홈 구간"
        className={`fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 lg:block ${onNight ? "home-nav-night" : ""}`}
      >
        <ol className="home-nav relative flex flex-col items-end gap-7">
          <span aria-hidden className="home-nav-line absolute top-2 right-[7px] bottom-2 w-px" />
          {SECTIONS.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={on ? "location" : undefined}
                  className="group flex items-center gap-3"
                >
                  <span
                    className={`home-nav-label rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap transition-[opacity,translate] duration-200 ${
                      on
                        ? "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 2xl:translate-x-0 2xl:opacity-100"
                        : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    aria-hidden
                    className={`home-nav-star star-mark block shrink-0 transition-[scale,background-color] duration-300 ${
                      on ? "size-[15px] scale-100" : "size-[11px] scale-90 group-hover:scale-110"
                    } ${on ? "is-on" : ""}`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 모바일: 첫 화면을 지나면 헤더 아래 칩 줄 */}
      <nav
        aria-label="홈 구간"
        className={`fixed inset-x-0 top-[var(--header-h)] z-30 bg-bg/90 px-4 py-2 backdrop-blur transition-[opacity,translate] duration-300 lg:hidden ${
          onNight ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.slice(1).map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                tabIndex={onNight ? -1 : 0}
                onClick={() => go(s.id)}
                aria-current={on ? "location" : undefined}
                className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                  on ? "bg-primary text-white" : "bg-surface text-text-2"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
