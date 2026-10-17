import type { ProjectCover } from "@/lib/profile";

// 프로젝트 대표 미디어. 영상은 음소거 자동 재생·반복 (모바일 자동 재생을 위해 muted + playsInline)
// fit "cover"(기본): 카드 썸네일, 틀을 꽉 채우고 cover.position 기준으로 자름 (#67)
// fit "contain": 상세 페이지 상단, 구성도가 잘리지 않게 원본 비율로
export function ProjectCoverMedia({
  cover,
  className = "",
  controls = false,
  fit = "cover",
}: {
  cover: ProjectCover;
  className?: string;
  controls?: boolean;
  fit?: "cover" | "contain";
}) {
  return (
    <div className={`relative overflow-hidden bg-fill ${className}`}>
      {"video" in cover ? (
        <video
          src={cover.video}
          poster={cover.poster}
          aria-label={cover.alt}
          autoPlay
          muted
          loop
          playsInline
          controls={controls}
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- 프로젝트 이미지는 원본 파일 그대로
        <img
          src={cover.image}
          alt={cover.alt}
          loading="lazy"
          style={fit === "cover" ? { objectPosition: cover.position ?? "center" } : undefined}
          className={`absolute inset-0 size-full ${fit === "cover" ? "object-cover" : "object-contain p-3"}`}
        />
      )}
    </div>
  );
}
