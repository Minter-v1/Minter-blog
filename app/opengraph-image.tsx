import { ImageResponse } from "next/og";
import { emph, OG, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";
import { PROFILE } from "@/lib/profile";

// 사이트 공통 OG 이미지. 하위 경로에 opengraph-image가 없으면 이 이미지를 쓴다
export const alt = `${PROFILE.name} · ${PROFILE.role}`;
export const size = OG_SIZE;
export const contentType = "image/png";

// 한 줄 소개 (intro[0]은 이미지에 넣기엔 길어 줄였다). [[ ]]가 강조
const HEADLINE = "장애가 나도 [[멈추지 않는 인프라]]를\n만드는 클라우드 엔지니어";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame
        label={`${PROFILE.name} · ${PROFILE.role}`}
        footLeft={<span>개발 기록 · 포트폴리오</span>}
        footRight={PROFILE.keywords.slice(0, 4).join(" · ")}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 64,
            fontWeight: 400,
            lineHeight: 1.32,
            letterSpacing: "-0.035em",
            color: OG.sub,
          }}
        >
          {emph(HEADLINE)}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
