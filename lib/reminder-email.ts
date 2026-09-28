import "server-only";
import type { Entry } from "./archive";
import { COLLECTIONS, entryHref } from "./collections";
import { SITE } from "./site";
import { formatDay, type DayKind } from "./today";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// 메일 클라이언트는 외부 CSS·웹폰트를 거의 못 쓰므로 표 + 인라인 스타일로. 색은 블로그와 같은 회색 + 파랑 하나
export function reminderEmail(day: string, items: { entry: Entry; kind: DayKind }[], siteUrl: string) {
  const readUrl = `${siteUrl}/today?d=${day}`;
  const rows = items
    .map(({ entry: e, kind }) => {
      const c = COLLECTIONS[e.collection];
      const url = `${siteUrl}${entryHref(e.collection, e.slug)}`;
      return `
        <tr><td style="padding:14px 0;border-top:1px solid #eceef1">
          <div style="font-size:12px;font-weight:600;color:#8b95a1">${esc(c.label)}${kind === "updated" ? " · 수정" : ""}</div>
          <a href="${url}" style="display:block;margin-top:4px;font-size:17px;font-weight:700;color:#191f28;text-decoration:none;${
            e.collection === "git" ? "font-family:ui-monospace,Menlo,monospace;" : ""
          }">${esc(e.title)}</a>
          <div style="margin-top:4px;font-size:14px;line-height:1.6;color:#4e5968">${esc(e.description)}</div>
        </td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f5f6f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:28px 28px 24px">
        <tr><td>
          <div style="font-size:13px;font-weight:600;color:#8b95a1">${esc(SITE.name)} · ${esc(formatDay(day))}</div>
          <div style="margin-top:6px;font-size:22px;font-weight:700;color:#191f28;letter-spacing:-0.03em">
            오늘 정리한 기록 <span style="color:#3182f6">${items.length}</span>
          </div>
          <div style="margin-top:6px;font-size:14px;color:#8b95a1">자기 전에 한 번 더 읽어 봐요.</div>
        </td></tr>
        <tr><td style="padding-top:18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
        <tr><td style="padding-top:20px">
          <a href="${readUrl}" style="display:block;text-align:center;background:#3182f6;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 0;border-radius:16px">몰아 읽기</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    `${SITE.name} · ${formatDay(day)}`,
    `오늘 정리한 기록 ${items.length}개`,
    "",
    ...items.map(({ entry: e, kind }) => `- [${COLLECTIONS[e.collection].label}${kind === "updated" ? " · 수정" : ""}] ${e.title}\n  ${e.description}`),
    "",
    `몰아 읽기: ${readUrl}`,
  ].join("\n");

  return { subject: `오늘 정리한 기록 ${items.length}개 · ${formatDay(day)}`, html, text };
}
