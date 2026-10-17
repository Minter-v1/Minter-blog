"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/profile";
import { ProjectCoverMedia } from "../about/project-cover";
import { Rich } from "../about/rich";
import { ChevronRight, Pause, Play } from "../icons";

const DURATION = 4500; // 한 프로젝트를 보여 주는 시간 (ms)

// 주력 프로젝트 스포트라이트 (#65): 큰 카드 하나에서 번갈아 보여 준다
// - 별자리 진행(#106): 슬라이드 밖에 고정된 "현재 별 — 선 — 다음 별". 선 끝 빛나는 머리가 다음 별에 닿으면 넘어간다
//   마우스를 올리거나 포커스하면 멈춤, 일시정지 버튼으로도 멈춤
//   나가는 쪽은 빠르게(250ms) 사라지고, 들어오는 쪽은 이미지 → 글 순서로 살짝 늦게 나타나 두 장이 겹쳐 흐려 보이는 구간을 줄인다
// - 움직임 줄이기 설정이면 자동 전환 없이 버튼으로만 넘긴다
export function ProjectSpotlight({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false); // 화면에 보일 때만 진행 막대가 찬다
  const [stopped, setStopped] = useState(false); // 일시정지 버튼
  const [arrived, setArrived] = useState(false); // 다음 별이 반짝 켜지는 짧은 순간
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + projects.length) % projects.length);
  const auto = !reduced && projects.length > 1;
  const running = auto && !paused && !stopped && inView;
  const next = projects[(index + 1) % projects.length];
  const label = (p: Project) => p.short ?? p.name;
  // 머리가 다음 별에 닿으면 별을 반짝 켜고 넘긴다
  const onArrive = () => {
    setArrived(true);
    setTimeout(() => {
      setArrived(false);
      go(1);
    }, 260);
  };

  return (
    <div
      ref={box}
      className="@container relative grid overflow-hidden rounded-[28px] bg-surface"
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
            className={`col-start-1 row-start-1 flex flex-col md:flex-row ${on ? "z-10" : "pointer-events-none"}`}
          >
            <Link
              href={`/about/projects/${p.slug}`}
              tabIndex={-1}
              aria-hidden
              className={`group relative block overflow-hidden transition-opacity ease-out md:w-[56%] md:shrink-0 ${
                on ? "opacity-100 duration-500" : "opacity-0 duration-[250ms]"
              }`}
            >
              {p.cover && (
                <ProjectCoverMedia
                  cover={p.cover}
                  className="aspect-[16/10] h-full transition-transform duration-700 ease-out group-hover:scale-[1.03] md:aspect-auto md:min-h-[340px]"
                />
              )}
            </Link>
            <div
              className={`flex min-w-0 flex-1 flex-col gap-3 p-6 transition-[opacity,translate] ease-out sm:p-8 ${projects.length > 1 ? "pt-[92px] sm:pt-[100px]" : ""} ${
                on ? "translate-y-0 opacity-100 delay-150 duration-500" : "translate-y-1.5 opacity-0 duration-200"
              }`}
            >
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
              </div>
            </div>
          </article>
        );
      })}
      {projects.length > 1 && (
        // 별자리 진행: 모바일은 이미지 바로 아래(16:10), 데스크톱은 글 영역 위쪽에 고정
        <div className="relative z-20 col-start-1 row-start-1 mx-6 mt-[calc(62.5cqw+20px)] self-start sm:mx-8 md:mt-8 md:ml-[calc(56%+32px)]">
          <div className="flex items-center">
            <span className={`star-mark size-4 shrink-0 bg-primary ${running ? "star-breath" : ""}`} aria-hidden />
            <span className="relative mx-2.5 h-0.5 flex-1 rounded-full bg-line" aria-hidden>
              <span
                key={index}
                className="star-track absolute inset-y-0 left-0 rounded-full"
                style={
                  auto
                    ? { animationDuration: `${DURATION}ms`, animationPlayState: running ? "running" : "paused" }
                    : { width: 0 }
                }
                onAnimationEnd={auto ? onArrive : undefined}
              >
                <span className="star-head" />
              </span>
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={`다음 주력 프로젝트: ${label(next)}`}
              className={`star-mark size-3.5 shrink-0 transition-colors ${arrived ? "star-arrive bg-primary" : "bg-primary-weak hover:bg-primary/60"}`}
            />
            <span className="ml-3 flex shrink-0 gap-1">
              <button type="button" onClick={() => go(-1)} aria-label="이전 주력 프로젝트" className="flex size-8 items-center justify-center rounded-lg bg-fill text-text-2 hover:bg-fill-strong/70">
                <ChevronRight className="size-3.5 rotate-180" />
              </button>
              {auto && (
                <button
                  type="button"
                  onClick={() => setStopped((v) => !v)}
                  aria-label={stopped ? "자동 넘김 재생" : "자동 넘김 일시정지"}
                  aria-pressed={stopped}
                  className="flex size-8 items-center justify-center rounded-lg bg-fill text-text-2 hover:bg-fill-strong/70"
                >
                  {stopped ? <Play className="size-3" /> : <Pause className="size-3" />}
                </button>
              )}
              <button type="button" onClick={() => go(1)} aria-label="다음 주력 프로젝트" className="flex size-8 items-center justify-center rounded-lg bg-fill text-text-2 hover:bg-fill-strong/70">
                <ChevronRight className="size-3.5" />
              </button>
            </span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[12px] font-semibold sm:pr-[112px]" aria-live="polite">
            <span className="min-w-0 truncate text-text">{label(projects[index])}</span>
            <button type="button" onClick={() => go(1)} className="min-w-0 truncate text-text-3 hover:text-primary">
              다음 · {label(next)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
