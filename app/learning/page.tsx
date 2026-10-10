import type { Metadata } from "next";
import Link from "next/link";
import { REVIEW_INTERVALS, REVIEW_TOTAL } from "@/lib/review";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: "망각곡선 학습법",
  description: "에빙하우스의 망각곡선과 간격 반복, 이 블로그의 복습 규칙과 복습 방법",
};

// 공개 페이지 (인증 없음, 정적 생성). 복습 간격은 lib/review.ts의 REVIEW_INTERVALS를 그대로 써서 규칙과 설명이 어긋나지 않게 한다

// Ebbinghaus (1885) 실험의 절약률(savings). 처음 외울 때보다 다시 외울 때 줄어든 노력의 비율
const EBBINGHAUS = [
  { after: "20분", savings: 58.2 },
  { after: "1시간", savings: 44.2 },
  { after: "9시간", savings: 35.8 },
  { after: "1일", savings: 33.7 },
  { after: "2일", savings: 27.8 },
  { after: "6일", savings: 25.4 },
  { after: "31일", savings: 21.1 },
];

// 복습한 날 (작성 완료일 = 0일)
const REVIEW_DAYS = REVIEW_INTERVALS.reduce<number[]>((acc, d) => [...acc, (acc.at(-1) ?? 0) + d], []);

