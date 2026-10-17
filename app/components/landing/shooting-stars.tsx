// 홈 히어로 배경 별똥별 (#84). 파비콘·OG의 별자리 + 혜성 모티프를 첫 화면에도
// CSS 애니메이션만 쓴다 (globals.css .shooting-star). 움직임 줄이기 설정이면 멈춘 채 숨긴다

// top·left: 출발 위치(%), delay·duration: 초, length: 꼬리 길이(px)
const STARS = [
  { top: 4, left: 78, delay: 0.6, duration: 7, length: 150 },
  { top: 18, left: 96, delay: 3.4, duration: 9, length: 110 },
  { top: -2, left: 58, delay: 5.8, duration: 8, length: 180 },
  { top: 30, left: 88, delay: 8.2, duration: 10, length: 90 },
];

// 반짝이는 작은 네 갈래 별
const SPARKLES = [
  { top: 10, left: 64, size: 10, delay: 0 },
  { top: 26, left: 92, size: 7, delay: 1.2 },
  { top: 6, left: 86, size: 6, delay: 2.4 },
  { top: 44, left: 72, size: 8, delay: 3.1 },
];

export function ShootingStars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="shooting-star"
          style={
            {
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.length,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
      {SPARKLES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 10 10"
          width={s.size}
          height={s.size}
          className="sparkle absolute text-primary"
          style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }}
        >
          <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
