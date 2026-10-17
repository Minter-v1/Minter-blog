"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/profile";
import { ProjectCoverMedia } from "../about/project-cover";
import { Rich } from "../about/rich";
import { ChevronRight } from "../icons";

const DURATION = 7000; // 한 프로젝트를 보여 주는 시간 (ms)

// 주력 프로젝트 스포트라이트 (#65): 큰 카드 하나에서 번갈아 보여 준다
// - 진행 막대가 다 차면 다음으로 넘어가며 크로스페이드, 마우스를 올리거나 포커스하면 멈춤
// - 움직임 줄이기 설정이면 자동 전환 없이 버튼으로만 넘긴다
export function ProjectSpotlight({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + projects.length) % projects.length);
  const auto = !reduced && projects.length > 1;

  return (
    <div
      className="relative grid overflow-hidden rounded-[28px] bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="주력 프로젝트"
    >
      {projects.map((p, i) => {
        const on = i === index;
        return (
          <article
            key={p.slug}
            aria-hidden={!on}
            inert={!on}
            className={`col-start-1 row-start-1 flex flex-col transition-opacity duration-700 ease-out md:flex-row ${
              on ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Link
              href={`/about/projects/${p.slug}`}
              tabIndex={-1}
              aria-hidden
              className="group relative block overflow-hidden md:w-[56%] md:shrink-0"
            >
              {p.cover && (
                <ProjectCoverMedia
                  cover={p.cover}
                  className="aspect-[16/10] h-full transition-transform duration-700 ease-out group-hover:scale-[1.03] md:aspect-auto md:min-h-[340px]"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-6 sm:p-8">
              <div className="flex gap-1.5" aria-hidden>
                {projects.map((_, j) => (
                  <span key={j} className="h-1 flex-1 overflow-hidden rounded-full bg-primary-weak">
                    <span
                      className={`block h-full rounded-full bg-primary ${j < index ? "w-full" : j > index ? "w-0" : ""}`}
                      style={
                        j === index && on
                          ? auto
                            ? {
                                animation: `spotlight-progress ${DURATION}ms linear forwards`,
                                animationPlayState: paused ? "paused" : "running",
                              }
                            : { width: "100%" }
                          : undefined
                      }
                      onAnimationEnd={j === index && on ? () => go(1) : undefined}
                    />
                  </span>
                ))}
              </div>
              <p className="text-[13px] font-medium text-text-3 tabular-nums">
                주력 {i + 1} / {projects.length} · {p.period}
              </p>
              <h3 className="text-[22px] leading-snug font-bold tracking-[-0.025em] sm:text-[24px]">
                <Link href={`/about/projects/${p.slug}`} className="hover:text-primary">
                  {p.name}
                </Link>
              </h3>
              <p className="flex flex-wrap gap-1.5 text-[12px] font-semibold">
                <span className="rounded-md bg-fill px-2 py-0.5 text-text-2">{p.team}</span>
                <span className="rounded-md bg-primary-weak px-2 py-0.5 text-primary-press">{p.role}</span>
              </p>
              <ul className="space-y-1.5 text-[15px] leading-[1.65] text-text-2">
                {p.bullets.map((b, k) => (
                  <li key={k} className="flex gap-2">
                    <span className="mt-[11px] size-1 shrink-0 rounded-full bg-text-3" />
                    <span>
                      <Rich text={b} />
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <Link
                  href={`/about/projects/${p.slug}`}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-[14px] font-semibold text-white transition-colors hover:bg-primary-press"
                >
                  자세히 보기
                  <ChevronRight className="size-3.5" />
                </Link>
                {projects.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="이전 주력 프로젝트"
                      className="flex size-10 items-center justify-center rounded-xl bg-fill text-text-2 hover:bg-fill-strong/70"
                    >
                      <ChevronRight className="size-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="다음 주력 프로젝트"
                      className="flex size-10 items-center justify-center rounded-xl bg-fill text-text-2 hover:bg-fill-strong/70"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
