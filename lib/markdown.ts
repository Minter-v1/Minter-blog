// 용어 md 파일 포맷 (PRD 3.3)
//
// ---
// title: 폴백함수
// tags: [아키텍처패턴, 운영모니터링]
// date: 2026-09-24
// ---
//
// 설명
//
// ![폴백함수 1](images/폴백함수/1.jpg)

export type TermDoc = {
  title: string;
  tags: string[];
  date: string;
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

export function formatTerm(input: {
  title: string;
  tags: string[];
  date: string;
  description: string;
  images: string[]; // terms 디렉토리 기준 상대 경로
}): string {
  const lines = [
    "---",
    `title: ${yamlScalar(input.title)}`,
    `tags: [${input.tags.map(yamlScalar).join(", ")}]`,
    `date: ${input.date}`,
    "---",
    "",
    input.description.trim(),
  ];
  const alt = input.title.replace(/[\[\]]/g, "");
  input.images.forEach((path, i) => {
    lines.push("", `![${alt} ${i + 1}](${path})`);
  });
  return lines.join("\n") + "\n";
}

export function parseTerm(source: string): TermDoc | null {
  const match = source.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const [, front, body] = match;

  const meta: Record<string, string> = {};
  for (const line of front.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  const rawTags = meta.tags ?? "";
  const tags = rawTags.startsWith("[")
    ? rawTags
        .slice(1, -1)
        .split(",")
        .map(unquote)
        .filter(Boolean)
    : [];

  return {
    title: unquote(meta.title ?? ""),
    tags,
    date: unquote(meta.date ?? ""),
    body: body.trim(),
  };
}

const IMAGE_LINE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

// 본문을 설명 텍스트와 이미지 경로로 분리
export function splitBody(body: string): { description: string; images: string[] } {
  const images = [...body.matchAll(IMAGE_LINE)].map((m) => m[2]);
  const description = body.replace(IMAGE_LINE, "").replace(/\n{3,}/g, "\n\n").trim();
  return { description, images };
}
