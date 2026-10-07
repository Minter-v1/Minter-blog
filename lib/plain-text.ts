// Markdown 본문 → 평문 요약. 메일처럼 서식을 못 쓰는 곳에서 본문 앞부분을 보여 줄 때 쓴다 (server-only 아님)
//
// 코드 블록·이미지·표·HTML 태그(글자색 span 등)는 통째로 빼고, 링크는 글자만, 서식 기호는 지운다.

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export function plainExcerpt(markdown: string, max = 200): string {
  const text = markdown
    .replace(/\\$/gm, "") // 줄 끝 \ (강제 줄바꿈)
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, " ") // 코드 블록 (mermaid 포함)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크 → 글자만
    .replace(/<[^>]+>/g, "") // HTML 태그 (글자색 span, <u>, <br> 등)
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .split("\n")
    .filter((line) => !/^\s*\|/.test(line)) // 표
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, "") // 제목
        .replace(/^\s*>\s?/, "") // 인용
        .replace(/^\s*([-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/, "") // 목록·체크리스트
        .replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/, ""), // 구분선
    )
    .join(" ")
    .replace(/(\*\*|__|~~|`)/g, "") // 굵게·취소선·인라인 코드
    .replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, "$1") // 이스케이프 문자 (\* → *)
    .replace(/(^|\s)[*_](\S[^*_]*\S|\S)[*_](?=\s|$|[.,!?])/g, "$1$2") // 기울임
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,·:;]+$/, "")}…`;
}
