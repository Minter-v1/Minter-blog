import Link from "next/link";
import { loadArchive, type Archive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTION_LIST, entryHref } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { ActivityGrid } from "./components/activity-grid";
import { ArrowUpRight, ChevronRight } from "./components/icons";
import { SiteHeader } from "./components/site-header";

export default async function Home() {
  const authed = await isAuthed();

  let archive: Archive | null = null;
  let loadError: string | null = null;
  try {
    archive = await loadArchive();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 pb-24">
      <SiteHeader authed={authed} writeHref="/write" />

      {/* 자기소개 */}
      <section className="pt-10 pb-12">
        <p className="text-[15px] font-semibold text-primary">{SITE.author}</p>
        <h1 className="mt-2 text-[40px] leading-[1.25] font-bold tracking-[-0.04em]">{SITE.headline}</h1>
        <p className="mt-4 max-w-[560px] text-[17px] leading-[1.7] text-text-2">{SITE.bio}</p>
        {SITE.links.length > 0 && (
          <div className="mt-6 flex gap-2">
            {SITE.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-surface px-4 py-2.5 text-[14px] font-semibold text-text-2 transition-colors hover:bg-fill-strong/60"
              >
                {l.label}
                <ArrowUpRight className="size-3.5 text-text-3" />
              </a>
            ))}
          </div>
        )}
      </section>

      {loadError && (
        <div className="rounded-2xl bg-danger-weak px-5 py-4 text-[15px] text-danger">
          <p className="font-semibold">저장소를 읽지 못했어요</p>
          <p className="mt-1 text-[14px] opacity-80">{loadError}</p>
        </div>
      )}

      {archive && (
        <>
          {/* 컬렉션 바로가기 */}
          <section className="grid grid-cols-3 gap-4">
            {COLLECTION_LIST.map((c) => {
              const items = archive.entries.filter((e) => e.collection === c.id);
              return (
                <div key={c.id} className="group relative flex flex-col rounded-[24px] bg-surface p-6">
                  <Link href={`/${c.id}`} className="absolute inset-0 rounded-[24px]" aria-label={c.label} />
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-[18px] font-bold tracking-[-0.02em] transition-colors group-hover:text-primary">
                      {c.label}
                    </h2>
                    <span className="text-[22px] font-bold text-primary tabular-nums">{items.length}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-text-3">{c.intro}</p>
                  <ul className="relative mt-5 space-y-0.5 border-t border-line pt-3">
                    {items.slice(0, 3).map((e) => (
                      <li key={e.ref}>
                        <Link
                          href={entryHref(e.collection, e.slug)}
                          className={`-mx-2 block truncate rounded-lg px-2 py-1.5 text-[14px] font-medium text-text-2 transition-colors hover:bg-fill hover:text-text ${
                            c.id === "git" ? "font-mono text-[13px]" : ""
                          }`}
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))}
                    {items.length === 0 && <li className="py-1.5 text-[14px] text-text-3">아직 비어 있어요</li>}
                  </ul>
                  <span className="relative mt-auto inline-flex items-center gap-0.5 pt-4 text-[13px] font-semibold text-text-3 transition-colors group-hover:text-primary">
                    전체 보기
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              );
            })}
          </section>

          {/* 기록 잔디 */}
          <section className="mt-4 rounded-[24px] bg-surface p-7">
            <ActivityGrid dates={archive.entries.map((e) => e.date)} />
          </section>
        </>
      )}
    </div>
  );
}
