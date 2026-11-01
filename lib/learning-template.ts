// 컬렉션별 학습 템플릿 (#34, 단계별 템플릿 #133). 서버·클라이언트 공용
//
// - 본문(상세 설명)에 `## 섹션명` + 회색 작성 가이드를 깔아 주는 작성 보조 도구다. 저장 구조는 그대로 Markdown
// - 작성 강제 없음: 가이드만 남은(=안 쓴) 섹션은 작성 완료로 저장할 때 제목·가이드째 빠진다
// - 이미 쓴 글에는 아직 없는 섹션만 본문 끝에 추가한다 (기존 내용은 건드리지 않음)
// - 컬렉션마다 템플릿이 여러 개일 수 있다. 학습 기록은 Log · Hands-on · Deep Dive 중에서 고른다
//   용어(Quick) → Hands-on → Deep Dive 순서로 글을 늘려 가는 흐름은 lib/learning-steps.ts
import type { CollectionId } from "./collections";

export type TemplateSection = {
  title: string;
  guide: string;
  subs?: { title: string; guide: string }[];
  guides?: string[]; // 정리용: 같은 제목의 섹션이 여러 템플릿에 있을 때 모든 가이드
};
export type TemplateId = "quick" | "log" | "hands-on" | "deep-dive" | "default";
export type LearningTemplate = { id: TemplateId; name: string; summary: string; sections: TemplateSection[] };

const QUICK: LearningTemplate = {
  id: "quick",
  name: "Quick",
  summary: "5초 이해 · 상황 · 정의 · 그림",
  sections: [
    { title: "5초 이해", guide: "전문 용어 없이 한 문장. 이게 무엇을 해 주는지만" },
    {
      title: "상황으로 이해하기",
      guide: "일상 상황 하나로 '이게 없으면 → 있으면' 흐름을 그린다. 비유가 실제 동작과 어긋나는 지점도 한 줄",
    },
    { title: "정확한 정의", guide: "면접에서 그대로 말할 수 있는 정의 2~3문장과 핵심 키워드 3개" },
    {
      title: "그림으로 보기",
      guide: "Mermaid로 구성 요소와 흐름(누가 → 무엇을 → 누구에게)을 그리고, 그림 아래 한두 줄 해설",
    },
  ],
};

const HANDS_ON: LearningTemplate = {
  id: "hands-on",
  name: "Hands-on",
  summary: "목표 · 준비 · 관찰 · 구현 · 배운 점",
  sections: [
    { title: "목표", guide: "이 실습으로 무엇을 확인할지 한 문장" },
    { title: "준비", guide: "환경, 도구, 버전. 따라 하려면 필요한 것" },
    { title: "Level 1. 관찰", guide: "기존 도구로 동작 확인 (DevTools, curl, dig 등). 명령 → 결과 → 해석" },
    { title: "Level 2. 구현", guide: "코드나 환경을 직접 구성해 검증. 코드 → 결과 → 주의할 점" },
    { title: "막힌 점과 배운 점", guide: "예상과 달랐던 것, 해결한 방법, 새로 알게 된 것" },
  ],
};

const DEEP_DIVE: LearningTemplate = {
  id: "deep-dive",
  name: "Deep Dive",
  summary: "배경 · 원리 · 비교 · 실무 · 면접 · 요약",
  sections: [
    { title: "등장 배경", guide: "이전 방식 → 그 방식의 한계 → 이 기술로 해결한 점" },
    { title: "동작 원리", guide: "실제 순서대로 단계별로. 관여하는 구성 요소와 데이터의 이동. Hands-on에서 본 결과와 연결" },
    { title: "비교 및 관계", guide: "비슷한 기술, 대체 기술, 함께 쓰는 기술, 상위·하위 개념과의 관계" },
    { title: "실무 관점", guide: "운영 환경에서 고려할 점. 장애, 보안, 확장 이슈" },
    { title: "면접 질문", guide: "기본, 심화, 응용 질문과 답변 포인트" },
    { title: "최종 요약", guide: "정의, 등장 이유, 핵심 동작, 주의사항, 한 문장 요약" },
  ],
};

