"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "../icons";

// 주요 프로젝트 가로 레일: 스크롤 스냅, 데스크톱은 좌우 버튼, 모바일은 스와이프
export function ProjectRail({ children }: { children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () =>
      setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector<HTMLElement>("[data-rail-card]");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16) * 2, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={rail}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:scroll-px-6 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-4 hidden justify-end gap-2 sm:flex">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            aria-label={dir === -1 ? "이전 프로젝트" : "다음 프로젝트"}
            disabled={dir === -1 ? edge.start : edge.end}
            onClick={() => move(dir)}
            className="flex size-10 items-center justify-center rounded-full bg-surface text-text-2 transition-[opacity,background-color] hover:bg-fill-strong/60 disabled:opacity-30"
          >
            <ChevronRight className={`size-4 ${dir === -1 ? "rotate-180" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
