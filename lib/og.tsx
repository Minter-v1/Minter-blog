import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { CONSTELLATION, MARK } from "./og-mark";

// OG 이미지 공통 (사이트 app/opengraph-image.tsx, 프로젝트 app/about/projects/[slug]/opengraph-image.tsx)
// satori는 woff2를 못 읽어 assets/fonts 의 Pretendard subset woff를 쓴다 (OFL)

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_COLORS = {
  night: "#1e2350",
  periwinkle: "#8c9be6",
  lavender: "#b39ddb",
  pale: "#d9ccf0",
  mist: "#ede8f8",
};

const font = (file: string) => readFile(path.join(process.cwd(), "assets/fonts", file));

export async function ogFonts() {
  const [medium, bold, extraBold] = await Promise.all([
    font("Pretendard-Medium.subset.woff"),
    font("Pretendard-Bold.subset.woff"),
    font("Pretendard-ExtraBold.subset.woff"),
  ]);
  return [
    { name: "Pretendard", data: medium, weight: 500 as const, style: "normal" as const },
    { name: "Pretendard", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Pretendard", data: extraBold, weight: 800 as const, style: "normal" as const },
  ];
}

/** 남색 밤하늘 바탕 + 왼쪽 위 브랜드 줄 + 아래 주소 줄. children이 가운데 내용 */
export function OgFrame({ children, side, label }: { children: ReactNode; side?: ReactNode; label: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `radial-gradient(circle at 85% 20%, #2c3470 0%, ${OG_COLORS.night} 60%)`,
        color: "#ffffff",
        fontFamily: "Pretendard",
      }}
    >
      {/* 흩뿌린 별 */}
      {[
        [96, 520, 3, 0.5],
        [540, 64, 2, 0.45],
        [700, 560, 2.5, 0.4],
        [1130, 590, 2, 0.5],
        [1150, 60, 3, 0.6],
        [430, 300, 2, 0.3],
      ].map(([x, y, r, o], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - r,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            background: OG_COLORS.mist,
            opacity: o,
          }}
        />
      ))}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "64px 72px", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={52} height={52} alt="" />
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Minter.log</span>
          <span style={{ fontSize: 24, fontWeight: 500, color: OG_COLORS.lavender }}>{label}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 }}>{children}</div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: OG_COLORS.pale, opacity: 0.85 }}>
          minter-v1.com
        </div>
      </div>
      {side}
    </div>
  );
}

/** 오른쪽 큰 별자리 장식 */
export function OgConstellation({ size = 460, right = 40, top = 85 }: { size?: number; right?: number; top?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={CONSTELLATION} width={size} height={size} alt="" style={{ position: "absolute", right, top }} />;
}

/** "[[강조]]", "**굵게**" 표시 제거 */
export const plain = (s: string) => s.replace(/\[\[|\]\]|\*\*/g, "");

/** 글자 수로 자르기 (satori에 줄 수 제한이 없어 길이로 맞춘다) */
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
