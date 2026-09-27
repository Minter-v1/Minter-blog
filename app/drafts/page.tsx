import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadArchive, summarize } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { DraftBoard } from "../components/drafts";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = { title: "작성 중" };

// 전 컬렉션의 작성 중인 글 (나만). 먼저 적어둔 것부터 정리하도록 오래된 순
export default async function DraftsPage() {
  if (!(await isAuthed())) redirect("/login");
  const { drafts } = await loadArchive();

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 sm:px-6">
      <SiteHeader active="drafts" writeHref="/write" />
      <div className="mt-4 mb-6 px-1">
        <h1 className="text-[24px] font-bold tracking-[-0.035em] sm:text-[28px]">
          작성 중
          <span className="ml-2 text-[20px] text-primary tabular-nums">{drafts.length}</span>
        </h1>
        <p className="mt-1.5 text-[15px] text-text-3">먼저 적어둔 것부터 정리해요 · 나만 보여요</p>
      </div>
      <section className="rounded-[24px] bg-surface p-4 sm:p-7">
        <DraftBoard drafts={drafts.map((d) => ({ ...summarize(d), draft: true as const }))} />
      </section>
    </div>
  );
}
