import "server-only";
import type { Entry } from "./archive";
import { COLLECTIONS, entryHref } from "./collections";
import { mailLayout } from "./mail";
import { formatDay, type DayKind } from "./today";

// 밤 리마인드: 오늘 정리한 기록
export function reminderEmail(day: string, items: { entry: Entry; kind: DayKind }[], siteUrl: string) {
  const { html, text } = mailLayout({
    eyebrow: formatDay(day),
    heading: "오늘 정리한 기록",
    count: items.length,
    lead: "자기 전에 한 번 더 읽어 봐요.",
    sections: [
      {
        rows: items.map(({ entry: e, kind }) => ({
          label: `${COLLECTIONS[e.collection].label}${kind === "updated" ? " · 수정" : ""}`,
          title: e.title,
          url: `${siteUrl}${entryHref(e.collection, e.slug)}`,
          description: e.description,
          mono: e.collection === "git",
        })),
      },
    ],
    button: { label: "몰아 읽기", url: `${siteUrl}/today?d=${day}` },
  });
  return { subject: `오늘 정리한 기록 ${items.length}개 · ${formatDay(day)}`, html, text };
}
