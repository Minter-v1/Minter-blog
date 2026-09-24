import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { createBlob } from "@/lib/github";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};
// Vercel 함수 요청 본문 한도(4.5MB) 안쪽
const MAX_BYTES = 4 * 1024 * 1024;

// 이미지 1장을 git blob으로 올려두고 sha만 돌려준다. 커밋은 용어를 저장할 때.
export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("이미지가 없어요.");
  const ext = EXT[file.type];
  if (!ext) return fail("JPG, PNG, GIF, WEBP만 올릴 수 있어요.");
  if (file.size > MAX_BYTES) return fail("이미지 한 장이 4MB를 넘어요.");

  try {
    const sha = await createBlob(Buffer.from(await file.arrayBuffer()).toString("base64"));
    return NextResponse.json({ sha, ext });
  } catch (e) {
    return handleError(e);
  }
}
