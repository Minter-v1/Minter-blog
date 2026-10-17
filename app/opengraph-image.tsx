import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIZE, OgConstellation, OgFrame, ogFonts, plain } from "@/lib/og";
import { PROFILE } from "@/lib/profile";

// 사이트 공통 OG 이미지. 하위 경로에 opengraph-image가 없으면 이 이미지를 쓴다
export const alt = `${PROFILE.name} · ${PROFILE.role} | Minter.log`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame label="개발 기록 · 포트폴리오" side={<OgConstellation />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 700 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: OG_COLORS.periwinkle }}>{PROFILE.role}</span>
          <span style={{ fontSize: 104, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em" }}>{PROFILE.name}</span>
          <span style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.45, color: OG_COLORS.mist }}>
            {plain(PROFILE.intro[0])}
          </span>
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
