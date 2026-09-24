import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { decodeSlug } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { loadDictionary } from "@/lib/dictionary";
import { absolutizeImages } from "@/lib/paths";
import { SiteHeader } from "../components/site-header";
import { WriteForm } from "../components/write-form";

export const metadata: Metadata = { title: "작성 · IT 용어 사전" };

export default async function WritePage(props: PageProps<"/write">) {
  if (!(await isAuthed())) redirect("/login");

  const { edit } = await props.searchParams;
  const editSlug = typeof edit === "string" ? decodeSlug(edit) : null;
  const dictionary = await loadDictionary();

  const term = editSlug ? dictionary.terms.find((t) => t.slug === editSlug) : null;
  if (editSlug && !term) notFound();

  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-16">
      <SiteHeader authed />
      <WriteForm
        // 다른 용어를 수정하러 오면 에디터를 새로 만든다
        key={term?.slug ?? "new"}
        mode={term ? "edit" : "create"}
        slug={term?.slug}
        initial={
          term
            ? {
                title: term.title,
                description: term.description,
                tags: term.tags,
                related: term.related.filter((r) => dictionary.terms.some((t) => t.slug === r)),
                // 에디터에서 이미지가 보이도록 상대 경로를 raw URL로
                body: absolutizeImages(term.body, dictionary.rawBase),
              }
            : { title: "", description: "", tags: [], related: [], body: "" }
        }
        tags={dictionary.tags}
        existingSlugs={dictionary.terms.map((t) => t.slug)}
        candidates={dictionary.terms
          .filter((t) => t.slug !== term?.slug)
          .map(({ slug, title, description, tags }) => ({ slug, title, description, tags }))}
        backlinks={
          term
            ? dictionary.terms
                .filter((t) => t.related.includes(term.slug) && !term.related.includes(t.slug))
                .map(({ slug, title }) => ({ slug, title }))
            : []
        }
      />
    </div>
  );
}
