import rehypeShiki from "@shikijs/rehype";
import { MarkdownAsync } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { resolveImageSrc } from "@/lib/paths";
import { COLOR_NAMES, normalizeEmptyLines } from "@/lib/rich-markdown";

// md 안의 HTML은 서식 태그(strong·em·del·u)와 글자색·배경색 <span>만 통과 (그 외는 GitHub 기본 규칙대로 정리)
const schema = {
  ...defaultSchema,
  // 밑줄(<u>)은 GitHub 기본 규칙에 없어 추가
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["dataTextColor", ...COLOR_NAMES],
      ["dataBgColor", ...COLOR_NAMES],
    ],
  },
};

// 서버에서 마크다운을 렌더링한다. 코드 블록은 Shiki로 하이라이트.
export async function Article({ markdown, rawBase }: { markdown: string; rawBase: string }) {
  return (
    <div className="article">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, schema],
          [rehypeShiki, { theme: "github-light", lazy: true, fallbackLanguage: "text" }],
        ]}
        components={{
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element -- raw.githubusercontent 원본 그대로 표시
              <img src={resolveImageSrc(src, rawBase)} alt={alt ?? ""} loading="lazy" />
            ) : null,
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {normalizeEmptyLines(markdown)}
      </MarkdownAsync>
    </div>
  );
}
