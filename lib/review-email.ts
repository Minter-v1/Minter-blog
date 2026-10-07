import "server-only";
import { COLLECTION_LIST, COLLECTIONS, entryHref, type CollectionId } from "./collections";
import { mailLayout, type MailSection } from "./mail";
import { REVIEW_TOTAL } from "./review";
import type { ReviewItem } from "./review-store";
import { formatDay } from "./today";

// 용어 사전을 맨 위에: "용어 → 정의"를 떠올리는 게 복습의 핵심이라 메일 안에서 바로 확인할 수 있게 카드로 보여 준다
const SECTION_ORDER: CollectionId[] = ["terms", ...COLLECTION_LIST.map((c) => c.id).filter((id) => id !== "terms")];

// 아침 복습 메일: 밀린 글 + 오늘 복습할 글을 컬렉션별로
export function reviewEmail(day: string, items: ReviewItem[], siteUrl: string) {
  const overdue = items.filter((i) => i.days > 0).length;
  const sections: MailSection[] = SECTION_ORDER.flatMap((id) => {
    const group = items.filter((i) => i.collection === id);
    if (group.length === 0) return [];
    const terms = id === "terms";
    return [
      {
        heading: COLLECTIONS[id].label,
        note: terms ? "정의를 읽기 전에 먼저 떠올려 보세요." : undefined,
        rows: group.map((i) => ({
          label: `${i.stage + 1}/${REVIEW_TOTAL}회${i.days > 0 ? ` · ${i.days}일 밀림` : ""}`,
          title: i.title,
          url: `${siteUrl}${entryHref(i.collection, i.slug)}`,
          description: i.description,
          mono: i.collection === "git",
          excerpt: terms ? i.excerpt : undefined,
        })),
      },
    ];
  });

  const { html, text } = mailLayout({
    eyebrow: formatDay(day),
    heading: "오늘 복습할 글",
    count: items.length,
    lead: overdue > 0 ? `밀린 복습 ${overdue}개가 포함되어 있어요.` : "잊어버리기 전에 다시 읽어 봐요.",
    sections,
    button: { label: "복습 시작", url: `${siteUrl}/review` },
  });
  return { subject: `오늘 복습할 글 ${items.length}개 · ${formatDay(day)}`, html, text };
}
