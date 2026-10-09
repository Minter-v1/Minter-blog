import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { isCronRequest, sendMail, siteUrlOf } from "@/lib/mail";
import { reviewEmail } from "@/lib/review-email";
import { loadReviewGroups } from "@/lib/review-store";
import { isDay, seoulToday } from "@/lib/today";

export const dynamic = "force-dynamic";

// 매일 밤 23시대(KST) Vercel Cron이 부른다 (vercel.json). 밀린 복습 + 오늘 복습할 글을 메일로 — 없는 날은 보내지 않는다.
//   ?preview=1   메일을 보내지 않고 HTML만 돌려준다 (확인용)
//   ?d=YYYY-MM-DD 그날 기준으로 계산 (확인용)
export async function GET(request: Request) {
  if (!isCronRequest(request)) return fail("권한이 없어요.", 401);

  const url = new URL(request.url);
  const day = isDay(url.searchParams.get("d")) ? url.searchParams.get("d")! : seoulToday();
  const { today } = await loadReviewGroups(day);
  const mail = reviewEmail(day, today, siteUrlOf(request));

  if (url.searchParams.get("preview")) {
    return new NextResponse(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (today.length === 0) return NextResponse.json({ sent: false, day, count: 0 });
  try {
    await sendMail(mail);
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), 502);
  }
  return NextResponse.json({ sent: true, day, count: today.length });
}
