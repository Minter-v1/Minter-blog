import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { MARK } from "./og-mark";

// OG 이미지 공통 (사이트 app/opengraph-image.tsx, 프로젝트 app/about/projects/[slug]/opengraph-image.tsx)
// 흰 바탕 여백형: 위 마크 줄 · 가운데 글 · 아래 가는 구분선 줄
// 강조: 나머지는 가늘고 회색, [[핵심]]만 진하게 + Lavender 형광펜
// satori는 woff2를 못 읽어 assets/fonts 의 Pretendard subset woff를 쓴다 (OFL)

export const OG_SIZE = { width: 1200, height: 630 };
export const OG = {
  ink: "#191f28",
  sub: "#4e5968",
  muted: "#8b95a1",
  line: "#e5e8eb",
  primary: "#5a6dcb",
  highlight: "#d9ccf0",
};

const font = (file: string) =>
  readFile(path.join(process.cwd(), "assets/fonts", file));

export async function ogFonts() {
  const [regular, semibold, bold] = await Promise.all([
    font("Pretendard-Regular.subset.woff"),
    font("Pretendard-SemiBold.subset.woff"),
    font("Pretendard-Bold.subset.woff"),
  ]);
  return [
    {
      name: "Pretendard",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Pretendard",
      data: semibold,
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Pretendard",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

/** 위 마크 줄 + 가운데 내용 + 아래 구분선 줄 */
export function OgFrame({
  label,
  children,
  footLeft,
  footRight,
}: {
  label: string;
  children: ReactNode;
  footLeft: ReactNode;
  footRight: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px 80px 56px",
        background: "#ffffff",
        fontFamily: "Pretendard",
        color: OG.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={48} height={48} alt="" />
          <span style={{ fontSize: 22, fontWeight: 400, color: OG.sub }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: 20, color: OG.muted }}>minter-v1.com</span>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}
      >
        {children}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 52,
          paddingTop: 22,
          borderTop: `1px solid ${OG.line}`,
          fontSize: 20,
          color: OG.muted,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>{footLeft}</div>
        <span>{footRight}</span>
      </div>
    </div>
  );
}

/** satori는 배열을 돌려주는 컴포넌트를 못 그려 일반 함수로 호출한다 ({emph(text)})
 * "[[핵심]]"을 진한 글자 + 형광펜으로, 나머지는 그대로. "**굵게**"는 표시만 지운다. 줄바꿈은 \n */
export function emph(text: string) {
  return text
    .replace(/\*\*/g, "")
    .split("\n")
    .map((line, i) => (
      <div key={i} style={{ display: "flex", flexWrap: "wrap" }}>
        {line.split(/(\[\[[^\]]+\]\])/).map((part, j) =>
          part.startsWith("[[") ? (
            <span
              key={j}
              style={{
                whiteSpace: "pre",
                color: OG.ink,
                fontWeight: 700,
                backgroundImage: `linear-gradient(transparent 58%, ${OG.highlight} 58%, ${OG.highlight} 92%, transparent 92%)`,
              }}
            >
              {part.slice(2, -2)}
            </span>
          ) : (
            <span key={j} style={{ whiteSpace: "pre" }}>
              {part}
            </span>
          ),
        )}
      </div>
    ));
}

/** 강조 표시 제거 */
export const plain = (s: string) => s.replace(/\[\[|\]\]|\*\*/g, "");

/** "/"로 이은 목록 (스택 등) */
export function slashed(items: string[]) {
  return items.flatMap((s, i) => [
    ...(i
      ? [
          <span key={`d${i}`} style={{ color: "#d1d6db", margin: "0 12px" }}>
            /
          </span>,
        ]
      : []),
    <span key={s}>{s}</span>,
  ]);
}
