import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadArchive, type Entry } from "@/lib/archive";
import { entryHref } from "@/lib/collections";
import { PROFILE } from "@/lib/profile";
import { projectsWithDetail, readProjectBody } from "@/lib/projects";
import { Reveal } from "../../../components/about/reveal";
import { ProjectCoverMedia } from "../../../components/about/project-cover";
import { Rich } from "../../../components/about/rich";
import { Article } from "../../../components/article";
import { ArrowUpRight, ChevronRight } from "../../../components/icons";
import { Outline } from "../../../components/outline";
import { SiteHeader } from "../../../components/site-header";
import { CollectionIcon } from "../../../components/collection-icon";

type Props = PageProps<"/about/projects/[slug]">;

// 상세 본문이 있는 프로젝트만 페이지를 만든다
const detailProjects = async () => {
  const has = await projectsWithDetail(PROFILE.projects.map((p) => p.slug));
  return PROFILE.projects.filter((p) => has.has(p.slug));
};

export async function generateStaticParams() {
  return (await detailProjects()).map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;
// 공개 페이지: 미리 만들어 CDN에 캐시하고, 글을 쓰면 revalidateTag("archive")로 즉시 갱신 (그 외엔 5분마다)
export const revalidate = 300;

const find = (slug: string) => PROFILE.projects.findIndex((p) => p.slug === slug);

export async function generateMetadata(props: Props): Promise<Metadata> {
  const p = PROFILE.projects[find((await props.params).slug)];
  return p ? { title: `${p.name} · 프로젝트`, description: p.bullets[0]?.replace(/\[\[|\]\]|\*\*/g, "") } : {};
}

export default async function ProjectPage(props: Props) {
  const { slug } = await props.params;
  const projects = await detailProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const p = projects[index];
  const prev = projects[index - 1];
  const next = projects[index + 1];

  const body = await readProjectBody(slug);

  // 관련 블로그 기록 (저장소를 못 읽어도 페이지는 보이게)
  let related: Entry[] = [];
  try {
    const { entries } = await loadArchive();
    const byRef = new Map(entries.map((e) => [e.ref, e]));
    related = (p.related ?? []).map((r) => byRef.get(r)).filter((e): e is Entry => !!e);
  } catch {}

  return (
    <div className="mx-auto max-w-[760px] px-4 sm:px-6 pb-24 xl:max-w-[1036px]">
      <SiteHeader active="about" writeHref="/write" />

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
            <Link
              href="/about/portfolio"
              className="float-right mb-4 inline-flex items-center gap-1 px-1 text-[14px] font-semibold text-text-3 hover:text-primary"
            >
              포트폴리오 PDF
              <ChevronRight className="size-3.5" />
            </Link>

            <article className="rounded-[24px] bg-surface px-5 pt-7 pb-10 sm:rounded-[28px] sm:px-12 sm:pt-11 sm:pb-14">
              <p className="text-[14px] font-medium text-text-3 tabular-nums">{p.period}</p>
              <h1 data-name className="mt-2 text-[28px] leading-tight sm:text-[34px] font-bold tracking-[-0.035em]">
                {p.name}
              </h1>
              {p.tagline && <p className="mt-1 text-[18px] font-semibold text-text-3">{p.tagline}</p>}

              <div className="mt-5 flex flex-wrap gap-1.5 text-[13px] font-semibold">
                <span className="rounded-lg bg-fill px-2.5 py-1 text-text-2">{p.team}</span>
                <span className="rounded-lg bg-primary-weak px-2.5 py-1 text-primary">{p.role}</span>
                {p.repo ? (
                  <a
                    href={p.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-text-2 hover:text-text"
                  >
                    GitHub
                    <ArrowUpRight className="size-3" />
                  </a>
                ) : p.repo === "" ? (
                  <span className="rounded-lg border border-dashed border-line px-2.5 py-1 text-text-3">GitHub 준비 중</span>
                ) : null}
              </div>

              {p.cover && <ProjectCoverMedia cover={p.cover} controls={"video" in p.cover} fit="contain" className="mt-6 aspect-[16/9] rounded-2xl" />}

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

              <hr className="my-10 border-line" />
              <Article markdown={body} rawBase="" />
            </article>

            {related.length > 0 && (
              <section data-reveal className="mt-6 rounded-[24px] bg-surface px-2 pt-6 pb-4 sm:rounded-[28px] sm:px-8 sm:pt-8 sm:pb-6">
                <h2 className="px-4 text-[17px] font-bold tracking-[-0.02em]">
                  관련 학습 기록
                  <span className="ml-1.5 text-primary tabular-nums">{related.length}</span>
                </h2>
                <ul className="mt-3">
                  {related.map((e) => (
                    <li key={e.ref}>
                      <Link
                        href={entryHref(e.collection, e.slug)}
                        className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-fill"
                      >
                        <CollectionIcon id={e.collection} className="text-[20px]" />
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
            <nav data-reveal className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              {prev ? (
                <ProjectNav href={`/about/projects/${prev.slug}`} dir="이전 프로젝트" name={prev.name} />
              ) : (
                <span />
              )}
              {next && <ProjectNav href={`/about/projects/${next.slug}`} dir="다음 프로젝트" name={next.name} alignRight />}
            </nav>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-12 pt-[76px]">
              <Outline selector=".article h1, .article h2, .article h3" />
            </div>
          </aside>
        </div>
      </Reveal>
    </div>
  );
}

function ProjectNav(props: { href: string; dir: string; name: string; alignRight?: boolean }) {
  return (
    <Link
      href={props.href}
      className={`group min-w-0 rounded-[22px] bg-surface p-4 sm:p-5 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,23,51,0.08)] ${
        props.alignRight ? "text-right" : ""
      }`}
    >
      <p className="text-[12px] font-semibold text-text-3">{props.dir}</p>
      <p className="mt-1 truncate text-[15px] font-bold transition-colors group-hover:text-primary">{props.name}</p>
    </Link>
  );
}
