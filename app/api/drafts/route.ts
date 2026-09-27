import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { loadArchive, summarize } from "@/lib/archive";
import { isAuthed } from "@/lib/auth";
import { isCollectionId } from "@/lib/collections";

// 작성 중인 글 목록 (로그인한 나만). 공개 목록 페이지는 CDN 캐시라서, 브라우저가 따로 불러와 합친다.
export async function GET(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const c = new URL(request.url).searchParams.get("c");
  const { drafts } = await loadArchive();
  const list = isCollectionId(c) ? drafts.filter((d) => d.collection === c) : drafts;
  return NextResponse.json(
    { drafts: list.map((d) => ({ ...summarize(d), draft: true })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
