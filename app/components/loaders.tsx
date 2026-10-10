// 로딩 표시: 스켈레톤(페이지 이동 중 모양 틀)과 원형 스피너(버튼 작업 중)

export function Bone({ className = "", width }: { className?: string; width?: number | string }) {
  return <span aria-hidden className={`skeleton block rounded-xl ${className}`} style={width ? { width } : undefined} />;
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 페이지 스켈레톤 공통 머리 (로고·메뉴는 실제와 같은 자리)
export function HeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-y-4 pt-5 pb-4 lg:flex-nowrap lg:py-7 lg:relative lg:left-1/2 lg:w-[max(100%,min(1072px,calc(100vw-3rem)))] lg:-translate-x-1/2" aria-hidden>
      <div className="contents lg:flex lg:items-center lg:gap-7">
        <span className="text-[20px] font-bold tracking-[-0.03em]">Minter.log</span>
        <div className="order-last flex w-full gap-3 overflow-hidden lg:order-none lg:w-auto">
          {[64, 84, 72, 72, 48, 44].map((w, i) => (
            <Bone key={i} className="h-5 rounded-lg" width={w} />
          ))}
        </div>
      </div>
      <Bone className="h-9 w-20 rounded-xl" />
    </div>
  );
}
