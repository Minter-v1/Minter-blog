"use client";

import { useState } from "react";
import { COLLECTIONS, type CollectionId } from "@/lib/collections";
import type { Tag } from "@/lib/tags";
import { Check, Plus } from "./icons";

export function TagPicker(props: {
  collection: CollectionId;
  tags: Tag[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onTagsChange: (tags: Tag[]) => void;
}) {
  const { tags, selected, onChange } = props;
  const { maxTags, tagLabel } = COLLECTIONS[props.collection];

  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((t) => t !== name));
    else if (selected.length < maxTags) onChange([...selected, name]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const on = selected.includes(tag.name);
        const full = !on && selected.length >= maxTags;
        return (
          <button
            key={tag.name}
            type="button"
            title={tag.hint}
            disabled={full}
            onClick={() => toggle(tag.name)}
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
        collection={props.collection}
        label={tagLabel}
        onAdded={(next, name) => {
          props.onTagsChange(next);
          if (selected.length < maxTags) onChange([...selected, name]);
        }}
      />
    </div>
  );
}

function NewTagInput(props: { collection: CollectionId; label: string; onAdded: (tags: Tag[], name: string) => void }) {
  const { onAdded } = props;
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
        body: JSON.stringify({ name, collection: props.collection }),
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
        {props.label} 추가
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
          placeholder={`새 ${props.label} 이름`}
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
