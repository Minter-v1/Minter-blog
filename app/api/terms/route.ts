import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { githubEnv } from "@/lib/env";
import { commitFiles, ConflictError, readTextFile, type CommitFile } from "@/lib/github";
import { formatTerm } from "@/lib/markdown";
import { toSlug } from "@/lib/slug";
import { MAX_TAGS_PER_TERM } from "@/lib/tags";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
// Vercel 함수 요청 본문 한도(4.5MB) 안쪽
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

function todayInSeoul() {
  // Vercel 서버는 UTC라서, 일요일 오전(KST)에 올리면 날짜가 하루 밀린다
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);

  const form = await request.formData();
  const title = String(form.get("title") ?? "").normalize("NFC").trim();
  const description = String(form.get("description") ?? "").normalize("NFC").trim();
  const tags = [...new Set(form.getAll("tags").map((t) => String(t).normalize("NFC").trim()))].filter(Boolean);
  const images = form.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);

  if (!title) return fail("용어명을 입력해 주세요.");
  if (!description) return fail("설명을 입력해 주세요.");
  if (tags.length > MAX_TAGS_PER_TERM) return fail(`태그는 최대 ${MAX_TAGS_PER_TERM}개까지 고를 수 있어요.`);

  const slug = toSlug(title);
  if (!slug) return fail("용어명으로 파일명을 만들 수 없어요. 글자나 숫자를 넣어 주세요.");

  const unsupported = images.find((f) => !IMAGE_EXT[f.type]);
  if (unsupported) return fail(`${unsupported.name}: JPG, PNG, GIF, WEBP만 올릴 수 있어요.`);
  if (images.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
    return fail("이미지 합계가 4MB를 넘어요. 몇 장만 빼 주세요.");
  }

  const { dir } = githubEnv();
  const mdPath = `${dir}/${slug}.md`;
  const imagePaths = images.map((f, i) => `images/${slug}/${i + 1}.${IMAGE_EXT[f.type]}`);
  const imageFiles: CommitFile[] = await Promise.all(
    images.map(async (f, i) => ({
      path: `${dir}/${imagePaths[i]}`,
      base64: Buffer.from(await f.arrayBuffer()).toString("base64"),
    })),
  );
  const markdown = formatTerm({ title, tags, date: todayInSeoul(), description, images: imagePaths });

  try {
    const sha = await commitFiles(`add term: ${title}`, async ({ headSha }) => {
      if ((await readTextFile(mdPath, headSha)) !== null) {
        throw new ConflictError(`이미 등록된 용어예요: ${mdPath}`);
      }
      return [{ path: mdPath, text: markdown }, ...imageFiles];
    });
    return NextResponse.json({ slug, sha });
  } catch (e) {
    if (e instanceof ConflictError) return fail(e.message, 409);
    console.error(e);
    return fail(e instanceof Error ? e.message : "커밋하지 못했어요.", 502);
  }
}
