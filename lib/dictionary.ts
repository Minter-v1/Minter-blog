import "server-only";
import { githubEnv } from "./env";
import { readTermsDir } from "./github";
import { parseTerm } from "./markdown";
import { encodePath, rawBaseUrl } from "./paths";
import { parseTags, type Tag } from "./tags";

export type Term = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  related: string[]; // 이 글에서 직접 연결한 용어의 slug
  date: string;
  updated?: string;
  body: string; // 이미지 경로는 repo 상대 경로 그대로
  sourceUrl: string;
};

export type Dictionary = {
  terms: Term[];
  tags: Tag[];
  repoUrl: string;
  rawBase: string; // 상대 경로 이미지를 표시할 때 앞에 붙일 URL
};

export async function loadDictionary(): Promise<Dictionary> {
  const { owner, repo, branch, dir } = githubEnv();
  const { commitSha, files } = await readTermsDir();
  const repoUrl = `https://github.com/${owner}/${repo}`;

  const terms: Term[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".md") || file.name.toLowerCase() === "readme.md") continue;
    const doc = parseTerm(file.text);
    if (!doc) continue;
    const slug = file.name.slice(0, -3).normalize("NFC");
    terms.push({
      slug,
      title: doc.title || slug,
      description: doc.description,
      tags: doc.tags,
      related: doc.related ?? [],
      date: doc.date,
      updated: doc.updated,
      body: doc.body,
      sourceUrl: `${repoUrl}/blob/${encodeURIComponent(branch)}/${encodePath(`${dir}/${file.name}`)}`,
    });
  }

  terms.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));

  const tagsFile = files.find((f) => f.name === "tags.json");
  return {
    terms,
    tags: parseTags(tagsFile?.text ?? null),
    repoUrl,
    // 커밋 SHA로 고정한 raw URL은 CDN 캐시 지연이 없다
    rawBase: rawBaseUrl(owner, repo, commitSha ?? branch, dir),
  };
}

/**
 * 연관 용어: 이 글에서 연결한 것 + 다른 글에서 이 글을 연결한 것(자동 양방향).
 * 삭제된 용어로의 연결은 건너뛴다.
 */
export function relatedTermsOf(term: Term, terms: Term[]): Term[] {
  const bySlug = new Map(terms.map((t) => [t.slug, t]));
  const slugs = [
    ...term.related,
    ...terms.filter((t) => t.related.includes(term.slug)).map((t) => t.slug),
  ];
  return [...new Set(slugs)]
    .filter((s) => s !== term.slug)
    .map((s) => bySlug.get(s))
    .filter((t): t is Term => !!t);
}
