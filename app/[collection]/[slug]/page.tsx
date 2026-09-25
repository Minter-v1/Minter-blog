import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeSlug } from "@/lib/api";
import { findEntry, loadArchive, relatedOf } from "@/lib/archive";
import { COLLECTIONS, entryHref, isCollectionId, type CollectionId } from "@/lib/collections";
import { Article } from "../../components/article";
import { AuthOnly } from "../../components/auth";
import { ArrowUpRight, ChevronRight } from "../../components/icons";
import { Outline } from "../../components/outline";
import { SiteHeader } from "../../components/site-header";

type Props = PageProps<"/[collection]/[slug]">;

// 글은 계속 늘어나므로 빌드 때 미리 만들지 않고, 처음 방문할 때 만들어 캐시한다
// 기존 글은 빌드 때 미리 만들고, 이후 새로 쓴 글은 첫 방문 때 만들어 캐시
export async function generateStaticParams() {
  const { entries } = await loadArchive();
  return entries.map((e) => ({ collection: e.collection, slug: e.slug }));
}
// 공개 페이지: 미리 만들어 CDN에 캐시하고, 글을 쓰면 revalidateTag("archive")로 즉시 갱신 (그 외엔 5분마다)
export const revalidate = 300;

async function find(props: Props) {
  const { collection, slug } = await props.params;
  if (!isCollectionId(collection)) return null;
  const archive = await loadArchive();
  const entry = findEntry(archive, collection, decodeSlug(slug));
  return entry ? { entry, archive } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await find(props);
  if (!found) return {};
  const { entry } = found;
  return { title: `${entry.title} · ${COLLECTIONS[entry.collection].label}`, description: entry.description };
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${y}년 ${m}월 ${d}일` : iso;
}

export default async function EntryPage(props: Props) {
  const found = await find(props);
  if (!found) notFound();
  const { entry, archive } = found;
  const c = COLLECTIONS[entry.collection];
  const related = relatedOf(entry, archive.entries);

  // Git 명령어 화면: 이 명령어를 언급하거나 Git 분야인 트러블슈팅을 자동으로 보여준다 (연결 안 해 둬도)
  const gitTroubles =
    c.id === "git"
      ? archive.entries
          .filter((e) => e.collection === "troubleshooting" && !related.some((r) => r.ref === e.ref))
          .map((e) => {
            const text = [e.title, e.description, e.extra.error ?? "", e.body].join("\n").toLowerCase();
            const mentions = text.includes(entry.title.toLowerCase());
            return { e, score: mentions ? 2 : e.tags.includes("Git") ? 1 : 0 };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((x) => x.e)
      : [];
  const editHref = `/write?c=${c.id}&edit=${encodeURIComponent(entry.slug)}`;

  return (
    // 넓은 화면에서는 본문 오른쪽에 목차 칼럼
    <div className="mx-auto max-w-[760px] px-6 pb-24 xl:max-w-[1036px]">
      <SiteHeader active={c.id} writeHref={`/write?c=${c.id}`} />

      <div className="xl:grid xl:grid-cols-[760px_220px] xl:gap-8">
        <div>
          <article className="rounded-[28px] bg-surface px-12 pt-12 pb-16">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={`/${c.id}`} className="mr-1 text-[13px] font-semibold text-text-3 hover:text-text-2">
                  {c.label}
                </Link>
                {entry.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/${c.id}?tag=${encodeURIComponent(t)}`}
                    className="rounded-full bg-primary-weak px-3 py-1 text-[13px] font-semibold text-primary hover:bg-[#d6e8ff]"
                  >
                    {t}
                  </Link>
                ))}
              </div>
              <AuthOnly>
                <Link
                  href={editHref}
                  className="rounded-xl bg-fill px-3.5 py-2 text-[14px] font-semibold text-text-2 transition-colors hover:bg-fill-strong"
                >
                  수정
                </Link>
              </AuthOnly>
            </div>

            <h1
              className={`mt-5 leading-tight font-bold tracking-[-0.035em] ${
                c.id === "git" ? "font-mono text-[32px]" : "text-[36px]"
              }`}
            >
              {entry.title}
            </h1>
            <p className="mt-4 text-[19px] leading-[1.6] font-medium tracking-[-0.02em] text-text-2">
              {entry.description}
            </p>

            {/* 컬렉션별 추가 필드: Git 사용법, 트러블슈팅 에러 메시지 */}
            {c.extraFields
              .filter((f) => entry.extra[f.key])
              .map((f) => (
                <div key={f.key} className="mt-5">
                  <p className="mb-1.5 text-[13px] font-semibold text-text-3">{f.label}</p>
                  <pre
                    className={`overflow-x-auto rounded-2xl px-5 py-3.5 font-mono text-[14px] leading-relaxed ${
                      f.key === "error" ? "bg-danger-weak text-danger" : "bg-[#f7f8fa] text-text"
                    }`}
                  >
                    {entry.extra[f.key]}
                  </pre>
                </div>
              ))}

            <p className="mt-5 text-[14px] text-text-3">
              {formatDate(entry.date)}
              {entry.updated && ` · ${formatDate(entry.updated)} 수정`}
            </p>

            {entry.body ? (
              <>
                <hr className="my-10 border-line" />
                <Article markdown={entry.body} rawBase={archive.rawBase[c.id]} />
              </>
            ) : (
              <AuthOnly>
                <Link
                  href={editHref}
                  className="mt-10 block rounded-2xl border-2 border-dashed border-fill-strong py-8 text-center text-[15px] font-medium text-text-3 transition-colors hover:border-primary hover:text-primary"
                >
                  + 상세 설명 쓰기
                </Link>
              </AuthOnly>
            )}
          </article>

          {related.length > 0 && (
            <section className="mt-6 rounded-[28px] bg-surface px-8 pt-8 pb-6">
              <h2 className="px-4 text-[17px] font-bold tracking-[-0.02em]">
                연관 기록
                <span className="ml-1.5 text-primary tabular-nums">{related.length}</span>
              </h2>
              <ul className="mt-3">
                {related.map((r) => (
                  <li key={r.ref}>
                    <RelatedRow
                      href={entryHref(r.collection, r.slug)}
                      collection={r.collection}
                      showCollection={r.collection !== c.id}
                      title={r.title}
                      description={r.description}
                      tags={r.tags}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {gitTroubles.length > 0 && (
            <section className="mt-6 rounded-[28px] bg-surface px-8 pt-8 pb-6">
              <h2 className="px-4 text-[17px] font-bold tracking-[-0.02em]">
                Git 트러블슈팅
                <span className="ml-1.5 text-primary tabular-nums">{gitTroubles.length}</span>
              </h2>
              <p className="mt-1 px-4 text-[13px] text-text-3">이 명령어를 언급했거나 Git 분야인 트러블슈팅이에요.</p>
              <ul className="mt-3">
                {gitTroubles.map((r) => (
                  <li key={r.ref}>
                    <RelatedRow
                      href={entryHref(r.collection, r.slug)}
                      collection={r.collection}
                      showCollection={false}
                      title={r.title}
                      description={r.description}
                      tags={r.tags}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-6 flex items-center justify-between px-2 text-[14px] font-medium text-text-3">
            <Link href={`/${c.id}`} className="hover:text-text-2">
              ← {c.label}
            </Link>
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-text-2"
            >
              GitHub에서 보기
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        {entry.body && (
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

function RelatedRow(props: {
  href: string;
  collection: CollectionId;
  showCollection: boolean;
  title: string;
  description: string;
  tags: string[];
}) {
  return (
    <Link
      href={props.href}
      className="group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-[background-color,transform] duration-150 hover:bg-fill active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span
            className={`truncate font-semibold tracking-[-0.02em] transition-colors group-hover:text-primary ${
              props.collection === "git" ? "font-mono text-[15px]" : "text-[16px]"
            }`}
          >
            {props.title}
          </span>
          {props.showCollection && (
            <span className="shrink-0 text-[12px] font-semibold text-text-3">{COLLECTIONS[props.collection].label}</span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[14px] text-text-3">{props.description}</p>
      </div>
      <span className="flex shrink-0 gap-1">
        {props.tags.map((t) => (
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
  );
}
