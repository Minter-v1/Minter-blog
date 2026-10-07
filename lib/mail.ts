import "server-only";
import { formatFrom } from "./mail-address";
import { SITE } from "./site";

// 리마인드 메일 공통: 레이아웃, 발송, Cron 인증.
// 메일 클라이언트는 외부 CSS·웹폰트를 거의 못 쓰므로 표 + 인라인 스타일로. 색은 블로그와 같은 회색 + 파랑 하나

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type MailRow = {
  label: string;
  title: string;
  url: string;
  description: string;
  mono?: boolean;
  excerpt?: string; // 있으면 카드형: 제목을 크게, 설명을 진하게, 본문 요약을 회색 상자로
};

/** 메일 본문 묶음. heading이 없으면 구분 없이 항목만 이어 붙인다 */
export type MailSection = { heading?: string; note?: string; rows: MailRow[] };

function rowHtml(r: MailRow) {
  const mono = r.mono ? "font-family:ui-monospace,Menlo,monospace;" : "";
  if (r.excerpt === undefined) {
    return `
        <tr><td style="padding:14px 0;border-top:1px solid #eceef1">
          <div style="font-size:12px;font-weight:600;color:#8b95a1">${esc(r.label)}</div>
          <a href="${r.url}" style="display:block;margin-top:4px;font-size:17px;font-weight:700;color:#191f28;text-decoration:none;${mono}">${esc(r.title)}</a>
          <div style="margin-top:4px;font-size:14px;line-height:1.6;color:#4e5968">${esc(r.description)}</div>
        </td></tr>`;
  }
  const excerpt = r.excerpt
    ? `<div style="margin-top:10px;padding:12px 14px;border-radius:12px;background:#f2f4f6;font-size:13px;line-height:1.7;color:#4e5968">${esc(r.excerpt)}</div>`
    : "";
  return `
        <tr><td style="padding:16px 0;border-top:1px solid #eceef1">
          <div style="font-size:12px;font-weight:600;color:#8b95a1">${esc(r.label)}</div>
          <a href="${r.url}" style="display:block;margin-top:6px;font-size:20px;font-weight:700;color:#191f28;text-decoration:none;letter-spacing:-0.02em;${mono}">${esc(r.title)}</a>
          <div style="margin-top:6px;font-size:15px;line-height:1.6;font-weight:600;color:#191f28">${esc(r.description)}</div>
          ${excerpt}
        </td></tr>`;
}

function sectionHtml(sec: MailSection) {
  const note = sec.note ? `<div style="margin-top:4px;font-size:13px;color:#8b95a1">${esc(sec.note)}</div>` : "";
  const head = sec.heading
    ? `
        <tr><td style="padding:22px 0 8px">
          <div style="font-size:15px;font-weight:700;color:#191f28">${esc(sec.heading)} <span style="color:#3182f6">${sec.rows.length}</span></div>
          ${note}
        </td></tr>`
    : "";
  return head + sec.rows.map(rowHtml).join("");
}

export function mailLayout(props: {
  eyebrow: string; // 위쪽 작은 글씨 (날짜 등)
  heading: string;
  count: number;
  lead: string;
  sections: MailSection[];
  button: { label: string; url: string };
}) {
  const rows = props.sections.map(sectionHtml).join("");

  const html = `<!doctype html><html lang="ko"><body style="margin:0;background:#f5f6f8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:28px 28px 24px">
        <tr><td>
          <div style="font-size:13px;font-weight:600;color:#8b95a1">${esc(SITE.name)} · ${esc(props.eyebrow)}</div>
          <div style="margin-top:6px;font-size:22px;font-weight:700;color:#191f28;letter-spacing:-0.03em">
            ${esc(props.heading)} <span style="color:#3182f6">${props.count}</span>
          </div>
          <div style="margin-top:6px;font-size:14px;color:#8b95a1">${esc(props.lead)}</div>
        </td></tr>
        <tr><td style="padding-top:18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
        <tr><td style="padding-top:20px">
          <a href="${props.button.url}" style="display:block;text-align:center;background:#3182f6;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 0;border-radius:16px">${esc(props.button.label)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    `${SITE.name} · ${props.eyebrow}`,
    `${props.heading} ${props.count}개`,
    "",
    ...props.sections.flatMap((sec) => [
      ...(sec.heading ? [`[${sec.heading} ${sec.rows.length}]${sec.note ? ` ${sec.note}` : ""}`] : []),
      ...sec.rows.map((r) => `- [${r.label}] ${r.title}\n  ${r.description}${r.excerpt ? `\n  ${r.excerpt}` : ""}`),
      "",
    ]),
    "",
    `${props.button.label}: ${props.button.url}`,
  ].join("\n");

  return { html, text };
}

/** Vercel Cron은 CRON_SECRET을 Authorization 헤더에 실어 보낸다. 값이 없으면 누구도 부를 수 없다 */
export function isCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export function siteUrlOf(request: Request) {
  return (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

/** Resend HTTPS API로 발송. 실패하면 이유를 담아 던진다 */
export async function sendMail(mail: { subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REMIND_TO;
  if (!apiKey || !to) throw new Error("RESEND_API_KEY·REMIND_TO가 설정되지 않았어요.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // 도메인을 인증하기 전엔 Resend 기본 주소로 (가입한 본인 메일로만 보낼 수 있다).
      // 이름에 특수문자가 있으면 따옴표로 감싼다 (Minter.log → "Minter.log")
      from: formatFrom(process.env.REMIND_FROM || "Minter.log <onboarding@resend.dev>"),
      to: [to],
      ...mail,
    }),
  });
  if (!res.ok) throw new Error(`메일 발송 실패 (${res.status}): ${(await res.text()).slice(0, 300)}`);
}
