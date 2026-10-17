import { ShootingStars } from "./shooting-stars";

// 홈 헤더 + 히어로 뒤 밤하늘 (#86). 고정 헤더(#95) 뒤까지 덮도록 위로 헤더 높이만큼 늘린다. 화면 전체 폭으로 깔고, 아래로 갈수록 페이지 배경색으로 녹인다
// 별 위치는 고정 시드로 만들어 서버·브라우저 렌더 결과가 같다

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const rand = seeded(20261018);
const STARS = Array.from({ length: 110 }, () => ({
  x: rand() * 100,
  y: rand() * 82, // 아래쪽 녹는 구간에는 별을 두지 않는다
  r: [1, 1, 1, 1.5, 1.5, 2, 2.5][Math.floor(rand() * 7)],
  o: 0.25 + rand() * 0.65,
  d: rand() * 4,
}));

export function NightSky() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[calc(var(--header-h)*-1)] bottom-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0b0d26 0%, #161a44 45%, #232a63 80%, #f5f6f8 100%)" }}
    >
      {/* 성운 빛 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48vw 40vh at 82% 16%, rgb(140 155 230 / 0.3), transparent 70%), radial-gradient(40vw 34vh at 10% 70%, rgb(179 157 219 / 0.2), transparent 70%)",
        }}
      />
      {STARS.map((s, i) => (
        <span
          key={i}
          className="night-star"
          style={{
            left: `${s.x.toFixed(2)}%`,
            top: `${s.y.toFixed(2)}%`,
            width: s.r * 2,
            height: s.r * 2,
            opacity: Number(s.o.toFixed(2)),
            animationDelay: `${s.d.toFixed(1)}s`,
          }}
        />
      ))}
      <ShootingStars />
    </div>
  );
}
