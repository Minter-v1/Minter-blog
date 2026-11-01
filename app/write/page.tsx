import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { decodeSlug } from "@/lib/api";
import { findEntry, loadArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTION_IDS, isCollectionId, toRef, type CollectionId } from "@/lib/collections";
import { isStepId, stepName, stepOf, stepPostsOf, type StepId } from "@/lib/learning-steps";
import { findTemplate, templateMarkdown } from "@/lib/learning-template";
import { absolutizeImages } from "@/lib/paths";
import { DraftTray } from "../components/draft-tray";
import { SiteHeader } from "../components/site-header";
import { WriteForm } from "../components/write-form";

export const metadata: Metadata = { title: "작성" };

// /write?c=git            새 Git 명령어
// /write?c=git&edit=rebase 기존 기록 수정
// /write?c=log&step=hands-on&from=terms/DNS  용어에서 이어 쓰는 단계 글 (#133). 이미 있으면 그 글 편집으로
export default async function WritePage(props: PageProps<"/write">) {
  if (!(await isAuthed())) redirect("/login");

  const { c, edit, step, from } = await props.searchParams;
  const archive = await loadArchive();
  const all = [...archive.entries, ...archive.drafts];
  const refs = new Set(all.map((e) => e.ref));

  // 단계 글: 출발한 용어가 있어야 하고, 같은 용어의 같은 단계 글이 있으면 새로 만들지 않는다
  const source = isStepId(step) && typeof from === "string" ? all.find((e) => e.ref === toRef("terms", decodeSlug(from.replace(/^terms\//, "")))) : null;
  const stepPosts = source ? stepPostsOf(source.ref, all) : {};
  const existingStep = source && isStepId(step) ? stepPosts[step] : undefined;
  if (existingStep) redirect(`/write?c=log&edit=${encodeURIComponent(existingStep.slug)}`);
  const newStep: StepId | null = source && isStepId(step) ? step : null;

  const collection = newStep ? "log" : isCollectionId(c) ? c : "terms";
  const editSlug = !newStep && typeof edit === "string" ? decodeSlug(edit) : null;
  const entry = editSlug ? findEntry(archive, collection, editSlug, true) : null;
  if (editSlug && !entry) notFound();

  // 단계 글이면 출발한 용어를 화면 위에 보여 준다 (새로 쓸 때 · 고칠 때 모두)
  const stepInfo = newStep ? { step: newStep, source: source!.ref } : entry ? stepOf(entry) : null;
  const stepSource = stepInfo ? all.find((e) => e.ref === stepInfo.source) : undefined;

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pb-16">
      <SiteHeader active={collection} />
      <DraftTray drafts={archive.drafts} current={entry?.ref} />
      <WriteForm
        // 컬렉션을 바꾸거나 다른 기록을 수정하러 오면 폼과 에디터를 새로 만든다
        key={`${collection}:${entry?.slug ?? (newStep ? `${newStep}:${source!.ref}` : "new")}`}
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
                draft: entry.draft,
                // 에디터에서 이미지가 보이도록 상대 경로를 raw URL로
                body: absolutizeImages(entry.body, archive.rawBase[collection]),
              }
            : newStep
              ? {
                  // 용어에서 이어 쓰기: 제목 · 템플릿 · 관련 글(용어, Deep Dive면 Hands-on 글도)을 미리 채운다
                  title: `${source!.title} ${stepName(newStep)}`,
                  description: "",
                  tags: [],
                  related: [source!.ref, ...(newStep === "deep-dive" && stepPosts["hands-on"] ? [stepPosts["hands-on"].ref] : [])],
                  extra: { step: newStep, source: source!.ref },
                  draft: true,
                  body: templateMarkdown(findTemplate("log", newStep)),
                }
              : { title: "", description: "", tags: [], related: [], extra: {}, draft: true, body: "" }
        }
        stepSource={stepInfo && stepSource ? { step: stepInfo.step, title: stepSource.title, ref: stepSource.ref } : undefined}
        tags={archive.tags[collection]}
        existingSlugs={all.filter((e) => e.collection === collection).map((e) => e.slug)}
        // 수정할 때 다른 컬렉션으로 옮기면 그 컬렉션의 분류·파일명 중복을 쓴다 (#42)
        allTags={archive.tags}
        slugsByCollection={Object.fromEntries(
          COLLECTION_IDS.map((id) => [id, all.filter((e) => e.collection === id).map((e) => e.slug)]),
        ) as Record<CollectionId, string[]>}
        // 작성 중인 글끼리도 연결할 수 있다 (공개 화면엔 두 글이 모두 공개된 뒤에 보인다)
        candidates={all
          .filter((e) => e.ref !== entry?.ref)
          .map(({ ref, collection, title, description, tags, draft }) => ({ ref, collection, title, description, tags, draft }))}
        backlinks={
          entry
            ? all
                .filter((e) => e.related.includes(entry.ref) && !entry.related.includes(e.ref))
                .map(({ ref, title }) => ({ ref, title }))
            : []
        }
      />
    </div>
  );
}
