import { isAuthed } from "@/lib/auth";
import { loadDictionary, type Dictionary } from "@/lib/dictionary";
import { SiteHeader } from "./components/site-header";
import { TermList } from "./components/term-list";

export default async function Home(props: PageProps<"/">) {
  const [authed, { tag }] = await Promise.all([isAuthed(), props.searchParams]);

  let dictionary: Dictionary | null = null;
  let loadError: string | null = null;
  try {
    dictionary = await loadDictionary();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24">
      <SiteHeader authed={authed} count={dictionary?.terms.length} repoUrl={dictionary?.repoUrl} showWrite />

      {loadError && (
        <div className="rounded-2xl bg-danger-weak px-5 py-4 text-[15px] text-danger">
          <p className="font-semibold">저장소를 읽지 못했어요</p>
          <p className="mt-1 text-[14px] opacity-80">{loadError}</p>
        </div>
      )}

      {dictionary && (
        <section className="rounded-[24px] bg-surface p-7">
          <TermList
            // 목록에는 본문이 필요 없다
            terms={dictionary.terms.map(({ slug, title, description, tags, date }) => ({ slug, title, description, tags, date }))}
            tags={dictionary.tags}
            initialTag={typeof tag === "string" ? tag : null}
          />
        </section>
      )}
    </div>
  );
}