const LOG: LearningTemplate = {
  id: "log",
  name: "Log",
  summary: "공부한 내용을 자유롭게",
  sections: [
    { title: "개요", guide: "무엇을 공부했는지 한두 문장" },
    { title: "배경과 목표", guide: "왜 공부했는지, 끝나고 나면 할 수 있어야 하는 것" },
    { title: "학습 내용", guide: "핵심 개념과 내가 이해한 방식" },
    { title: "동작 원리", guide: "구조나 흐름을 단계별로" },
    { title: "시각화", guide: "Mermaid 다이어그램이나 표. 필요 없으면 지운다" },
    { title: "직접 실험", guide: "실행한 명령이나 코드, 결과와 해석" },
    { title: "비교 및 관계", guide: "비슷한 개념, 이전에 배운 내용과의 연결" },
    { title: "정리", guide: "새로 알게 된 점, 헷갈렸던 점, 남은 질문" },
    { title: "복습 포인트", guide: "다음 복습 때 먼저 떠올려 볼 질문 2~3개" },
  ],
};

const single = (sections: TemplateSection[]): LearningTemplate[] => [{ id: "default", name: "기본", summary: "", sections }];

export const LEARNING_TEMPLATES: Record<CollectionId, LearningTemplate[]> = {
  terms: [QUICK],
  log: [LOG, HANDS_ON, DEEP_DIVE],
  git: single([
    { title: "5초 이해", guide: "이 명령이 하는 일을 1~2문장으로" },
    { title: "사용법", guide: "기본 문법과 자주 쓰는 형태 (코드 블록)" },
    { title: "자주 쓰는 옵션", guide: "옵션별 의미와 쓰는 상황" },
    { title: "동작 원리", guide: "실행하면 커밋, 브랜치, 인덱스가 어떻게 바뀌는지" },
    { title: "예시", guide: "실제 상황과 명령, 실행 결과" },
    { title: "주의할 점", guide: "이미 push한 커밋, 협업 중에 조심할 상황" },
    { title: "되돌리기", guide: "잘못 실행했을 때 되돌리는 방법" },
    { title: "비교 및 관계", guide: "비슷한 명령과의 차이, 함께 쓰는 명령" },
    { title: "최종 요약", guide: "언제 쓰는지와 핵심 명령 한 줄" },
  ]),
  troubleshooting: single([
    { title: "상황", guide: "무엇을 하다가, 어떤 환경에서 발생했는지" },
    { title: "증상과 에러", guide: "실제 증상, 에러 메시지와 로그 (코드 블록)" },
    { title: "원인", guide: "세운 가설과 확인 과정, 최종 원인" },
    { title: "해결", guide: "적용한 조치와 변경 내용" },
    { title: "검증", guide: "해결됐음을 확인한 방법과 결과" },
    { title: "재발 방지", guide: "같은 문제를 막기 위한 조치나 체크리스트" },
    { title: "배운 점", guide: "새로 알게 된 개념, 다음에 다르게 할 점" },
    { title: "관련 개념", guide: "이해하는 데 필요한 개념과 관련 용어" },
  ]),
  career: single([
    { title: "개요", guide: "무엇에 관한 노트인지 한두 문장" },
    { title: "배경", guide: "왜 정리하게 됐는지. 지원 기업, 직무, 상황" },
    { title: "핵심 내용", guide: "정리한 기준이나 전략, 알게 된 점" },
    { title: "근거와 자료", guide: "채용 공고, IR 자료, 기사, 피드백 등 판단의 근거" },
    { title: "적용", guide: "자기소개서, 면접 답변, 포트폴리오에 어떻게 반영했는지" },
    { title: "회고", guide: "잘된 점과 아쉬운 점, 다음에 다르게 할 점" },
    { title: "다음 행동", guide: "이어서 할 일과 기한" },
  ]),
};

