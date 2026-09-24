// 용어 md 파일 포맷
//
// ---
// title: 폴백함수
// description: 주 기능이 실패했을 때 대신 실행되는 함수
// tags: [아키텍처패턴, 운영모니터링]
// related: [서킷브레이커, 멱등성]   ← 연관 용어 파일명(slug), 있을 때만
// date: 2026-09-24
// updated: 2026-09-30        ← 수정했을 때만
// ---
//
// (상세 설명 마크다운. 이미지는 images/폴백함수/1.jpg 처럼 terms 기준 상대 경로)

export type TermDoc = {
  title: string;
  description: string;
  tags: string[];
  related?: string[];
  date: string;
  updated?: string;
  body: string;
};

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

export function formatTerm(doc: TermDoc): string {
  const lines = [
    "---",
    `title: ${yamlScalar(doc.title)}`,
    `description: ${yamlScalar(doc.description)}`,
    `tags: [${doc.tags.map(yamlScalar).join(", ")}]`,
    ...(doc.related?.length ? [`related: [${doc.related.map(yamlScalar).join(", ")}]`] : []),
    `date: ${doc.date}`,
    ...(doc.updated && doc.updated !== doc.date ? [`updated: ${doc.updated}`] : []),
    "---",
  ];
  const body = doc.body.trim();
  return lines.join("\n") + "\n" + (body ? `\n${body}\n` : "");
}

export function parseTerm(source: string): TermDoc | null {
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

  return {
    title: unquote(meta.title ?? ""),
    description,
    tags,
    related: list(meta.related).map((s) => s.normalize("NFC")),
    date: unquote(meta.date ?? ""),
    updated: meta.updated ? unquote(meta.updated) : undefined,
    body,
  };
}
