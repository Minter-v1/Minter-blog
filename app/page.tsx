import { buildActivity } from "@/lib/activity";
import { loadArchive, type Archive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTION_IDS, type CollectionId } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { Activity } from "./components/home/activity";
import { CollectionCards, type CardItem } from "./components/home/collection-cards";
import { Hero } from "./components/home/hero";
import { KnowledgeMap } from "./components/home/knowledge-map";
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

  const entries = archive?.entries ?? [];
  const byCollection = (id: CollectionId) => entries.filter((e) => e.collection === id);
  const counts = Object.fromEntries(COLLECTION_IDS.map((id) => [id, byCollection(id).length])) as Record<CollectionId, number>;
  const recent = Object.fromEntries(
    COLLECTION_IDS.map((id) => [id, byCollection(id).slice(0, 3).map(({ collection, slug, title }) => ({ collection, slug, title }))]),
  ) as Record<CollectionId, CardItem[]>;

  // 연결 지도: 연관 연결은 양쪽이 모두 존재하는 것만, 중복(A→B, B→A) 없이
  const refs = new Set(entries.map((e) => e.ref));
  const seen = new Set<string>();
  const links: [string, string][] = [];
  for (const e of entries) {
    for (const r of e.related) {
      const key = [e.ref, r].sort().join("|");
      if (refs.has(r) && !seen.has(key)) {
        seen.add(key);
        links.push([e.ref, r]);
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24">
      <SiteHeader authed={authed} writeHref="/write" />

      {loadError && (
        <div className="mb-6 rounded-2xl bg-danger-weak px-5 py-4 text-[15px] text-danger">
          <p className="font-semibold">저장소를 읽지 못했어요</p>
          <p className="mt-1 text-[14px] opacity-80">{loadError}</p>
        </div>
      )}

      <Hero
        counts={counts}
        recent={entries
          .slice(0, 16)
          .map(({ collection, slug, title, description, date }) => ({ collection, slug, title, description, date }))}
      />

      <div className="mt-16 space-y-12">
        <KnowledgeMap
          entries={entries.map(({ ref, collection, slug, title, description }) => ({ ref, collection, slug, title, description }))}
          links={links}
        />
        <CollectionCards counts={counts} recent={recent} />
        <Activity data={buildActivity(entries)} goals={SITE.weeklyGoal} />
      </div>
    </div>
  );
}
