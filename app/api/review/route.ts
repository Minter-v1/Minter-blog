import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { loadReviewGroups, markReviewed } from "@/lib/review-store";

const noStore = { "Cache-Control": "private, no-store" };

// 오늘 복습할 글 (로그인한 나만). 헤더 링크와 글 상세의 복습 완료 버튼이 쓴다
export async function GET() {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const { today } = await loadReviewGroups();
  return NextResponse.json(
    { today: today.map(({ ref, stage, days }) => ({ ref, stage, days })) },
    { headers: noStore },
  );
}

// 복습 완료 처리
export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const body = (await request.json().catch(() => ({}))) as { ref?: unknown };
  if (typeof body.ref !== "string" || !body.ref.includes("/")) return fail("잘못된 요청이에요.");
  try {
    const record = await markReviewed(body.ref.normalize("NFC"));
    return NextResponse.json({ ref: body.ref, ...record }, { headers: noStore });
  } catch (e) {
    return handleError(e);
  }
}
