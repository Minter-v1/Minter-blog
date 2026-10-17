import Link from "next/link";
import { PROFILE, type ProjectCategory } from "@/lib/profile";
import { ChevronRight } from "../icons";

// 홈 히어로 통계 (#108): 기울어진 고리를 두른 행성 위 숫자 + 제목 + 설명 두 줄
// 고리는 뒤쪽(옅게) · 행성 · 앞쪽(진하게) 순으로 겹쳐 입체감, 네 갈래 별이 앞뒤로 돈다 (.orbit-sat, globals.css)
// 숫자는 Reveal이 [data-count]를 0부터 올린다
// 누를 수 있다는 신호 (#116): 평소 제목 옆 옅은 ›, 마우스 올림 · 포커스 때 행성 · 고리 · 별 · › 가 함께 반응 (.orbit-stat)

const SHORT: Record<ProjectCategory, string> = { cloud: "클라우드", web: "웹", automation: "자동화" };
// 행성 색: 밝은 쪽, 기본 (칸마다 조금씩 다르게)
const PLANET = [
  ["#c3cbf5", "#5a6dcb"],
  ["#d9ccf0", "#7d6bc4"],
  ["#b8d0f5", "#4f74c9"],
  ["#e6dcf7", "#8a72c9"],
];

function stats() {
  const byCat = Object.entries(
    PROFILE.projects.reduce<Record<string, number>>((m, p) => ({ ...m, [p.category]: (m[p.category] ?? 0) + 1 }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${SHORT[c as ProjectCategory]} ${n}`);
  // 클라우드 자격증을 앞에 (AWS · 네이버클라우드)
  const certs = [...PROFILE.certifications]
    .sort((a, b) => Number(/AWS|네이버/.test(b.issuer)) - Number(/AWS|네이버/.test(a.issuer)))
    .map((c) => c.short ?? c.name);
  return [
    {
      href: "/about#experience",
      label: "실무 경험",
      value: PROFILE.experience.length,
      unit: "곳",
      lines: [PROFILE.experience[0]?.title ?? "", PROFILE.experience.slice(1).map((e) => e.title).join(" · ")],
    },
    {
      href: "/about#projects",
      label: "주요 프로젝트",
      value: PROFILE.projects.length,
      unit: "개",
      lines: [byCat[0] ?? "", byCat.slice(1).join(" · ")],
    },
    {
      href: "/about#certifications",
      label: "자격증",
      value: PROFILE.certifications.length,
      unit: "개",
      lines: [certs.slice(0, 2).join(" · "), certs.length > 2 ? `외 ${certs.length - 2}` : ""],
    },
    {
      href: "/about#awards",
      label: "수상 · 논문",
      value: PROFILE.awards.length + PROFILE.papers.length,
      unit: "건",
      lines: [`수상 ${PROFILE.awards.length}`, `제1저자 논문 ${PROFILE.papers.length}`],
    },
  ];
}

// 고리 크기 (px): 폭 132 · 높이 100, 타원 반지름 58 × 17, 행성 반지름 31
const W = 132;
const H = 100;
const CX = W / 2;
const CY = H / 2;
const RX = 58;
const RY = 17;
const PR = 31;
// 왼쪽 끝에서 시작해 아래(앞) → 오른쪽 → 위(뒤)로 한 바퀴
const PATH = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 1 0 ${CX + RX} ${CY} A ${RX} ${RY} 0 1 0 ${CX - RX} ${CY}`;
const FRONT = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 0 ${CX + RX} ${CY}`;
const BACK = `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 1 ${CX + RX} ${CY}`;

function Planet({ i, value, unit }: { i: number; value: number; unit: string }) {
  const [hi, lo] = PLANET[i % PLANET.length];
  const ring = (d: string, side: "front" | "back", z: number) => (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute inset-0 overflow-visible" style={{ zIndex: z }} aria-hidden>
      <path d={d} fill="none" className={`orbit-ring-${side}`} />
    </svg>
  );
  return (
    <div className="orbit-planet relative shrink-0" style={{ width: W, height: H }}>
      {ring(BACK, "back", 1)}
      <span
        aria-hidden
        className="orbit-globe absolute z-[2] rounded-full"
        style={{
          left: CX - PR,
          top: CY - PR,
          width: PR * 2,
          height: PR * 2,
          background: `radial-gradient(circle at 34% 30%, ${hi}, ${lo} 52%, #1b2050 100%)`,
        }}
      />
      {ring(FRONT, "front", 3)}
      <span
        aria-hidden
        className="orbit-sat star-mark absolute top-0 left-0 size-[11px] bg-white"
        style={{ offsetPath: `path('${PATH}')`, animationDuration: `${8 + i * 1.6}s`, animationDelay: `-${i * 2.1}s` }}
      />
      <span
        className="absolute z-[4] flex rotate-12 items-baseline justify-center pt-[18px] text-white [text-shadow:0_1px_8px_rgb(20_24_66/0.6)]"
        style={{ left: CX - PR, top: CY - PR, width: PR * 2, height: PR * 2 }}
      >
        <span className="text-[25px] leading-none font-bold tracking-[-0.04em] tabular-nums" data-count={value}>
          {value}
        </span>
        <span className="ml-0.5 text-[11px] font-semibold text-white/85">{unit}</span>
      </span>
    </div>
  );
}

export function OrbitStats() {
  return (
    <dl className="mt-14 grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4">
      {stats().map((s, i) => (
        <Link
          key={s.label}
          href={s.href}
          className="orbit-stat group flex flex-col items-center gap-3 rounded-[22px] px-2 py-2 text-center outline-offset-4 transition-[background-color,scale] duration-150 active:scale-[0.97] active:bg-white/[0.08] sm:flex-row sm:gap-4 sm:text-left"
        >
          <Planet i={i} value={s.value} unit={s.unit} />
          <div className="min-w-0">
            <dt className="inline-flex items-center gap-1 text-[14px] font-semibold text-text">
              {s.label}
              <ChevronRight className="orbit-chev size-3" />
            </dt>
            <dd className="mt-1 text-[12px] leading-[1.5] whitespace-nowrap text-text-3">
              {s.lines[0]}
              {s.lines[1] && (
                <>
                  <br />
                  {s.lines[1]}
                </>
              )}
            </dd>
          </div>
        </Link>
      ))}
    </dl>
  );
}
