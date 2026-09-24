"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/prepare-image";
import { toSlug } from "@/lib/slug";
import { COLLECTION_LIST, COLLECTIONS, entryHref, type CollectionId } from "@/lib/collections";
import type { Tag } from "@/lib/tags";
import type { BodyEditorApi } from "./body-editor";
import { Check } from "./icons";
import { Spinner } from "./loaders";
import { OutlinePopover } from "./outline";
import { RelatedPicker, type RelatedCandidate } from "./related-picker";
import { TagPicker } from "./tag-picker";

const BodyEditor = dynamic(() => import("./body-editor"), {
  ssr: false,
  loading: () => <p className="px-[54px] text-[16px] text-text-3">에디터 불러오는 중…</p>,
});

type Initial = {
  title: string;
  description: string;
  tags: string[];
  related: string[];
  extra: Record<string, string>;
  body: string;
};

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function WriteForm(props: {
  collection: CollectionId;
  mode: "create" | "edit";
  slug?: string;
  initial: Initial;
  tags: Tag[];
  existingSlugs: string[]; // 같은 컬렉션의 파일명 (중복 확인용)
  candidates: RelatedCandidate[]; // 연관 기록으로 고를 수 있는 전 컬렉션 기록 (자기 자신 제외)
  backlinks: { ref: string; title: string }[]; // 이 기록을 연결해 둔 다른 글
}) {
  const router = useRouter();
  const c = COLLECTIONS[props.collection];
  const editing = props.mode === "edit";
  const titleRef = useRef<HTMLInputElement>(null);
  const editorApi = useRef<BodyEditorApi | null>(null);
  const uploads = useRef(new Map<string, { sha: string; ext: string }>());

  const [title, setTitle] = useState(props.initial.title);
  const [description, setDescription] = useState(props.initial.description);
  const [tags, setTags] = useState(props.tags);
  const [selected, setSelected] = useState(props.initial.tags);
  const [related, setRelated] = useState(props.initial.related);
  const [extra, setExtra] = useState(props.initial.extra);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; href: string } | null>(null);
  const [outlineVersion, setOutlineVersion] = useState(0);

  const slug = editing ? props.slug! : toSlug(title);
  const duplicate = !editing && slug !== "" && props.existingSlugs.includes(slug);
  const canSubmit =
    !submitting && !deleting && pendingUploads === 0 && title.trim() !== "" && description.trim() !== "" && !duplicate;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // 긴 글을 쓰다가 실수로 창을 닫지 않도록
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // 에디터 안에서 붙여넣기/드래그한 이미지: 줄인 뒤 git blob으로 먼저 올려둔다
  const uploadFile = useCallback(async (file: File) => {
    setPendingUploads((n) => n + 1);
    setError(null);
    try {
      const prepared = await prepareImage(file);
      const form = new FormData();
      form.set("file", prepared);
      const res = await fetch("/api/images", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { sha?: string; ext?: string; error?: string };
      if (!res.ok || !data.sha || !data.ext) throw new Error(data.error ?? `이미지 업로드 실패 (${res.status})`);
      const url = URL.createObjectURL(prepared);
      uploads.current.set(url, { sha: data.sha, ext: data.ext });
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setPendingUploads((n) => n - 1);
    }
  }, []);

  const onEditorReady = useCallback((api: BodyEditorApi) => {
    editorApi.current = api;
    setOutlineVersion((v) => v + 1);
  }, []);
  const onEditorChange = useCallback(() => {
    setDirty(true);
    setOutlineVersion((v) => v + 1);
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit || !editorApi.current) return;
    setSubmitting(true);
    setError(null);
    const markdown = editorApi.current.getMarkdown();
    const payload = {
      collection: c.id,
      title,
      description,
      tags: selected,
      related,
      extra,
      // 템플릿(## 상황 ## 원인 …)을 채우지 않았으면 본문 없음으로
      body: c.bodyTemplate && squash(markdown) === squash(c.bodyTemplate) ? "" : markdown,
      images: [...uploads.current].map(([url, v]) => ({ url, ...v })),
    };

    try {
      const res = await fetch(editing ? `/api/entries/${c.id}/${encodeURIComponent(slug)}` : "/api/entries", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!res.ok || !data.slug) throw new Error(data.error ?? `저장 실패 (${res.status})`);

      setDirty(false);
      const href = entryHref(c.id, data.slug);
      if (editing) {
        router.push(href);
        router.refresh();
        return;
      }
      // 일요일 배치 정리: 저장하고 바로 다음 기록을 쓸 수 있게 비운다
      setToast({ text: `‘${title.trim()}’ 등록했어요`, href });
      uploads.current.forEach((_, url) => URL.revokeObjectURL(url));
      uploads.current.clear();
      setTitle("");
      setDescription("");
      setSelected([]);
      setRelated([]);
      setExtra({});
      editorApi.current.reset(c.bodyTemplate);
      setDirty(false);
      router.refresh();
      titleRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, c, title, description, selected, related, extra, editing, slug, router]);

  // ⌘Enter는 에디터 안에서도 저장
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [submit]);

  async function remove() {
    if (!window.confirm(`‘${props.initial.title}’을(를) 삭제할까요?\nmd 파일과 이미지가 repo에서 지워져요. (커밋 기록에는 남아요)`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${c.id}/${encodeURIComponent(slug)}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `삭제 실패 (${res.status})`);
      setDirty(false);
      router.push(`/${c.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  const submitLabel = submitting
    ? "저장하는 중…"
    : pendingUploads > 0
      ? "이미지 올리는 중…"
      : editing
        ? "저장하기"
        : "등록하기";

  return (
    <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-6">
      <aside className="sticky top-6 space-y-7 rounded-[24px] bg-surface p-7">
        {editing ? (
          <div className="flex items-baseline justify-between">
            <h1 className="text-[20px] font-bold tracking-[-0.02em]">{c.itemLabel} 수정</h1>
            <Link href={entryHref(c.id, slug)} className="text-[13px] font-medium text-text-3 hover:text-text-2">
              취소
            </Link>
          </div>
        ) : (
          // 새로 쓸 때는 어느 컬렉션에 쓸지 고른다
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-fill p-1" role="tablist" aria-label="컬렉션">
            {COLLECTION_LIST.map((col) => (
              <button
                key={col.id}
                type="button"
                role="tab"
                aria-selected={col.id === c.id}
                onClick={() => {
                  if (col.id === c.id) return;
                  if (dirty && !window.confirm("작성 중인 내용이 사라져요. 다른 컬렉션으로 옮길까요?")) return;
                  setDirty(false);
                  router.push(`/write?c=${col.id}`);
                }}
                className={`h-9 rounded-xl text-[13px] font-semibold transition-colors ${
                  col.id === c.id ? "bg-surface text-text shadow-sm" : "text-text-3 hover:text-text-2"
                }`}
              >
                {col.shortLabel}
              </button>
            ))}
          </div>
        )}

        <Field label={c.titleLabel} htmlFor="title">
          <input
            id="title"
            ref={titleRef}
            autoFocus={!editing}
            autoComplete="off"
            placeholder={c.titlePlaceholder}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                document.getElementById("description")?.focus();
              }
            }}
            className={`${inputClass} h-13 text-[17px] font-semibold ${duplicate ? "ring-2 ring-danger" : ""}`}
          />
          {slug && (
            <p className={`mt-2 px-1 text-[13px] ${duplicate ? "text-danger" : "text-text-3"}`}>
              {duplicate && `이미 등록된 ${c.itemLabel}예요 · `}
              <span className="font-mono text-[12px]">
                {c.dir}/{slug}.md
              </span>
              {editing && " · 파일명은 그대로 유지돼요"}
            </p>
          )}
        </Field>

        <Field
          label={c.descriptionLabel}
          htmlFor="description"
          aside={<span className="tabular-nums">{description.length}</span>}
        >
          <textarea
            id="description"
            rows={3}
            placeholder={c.descriptionPlaceholder}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value.replace(/\n/g, " "));
              setDirty(true);
            }}
            onKeyDown={(e) => {
              // 한 줄 설명은 줄바꿈 없이. Enter는 상세 설명으로 이동
              if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                editorApi.current?.focus();
              }
            }}
            className={`${inputClass} resize-none py-3.5 text-[15px] leading-[1.6]`}
          />
        </Field>

        {c.extraFields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`extra-${f.key}`}>
            <input
              id={`extra-${f.key}`}
              autoComplete="off"
              spellCheck={false}
              placeholder={f.placeholder}
              value={extra[f.key] ?? ""}
              onChange={(e) => {
                setExtra((prev) => ({ ...prev, [f.key]: e.target.value }));
                setDirty(true);
              }}
              className={`${inputClass} h-11 ${f.mono ? "font-mono text-[13px]" : "text-[15px]"}`}
            />
          </Field>
        ))}

        <Field
          label={c.tagLabel}
          aside={
            <span className={`tabular-nums ${selected.length === c.maxTags ? "text-primary" : ""}`}>
              {selected.length}/{c.maxTags}
            </span>
          }
        >
          <TagPicker
            collection={c.id}
            tags={tags}
            selected={selected}
            onChange={(s) => {
              setSelected(s);
              setDirty(true);
            }}
            onTagsChange={setTags}
          />
        </Field>

        <Field label="연관 기록" aside={related.length > 0 && <span className="tabular-nums">{related.length}</span>}>
          <RelatedPicker
            collection={c.id}
            candidates={props.candidates}
            selected={related}
            onChange={(r) => {
              setRelated(r);
              setDirty(true);
            }}
            contextTags={selected}
          />
          {props.backlinks.length > 0 && (
            <p className="mt-2 px-1 text-[13px] leading-relaxed text-text-3">
              {props.backlinks.map((b) => b.title).join(", ")}에서 이 {c.itemLabel}을(를) 연결했어요. 상세 화면에 자동으로
              함께 보여요.
            </p>
          )}
        </Field>

        {error && <p className="rounded-xl bg-danger-weak px-4 py-3 text-[14px] text-danger">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="relative h-14 w-full rounded-2xl bg-primary text-[17px] font-semibold text-white transition-[background-color,transform] hover:bg-primary-press active:scale-[0.99] disabled:bg-fill-strong disabled:text-text-3 disabled:active:scale-100"
          >
            <span className="inline-flex items-center gap-2">
              {(submitting || pendingUploads > 0) && <Spinner />}
              {submitLabel}
            </span>
            <span className="absolute top-1/2 right-5 -translate-y-1/2 text-[13px] font-medium opacity-60">⌘↵</span>
          </button>
          {editing && (
            <button
              type="button"
              onClick={remove}
              disabled={submitting || deleting}
              className="h-11 w-full rounded-2xl text-[14px] font-semibold text-danger transition-colors hover:bg-danger-weak disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-2">
                {deleting && <Spinner />}
                {deleting ? "삭제하는 중…" : `이 ${c.itemLabel} 삭제`}
              </span>
            </button>
          )}
        </div>
      </aside>

      <section className="min-h-[calc(100vh-140px)] rounded-[24px] bg-surface pb-24">
        {/* 긴 글을 쓰며 내려가도 목차 버튼이 따라오도록 */}
        <div className="sticky top-0 z-20 mb-2 flex items-center justify-between gap-4 rounded-t-[24px] bg-surface/90 px-[54px] pt-6 pb-3 backdrop-blur">
          <h2 className="text-[14px] font-semibold text-text-2">상세 설명</h2>
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-text-3">
              <Kbd>/</Kbd> 블록 · <Kbd>⋮⋮</Kbd> 끌어서 순서 변경 · 이미지 붙여넣기·드래그
            </p>
            <OutlinePopover
              selector='.body-editor .bn-block-content[data-content-type="heading"]'
              version={outlineVersion}
            />
          </div>
        </div>
        <BodyEditor
          initialMarkdown={props.initial.body}
          uploadFile={uploadFile}
          onReady={onEditorReady}
          onChange={onEditorChange}
        />
      </section>

      {toast && (
        <div
          role="status"
          className="fixed bottom-8 left-1/2 z-50 flex animate-[toast-in_200ms_ease-out] items-center gap-2 rounded-full bg-text/90 py-3 pr-2 pl-4 text-[15px] font-medium text-white shadow-lg backdrop-blur"
          style={{ transform: "translateX(-50%)" }}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3" />
          </span>
          {toast.text}
          <Link href={toast.href} className="ml-2 rounded-full bg-white/15 px-3 py-1 text-[14px] hover:bg-white/25">
            보기
          </Link>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl bg-fill px-4 outline-none transition-shadow placeholder:font-normal placeholder:text-text-3 focus:bg-surface focus:ring-2 focus:ring-primary";

function Field(props: { label: string; htmlFor?: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between px-1 text-[14px] font-semibold text-text-2">
        <label htmlFor={props.htmlFor}>{props.label}</label>
        {props.aside && <span className="text-[13px] font-medium text-text-3">{props.aside}</span>}
      </div>
      {props.children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md bg-fill px-1.5 py-0.5 font-sans text-[12px] font-semibold text-text-2">{children}</kbd>;
}
