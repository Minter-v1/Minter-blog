import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import { loadDictionary, type Dictionary } from "@/lib/dictionary";
import { LogoutButton } from "./components/logout-button";
import { TermForm } from "./components/term-form";
import { TermList } from "./components/term-list";

export default async function Home() {
  const authed = await isAuthed();

  let dictionary: Dictionary | null = null;
  let loadError: string | null = null;
  try {
    dictionary = await loadDictionary();
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className={`mx-auto px-6 pb-24 ${authed ? "max-w-[1120px]" : "max-w-[720px]"}`}>
      <header className="flex items-center justify-between py-8">
        <Link href="/" className="text-[22px] font-bold tracking-[-0.03em]">
          IT 용어 사전
          {dictionary && (
            <span className="ml-2 align-middle text-[15px] font-semibold text-primary tabular-nums">
              {dictionary.terms.length}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-1 text-[14px] font-medium text-text-2">
          {dictionary && (
            <a href={dictionary.repoUrl} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60">
              GitHub
            </a>
          )}
          {authed ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60">
              로그인
            </Link>
          )}
        </nav>
      </header>

      {loadError && (
        <div className="rounded-2xl bg-danger-weak px-5 py-4 text-[15px] text-danger">
          <p className="font-semibold">저장소를 읽지 못했어요</p>
          <p className="mt-1 text-[14px] opacity-80">{loadError}</p>
        </div>
      )}

      {dictionary && (
        <div className={authed ? "grid grid-cols-[400px_minmax(0,1fr)] items-start gap-6" : ""}>
          {authed && (
            <section className="sticky top-6 rounded-[24px] bg-surface p-7">
              <h2 className="mb-6 text-[20px] font-bold tracking-[-0.02em]">새 용어 등록</h2>
              <TermForm tags={dictionary.tags} existingSlugs={dictionary.terms.map((t) => t.slug)} />
            </section>
          )}
          <section className="rounded-[24px] bg-surface p-7">
            <TermList terms={dictionary.terms} tags={dictionary.tags} />
          </section>
        </div>
      )}
    </div>
  );
}