export default function ReviewGuidePage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 sm:px-6">
      <SiteHeader active="learning" />

      <div className="mt-4 mb-8 px-1">
        <p className="text-[14px] font-semibold text-text-3">복습</p>
        <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.035em] sm:text-[34px]">망각곡선 학습법</h1>
        <p className="mt-3 text-[16px] leading-[1.7] text-text-2 sm:text-[17px]">
          공부한 내용은 생각보다 빨리 잊힌다. 이 블로그는 작성 완료한 글을 잊히기 직전에 다시 꺼내 보도록 복습 일정을
          자동으로 잡아 준다. 왜 그런 간격으로 복습하는지, 복습할 때는 무엇을 하면 좋은지 정리했다.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="망각곡선">
          <p>
            독일의 심리학자 헤르만 에빙하우스(Hermann Ebbinghaus)는 1885년, 의미 없는 음절 목록을 스스로 외운 뒤 시간이
            지나 다시 외우는 실험을 했다. 처음 외울 때보다 다시 외울 때 노력이 얼마나 줄었는지(절약률)를 재 보니,
            기억은 <strong>학습 직후 가장 빠르게 줄고</strong> 시간이 지날수록 천천히 줄어드는 곡선을 그렸다. 이것이{" "}
            <strong className="text-primary">망각곡선(Forgetting Curve)</strong>이다.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-[14px]">
              <thead>
                <tr className="border-b border-line text-left text-text-3">
                  <th className="py-2 pr-4 font-semibold">경과 시간</th>
                  {EBBINGHAUS.map((e) => (
                    <th key={e.after} className="px-2 py-2 text-center font-semibold">
                      {e.after}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 pr-4 text-text-3">절약률</td>
                  {EBBINGHAUS.map((e) => (
                    <td key={e.after} className="px-2 py-2 text-center font-semibold tabular-nums">
                      {e.savings}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13px] text-text-3">
            Ebbinghaus, H. (1885). <em>Über das Gedächtnis</em>. 한 사람(본인)을 대상으로 한 실험값으로, 일반적인 기억률을
            그대로 뜻하지는 않는다. 다만 &ldquo;처음 하루가 가장 많이 잊힌다&rdquo;는 경향은 이후 연구에서도 반복해서
            확인됐다.
          </p>
        </Section>

        <Section title="잊히기 직전에 다시 보기">
          <p>
            망각을 막는 방법은 단순하다. <strong>잊어버리기 전에 다시 보는 것</strong>이다. 그리고 다시 볼 때마다 기억은
            조금 더 단단해져서, 다음에 잊히기까지 걸리는 시간이 길어진다. 그래서 복습 간격을 처음에는 짧게, 점점 길게
            늘려 가는 방식을 <strong className="text-primary">간격 반복(Spaced Repetition)</strong>이라고 한다.
          </p>
          <ForgettingChart />
          <p className="mt-3 text-[13px] text-text-3">
            복습 효과를 보여 주기 위한 개념 모형이다. 실측 데이터가 아니며, 실제 기억은 내용과 사람에 따라 다르다.
          </p>
        </Section>

        <Section title="이 블로그의 복습 규칙">
          <p>
            글을 작성 완료한 날을 기준으로 아래 간격마다 복습 알림이 온다. 총 {REVIEW_TOTAL}번을 마치면 그 글의 복습은
            끝난다.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {REVIEW_INTERVALS.map((d, i) => (
              <div key={i} className="rounded-2xl bg-fill px-3 py-3 text-center">
                <p className="text-[12px] font-semibold text-text-3">{i + 1}회</p>
                <p className="mt-0.5 text-[18px] font-bold tabular-nums">{d}일 뒤</p>
              </div>
            ))}
          </div>
          <ul className="mt-5 space-y-2">
            <li>
              <strong>복습 완료를 눌러야 다음 단계로 넘어간다.</strong> 다음 복습일은 작성일이 아니라 실제로 복습한 날부터
              센다. 하루 늦게 복습해도 그 다음 간격은 줄어들지 않는다.
            </li>
            <li>
              <strong>놓친 복습은 사라지지 않는다.</strong> 복습할 날이 지나면 &lsquo;밀림&rsquo;으로 목록 맨 위에 남아,
              할 때까지 계속 보인다.
            </li>
            <li>
              <strong>매일 밤 11시대에 메일이 온다.</strong> 밀린 글과 오늘 복습할 글을 컬렉션별로 묶어 보내고, 용어
              사전은 정의와 본문 요약까지 메일에 담는다. 복습할 글이 없는 날은 보내지 않는다.
            </li>
          </ul>
        </Section>

        <Section title="복습하는 방법">
          <p>
            같은 글을 다시 읽기만 하면 익숙한 느낌이 들어 다 아는 것처럼 착각하기 쉽다. 복습 효과를 높이려면 읽기 전에{" "}
            <strong className="text-primary">먼저 떠올려 보는 것(능동 회상, Active Recall)</strong>이 좋다. 떠올리려고
            애쓰는 과정 자체가 기억을 강화한다.
          </p>
          <ol className="mt-5 space-y-3">
            <Step n={1} title="제목만 보고 떠올리기">
              용어 사전이라면 정의를, 학습 기록이라면 무엇을 왜 했는지 흐름을 한두 문장으로 말해 본다.
            </Step>
            <Step n={2} title="본문으로 확인하기">
              떠올린 내용과 본문을 비교한다. 빠뜨렸거나 틀린 부분이 이번 복습에서 가장 중요한 부분이다.
            </Step>
            <Step n={3} title="복습 완료 누르기">
              글 아래나 복습 페이지에서 복습 완료를 누르면 다음 복습일이 정해진다. 고칠 내용이 보였다면 그때 글을 수정해
              둔다.
            </Step>
          </ol>
        </Section>

        <Section title="하루 흐름">
          <ol className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
            {["밤 11시대 복습 메일", "제목만 보고 떠올리기", "본문 확인", "복습 완료", "다음 복습일 예약"].map((s, i, all) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-fill px-3 py-1.5">{s}</span>
                {i < all.length - 1 && <span className="text-text-3">→</span>}
              </li>
            ))}
          </ol>
          <Link
            href="/review"
            className="mt-6 inline-flex h-11 items-center rounded-2xl bg-primary px-5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-press"
          >
            오늘 복습하러 가기
          </Link>
        </Section>
      </div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-surface px-5 py-7 text-[15px] leading-[1.75] text-text-2 sm:px-8 sm:py-8 sm:text-[16px]">
      <h2 className="mb-3 text-[20px] font-bold tracking-[-0.03em] text-text">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Step(props: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-weak text-[13px] font-bold text-primary">
        {props.n}
      </span>
      <div>
        <p className="font-semibold text-text">{props.title}</p>
        <p className="mt-0.5">{props.children}</p>
      </div>
    </li>
  );
}

/**
 * 복습 없이 잊혀 가는 곡선과, 복습할 때마다 회복되는 곡선 (개념 모형).
 * 망각은 처음에 급하고 갈수록 완만한 거듭제곱 꼴이라 R(t) = (1 + t/τ)^-β로 그린다.
 * β, τ는 위 표의 에빙하우스 실험값(1일 33.7%, 6일 25.4%, 31일 21.1%)에 맞췄다.
 * 복습하면 100%로 돌아가고, 다음 복습일에 약 60%가 남도록 망각 속도(τ)를 늦췄다.
 */
const BETA = 0.143;
const TAU0 = 0.0005; // 일 단위
const recall = (t: number, tau: number) => Math.pow(1 + t / tau, -BETA);
const tauFor = (interval: number) => interval / (Math.pow(0.6, -1 / BETA) - 1); // interval일 뒤 60%

function ForgettingChart() {
  const W = 680;
  const H = 260;
  const pad = { l: 44, r: 16, t: 16, b: 40 };
  const days = 30;
  const x = (d: number) => pad.l + (d / days) * (W - pad.l - pad.r);
  const y = (r: number) => pad.t + (1 - r) * (H - pad.t - pad.b);
  const steps = days * 24;
  const ts = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * days);

  const noReview = ts.map((t) => [x(t), y(recall(t, TAU0))]);

  // 복습할 때마다 1(100%)로 돌아가고, 다음 간격 동안 더 천천히 줄어든다
  const withReview: [number, number][] = [];
  const reviews = REVIEW_DAYS.filter((d) => d <= days);
  let last = 0;
  let tau = TAU0;
  for (const t of ts) {
    const next = reviews.find((d) => d > last && d <= t);
    if (next !== undefined) {
      withReview.push([x(next), y(recall(next - last, tau))]);
      const done = reviews.indexOf(next) + 1; // 마친 복습 횟수
      last = next;
      tau = tauFor(REVIEW_INTERVALS[done] ?? REVIEW_INTERVALS.at(-1)!);
      withReview.push([x(next), y(1)]);
    }
    withReview.push([x(t), y(recall(t - last, tau))]);
  }
  const path = (pts: number[][]) => pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");

  return (
    <figure className="mt-5">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[520px]"
          role="img"
          aria-label="복습 없이 기억이 줄어드는 곡선과 복습할 때마다 회복되는 곡선 비교"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={r}>
              <line x1={pad.l} x2={W - pad.r} y1={y(r)} y2={y(r)} stroke="#eceef1" />
              <text x={pad.l - 8} y={y(r)} dy="0.35em" textAnchor="end" fontSize="11" fill="#8b95a1">
                {r * 100}%
              </text>
            </g>
          ))}
          {reviews.map((d, i) => (
            <g key={d}>
              <line x1={x(d)} x2={x(d)} y1={pad.t} y2={H - pad.b} stroke="#3182f6" strokeOpacity="0.25" strokeDasharray="3 4" />
              <text x={x(d)} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="#3182f6" fontWeight="600">
                {i + 1}회
              </text>
              <text x={x(d)} y={H - pad.b + 30} textAnchor="middle" fontSize="10" fill="#8b95a1">
                {d}일
              </text>
            </g>
          ))}
          <text x={x(0)} y={H - pad.b + 30} textAnchor="middle" fontSize="10" fill="#8b95a1">
            0일
          </text>
          <path d={path(noReview)} fill="none" stroke="#c5ccd3" strokeWidth="2.5" />
          <path d={path(withReview)} fill="none" stroke="#3182f6" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-text-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-[#c5ccd3]" />
          복습하지 않았을 때
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-primary" />
          간격 반복으로 복습했을 때
        </span>
      </figcaption>
    </figure>
  );
}
