import "server-only";
import { githubEnv } from "./env";
import { commitFiles, ConflictError, listDir, readTextFile, type CommitFile } from "./github";
import { formatTerm, parseTerm } from "./markdown";
import { toSlug } from "./slug";
import { MAX_TAGS_PER_TERM } from "./tags";

export class ValidationError extends Error {}

export type UploadedImage = { url: string; sha: string; ext: string };

export type TermInput = {
  title: string;
  description: string;
  tags: string[];
  related: string[]; // 연관 용어 slug
  body: string; // 에디터가 만든 마크다운. 새 이미지는 blob: URL, 기존 이미지는 raw URL
  images: UploadedImage[];
};

const EXTS = new Set(["jpg", "png", "gif", "webp"]);

export function parseTermInput(raw: unknown): TermInput {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.normalize("NFC") : "");
  const title = str(r.title).trim();
  const description = str(r.description).replace(/\s*\n\s*/g, " ").trim();
  const tags = [...new Set((Array.isArray(r.tags) ? r.tags : []).map((t) => str(t).trim()).filter(Boolean))];
  const related = [
    ...new Set((Array.isArray(r.related) ? r.related : []).map((t) => str(t).trim()).filter(Boolean)),
  ].slice(0, 30);
  const images = (Array.isArray(r.images) ? r.images : []).filter(
    (i): i is UploadedImage =>
      !!i &&
      typeof i.url === "string" &&
      typeof i.sha === "string" &&
      /^[0-9a-f]{40}$/.test(i.sha) &&
      EXTS.has(i.ext),
  );

  if (!title) throw new ValidationError("용어명을 입력해 주세요.");
  if (!description) throw new ValidationError("한 줄 정의를 입력해 주세요.");
  if (tags.length > MAX_TAGS_PER_TERM) throw new ValidationError(`태그는 최대 ${MAX_TAGS_PER_TERM}개까지 고를 수 있어요.`);
  return { title, description, tags, related, body: str(r.body), images };
}

function todayInSeoul() {
  // Vercel 서버는 UTC라서, 일요일 오전(KST)에 올리면 날짜가 하루 밀린다
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 에디터 마크다운의 이미지 URL을 repo 상대 경로로 바꾸고, 커밋할 이미지 파일 목록을 만든다.
 * - raw.githubusercontent URL(기존 이미지) → images/{slug}/n.ext
 * - blob: URL(새 이미지) → images/{slug}/{다음 번호}.ext
 */
function resolveImages(body: string, slug: string, uploads: UploadedImage[], existingFiles: string[]) {
  const { owner, repo, dir } = githubEnv();
  const rawPrefix = new RegExp(
    `https://raw\\.githubusercontent\\.com/${escapeRegExp(owner)}/${escapeRegExp(repo)}/[^/]+/${escapeRegExp(
      dir.split("/").map(encodeURIComponent).join("/"),
    )}/(images/[^)\\s]+)`,
    "g",
  );
  let md = body.replace(rawPrefix, (_, rel: string) => {
    try {
      return decodeURIComponent(rel);
    } catch {
      return rel;
    }
  });

  let next = Math.max(0, ...existingFiles.map((f) => parseInt(f, 10)).filter(Number.isFinite)) + 1;
  const files: CommitFile[] = [];
  for (const img of uploads) {
    if (!md.includes(img.url)) continue; // 올렸다가 에디터에서 지운 이미지
    const rel = `images/${slug}/${next++}.${img.ext}`;
    md = md.split(img.url).join(rel);
    files.push({ path: `${dir}/${rel}`, sha: img.sha });
  }
  if (/\]\(blob:/.test(md)) throw new ValidationError("아직 올라가지 않은 이미지가 있어요. 잠시 후 다시 저장해 주세요.");

  // 본문에서 빠진 기존 이미지는 repo에서도 지운다
  for (const name of existingFiles) {
    const rel = `images/${slug}/${name}`;
    if (!md.includes(rel)) files.push({ path: `${dir}/${rel}`, delete: true });
  }
  return { markdown: md.trim(), files };
}

export async function createTerm(input: TermInput) {
  const { dir } = githubEnv();
  const slug = toSlug(input.title);
  if (!slug) throw new ValidationError("용어명으로 파일명을 만들 수 없어요. 글자나 숫자를 넣어 주세요.");
  const mdPath = `${dir}/${slug}.md`;

  const sha = await commitFiles(`add term: ${input.title}`, async ({ headSha }) => {
    if ((await readTextFile(mdPath, headSha)) !== null) throw new ConflictError(`이미 등록된 용어예요: ${mdPath}`);
    const { markdown, files } = resolveImages(input.body, slug, input.images, []);
    const related = input.related.filter((r) => r !== slug);
    const doc = formatTerm({ ...input, related, body: markdown, date: todayInSeoul() });
    return [{ path: mdPath, text: doc }, ...files];
  });
  return { slug, sha };
}

// 파일명(slug)은 처음 등록할 때 정해지고 수정해도 바뀌지 않는다 (링크가 깨지지 않도록)
export async function updateTerm(slug: string, input: TermInput) {
  const { dir } = githubEnv();
  const mdPath = `${dir}/${slug}.md`;

  const sha = await commitFiles(`update term: ${input.title}`, async ({ headSha }) => {
    const [current, existingFiles] = await Promise.all([
      readTextFile(mdPath, headSha),
      listDir(`${dir}/images/${slug}`, headSha),
    ]);
    const prev = current ? parseTerm(current) : null;
    if (!prev) throw new ConflictError(`용어를 찾을 수 없어요: ${mdPath}`);
    const { markdown, files } = resolveImages(input.body, slug, input.images, existingFiles);
    const related = input.related.filter((r) => r !== slug);
    const doc = formatTerm({ ...input, related, body: markdown, date: prev.date, updated: todayInSeoul() });
    return [{ path: mdPath, text: doc }, ...files];
  });
  return { slug, sha };
}

export async function deleteTerm(slug: string) {
  const { dir } = githubEnv();
  const mdPath = `${dir}/${slug}.md`;
  return commitFiles(`delete term: ${slug}`, async ({ headSha }) => {
    const [current, images] = await Promise.all([
      readTextFile(mdPath, headSha),
      listDir(`${dir}/images/${slug}`, headSha),
    ]);
    if (current === null) throw new ConflictError(`용어를 찾을 수 없어요: ${mdPath}`);
    return [
      { path: mdPath, delete: true as const },
      ...images.map((name) => ({ path: `${dir}/images/${slug}/${name}`, delete: true as const })),
    ];
  });
}
