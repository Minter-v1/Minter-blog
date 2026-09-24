import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { loadArchive, type Entry } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, entryHref } from "@/lib/collections";
import { PROFILE, type TimelineItem } from "@/lib/profile";
import { Reveal } from "../components/about/reveal";
import { Rich } from "../components/about/rich";
import { ArrowUpRight, ChevronRight } from "../components/icons";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: "About",
  description: `${PROFILE.name} · ${PROFILE.role}`,
};

export default async function AboutPage() {
  const authed = await isAuthed();

  // 프로젝트 → 관련 블로그 기록 (저장소를 못 읽어도 About은 보여야 하니 실패는 무시)
  let entries: Entry[] = [];
  try {
    entries = (await loadArchive()).entries;
  } catch {}
  const byRef = new Map(entries.map((e) => [e.ref, e]));

  const stats = [
    { emoji: "🗂️", label: "프로젝트", value: PROFILE.projects.length },
    { emoji: "📜", label: "자격증", value: PROFILE.certifications.length },
    { emoji: "🏆", label: "수상", value: PROFILE.awards.length },
    { emoji: "📄", label: "제1저자 논문", value: PROFILE.papers.length },
  ];

  return (
    <div className="mx-auto max-w-[960px] px-6 pb-28">
      <SiteHeader authed={authed} active="about" writeHref="/write" />

      <Reveal>
        {/* 소개 */}
        <section className="pt-10 pb-4">
          <div className="flex items-start justify-between gap-10">
            <div className="min-w-0">
              <span className="text-[16px] font-semibold text-primary">
                {PROFILE.role}
              </span>
              <h1 className="mt-4 flex items-baseline gap-3">
                <span data-name className="text-[52px] leading-none font-bold tracking-[-0.045em]">
                  {PROFILE.name}
                </span>
                <span className="text-[20px] font-semibold text-text-3">{PROFILE.nameEn}</span>
              </h1>
              <div className="mt-6 space-y-1 text-[18px] leading-[1.7] text-text-2">
                {PROFILE.intro.map((line, i) => (
                  <p key={i}>
                    <Rich text={line} />
                  </p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {PROFILE.contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group inline-flex h-11 items-center gap-2 rounded-2xl bg-surface px-4 text-[14px] transition-colors hover:bg-fill-strong/60"
                  >
                    <span className="font-semibold text-text-3">{c.label}</span>
                    <span className="font-semibold text-text">{c.text}</span>
                    <ArrowUpRight className="size-3.5 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
            {PROFILE.photo && (
              <div
                data-photo
                className="relative aspect-[3/4] w-[210px] shrink-0 overflow-hidden rounded-[28px] bg-fill"
              >
                <Image
                  src={PROFILE.photo}
                  alt={`${PROFILE.name} 프로필 사진`}
                  fill
                  sizes="210px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="mt-10 grid grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[22px] bg-surface p-5">
                <span className="tossface text-[26px]">{s.emoji}</span>
                <p className="mt-3 text-[13px] font-semibold text-text-3">{s.label}</p>
                <p className="mt-0.5 text-[28px] leading-none font-bold tracking-[-0.03em] tabular-nums">
                  <span data-count={s.value}>{s.value}</span>
                  <span className="ml-0.5 text-[16px]">{s.label === "제1저자 논문" ? "편" : "개"}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 프로젝트 */}
        <Section emoji="🗂️" title="프로젝트" id="projects">
          <div className="grid grid-cols-2 gap-4">
            {PROFILE.projects.map((p) => {
              const related = (p.related ?? []).map((r) => byRef.get(r)).filter((e): e is Entry => !!e);
              return (
                <article
                  key={p.name}
                  data-reveal
                  className="group relative flex flex-col rounded-[24px] bg-surface p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,23,51,0.08)]"
                >
                  {/* 카드 전체가 상세 페이지 링크. 안쪽 링크(관련 기록)는 relative로 그 위에 */}
                  <Link
                    href={`/about/projects/${p.slug}`}
                    className="absolute inset-0 rounded-[24px]"
                    aria-label={`${p.name} 자세히`}
                  />
                  <p className="flex items-center justify-between text-[13px] font-medium text-text-3 tabular-nums">
                    {p.period}
                    <span className="inline-flex items-center gap-0.5 font-semibold transition-colors group-hover:text-primary">
                      자세히
                      <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </p>
                  <h3 className="mt-1.5 text-[19px] leading-snug font-bold tracking-[-0.025em] transition-colors group-hover:text-primary">
                    {p.name}
                    {p.tagline && <span className="ml-1.5 text-[15px] font-semibold text-text-3">{p.tagline}</span>}
                  </h3>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-[12px] font-semibold">
                    <span className="rounded-md bg-fill px-2 py-0.5 text-text-2">{p.team}</span>
                    <span className="rounded-md bg-primary-weak px-2 py-0.5 text-primary">{p.role}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-[14px] leading-[1.65] text-text-2">
                    {p.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-text-3" />
                        <span>
                          <Rich text={b} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line px-2.5 py-1 text-[12px] font-medium text-text-2"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {related.length > 0 && (
                    <div className="relative mt-4 border-t border-line pt-3">
                      <p className="text-[12px] font-semibold text-text-3">관련 기록</p>
                      <ul className="mt-1">
                        {related.map((e) => (
                          <li key={e.ref}>
                            <Link
                              href={entryHref(e.collection, e.slug)}
                              className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium hover:bg-fill"
                            >
                              <span className="tossface text-[14px]">{COLLECTIONS[e.collection].emoji}</span>
                              <span className="truncate">{e.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </Section>

        <Section emoji="💼" title="경력">
          <Timeline items={PROFILE.experience} />
        </Section>

        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4">
          <Section emoji="🛠️" title="기술 스택">
            <div data-reveal className="space-y-4 rounded-[24px] bg-surface p-6">
              {PROFILE.skills.map((g) => (
                <div key={g.group} className="grid grid-cols-[108px_minmax(0,1fr)] items-baseline gap-3">
                  <p className="text-[13px] font-semibold text-text-3">{g.group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((s) => (
                      <span key={s} className="rounded-lg bg-fill px-2.5 py-1 text-[13px] font-semibold text-text-2">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section emoji="📜" title="자격증">
            <ul data-reveal className="rounded-[24px] bg-surface p-3">
              {PROFILE.certifications.map((c) => (
                <li key={c.name} className="flex items-start justify-between gap-3 rounded-2xl px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] leading-snug font-bold">{c.name}</p>
                    <p className="mt-0.5 text-[12px] text-text-3">{c.issuer}</p>
                  </div>
                  <span className="shrink-0 text-[12px] font-medium text-text-3 tabular-nums">{c.date}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section emoji="🏃" title="대내외활동">
          <Timeline items={PROFILE.activities} />
        </Section>

        <Section emoji="🏆" title="수상">
          <Timeline items={PROFILE.awards} />
        </Section>

        <Section emoji="📄" title="논문">
          <ul data-reveal className="rounded-[24px] bg-surface p-3">
            {PROFILE.papers.map((p) => (
              <li key={p.title} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-2xl px-3 py-3.5">
                <span className="text-[13px] font-medium text-text-3 tabular-nums">{p.date}</span>
                <div>
                  <p className="text-[15px] leading-snug font-bold">{p.title}</p>
                  <p className="mt-1 text-[13px] text-text-3">{p.venue}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section emoji="🎓" title="학력">
          <Timeline items={PROFILE.education} />
        </Section>
      </Reveal>
    </div>
  );
}

function Section(props: { emoji: string; title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={props.id} className="mt-14 scroll-mt-6">
      <h2 data-reveal className="mb-4 flex items-center gap-2 px-1 text-[22px] font-bold tracking-[-0.03em]">
        <span className="tossface text-[24px]">{props.emoji}</span>
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="rounded-[24px] bg-surface p-3">
      {items.map((it) => (
        <li
          key={it.title + it.period}
          data-reveal
          className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 px-3 py-4"
        >
          <span className="pt-0.5 text-[13px] font-medium text-text-3 tabular-nums">{it.period}</span>
          <div>
            <p className="text-[16px] leading-snug font-bold tracking-[-0.02em]">
              {it.title}
              {it.subtitle && <span className="ml-1.5 font-semibold text-text-2">{it.subtitle}</span>}
            </p>
            {it.org && <p className="mt-0.5 text-[13px] text-text-3">{it.org}</p>}
            <ul className="mt-2 space-y-1 text-[14px] leading-[1.65] text-text-2">
              {it.bullets.map((b, i) => (
                <li key={i}>
                  <Rich text={b} />
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
