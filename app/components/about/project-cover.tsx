import type { ProjectCover } from "@/lib/profile";

// 프로젝트 대표 미디어. 영상은 음소거 자동 재생·반복 (모바일 자동 재생을 위해 muted + playsInline)
export function ProjectCoverMedia({ cover, className = "", controls = false }: { cover: ProjectCover; className?: string; controls?: boolean }) {
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
        // eslint-disable-next-line @next/next/no-img-element -- 구성도는 잘리지 않게 원본 비율로
        <img src={cover.image} alt={cover.alt} loading="lazy" className="absolute inset-0 size-full object-contain p-3" />
      )}
    </div>
  );
}