// 예전 IT 용어 사전 템플릿(#133 이전). 새로 넣지는 않지만, 이 뼈대로 쓰다 만 글을 작성 완료로 저장할 때 안 쓴 섹션을 지울 수 있게 남겨 둔다
const LEGACY_SECTIONS: Partial<Record<CollectionId, TemplateSection[]>> = {
  terms: [
    { title: "5초 이해", guide: "전문 용어 없이 1~2문장으로. 친숙한 상황 하나를 곁들인다" },
    { title: "핵심 정의", guide: "면접에서 그대로 말할 수 있는 정확한 정의와 핵심 키워드" },
    { title: "등장 배경", guide: "이전 방식 → 그 방식의 한계 → 이 기술로 해결한 점" },
    { title: "사용 목적 및 사례", guide: "주요 목적, 실제 사용 사례, 쓰기 좋은 상황과 맞지 않는 상황" },
    { title: "동작 원리", guide: "실제 순서대로 단계별로. 관여하는 구성 요소와 데이터의 이동" },
    { title: "시각화", guide: "Mermaid 다이어그램이나 표와 짧은 해설. 필요 없으면 지운다" },
    {
      title: "직접 실험",
      guide: "직접 확인하거나 구현해 본 기록. 실험하기 어려운 개념이면 지운다",
      subs: [
        { title: "Level 1. 관찰", guide: "기존 도구로 동작 확인 (DevTools, curl, dig 등). 목표, 명령, 예상 결과, 해석" },
        { title: "Level 2. 구현", guide: "코드나 환경을 직접 구성해 검증. 준비물, 코드, 결과, 주의사항" },
      ],
    },
    { title: "비교 및 관계", guide: "비슷한 기술, 대체 기술, 함께 쓰는 기술, 상위·하위 개념과의 관계" },
    {
      title: "실무 및 면접",
      guide: "실제 시스템과 기술 면접에서 이 개념을 쓰는 방법",
      subs: [
        { title: "실무 관점", guide: "운영 환경에서 고려할 점. 장애, 보안, 확장 이슈" },
        { title: "면접 질문", guide: "기본, 심화, 응용 질문과 답변 포인트" },
      ],
    },
    { title: "최종 요약", guide: "정의, 등장 이유, 사용 목적, 핵심 동작, 주의사항, 한 문장 요약" },
  ],
};

export function templatesOf(collection: CollectionId): LearningTemplate[] {
  return LEARNING_TEMPLATES[collection];
}

export function findTemplate(collection: CollectionId, id: string | null | undefined): LearningTemplate {
  const list = templatesOf(collection);
  return list.find((t) => t.id === id) ?? list[0];
}

// 가이드는 회색 글자로. 저장 형식(lib/rich-markdown.ts)의 글자색 span이라 에디터에서도 회색으로 보인다
const guideLine = (text: string) => `<span data-text-color="gray">${text}</span>`;

function sectionMarkdown(s: TemplateSection) {
  const subs = (s.subs ?? []).map((sub) => `### ${sub.title}\n\n${guideLine(sub.guide)}\n`).join("\n");
  return `## ${s.title}\n\n${guideLine(s.guide)}\n${subs ? `\n${subs}` : ""}`;
}

// 비교용: 태그·이스케이프·빈 줄 표시(&nbsp;)·공백 차이를 없앤다
const norm = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\\(.)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const headingText = (line: string) => line.match(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/)?.[1];

/** 템플릿 전체 Markdown (새 글을 템플릿째 시작할 때) */
export function templateMarkdown(template: LearningTemplate) {
  return template.sections.map(sectionMarkdown).join("\n");
}

