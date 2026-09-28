import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { loadArchive } from "@/lib/archive";
import { reminderEmail } from "@/lib/reminder-email";
import { entriesOfDay, isDay, seoulToday } from "@/lib/today";

export const dynamic = "force-dynamic";

// 매일 밤 Vercel Cron이 부른다 (vercel.json). 오늘(KST) 정리한 글을 메일로 — 없는 날은 보내지 않는다.
// Vercel이 CRON_SECRET을 Authorization 헤더에 실어 보내므로, 그 값이 없으면 누구도 부를 수 없다.
//   ?preview=1   메일을 보내지 않고 HTML만 돌려준다 (확인용)
//   ?d=YYYY-MM-DD 다른 날짜로 (확인용)
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return fail("권한이 없어요.", 401);

  const url = new URL(request.url);
  const day = isDay(url.searchParams.get("d")) ? url.searchParams.get("d")! : seoulToday();
  const { entries } = await loadArchive();
  const items = entriesOfDay(entries, day);
  const siteUrl = (process.env.SITE_URL || url.origin).replace(/\/$/, "");
  const mail = reminderEmail(day, items, siteUrl);

  if (url.searchParams.get("preview")) {
    return new NextResponse(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (items.length === 0) return NextResponse.json({ sent: false, day, count: 0 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REMIND_TO;
  if (!apiKey || !to) return fail("RESEND_API_KEY·REMIND_TO가 설정되지 않았어요.", 500);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // 도메인을 인증하기 전엔 Resend 기본 주소로 (가입한 본인 메일로만 보낼 수 있다)
      from: process.env.REMIND_FROM || "Minter.log <onboarding@resend.dev>",
      to: [to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  if (!res.ok) return fail(`메일 발송 실패 (${res.status}): ${(await res.text()).slice(0, 300)}`, 502);
  return NextResponse.json({ sent: true, day, count: items.length });
}
