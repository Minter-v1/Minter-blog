import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { OG_COLORS, OG_SIZE, OgConstellation, OgFrame, clip, ogFonts, plain } from "@/lib/og";
import { PROFILE } from "@/lib/profile";
import { projectsWithDetail } from "@/lib/projects";

// 프로젝트 상세 OG 이미지: 기간·역할, 이름, 한 줄 소개, 스택 + 오른쪽 대표 이미지
export const alt = "프로젝트 소개 이미지 | Minter.log";
export const size = OG_SIZE;
export const contentType = "image/png";

// 상세 페이지와 같은 목록으로 빌드 때 미리 만든다
export async function generateStaticParams() {
  const has = await projectsWithDetail(PROFILE.projects.map((p) => p.slug));
  return PROFILE.projects.filter((p) => has.has(p.slug)).map((p) => ({ slug: p.slug }));
}

// 대표 이미지(영상이면 포스터)를 data URI로. 없거나 못 읽으면 별자리 장식
async function coverSrc(cover: (typeof PROFILE.projects)[number]["cover"]) {
  const file = cover && ("image" in cover ? cover.image : cover.poster);
  if (!file || !/\.(png|jpe?g)$/i.test(file)) return null;
  try {
    const data = await readFile(path.join(process.cwd(), "public", file));
    return `data:image/${file.toLowerCase().endsWith(".png") ? "png" : "jpeg"};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROFILE.projects.find((x) => x.slug === slug);
  const fonts = await ogFonts();
  if (!p) {
    return new ImageResponse(
      <OgFrame label="프로젝트" side={<OgConstellation />}>
        <span style={{ fontSize: 72, fontWeight: 800 }}>{PROFILE.name}</span>
      </OgFrame>,
      { ...size, fonts },
    );
  }

  const cover = await coverSrc(p.cover);
  // 한 줄 소개는 tagline만 쓴다 (bullet은 길어 어색하게 잘림)
  const summary = p.tagline ? clip(plain(p.tagline), 40) : "";
  const long = p.name.length > 16;

  return new ImageResponse(
    (
      <OgFrame
        label="프로젝트"
        side={
          cover ? (
            <div
              style={{
                position: "absolute",
                right: 64,
                top: 140,
                width: 400,
                height: 350,
                display: "flex",
                borderRadius: 28,
                overflow: "hidden",
                border: `2px solid ${OG_COLORS.periwinkle}55`,
                background: "#ffffff",
              }}
            >
              <img src={cover} width={400} height={350} alt="" style={{ objectFit: "cover", objectPosition: p.cover?.position ?? "center" }} />
            </div>
          ) : (
            <OgConstellation size={400} />
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 620 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: OG_COLORS.periwinkle }}>
            {p.period} · {p.role}
          </span>
          <span style={{ fontSize: long ? 48 : 64, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.03em", wordBreak: "keep-all" }}>
            {clip(p.name, 36)}
          </span>
          {summary && (
            <span style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.45, color: OG_COLORS.mist }}>{summary}</span>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
            {p.stack.slice(0, 4).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: `${OG_COLORS.lavender}2e`,
                  color: OG_COLORS.pale,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
