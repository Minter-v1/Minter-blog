import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { githubEnv } from "@/lib/env";
import { commitFiles, ConflictError, readTextFile } from "@/lib/github";
import { parseTags, serializeTags, validateTagName, type Tag } from "@/lib/tags";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);

  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const raw = typeof body.name === "string" ? body.name : "";
  const invalid = validateTagName(raw);
  if (invalid) return fail(invalid);
  const name = raw.normalize("NFC").trim();

  const { dir } = githubEnv();
  const path = `${dir}/tags.json`;
  let tags: Tag[] = [];

  try {
    await commitFiles(`add tag: ${name}`, async ({ headSha }) => {
      // tags.json이 아직 없으면 기본 7개로 시작
      tags = parseTags(await readTextFile(path, headSha));
      if (tags.some((t) => t.name === name)) throw new ConflictError(`이미 있는 태그예요: ${name}`);
      tags = [...tags, { name }];
      return [{ path, text: serializeTags(tags) }];
    });
    return NextResponse.json({ tags });
  } catch (e) {
    if (e instanceof ConflictError) return fail(e.message, 409);
    console.error(e);
    return fail(e instanceof Error ? e.message : "커밋하지 못했어요.", 502);
  }
}
