import { ImageResponse } from "next/og";
import { emph, OG, OG_SIZE, OgFrame, slashed, ogFonts, plain } from "@/lib/og";
import { PROFILE, PROJECT_CATEGORIES } from "@/lib/profile";
import { projectsWithDetail } from "@/lib/projects";

// 프로젝트 상세 OG 이미지: 분야 · 기간 · 역할, 이름, 대표 성과 한 줄([[강조]] 포함 bullet), 스택
export const alt = "프로젝트 소개 이미지";
export const size = OG_SIZE;
export const contentType = "image/png";

// 상세 페이지와 같은 목록으로 빌드 때 미리 만든다
export async function generateStaticParams() {
  const has = await projectsWithDetail(PROFILE.projects.map((p) => p.slug));
  return PROFILE.projects.filter((p) => has.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROFILE.projects.find((x) => x.slug === slug);
  const fonts = await ogFonts();
  if (!p) {
    return new ImageResponse(
      <OgFrame label="프로젝트" footLeft={null} footRight={PROFILE.name}>
        <span style={{ fontSize: 56, fontWeight: 600 }}>{PROFILE.name}</span>
      </OgFrame>,
      { ...size, fonts },
    );
  }

  // 대표 성과: [[강조]]가 있는 첫 bullet, 없으면 tagline
  const highlight = p.bullets.find((b) => b.includes("[["));
  const summary = highlight ?? (p.tagline ? plain(p.tagline) : "");

  return new ImageResponse(
    (
      <OgFrame
        label={`프로젝트 · ${PROJECT_CATEGORIES[p.category].label}`}
        footLeft={<>{slashed(p.stack.slice(0, 4))}</>}
        footRight={PROFILE.name}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: OG.primary }}>
            {p.period} · {p.role}
          </span>
          <span
            style={{
              fontSize: p.name.length > 22 ? 50 : 56,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.03em",
              color: OG.ink,
              wordBreak: "keep-all",
            }}
          >
            {p.name}
          </span>
          {summary && (
            <div
              style={{ display: "flex", flexDirection: "column", fontSize: 26, lineHeight: 1.5, color: OG.muted }}
            >
              {emph(summary)}
            </div>
          )}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
