// 컬렉션별 학습 템플릿 (#34). 서버·클라이언트 공용
//
// - 본문(상세 설명)에 `## 섹션명` + 회색 작성 가이드를 깔아 주는 작성 보조 도구다. 저장 구조는 그대로 Markdown
// - 작성 강제 없음: 가이드만 남은(=안 쓴) 섹션은 작성 완료로 저장할 때 제목·가이드째 빠진다
// - 이미 쓴 글에는 아직 없는 섹션만 본문 끝에 추가한다 (기존 내용은 건드리지 않음)
import type { CollectionId } from "./collections";

export type TemplateSection = { title: string; guide: string; subs?: { title: string; guide: string }[] };

export const LEARNING_TEMPLATES: Record<CollectionId, TemplateSection[]> = {
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
  log: [
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
  git: [
    { title: "5초 이해", guide: "이 명령이 하는 일을 1~2문장으로" },
    { title: "사용법", guide: "기본 문법과 자주 쓰는 형태 (코드 블록)" },
    { title: "자주 쓰는 옵션", guide: "옵션별 의미와 쓰는 상황" },
    { title: "동작 원리", guide: "실행하면 커밋, 브랜치, 인덱스가 어떻게 바뀌는지" },
    { title: "예시", guide: "실제 상황과 명령, 실행 결과" },
    { title: "주의할 점", guide: "이미 push한 커밋, 협업 중에 조심할 상황" },
    { title: "되돌리기", guide: "잘못 실행했을 때 되돌리는 방법" },
    { title: "비교 및 관계", guide: "비슷한 명령과의 차이, 함께 쓰는 명령" },
    { title: "최종 요약", guide: "언제 쓰는지와 핵심 명령 한 줄" },
  ],
  troubleshooting: [
    { title: "상황", guide: "무엇을 하다가, 어떤 환경에서 발생했는지" },
    { title: "증상과 에러", guide: "실제 증상, 에러 메시지와 로그 (코드 블록)" },
    { title: "원인", guide: "세운 가설과 확인 과정, 최종 원인" },
    { title: "해결", guide: "적용한 조치와 변경 내용" },
    { title: "검증", guide: "해결됐음을 확인한 방법과 결과" },
    { title: "재발 방지", guide: "같은 문제를 막기 위한 조치나 체크리스트" },
    { title: "배운 점", guide: "새로 알게 된 개념, 다음에 다르게 할 점" },
    { title: "관련 개념", guide: "이해하는 데 필요한 개념과 관련 용어" },
  ],
};

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

/** 본문에 아직 없는 섹션만 골라 Markdown으로. 본문이 비어 있으면 전체 */
export function missingTemplateMarkdown(collection: CollectionId, body: string) {
  const present = new Set(body.split("\n").map(headingText).filter((t): t is string => !!t).map(norm));
  const missing = LEARNING_TEMPLATES[collection].filter((s) => !present.has(norm(s.title)));
  return { count: missing.length, markdown: missing.map(sectionMarkdown).join("\n") };
}

/**
 * 작성 완료로 저장하기 전에 안 쓴 템플릿 섹션을 뺀다.
 * - `##` 템플릿 섹션 아래에 가이드·템플릿 소제목·빈 줄만 있으면 섹션째 제거
 * - 내용이 있는 섹션 안에서도, 가이드만 남은 템플릿 소제목(`###`)은 제거
 * - 템플릿에 없는 제목과 그 아래 내용은 그대로 둔다
 */
export function stripUnfilledTemplate(collection: CollectionId, markdown: string): string {
  const sections = LEARNING_TEMPLATES[collection];
  const byTitle = new Map(sections.map((s) => [norm(s.title), s]));
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
    const filler = new Set([section.guide, ...(section.subs ?? []).flatMap((s) => [s.guide, s.title])].map(norm));
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
