import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadArchive, summarize, type Archive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { EntryList } from "../components/entry-list";
import { SiteHeader } from "../components/site-header";

export async function generateMetadata(props: PageProps<"/[collection]">): Promise<Metadata> {
  const { collection } = await props.params;
  if (!isCollectionId(collection)) return {};
  const c = COLLECTIONS[collection];
  return { title: c.label, description: c.intro };
}

export default async function CollectionPage(props: PageProps<"/[collection]">) {
  const { collection } = await props.params;
  if (!isCollectionId(collection)) notFound();
  const c = COLLECTIONS[collection];
  const [authed, { tag }] = await Promise.all([isAuthed(), props.searchParams]);

  let archive: Archive | null = null;
  let loadError: string | null = null;
  try {
    archive = await loadArchive();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }
  const entries = archive?.entries.filter((e) => e.collection === collection) ?? [];

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24">
      <SiteHeader authed={authed} active={collection} writeHref={`/write?c=${collection}`} />

      <div className="mt-4 mb-6 px-1">
        <h1 className="text-[28px] font-bold tracking-[-0.035em]">
          {c.label}
          {archive && <span className="ml-2 text-[20px] text-primary tabular-nums">{entries.length}</span>}
        </h1>
        <p className="mt-1.5 text-[15px] text-text-3">{c.intro}</p>
      </div>

      {loadError && (
        <div className="rounded-2xl bg-danger-weak px-5 py-4 text-[15px] text-danger">
          <p className="font-semibold">저장소를 읽지 못했어요</p>
          <p className="mt-1 text-[14px] opacity-80">{loadError}</p>
        </div>
      )}

      {archive && (
        <section className="rounded-[24px] bg-surface p-7">
          <EntryList
            collection={collection}
            entries={entries.map(summarize)}
            tags={archive.tags[collection]}
            initialTag={typeof tag === "string" ? tag : null}
          />
        </section>
      )}
    </div>
  );
}
