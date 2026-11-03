import { ImageResponse } from "next/og";
import { decodeSlug } from "@/lib/api";
import { findEntry, loadArchive } from "@/lib/archive";
import { COLLECTIONS, isCollectionId } from "@/lib/collections";
import { OG, OG_SIZE, OgFrame, ogFonts, slashed } from "@/lib/og";
import { PROFILE } from "@/lib/profile";

// 게시글 OG 이미지 (#141): 컬렉션 · 분류, 제목, 한 줄 요약. 링크 미리보기에서 어떤 글인지 바로 보이게
// 글 페이지와 같이 처음 요청 때 만들어 캐시하고, 글을 고치면 5분 안에 갱신
export const alt = "게시글 소개 이미지";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export default async function Image({ params }: { params: Promise<{ collection: string; slug: string }> }) {
  const { collection, slug } = await params;
  const fonts = await ogFonts();
  const entry = isCollectionId(collection) ? findEntry(await loadArchive(), collection, decodeSlug(slug)) : null;
  if (!entry) {
    return new ImageResponse(
      <OgFrame label="개발 기록" footLeft={null} footRight={PROFILE.name}>
        <span style={{ fontSize: 56, fontWeight: 600 }}>{PROFILE.name}</span>
      </OgFrame>,
      { ...size, fonts },
    );
  }

  const c = COLLECTIONS[entry.collection];
  const title = clip(entry.title, 60);
  const [y, m, d] = entry.date.split("-");

  return new ImageResponse(
    (
      <OgFrame label={c.label} footLeft={<>{slashed(entry.tags.slice(0, 3))}</>} footRight={PROFILE.name}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: OG.primary }}>{`${y}. ${Number(m)}. ${Number(d)}.`}</span>
          <span
            style={{
              fontSize: title.length > 24 ? 50 : 60,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.03em",
              color: OG.ink,
              wordBreak: "keep-all",
            }}
          >
            {title}
          </span>
          {entry.description && (
            <span style={{ fontSize: 26, lineHeight: 1.5, color: OG.muted, wordBreak: "keep-all" }}>
              {clip(entry.description, 90)}
            </span>
          )}
        </div>
      </OgFrame>
    ),
    { ...size, fonts },
  );
}
