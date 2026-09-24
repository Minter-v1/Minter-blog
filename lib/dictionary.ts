import "server-only";
import { githubEnv } from "./env";
import { readTermsDir } from "./github";
import { parseTerm, splitBody } from "./markdown";
import { parseTags, type Tag } from "./tags";

export type Term = {
  slug: string;
  title: string;
  tags: string[];
  date: string;
  description: string;
  images: string[];
  sourceUrl: string;
};

export type Dictionary = {
  terms: Term[];
  tags: Tag[];
  repoUrl: string;
};

const encodePath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

export async function loadDictionary(): Promise<Dictionary> {
  const { owner, repo, branch, dir } = githubEnv();
  const { commitSha, files } = await readTermsDir();
  const repoUrl = `https://github.com/${owner}/${repo}`;
  // 커밋 SHA로 고정한 raw URL은 CDN 캐시 지연이 없다
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha ?? branch}/${encodePath(dir)}/`;

  const terms: Term[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".md") || file.name.toLowerCase() === "readme.md") continue;
    const doc = parseTerm(file.text);
    if (!doc) continue;
    const slug = file.name.slice(0, -3);
    const { description, images } = splitBody(doc.body);
    terms.push({
      slug,
      title: doc.title || slug,
      tags: doc.tags,
      date: doc.date,
      description,
      images: images.map((src) =>
        /^https?:\/\//.test(src) ? src : rawBase + encodePath(decodeURIComponent(src.replace(/^\.\//, ""))),
      ),
      sourceUrl: `${repoUrl}/blob/${encodeURIComponent(branch)}/${encodePath(`${dir}/${file.name}`)}`,
    });
  }

  terms.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "ko"));

  const tagsFile = files.find((f) => f.name === "tags.json");
  return { terms, tags: parseTags(tagsFile?.text ?? null), repoUrl };
}
