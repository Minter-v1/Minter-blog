import { COLLECTION_LIST } from "@/lib/collections";
import { githubEnv } from "@/lib/env";

// 기록 이미지 전달: 데이터 repo가 비공개여도 보이도록, 서버가 토큰으로 받아 그대로 넘긴다.
// /api/files/{커밋 SHA 또는 브랜치}/{컬렉션 폴더}/images/{slug}/{n}.{ext}
// md 파일 같은 다른 파일은 내주지 않는다 (작성 중인 글 원문이 새지 않도록).
const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
const DIRS = new Set(COLLECTION_LIST.map((c) => c.dir));

export async function GET(_request: Request, ctx: RouteContext<"/api/files/[ref]/[...path]">) {
  const { ref, path } = await ctx.params;
  const segments = path.map((s) => decodeURIComponent(s));
  const ext = segments.at(-1)?.split(".").pop()?.toLowerCase() ?? "";
  const valid =
    /^[\w.-]{1,100}$/.test(ref) &&
    segments.length >= 3 &&
    DIRS.has(segments[0]) &&
    segments[1] === "images" &&
    segments.every((s) => s && s !== "." && s !== ".." && !s.includes("/")) &&
    ext in TYPES;
  if (!valid) return new Response("Not found", { status: 404 });

  const { token, owner, repo } = githubEnv();
  const filePath = segments.map(encodeURIComponent).join("/");
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!res.ok || !res.body) return new Response("Not found", { status: res.status === 404 ? 404 : 502 });

  // 커밋 SHA로 고정된 주소는 내용이 절대 안 바뀐다 → CDN·브라우저에 오래 캐시
  const pinned = /^[0-9a-f]{40}$/.test(ref);
  return new Response(res.body, {
    headers: {
      "Content-Type": TYPES[ext],
      "Cache-Control": pinned ? "public, max-age=31536000, immutable" : "public, max-age=60, s-maxage=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
