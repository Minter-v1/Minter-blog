import rehypeShiki from "@shikijs/rehype";
import { MarkdownAsync } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { resolveImageSrc } from "@/lib/paths";
import { COLOR_NAMES, normalizeEmptyLines } from "@/lib/rich-markdown";
import { Mermaid } from "./mermaid";

type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };

const textOf = (n: HastNode): string => (n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(textOf).join(""));

// ```mermaid 코드 블록은 Shiki로 칠하지 않고 <div data-mermaid="원문">으로 바꿔 두면, 브라우저에서 그림으로 그린다
function rehypeMermaid() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      node.children = node.children?.map((child) => {
        const code = child.tagName === "pre" ? child.children?.find((c) => c.tagName === "code") : undefined;
        const cls = code?.properties?.className;
        if (code && Array.isArray(cls) && cls.includes("language-mermaid")) {
          return { type: "element", tagName: "div", properties: { dataMermaid: textOf(code).trim() }, children: [] };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

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
          rehypeMermaid,
          [rehypeShiki, { theme: "github-light", lazy: true, fallbackLanguage: "text" }],
        ]}
        components={{
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element -- 기록 이미지(/api/files)를 원본 그대로 표시
              <img src={resolveImageSrc(src, rawBase)} alt={alt ?? ""} loading="lazy" />
            ) : null,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node는 DOM에 넘기지 않는다
          div: ({ node, ...props }) => {
            const code = (props as Record<string, unknown>)["data-mermaid"];
            return typeof code === "string" ? <Mermaid code={code} /> : <div {...props} />;
          },
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
