import "server-only";
import { COLLECTION_LIST, COLLECTIONS, entryHref, type CollectionId } from "./collections";
import { stepName, STEPS, stepWriteHref } from "./learning-steps";
import { mailLayout, type MailSection } from "./mail";
import { REVIEW_TOTAL } from "./review";
import type { ReviewItem, StepItem } from "./review-store";
import { STEP_MAIL_LIMIT } from "./step-review";
import { formatDay } from "./today";

// 용어 사전을 맨 위에: "용어 → 정의"를 떠올리는 게 복습의 핵심이라 메일 안에서 바로 확인할 수 있게 카드로 보여 준다
const SECTION_ORDER: CollectionId[] = ["terms", ...COLLECTION_LIST.map((c) => c.id).filter((id) => id !== "terms")];

const lateLabel = (days: number) => (days > 0 ? ` · ${days}일 밀림` : "");

// 밤 복습 메일(23시대): 밀린 글 + 오늘 복습할 글을 컬렉션별로, 이어서 다음 학습 단계 (#135)
export function reviewEmail(day: string, items: ReviewItem[], stepItems: StepItem[], siteUrl: string) {
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
          label: `${i.stage + 1}/${REVIEW_TOTAL}회${lateLabel(i.days)}`,
          title: i.title,
          url: `${siteUrl}${entryHref(i.collection, i.slug)}`,
          description: i.description,
          mono: i.collection === "git",
          excerpt: terms ? i.excerpt : undefined,
          // 단계 글은 따로 복습하지 않고 용어와 함께 다시 본다
          links: i.steps.map((s) => ({
            label: stepName(s.step),
            title: s.title,
            url: `${siteUrl}${entryHref(s.collection, s.slug)}`,
          })),
        })),
      },
    ];
  });

  // 다음 단계: 하루에 몇 개만, 오래 밀린 것부터. 건너뛰기는 복습 화면에서
  const steps = stepItems.slice(0, STEP_MAIL_LIMIT);
  if (steps.length > 0) {
    sections.push({
      heading: "다음 단계",
      note: "용어를 손으로 익히고 깊게 파 볼 차례예요. 건너뛰려면 복습 화면에서.",
      rows: steps.map((s) => ({
        label: `${stepName(s.step)}${lateLabel(s.days)}`,
        title: s.title,
        url: `${siteUrl}${entryHref(s.collection, s.slug)}`,
        description: STEPS.find((x) => x.id === s.step)!.hint,
        action: {
          label: `${stepName(s.step)} ${s.drafting ? "이어 쓰기" : "쓰기"}`,
          url: `${siteUrl}${stepWriteHref(s.step, s.ref)}`,
        },
      })),
    });
  }

  const count = items.length + steps.length;
  const lead =
    overdue > 0
      ? `밀린 복습 ${overdue}개가 포함되어 있어요.`
      : items.length > 0
        ? "잊어버리기 전에 다시 읽어 봐요."
        : "오늘은 복습 대신 다음 단계를 써 봐요.";
  const { html, text } = mailLayout({
    eyebrow: formatDay(day),
    heading: items.length > 0 ? "오늘 복습할 글" : "오늘의 다음 단계",
    count,
    lead,
    sections,
    button: { label: "복습 시작", url: `${siteUrl}/review` },
  });
  const subject = [
    items.length > 0 && `오늘 복습할 글 ${items.length}개`,
    steps.length > 0 && `다음 단계 ${steps.length}개`,
    formatDay(day),
  ]
    .filter(Boolean)
    .join(" · ");
  return { subject, html, text };
}
