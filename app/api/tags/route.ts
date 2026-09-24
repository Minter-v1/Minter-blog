import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { invalidateArchive } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { commitFiles, ConflictError, readTextFile } from "@/lib/github";
import { parseTags, serializeTags, validateTagName, type Tag } from "@/lib/tags";

// 컬렉션의 {폴더}/tags.json에 태그(트러블슈팅은 분야, Git은 분류)를 추가
export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);

  const body = (await request.json().catch(() => ({}))) as { name?: unknown; collection?: unknown };
  if (!isCollectionId(body.collection)) return fail("알 수 없는 컬렉션이에요.");
  const c = COLLECTIONS[body.collection];
  const raw = typeof body.name === "string" ? body.name : "";
  const invalid = validateTagName(raw);
  if (invalid) return fail(invalid);
  const name = raw.normalize("NFC").trim();

  const path = `${c.dir}/tags.json`;
  let tags: Tag[] = [];

  try {
    await commitFiles(`add tag(${c.id}): ${name}`, async ({ headSha }) => {
      // tags.json이 아직 없으면 컬렉션 기본 태그로 시작
      tags = parseTags(await readTextFile(path, headSha), c.defaultTags);
      if (tags.some((t) => t.name === name)) throw new ConflictError(`이미 있는 ${c.tagLabel}예요: ${name}`);
      tags = [...tags, { name }];
      return [{ path, text: serializeTags(tags) }];
    });
    invalidateArchive();
    return NextResponse.json({ tags });
  } catch (e) {
    return handleError(e);
  }
}
