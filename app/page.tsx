import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadArchive, type Entry } from "@/lib/archive";
import { COLLECTION_LIST, entryHref } from "@/lib/collections";
import { PROFILE } from "@/lib/profile";
import { Reveal } from "./components/about/reveal";
import { Rich } from "./components/about/rich";
import { CollectionIcon } from "./components/collection-icon";
import { ArrowUpRight, ChevronRight } from "./components/icons";
import { CopyButton } from "./components/landing/copy-button";
import { ProjectFilterGrid } from "./components/landing/project-filter-grid";
import { ProjectSpotlight } from "./components/landing/project-spotlight";
import { NightSky } from "./components/landing/night-sky";
import { SiteHeader } from "./components/site-header";
import { EmptyState } from "./components/loaders";

export const metadata: Metadata = {
  title: { absolute: `${PROFILE.name} · ${PROFILE.role}` },
  description: PROFILE.intro.join(" ").replace(/\[\[|\]\]|\*\*/g, ""),
};

// 공개 페이지: 미리 만들어 CDN에 캐시 (글을 쓰면 revalidateTag("archive")로 갱신, 그 외엔 5분마다)
export const revalidate = 300;

// 루트 랜딩 (#60): 첫 방문자(HR)에게 누구인지 · 무엇을 했는지 · PDF를 먼저 보여 주고, 블로그로 가는 문을 둔다
export default async function Landing() {
  let entries: Entry[] = [];
  try {
    entries = (await loadArchive()).entries;
  } catch {}
  const recent = entries.slice(0, 3);
  const featured = PROFILE.projects.filter((p) => p.featured);
  const others = PROFILE.projects.filter((p) => !p.featured);
  const counts = COLLECTION_LIST.map((c) => ({
    c,
    n: entries.filter((e) => e.collection === c.id).length,
  }));

  const stats = [
    { label: "주요 프로젝트", value: PROFILE.projects.length, unit: "개" },
    { label: "자격증", value: PROFILE.certifications.length, unit: "개" },
    { label: "수상", value: PROFILE.awards.length, unit: "회" },
    { label: "제1저자 논문", value: PROFILE.papers.length, unit: "편" },
  ];

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pb-24">
      {/* 헤더 + 첫 화면은 밤하늘 위 (#86). .night 안에서는 색 토큰이 어두운 배경용으로 바뀐다 */}
      <SiteHeader writeHref="/write" tone="night" />
      <div className="night relative isolate">
        <NightSky />
        {/* 헤더가 밝은 톤으로 바뀌는 지점 (밤하늘이 녹기 시작하는 곳) */}
        <div id="night-end" aria-hidden className="absolute bottom-64 h-px w-px" />

        <Reveal>
          {/* 첫 화면 */}
          <section className="flex flex-col justify-center pt-10 pb-40 sm:pt-16 sm:pb-52 md:min-h-[min(calc(100svh-180px),820px)]">
            <div className="flex flex-col-reverse items-start justify-between gap-10 md:flex-row md:items-center">
              <div className="min-w-0 max-w-[640px]">
                <p className="text-[16px] font-semibold text-primary sm:text-[18px]">
                  {PROFILE.role}
                </p>
                <h1 className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span
                    data-name
                    className="text-[52px] leading-none font-bold tracking-[-0.05em] sm:text-[76px]"
                  >
                    {PROFILE.name}
                  </span>
                  <span className="text-[20px] font-semibold text-text-3 sm:text-[24px]">
                    {PROFILE.nameEn}
                  </span>
                </h1>
                <div className="mt-8 space-y-1 text-[17px] leading-[1.7] text-text-2 sm:text-[20px]">
                  {PROFILE.intro.map((line, i) => (
                    <p key={i}>
                      <Rich text={line} />
                    </p>
                  ))}
                </div>
                <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[15px] font-semibold text-text-3">
                  {PROFILE.keywords.map((k) => (
                    <span key={k}>#{k}</span>
                  ))}
                </p>
                <div className="mt-9 flex flex-wrap gap-2">
                  <Link
                    href={PROFILE.portfolioPdf.href}
                    className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-semibold text-[#1e2350] transition-opacity hover:opacity-90"
                  >
                    포트폴리오 PDF
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/about"
                    className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[15px] font-semibold text-text ring-1 ring-white/15 transition-colors ring-inset hover:bg-white/15"
                  >
                    About
                    <ChevronRight className="size-4 text-text-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  {PROFILE.contacts
                    .filter((c) => c.label === "GitHub")
                    .map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[15px] font-semibold text-text ring-1 ring-white/15 transition-colors ring-inset hover:bg-white/15"
                      >
                        GitHub
                        <ArrowUpRight className="size-3.5 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    ))}
                </div>
              </div>
              {PROFILE.photo && (
                <div
                  data-photo
                  className="relative aspect-[3/4] w-[150px] shrink-0 overflow-hidden rounded-[28px] bg-fill shadow-[0_20px_60px_rgba(10,12,40,0.45)] sm:w-[260px] sm:rounded-[36px]"
                >
                  <Image
                    src={PROFILE.photo}
                    alt={`${PROFILE.name} 프로필 사진`}
                    fill
                    sizes="260px"
                    priority
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[22px] bg-white/[0.07] px-5 py-4 ring-1 ring-white/10 backdrop-blur-sm ring-inset"
                >
                  <dt className="text-[13px] font-semibold text-text-3">
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-[30px] leading-none font-bold tracking-[-0.03em] tabular-nums">
                    <span data-count={s.value}>{s.value}</span>
                    <span className="ml-0.5 text-[16px]">{s.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      </div>

      <Reveal>
        {/* 주요 프로젝트 레일 */}
        <section className="mt-10" aria-labelledby="projects-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2
                id="projects-title"
                className="text-[26px] font-bold tracking-[-0.03em] sm:text-[32px]"
              >
                주요 프로젝트
              </h2>
              <p className="mt-1 text-[15px] text-text-3">
                주력 프로젝트를 먼저, 나머지는 분야별로 볼 수 있어요
              </p>
            </div>
            <Link
              href="/about#projects"
              className="inline-flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-text-3 hover:text-primary"
            >
              전체 보기
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <ProjectSpotlight projects={featured} />
          <div className="mt-8">
            <ProjectFilterGrid projects={others} />
          </div>
        </section>

        {/* 블로그 */}
        <section className="mt-20" aria-labelledby="blog-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2
                id="blog-title"
                className="text-[26px] font-bold tracking-[-0.03em] sm:text-[32px]"
              >
                학습 기록
              </h2>
              <p className="mt-1 text-[15px] text-text-3">
                개발하며 배운 것을 망각곡선에 맞춰 복습하며 쌓고 있어요
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-text-3 hover:text-primary"
            >
              Blog 전체 보기
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <ul data-reveal className="rounded-[24px] bg-surface p-2 sm:p-3">
              {recent.map((e) => (
                <li key={e.ref}>
                  <Link
                    href={entryHref(e.collection, e.slug)}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-colors hover:bg-fill"
                  >
                    <CollectionIcon
                      id={e.collection}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fill text-[20px]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold group-hover:text-primary">
                        {e.title}
                      </span>
                      <span className="block truncate text-[14px] text-text-3">
                        {e.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-[12px] text-text-3 tabular-nums">
                      {e.date}
                    </span>
                  </Link>
                </li>
              ))}
              {recent.length === 0 && (
                <li>
                  <EmptyState emoji="📭" title="기록을 불러오지 못했어요" desc="잠시 뒤 다시 확인해 주세요" />
                </li>
              )}
            </ul>
            <div
              data-reveal
              className="grid grid-cols-2 gap-2 rounded-[24px] bg-surface p-3 sm:gap-3"
            >
              {counts.map(({ c, n }) => (
                <Link
                  key={c.id}
                  href={`/${c.id}`}
                  className="group rounded-2xl px-3 py-3 transition-colors hover:bg-fill"
                >
                  <CollectionIcon id={c.id} className="text-[20px]" />
                  <p className="mt-1.5 text-[14px] font-semibold group-hover:text-primary">
                    {c.label}
                  </p>
                  <p className="text-[13px] text-text-3 tabular-nums">{n}편</p>
                </Link>
              ))}
              {/* 다른 타일과 같은 기본 스타일 (색을 칠하면 선택된 탭처럼 보임, #82) */}
              <Link
                href="/learning"
                className="group rounded-2xl px-3 py-3 transition-colors hover:bg-fill"
              >
                <span className="tossface text-[20px]">🧠</span>
                <p className="mt-1.5 text-[14px] font-semibold group-hover:text-primary">
                  학습법
                </p>
                <p className="text-[13px] text-text-3">망각곡선 복습 방식</p>
              </Link>
            </div>
          </div>
        </section>

        {/* 마무리 (#89): 왼쪽 포트폴리오 PDF, 오른쪽 연락 */}
        <section
          data-reveal
          className="mt-20 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2"
          aria-label="포트폴리오 PDF와 연락처"
        >
          <Link
            href={PROFILE.portfolioPdf.href}
            className="group flex items-center gap-6 rounded-[28px] bg-surface p-6 transition-colors hover:bg-white sm:p-8"
          >
            <div className="relative aspect-[480/679] w-[104px] shrink-0 overflow-hidden rounded-xl bg-white shadow-[0_4px_18px_rgba(0,23,51,0.1)] ring-1 ring-line transition-transform group-hover:-translate-y-1 sm:w-[120px]">
              <Image
                src={PROFILE.portfolioPdf.cover}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-primary tabular-nums">
                PDF · v{PROFILE.portfolioPdf.version} ·{" "}
                {PROFILE.portfolioPdf.pages}쪽
              </p>
              <h2 className="mt-1 text-[22px] leading-snug font-bold tracking-[-0.03em]">
                {PROFILE.portfolioPdf.title}
              </h2>
              <p className="mt-1 text-[14px] text-text-3">
                주력 프로젝트의 설계와 트러블슈팅을 한 부에
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-primary">
                PDF 보기
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
          <div className="flex flex-col justify-center rounded-[28px] bg-surface p-6 sm:p-8">
            <h2 className="text-[22px] font-bold tracking-[-0.03em]">
              함께 일할 팀을 찾고 있어요
            </h2>
            <p className="mt-1 text-[14px] text-text-3">편하게 연락 주세요</p>
            <dl className="mt-4">
              {PROFILE.contacts.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center justify-between gap-3 border-t border-line py-3"
                >
                  <dt className="w-16 shrink-0 text-[14px] text-text-3">
                    {c.label}
                  </dt>
                  <dd className="flex min-w-0 flex-1 items-center justify-end gap-2">
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="group inline-flex min-w-0 items-center gap-1 text-[15px] font-semibold hover:text-primary"
                    >
                      <span className="truncate">{c.text}</span>
                      {c.href.startsWith("http") && (
                        <ArrowUpRight className="size-3.5 shrink-0 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      )}
                    </a>
                    {c.href.startsWith("mailto:") && (
                      <CopyButton text={c.text} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
