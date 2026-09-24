import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive, type Entry } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, entryHref } from "@/lib/collections";
import { PROFILE } from "@/lib/profile";
import { readProjectBody } from "@/lib/projects";
import { Reveal } from "../../../components/about/reveal";
import { Rich } from "../../../components/about/rich";
import { Article } from "../../../components/article";
import { ChevronRight } from "../../../components/icons";
import { Outline } from "../../../components/outline";
import { SiteHeader } from "../../../components/site-header";

type Props = PageProps<"/about/projects/[slug]">;

export function generateStaticParams() {
  return PROFILE.projects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

const find = (slug: string) => PROFILE.projects.findIndex((p) => p.slug === slug);

export async function generateMetadata(props: Props): Promise<Metadata> {
  const p = PROFILE.projects[find((await props.params).slug)];
  return p ? { title: `${p.name} · 프로젝트`, description: p.bullets[0]?.replace(/\[\[|\]\]|\*\*/g, "") } : {};
}

export default async function ProjectPage(props: Props) {
  const { slug } = await props.params;
  const index = find(slug);
  if (index === -1) notFound();
  const p = PROFILE.projects[index];
  const prev = PROFILE.projects[index - 1];
  const next = PROFILE.projects[index + 1];

  const [authed, body] = await Promise.all([isAuthed(), readProjectBody(slug)]);

  // 관련 블로그 기록 (저장소를 못 읽어도 페이지는 보이게)
  let related: Entry[] = [];
  try {
    const { entries } = await loadArchive();
    const byRef = new Map(entries.map((e) => [e.ref, e]));
    related = (p.related ?? []).map((r) => byRef.get(r)).filter((e): e is Entry => !!e);
  } catch {}

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 xl:max-w-[1036px]">
      <SiteHeader authed={authed} active="about" writeHref="/write" />

      <Reveal>
        <div className="xl:grid xl:grid-cols-[760px_220px] xl:gap-8">
          <div>
            <Link
              href="/about#projects"
              className="mb-4 inline-flex items-center gap-1 px-1 text-[14px] font-semibold text-text-3 hover:text-text-2"
            >
              <ChevronRight className="size-3.5 rotate-180" />
              프로젝트
            </Link>

            <article className="rounded-[28px] bg-surface px-12 pt-11 pb-14">
              <p className="text-[14px] font-medium text-text-3 tabular-nums">{p.period}</p>
              <h1 data-name className="mt-2 text-[34px] leading-tight font-bold tracking-[-0.035em]">
                {p.name}
              </h1>
              {p.tagline && <p className="mt-1 text-[18px] font-semibold text-text-3">{p.tagline}</p>}

              <div className="mt-5 flex flex-wrap gap-1.5 text-[13px] font-semibold">
                <span className="rounded-lg bg-fill px-2.5 py-1 text-text-2">{p.team}</span>
                <span className="rounded-lg bg-primary-weak px-2.5 py-1 text-primary">{p.role}</span>
              </div>

              {/* 레쥬메 요약 */}
              <ul className="mt-6 space-y-2 rounded-2xl bg-fill/70 px-5 py-4 text-[15px] leading-[1.7] text-text-2">
                {p.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-[11px] size-1 shrink-0 rounded-full bg-text-3" />
                    <span>
                      <Rich text={b} />
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span key={s} className="rounded-full border border-line px-3 py-1 text-[13px] font-medium text-text-2">
                    {s}
                  </span>
                ))}
              </div>

              {body ? (
                <>
                  <hr className="my-10 border-line" />
                  <Article markdown={body} rawBase="" />
                </>
              ) : (
                <p className="mt-10 rounded-2xl border-2 border-dashed border-fill-strong py-8 text-center text-[14px] text-text-3">
                  content/projects/{p.slug}.md 에 상세 내용을 적으면 여기에 보여요
                </p>
              )}
            </article>

            {related.length > 0 && (
              <section data-reveal className="mt-6 rounded-[28px] bg-surface px-8 pt-8 pb-6">
                <h2 className="px-4 text-[17px] font-bold tracking-[-0.02em]">
                  관련 기록
                  <span className="ml-1.5 text-primary tabular-nums">{related.length}</span>
                </h2>
                <ul className="mt-3">
                  {related.map((e) => (
                    <li key={e.ref}>
                      <Link
                        href={entryHref(e.collection, e.slug)}
                        className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-fill"
                      >
                        <span className="tossface text-[20px]">{COLLECTIONS[e.collection].emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold group-hover:text-primary">{e.title}</p>
                          <p className="truncate text-[13px] text-text-3">{e.description}</p>
                        </div>
                        <ChevronRight className="size-4 text-text-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 이전·다음 프로젝트 */}
            <nav data-reveal className="mt-6 grid grid-cols-2 gap-4">
              {prev ? (
                <ProjectNav href={`/about/projects/${prev.slug}`} dir="이전 프로젝트" name={prev.name} />
              ) : (
                <span />
              )}
              {next && <ProjectNav href={`/about/projects/${next.slug}`} dir="다음 프로젝트" name={next.name} alignRight />}
            </nav>
          </div>

          {body && (
            <aside className="hidden xl:block">
              <div className="sticky top-12 pt-[76px]">
                <Outline selector=".article h1, .article h2, .article h3" />
              </div>
            </aside>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function ProjectNav(props: { href: string; dir: string; name: string; alignRight?: boolean }) {
  return (
    <Link
      href={props.href}
      className={`group rounded-[22px] bg-surface p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,23,51,0.08)] ${
        props.alignRight ? "text-right" : ""
      }`}
    >
      <p className="text-[12px] font-semibold text-text-3">{props.dir}</p>
      <p className="mt-1 truncate text-[15px] font-bold transition-colors group-hover:text-primary">{props.name}</p>
    </Link>
  );
}
