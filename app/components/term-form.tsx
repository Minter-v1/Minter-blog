"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/prepare-image";
import { toSlug } from "@/lib/slug";
import { MAX_TAGS_PER_TERM, type Tag } from "@/lib/tags";
import { Check, Close, ImageIcon, Plus } from "./icons";

type Picked = { file: File; url: string };

const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

export function TermForm(props: { tags: Tag[]; existingSlugs: string[] }) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState(props.tags);
  const [selected, setSelected] = useState<string[]>([]);
  const [images, setImages] = useState<Picked[]>([]);
  const [processing, setProcessing] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const slug = toSlug(title);
  const duplicate = slug !== "" && props.existingSlugs.includes(slug);
  const totalBytes = images.reduce((s, i) => s + i.file.size, 0);
  const canSubmit =
    !submitting && processing === 0 && title.trim() !== "" && description.trim() !== "" && !duplicate && totalBytes <= MAX_TOTAL_BYTES;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setError(null);
    setProcessing((n) => n + imgs.length);
    for (const f of imgs) {
      try {
        const file = await prepareImage(f);
        setImages((prev) => [...prev, { file, url: URL.createObjectURL(file) }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setProcessing((n) => n - 1);
      }
    }
  }

  // 스크린샷 붙여넣기(⌘V)는 폼 어디에 포커스가 있든 받는다
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      e.preventDefault();
      addFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function toggleTag(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : prev.length < MAX_TAGS_PER_TERM ? [...prev, name] : prev,
    );
  }

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    selected.forEach((t) => form.append("tags", t));
    images.forEach((img) => form.append("images", img.file));

    try {
      const res = await fetch("/api/terms", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { error?: string; sha?: string };
      if (!res.ok) throw new Error(data.error ?? `등록 실패 (${res.status})`);

      setToast(`‘${title.trim()}’ 등록했어요`);
      images.forEach((img) => URL.revokeObjectURL(img.url));
      setTitle("");
      setDescription("");
      setSelected([]);
      setImages([]);
      router.refresh();
      titleRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit();
        }
      }}
      className="space-y-7"
    >
      <Field label="용어명" htmlFor="title">
        <input
          id="title"
          ref={titleRef}
          autoFocus
          autoComplete="off"
          placeholder="예) 폴백함수"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            // 용어명에서 Enter는 제출 대신 설명으로 이동
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              document.getElementById("description")?.focus();
            }
          }}
          className={`${inputClass} h-13 text-[17px] font-semibold ${duplicate ? "ring-2 ring-danger" : ""}`}
        />
        {slug && (
          <p className={`mt-2 px-1 text-[13px] ${duplicate ? "text-danger" : "text-text-3"}`}>
            {duplicate ? "이미 등록된 용어예요 · " : ""}
            <span className="font-mono text-[12px]">terms/{slug}.md</span>
          </p>
        )}
      </Field>

      <Field label="설명" htmlFor="description">
        <textarea
          id="description"
          rows={4}
          placeholder="한 줄로 정리해 보세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-none py-3.5 text-[15px] leading-[1.6]`}
        />
      </Field>

      <Field
        label="태그"
        aside={
          <span className={`tabular-nums ${selected.length === MAX_TAGS_PER_TERM ? "text-primary" : ""}`}>
            {selected.length}/{MAX_TAGS_PER_TERM}
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const on = selected.includes(tag.name);
            const full = !on && selected.length >= MAX_TAGS_PER_TERM;
            return (
              <button
                key={tag.name}
                type="button"
                title={tag.hint}
                disabled={full}
                onClick={() => toggleTag(tag.name)}
                aria-pressed={on}
                className={`inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[14px] font-semibold transition-colors ${
                  on ? "bg-primary-weak text-primary" : "bg-fill text-text-2 hover:bg-fill-strong"
                } disabled:opacity-40 disabled:hover:bg-fill`}
              >
                {on && <Check className="-ml-0.5 size-3.5" />}
                {tag.name}
              </button>
            );
          })}
          <NewTagInput
            onAdded={(next, name) => {
              setTags(next);
              setSelected((prev) => (prev.length < MAX_TAGS_PER_TERM ? [...prev, name] : prev));
            }}
          />
        </div>
      </Field>

      <Field label="이미지" aside={images.length > 0 && <span className="tabular-nums">{formatBytes(totalBytes)}</span>}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles([...e.dataTransfer.files]);
          }}
        >
          {images.length === 0 && processing === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed py-6 transition-colors ${
                dragging ? "border-primary bg-primary-weak text-primary" : "border-fill-strong text-text-3 hover:bg-fill"
              }`}
            >
              <ImageIcon className="size-6" />
              <span className="text-[14px] font-medium">
                끌어다 놓거나 <span className="text-text-2">⌘V</span>로 붙여넣기
              </span>
            </button>
          ) : (
            <div
              className={`flex flex-wrap gap-2 rounded-2xl p-2 transition-colors ${dragging ? "bg-primary-weak" : "bg-fill"}`}
            >
              {images.map((img, i) => (
                <div key={img.url} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */}
                  <img src={img.url} alt={`${i + 1}번 이미지`} className="size-[72px] rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label={`${i + 1}번 이미지 빼기`}
                    className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-text/80 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <Close className="size-3" />
                  </button>
                </div>
              ))}
              {processing > 0 && (
                <div className="flex size-[72px] items-center justify-center rounded-xl bg-fill-strong text-[12px] text-text-3">
                  처리 중
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="이미지 추가"
                className="flex size-[72px] items-center justify-center rounded-xl text-text-3 transition-colors hover:bg-fill-strong"
              >
                <Plus className="size-5" />
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>
        {totalBytes > MAX_TOTAL_BYTES && (
          <p className="mt-2 px-1 text-[13px] text-danger">합계가 4MB를 넘어서 올릴 수 없어요. 몇 장만 빼 주세요.</p>
        )}
      </Field>

      {error && <p className="rounded-xl bg-danger-weak px-4 py-3 text-[14px] text-danger">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="relative h-14 w-full rounded-2xl bg-primary text-[17px] font-semibold text-white transition-[background-color,transform] hover:bg-primary-press active:scale-[0.99] disabled:bg-fill-strong disabled:text-text-3 disabled:active:scale-100"
      >
        {submitting ? "등록하는 중…" : "등록하기"}
        <span className="absolute top-1/2 right-5 -translate-y-1/2 text-[13px] font-medium opacity-60">⌘↵</span>
      </button>

      {toast && (
        <div
          role="status"
          className="fixed bottom-8 left-1/2 flex animate-[toast-in_200ms_ease-out] items-center gap-2 rounded-full bg-text/90 py-3 pr-5 pl-4 text-[15px] font-medium text-white shadow-lg backdrop-blur"
          style={{ transform: "translateX(-50%)" }}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3" />
          </span>
          {toast}
        </div>
      )}
    </form>
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

function NewTagInput({ onAdded }: { onAdded: (tags: Tag[], name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const name = value.trim();
    if (!name || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; tags?: Tag[] };
      if (!res.ok || !data.tags) throw new Error(data.error ?? `태그 추가 실패 (${res.status})`);
      onAdded(data.tags, name.normalize("NFC"));
      setValue("");
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex h-9 items-center gap-1 rounded-full border border-dashed border-fill-strong px-3 text-[14px] font-medium text-text-3 transition-colors hover:border-text-3 hover:text-text-2"
      >
        <Plus className="size-3.5" />
        태그 추가
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="flex h-9 items-center gap-1 rounded-full bg-surface pr-1 pl-3.5 ring-2 ring-primary">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              add();
            }
            if (e.key === "Escape") {
              setEditing(false);
              setValue("");
              setError(null);
            }
          }}
          onBlur={() => {
            if (!value.trim() && !pending) setEditing(false);
          }}
          placeholder="새 태그 이름"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none placeholder:text-text-3"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !value.trim()}
          className="h-7 rounded-full bg-primary px-3 text-[13px] font-semibold text-white disabled:bg-fill-strong disabled:text-text-3"
        >
          {pending ? "추가 중" : "추가"}
        </button>
      </div>
      {error && <p className="mt-1.5 px-1 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)}KB` : `${(n / 1024 / 1024).toFixed(1)}MB`;
}
