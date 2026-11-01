// 학습 단계 (#133): 용어(Quick) → Hands-on → Deep Dive. 서버·클라이언트 공용
//
// - Quick은 IT 용어 사전 글 그 자체, Hands-on · Deep Dive는 학습 기록의 별도 글
// - 단계 글은 frontmatter에 step(어느 단계)과 source(출발한 용어 ref)를 남기고, 원래 용어를 관련 글로 연결한다
// - 손으로 해 볼 게 없는 용어는 handsOn: none 으로 Hands-on을 건너뛴다
import { toRef, type Ref } from "./collections";
import type { TemplateId } from "./learning-template";

export type StepId = "hands-on" | "deep-dive";

export const STEPS: { id: StepId; name: string; template: TemplateId; hint: string }[] = [
  { id: "hands-on", name: "Hands-on", template: "hands-on", hint: "직접 해 보며 익히기" },
  { id: "deep-dive", name: "Deep Dive", template: "deep-dive", hint: "원리와 배경 깊게 파기" },
];

// frontmatter 키 (컬렉션 추가 필드와 같은 자리에 저장, 화면의 추가 필드 입력칸에는 나오지 않는다)
export const STEP_KEY = "step";
export const SOURCE_KEY = "source";
export const HANDS_ON_KEY = "handsOn";
export const META_KEYS = [STEP_KEY, SOURCE_KEY, HANDS_ON_KEY] as const;

export const isStepId = (v: unknown): v is StepId => STEPS.some((s) => s.id === v);
export const stepName = (id: StepId) => STEPS.find((s) => s.id === id)!.name;

type WithExtra = { ref: Ref; collection: string; extra: Record<string, string> };

/** 이 글이 어느 용어의 몇 번째 단계 글인지. 단계 글이 아니면 null */
export function stepOf(entry: Pick<WithExtra, "collection" | "extra">): { step: StepId; source: Ref } | null {
  const step = entry.extra[STEP_KEY];
  const source = entry.extra[SOURCE_KEY];
  return entry.collection === "log" && isStepId(step) && source ? { step, source: source as Ref } : null;
}

/** 이 용어에서 출발한 단계 글 (단계마다 하나, 먼저 찾은 것) */
export function stepPostsOf<T extends WithExtra>(sourceRef: Ref, entries: T[]): Partial<Record<StepId, T>> {
  const out: Partial<Record<StepId, T>> = {};
  for (const e of entries) {
    const s = stepOf(e);
    if (s && s.source === sourceRef) out[s.step] ??= e;
  }
  return out;
}

export const skipsHandsOn = (extra: Record<string, string>) => extra[HANDS_ON_KEY] === "none";

/** 단계 글 쓰기 화면: 같은 단계 글이 이미 있으면 그 글 편집으로 넘어간다 (app/write/page.tsx) */
export const stepWriteHref = (step: StepId, sourceRef: Ref) =>
  `/write?c=log&step=${step}&from=${encodeURIComponent(sourceRef)}`;

/** frontmatter에서 읽은 추가 필드 중 단계 정보만, 올바른 값일 때만 남긴다 */
export function cleanStepMeta(raw: Record<string, unknown>, collection: string): Record<string, string> {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const out: Record<string, string> = {};
  const step = str(raw[STEP_KEY]);
  const source = str(raw[SOURCE_KEY]);
  if (collection === "log" && isStepId(step) && /^terms\/.+/.test(source)) {
    out[STEP_KEY] = step;
    out[SOURCE_KEY] = toRef("terms", source.slice("terms/".length));
  }
  if (collection === "terms" && str(raw[HANDS_ON_KEY]) === "none") out[HANDS_ON_KEY] = "none";
  return out;
}
