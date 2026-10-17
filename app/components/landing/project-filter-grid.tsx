"use client";

import Link from "next/link";
import { useState } from "react";
import { flushSync } from "react-dom";
import { PROJECT_CATEGORIES, type Project, type ProjectCategory } from "@/lib/profile";
import { ProjectCoverMedia } from "../about/project-cover";
import { Rich } from "../about/rich";

type Filter = "all" | ProjectCategory;

// 주력 외 프로젝트 그리드 + 분야 필터 칩 (#65)
// 칩을 바꾸면 View Transitions API로 남는 카드는 제자리로 미끄러지고, 빠지거나 들어오는 카드는 흐려지며 바뀐다.
// 지원하지 않는 브라우저, 움직임 줄이기 설정에서는 애니메이션 없이 바로 바뀐다
export function ProjectFilterGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const chips: { id: Filter; label: string; emoji?: string; count: number }[] = [
    { id: "all", label: "전체", count: projects.length },
    ...(Object.keys(PROJECT_CATEGORIES) as ProjectCategory[])
      .map((id) => ({ id, ...PROJECT_CATEGORIES[id], count: projects.filter((p) => p.category === id).length }))
      .filter((c) => c.count > 0),
  ];

  const pick = (id: Filter) => {
    if (id === filter) return;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (doc.startViewTransition && !reduced) doc.startViewTransition(() => flushSync(() => setFilter(id)));
    else setFilter(id);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="분야">
        {chips.map((c) => {
          const on = c.id === filter;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick(c.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition-colors ${
                on ? "bg-primary text-white" : "bg-surface text-text-2 hover:bg-fill-strong/60"
              }`}
            >
              {c.emoji && <span className="tossface text-[15px]">{c.emoji}</span>}
              {c.label}
              <span className={`tabular-nums ${on ? "text-white/80" : "text-text-3"}`}>{c.count}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {shown.map((p) => (
          <Link
            key={p.slug}
            href={`/about/projects/${p.slug}`}
            style={{ viewTransitionName: `project-${p.slug}` }}
            className="group flex flex-col overflow-hidden rounded-[24px] bg-surface transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,23,51,0.08)]"
          >
            <div className="overflow-hidden">
              {p.cover ? (
                <ProjectCoverMedia
                  cover={p.cover}
                  className="aspect-[16/10] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <div className="aspect-[16/10] bg-fill" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-5">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-3 tabular-nums">
                <span className="tossface">{PROJECT_CATEGORIES[p.category].emoji}</span>
                {p.period}
              </p>
              <h3 className="text-[17px] leading-snug font-bold tracking-[-0.02em] group-hover:text-primary">
                {p.name}
                {p.tagline && <span className="ml-1.5 text-[14px] font-semibold text-text-3">{p.tagline}</span>}
              </h3>
              <p className="line-clamp-2 text-[13px] leading-[1.6] text-text-2">
                <Rich text={p.bullets[p.bullets.length - 1] ?? ""} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
