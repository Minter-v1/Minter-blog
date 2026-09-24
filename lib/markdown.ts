// 기록 md 파일 포맷 (모든 컬렉션 공통)
//
// ---
// title: git rebase
// description: 커밋들을 다른 기준 위로 옮겨 다시 쌓는다
// tags: [병합·리베이스]
// related: [terms/커밋그래프, troubleshooting/rebase-충돌]   ← 있을 때만
// usage: "git rebase -i <기준 커밋>"                          ← 컬렉션별 추가 필드(extra)
// date: 2026-09-24
// updated: 2026-09-30                                         ← 수정했을 때만
// ---
//
// (상세 설명 마크다운. 이미지는 images/{slug}/1.jpg 처럼 컬렉션 폴더 기준 상대 경로)

export type EntryDoc = {
  title: string;
  description: string;
  tags: string[];
  related?: string[];
  extra?: Record<string, string>;
  date: string;
  updated?: string;
  body: string;
};

const RESERVED = new Set(["title", "description", "tags", "related", "date", "updated"]);

const NEEDS_QUOTE = /[:#\[\]{},&*!|>'"%@`]|^\s|\s$|^[-?]/;

function yamlScalar(value: string) {
  return NEEDS_QUOTE.test(value) ? JSON.stringify(value) : value;
}

function unquote(value: string) {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    try {
      return JSON.parse(v) as string;
    } catch {
      return v.slice(1, -1);
    }
  }
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}

export function formatEntry(doc: EntryDoc): string {
  const lines = [
    "---",
    `title: ${yamlScalar(doc.title)}`,
    `description: ${yamlScalar(doc.description)}`,
    `tags: [${doc.tags.map(yamlScalar).join(", ")}]`,
    ...(doc.related?.length ? [`related: [${doc.related.map(yamlScalar).join(", ")}]`] : []),
    ...Object.entries(doc.extra ?? {})
      .filter(([k, v]) => !RESERVED.has(k) && v.trim())
      .map(([k, v]) => `${k}: ${yamlScalar(v.replace(/\s*\n\s*/g, " ").trim())}`),
    `date: ${doc.date}`,
    ...(doc.updated && doc.updated !== doc.date ? [`updated: ${doc.updated}`] : []),
    "---",
  ];
  const body = doc.body.trim();
  return lines.join("\n") + "\n" + (body ? `\n${body}\n` : "");
}

export function parseEntry(source: string): EntryDoc | null {
  const match = source.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const [, front, rawBody] = match;

  const meta: Record<string, string> = {};
  for (const line of front.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  const list = (raw = "") =>
    raw.startsWith("[")
      ? raw
          .slice(1, -1)
          .split(",")
          .map(unquote)
          .filter(Boolean)
      : [];
  const tags = list(meta.tags);

  let description = unquote(meta.description ?? "");
  let body = rawBody.trim();
  if (!description) {
    // 예전 형식: 본문 첫 문단이 한 줄 설명
    const [first, ...rest] = body.split(/\n\s*\n/);
    if (first && !first.trim().startsWith("![")) {
      description = first.trim().replace(/\s*\n\s*/g, " ");
      body = rest.join("\n\n").trim();
    }
  }

  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) if (!RESERVED.has(k)) extra[k] = unquote(v);

  return {
    title: unquote(meta.title ?? ""),
    description,
    tags,
    related: list(meta.related).map((s) => s.normalize("NFC")),
    extra,
    date: unquote(meta.date ?? ""),
    updated: meta.updated ? unquote(meta.updated) : undefined,
    body,
  };
}
