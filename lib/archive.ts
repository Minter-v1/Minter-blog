import "server-only";
import { COLLECTION_LIST, parseRef, toRef, type CollectionId, type Ref } from "./collections";
import { githubEnv } from "./env";
import { readDirs } from "./github";
import { parseEntry } from "./markdown";
import { encodePath, rawBaseUrl } from "./paths";
import { parseTags, type Tag } from "./tags";

export type Entry = {
  collection: CollectionId;
  slug: string;
  ref: Ref; // "git/rebase"
  title: string;
  description: string;
  tags: string[];
  related: Ref[]; // 이 글에서 직접 연결한 기록
  extra: Record<string, string>; // 컬렉션별 추가 필드 (git: usage, troubleshooting: error)
  date: string;
  updated?: string;
  body: string; // 이미지 경로는 컬렉션 폴더 기준 상대 경로 그대로
  sourceUrl: string;
};

// 목록·연관 선택기처럼 본문이 필요 없는 곳에 넘기는 요약
export type EntrySummary = Pick<Entry, "collection" | "slug" | "ref" | "title" | "description" | "tags" | "date"> & {
  extra: Record<string, string>;
};

export type Archive = {
  entries: Entry[]; // 전 컬렉션, 최신순
  tags: Record<CollectionId, Tag[]>;
  repoUrl: string;
  rawBase: Record<CollectionId, string>; // 상대 경로 이미지 앞에 붙일 URL
};

export async function loadArchive(): Promise<Archive> {
  const { owner, repo, branch } = githubEnv();
  const { commitSha, dirs } = await readDirs(COLLECTION_LIST.map((c) => c.dir));
  const repoUrl = `https://github.com/${owner}/${repo}`;

  const entries: Entry[] = [];
  const tags = {} as Archive["tags"];
  const rawBase = {} as Archive["rawBase"];

  for (const c of COLLECTION_LIST) {
    const files = dirs[c.dir] ?? [];
    // 커밋 SHA로 고정한 raw URL은 CDN 캐시 지연이 없다
    rawBase[c.id] = rawBaseUrl(owner, repo, commitSha ?? branch, c.dir);
    tags[c.id] = parseTags(files.find((f) => f.name === "tags.json")?.text ?? null, c.defaultTags);

    for (const file of files) {
      if (!file.name.endsWith(".md") || file.name.toLowerCase() === "readme.md") continue;
      const doc = parseEntry(file.text);
      if (!doc) continue;
      const slug = file.name.slice(0, -3).normalize("NFC");
      entries.push({
        collection: c.id,
        slug,
        ref: toRef(c.id, slug),
        title: doc.title || slug,
        description: doc.description,
        tags: doc.tags,
        related: (doc.related ?? []).map((r) => parseRef(r, c.id)),
        extra: doc.extra ?? {},
        date: doc.date,
        updated: doc.updated,
        body: doc.body,
        sourceUrl: `${repoUrl}/blob/${encodeURIComponent(branch)}/${encodePath(`${c.dir}/${file.name}`)}`,
      });
    }
  }

  entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));
  return { entries, tags, repoUrl, rawBase };
}

export function summarize(e: Entry): EntrySummary {
  const { collection, slug, ref, title, description, tags, date, extra } = e;
  return { collection, slug, ref, title, description, tags, date, extra };
}

export function findEntry(archive: Archive, collection: CollectionId, slug: string) {
  return archive.entries.find((e) => e.collection === collection && e.slug === slug) ?? null;
}

/**
 * 연관 기록: 이 글에서 연결한 것 + 다른 글에서 이 글을 연결한 것(자동 양방향). 컬렉션을 넘나든다.
 * 삭제된 기록으로의 연결은 건너뛴다.
 */
export function relatedOf(entry: Entry, entries: Entry[]): Entry[] {
  const byRef = new Map(entries.map((e) => [e.ref, e]));
  const refs = [...entry.related, ...entries.filter((e) => e.related.includes(entry.ref)).map((e) => e.ref)];
  return [...new Set(refs)]
    .filter((r) => r !== entry.ref)
    .map((r) => byRef.get(r))
    .filter((e): e is Entry => !!e);
}

