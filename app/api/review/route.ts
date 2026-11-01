import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { isAuthed } from "@/lib/auth";
import { isStepId } from "@/lib/learning-steps";
import { loadReviewGroups, markReviewed, skipStep } from "@/lib/review-store";

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

// 복습 완료 처리. skip이 있으면 학습 단계 건너뛰기 (#135): "hands-on" | "deep-dive" | "all"(이 글은 여기까지)
export async function POST(request: Request) {
  if (!(await isAuthed())) return fail("로그인이 필요해요.", 401);
  const body = (await request.json().catch(() => ({}))) as {
    ref?: unknown;
    skip?: unknown;
  };
  if (typeof body.ref !== "string" || !body.ref.includes("/")) return fail("잘못된 요청이에요.");
  if (body.skip !== undefined && body.skip !== "all" && !isStepId(body.skip)) return fail("잘못된 요청이에요.");
  try {
    const ref = body.ref.normalize("NFC");
    const record = body.skip === undefined ? await markReviewed(ref) : await skipStep(ref, body.skip);
    return NextResponse.json({ ref: body.ref, ...record }, { headers: noStore });
  } catch (e) {
    return handleError(e);
  }
}
