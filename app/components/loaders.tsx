// 로딩 표시: 스켈레톤(페이지 이동 중 모양 틀)과 원형 스피너(버튼 작업 중)

export function Bone({
  className = "",
  width,
}: {
  className?: string;
  width?: number | string;
}) {
  return (
    <span
      aria-hidden
      className={`skeleton block rounded-xl ${className}`}
      style={width ? { width } : undefined}
    />
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 페이지 스켈레톤 공통 머리 (로고·메뉴는 실제와 같은 자리)
export function HeaderSkeleton() {
  return (
    <div
      className="site-header flex items-center justify-between gap-4"
      aria-hidden
    >
      <div className="contents lg:flex lg:items-center lg:gap-7">
        <span className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.03em]">
          <span className="size-7 rounded-lg bg-[#1e2350]" />
          Minter
        </span>
        <div className="hidden gap-3 overflow-hidden lg:flex">
          {[64, 84, 72, 72, 48, 44].map((w, i) => (
            <Bone key={i} className="h-5 rounded-lg" width={w} />
          ))}
        </div>
      </div>
      <Bone className="h-9 w-20 rounded-xl" />
    </div>
  );
}

// 빈 목록 · 검색 결과 없음 · 오류 안내 (#99). 글자만 두지 않고 아이콘(Tossface)과 함께
export function EmptyState({
  emoji,
  title,
  desc,
  action,
  tone = "neutral",
  size = "md",
  className = "",
}: {
  emoji: string;
  title: string;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "neutral" | "danger";
  size?: "md" | "sm";
  className?: string;
}) {
  const sm = size === "sm";
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={`flex flex-col items-center text-center ${sm ? "gap-1.5 px-3 py-5" : "gap-2 px-4 py-12"} ${className}`}
    >
      <span
        aria-hidden
        className={`tossface flex items-center justify-center rounded-2xl ${
          tone === "danger" ? "bg-danger-weak" : "bg-fill"
        } ${sm ? "mb-0.5 size-10 text-[20px]" : "mb-1 size-14 text-[28px]"}`}
      >
        {emoji}
      </span>
      <p
        className={`font-semibold ${tone === "danger" ? "text-danger" : "text-text-2"} ${sm ? "text-[13px]" : "text-[16px]"}`}
      >
        {title}
      </p>
      {desc && (
        <p
          className={`max-w-[420px] text-text-3 ${sm ? "text-[12px]" : "text-[14px]"}`}
        >
          {desc}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
