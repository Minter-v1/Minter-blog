import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { decodeSlug } from "@/lib/api";
import { findEntry, loadArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { absolutizeImages } from "@/lib/paths";
import { SiteHeader } from "../components/site-header";
import { WriteForm } from "../components/write-form";

export const metadata: Metadata = { title: "작성" };

// /write?c=git            새 Git 명령어
// /write?c=git&edit=rebase 기존 기록 수정
export default async function WritePage(props: PageProps<"/write">) {
  if (!(await isAuthed())) redirect("/login");

  const { c, edit } = await props.searchParams;
  const collection = isCollectionId(c) ? c : "terms";
  const col = COLLECTIONS[collection];
  const archive = await loadArchive();

  const editSlug = typeof edit === "string" ? decodeSlug(edit) : null;
  const entry = editSlug ? findEntry(archive, collection, editSlug) : null;
  if (editSlug && !entry) notFound();

  const refs = new Set(archive.entries.map((e) => e.ref));

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16">
      <SiteHeader authed active={collection} />
      <WriteForm
        // 컬렉션을 바꾸거나 다른 기록을 수정하러 오면 폼과 에디터를 새로 만든다
        key={`${collection}:${entry?.slug ?? "new"}`}
        collection={collection}
        mode={entry ? "edit" : "create"}
        slug={entry?.slug}
        initial={
          entry
            ? {
                title: entry.title,
                description: entry.description,
                tags: entry.tags,
                related: entry.related.filter((r) => refs.has(r)),
                extra: entry.extra,
                // 에디터에서 이미지가 보이도록 상대 경로를 raw URL로
                body: absolutizeImages(entry.body, archive.rawBase[collection]),
              }
            : { title: "", description: "", tags: [], related: [], extra: {}, body: col.bodyTemplate }
        }
        tags={archive.tags[collection]}
        existingSlugs={archive.entries.filter((e) => e.collection === collection).map((e) => e.slug)}
        candidates={archive.entries
          .filter((e) => e.ref !== entry?.ref)
          .map(({ ref, collection, title, description, tags }) => ({ ref, collection, title, description, tags }))}
        backlinks={
          entry
            ? archive.entries
                .filter((e) => e.related.includes(entry.ref) && !entry.related.includes(e.ref))
                .map(({ ref, title }) => ({ ref, title }))
            : []
        }
      />
    </div>
  );
}
