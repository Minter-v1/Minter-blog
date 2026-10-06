import "server-only";
import { COLLECTIONS, entryHref } from "./collections";
import { mailLayout } from "./mail";
import { REVIEW_TOTAL } from "./review";
import type { ReviewItem } from "./review-store";
import { formatDay } from "./today";

// 아침 복습 메일: 밀린 글 + 오늘 복습할 글
export function reviewEmail(day: string, items: ReviewItem[], siteUrl: string) {
  const overdue = items.filter((i) => i.days > 0).length;
  const { html, text } = mailLayout({
    eyebrow: formatDay(day),
    heading: "오늘 복습할 글",
    count: items.length,
    lead: overdue > 0 ? `밀린 복습 ${overdue}개가 포함되어 있어요.` : "잊어버리기 전에 다시 읽어 봐요.",
    rows: items.map((i) => ({
      label: `${COLLECTIONS[i.collection].label} · ${i.stage + 1}/${REVIEW_TOTAL}회${i.days > 0 ? ` · ${i.days}일 밀림` : ""}`,
      title: i.title,
      url: `${siteUrl}${entryHref(i.collection, i.slug)}`,
      description: i.description,
      mono: i.collection === "git",
    })),
    button: { label: "복습 시작", url: `${siteUrl}/review` },
  });
  return { subject: `오늘 복습할 글 ${items.length}개 · ${formatDay(day)}`, html, text };
}
