import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeSlug } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { loadDictionary, relatedTermsOf } from "@/lib/dictionary";
import { Article } from "../../components/article";
import { ArrowUpRight, ChevronRight } from "../../components/icons";
import { Outline } from "../../components/outline";
import { SiteHeader } from "../../components/site-header";

async function findTerm(rawSlug: string) {
  const dictionary = await loadDictionary();
  const term = dictionary.terms.find((t) => t.slug === decodeSlug(rawSlug));
  return term ? { term, dictionary } : null;
}

export async function generateMetadata(props: PageProps<"/terms/[slug]">): Promise<Metadata> {
  const found = await findTerm((await props.params).slug);
  if (!found) return { title: "IT 용어 사전" };
  return {
    title: `${found.term.title} · IT 용어 사전`,
    description: found.term.description,
  };
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${y}년 ${m}월 ${d}일` : iso;
}

export default async function TermPage(props: PageProps<"/terms/[slug]">) {
  const [found, authed] = await Promise.all([findTerm((await props.params).slug), isAuthed()]);
  if (!found) notFound();
  const { term, dictionary } = found;
  const related = relatedTermsOf(term, dictionary.terms);

  return (
    // 넓은 화면에서는 본문 오른쪽에 목차 칼럼
    <div className="mx-auto max-w-[760px] px-6 pb-24 xl:max-w-[1036px]">
      <SiteHeader authed={authed} repoUrl={dictionary.repoUrl} showWrite />

      <div className="xl:grid xl:grid-cols-[760px_220px] xl:gap-8">
        <div>
          <article className="rounded-[28px] bg-surface px-12 pt-12 pb-16">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {term.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/?tag=${encodeURIComponent(t)}`}
                    className="rounded-full bg-primary-weak px-3 py-1 text-[13px] font-semibold text-primary hover:bg-[#d6e8ff]"
                  >
                    {t}
                  </Link>
                ))}
              </div>
              {authed && (
                <Link
                  href={`/write?edit=${encodeURIComponent(term.slug)}`}
                  className="rounded-xl bg-fill px-3.5 py-2 text-[14px] font-semibold text-text-2 transition-colors hover:bg-fill-strong"
                >
                  수정
                </Link>
              )}
            </div>

            <h1 className="mt-5 text-[36px] leading-tight font-bold tracking-[-0.035em]">{term.title}</h1>
            <p className="mt-4 text-[19px] leading-[1.6] font-medium tracking-[-0.02em] text-text-2">
              {term.description}
            </p>
            <p className="mt-5 text-[14px] text-text-3">
              {formatDate(term.date)}
              {term.updated && ` · ${formatDate(term.updated)} 수정`}
            </p>

            {term.body ? (
              <>
                <hr className="my-10 border-line" />
                <Article markdown={term.body} rawBase={dictionary.rawBase} />
              </>
            ) : (
              authed && (
                <Link
                  href={`/write?edit=${encodeURIComponent(term.slug)}`}
                  className="mt-10 block rounded-2xl border-2 border-dashed border-fill-strong py-8 text-center text-[15px] font-medium text-text-3 transition-colors hover:border-primary hover:text-primary"
                >
                  아직 상세 설명이 없어요. 이어서 써 볼까요?
                </Link>
              )
            )}
          </article>

          {related.length > 0 && (
            <section className="mt-6 rounded-[28px] bg-surface px-8 pt-8 pb-6">
              <h2 className="px-4 text-[17px] font-bold tracking-[-0.02em]">
                연관 용어
                <span className="ml-1.5 text-primary tabular-nums">{related.length}</span>
              </h2>
              <ul className="mt-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/terms/${encodeURIComponent(r.slug)}`}
                      className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-[background-color,transform] duration-150 hover:bg-fill active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary">
                          {r.title}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] text-text-3">{r.description}</p>
                      </div>
                      <span className="flex shrink-0 gap-1">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-fill px-1.5 py-0.5 text-[12px] font-medium text-text-2 transition-colors group-hover:bg-surface"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-text-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-6 flex items-center justify-between px-2 text-[14px] font-medium text-text-3">
            <Link href="/" className="hover:text-text-2">
              ← 목록으로
            </Link>
            <a
              href={term.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-text-2"
            >
              GitHub에서 보기
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        {term.body && (
          <aside className="hidden xl:block">
            <div className="sticky top-12 pt-12">
              <Outline selector=".article h1, .article h2, .article h3" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