/** 본문에 아직 없는 섹션만 골라 Markdown으로. 본문이 비어 있으면 전체 */
export function missingTemplateMarkdown(template: LearningTemplate, body: string) {
  const present = new Set(body.split("\n").map(headingText).filter((t): t is string => !!t).map(norm));
  const missing = template.sections.filter((s) => !present.has(norm(s.title)));
  return { count: missing.length, markdown: missing.map(sectionMarkdown).join("\n") };
}

/**
 * 작성 완료로 저장하기 전에 안 쓴 템플릿 섹션을 뺀다.
 * - `##` 템플릿 섹션 아래에 가이드·템플릿 소제목·빈 줄만 있으면 섹션째 제거
 * - 내용이 있는 섹션 안에서도, 가이드만 남은 템플릿 소제목(`###`)은 제거
 * - 템플릿에 없는 제목과 그 아래 내용은 그대로 둔다
 */
export function stripUnfilledTemplate(collection: CollectionId, markdown: string): string {
  // 그 컬렉션의 모든 템플릿 + 예전 템플릿. 같은 제목이 여러 템플릿에 있으면 가이드·소제목을 합친다
  const byTitle = new Map<string, TemplateSection>();
  for (const sec of [...LEARNING_TEMPLATES[collection].flatMap((t) => t.sections), ...(LEGACY_SECTIONS[collection] ?? [])]) {
    const key = norm(sec.title);
    const prev = byTitle.get(key);
    byTitle.set(key, prev ? { ...prev, guides: [...(prev.guides ?? [prev.guide]), sec.guide], subs: [...(prev.subs ?? []), ...(sec.subs ?? [])] } : sec);
  }
  const lines = markdown.split("\n");

  // 코드 블록 안의 # 줄은 제목이 아니다
  let fence: string | null = null;
  const isHeading = (i: number, level: number) => {
    const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
    if (m) fence = fence ? (m[1][0] === fence[0] ? null : fence) : m[1];
    if (fence && !m) return false;
    const h = lines[i].match(/^\s{0,3}(#{1,6})\s/);
    return !!h && h[1].length <= level;
  };

  // `##` 이하 제목으로 나눈 덩어리
  const chunks: { start: number; end: number }[] = [];
  let start = 0;
  fence = null;
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && isHeading(i, 2) && !fence) {
      chunks.push({ start, end: i });
      start = i;
    }
  }
  chunks.push({ start, end: lines.length });

  const out: string[] = [];
  for (const { start, end } of chunks) {
    const chunk = lines.slice(start, end);
    const title = headingText(chunk[0]);
    const section = title && /^\s{0,3}##\s/.test(chunk[0]) ? byTitle.get(norm(title)) : undefined;
    if (!section) {
      out.push(...chunk);
      continue;
    }
    const filler = new Set(
      [...(section.guides ?? [section.guide]), ...(section.subs ?? []).flatMap((s) => [s.guide, s.title])].map(norm),
    );
    const isFiller = (line: string) => {
      const t = norm(headingText(line) ?? line);
      return t === "" || filler.has(t);
    };
    if (chunk.slice(1).every(isFiller)) continue; // 안 쓴 섹션

    // 쓴 섹션: 가이드 줄과, 가이드만 남은 템플릿 소제목을 정리
    const subTitles = new Map((section.subs ?? []).map((s) => [norm(s.title), s]));
    const kept: string[] = [chunk[0]];
    for (let i = 1; i < chunk.length; i++) {
      const line = chunk[i];
      const sub = /^\s{0,3}###\s/.test(line) ? subTitles.get(norm(headingText(line) ?? "")) : undefined;
      if (sub) {
        let j = i + 1;
        while (j < chunk.length && !/^\s{0,3}#{1,3}\s/.test(chunk[j])) j++;
        if (chunk.slice(i + 1, j).every(isFiller)) {
          i = j - 1;
          continue;
        }
      }
      if (filler.has(norm(line)) && norm(line) !== "") continue;
      kept.push(line);
    }
    out.push(...kept);
  }

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
