import rehypeShiki from "@shikijs/rehype";
import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveImageSrc } from "@/lib/paths";

// 서버에서 마크다운을 렌더링한다. 코드 블록은 Shiki로 하이라이트.
export async function Article({ markdown, rawBase }: { markdown: string; rawBase: string }) {
  return (
    <div className="article">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeShiki, { theme: "github-light", lazy: true, fallbackLanguage: "text" }]]}
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
        {markdown}
      </MarkdownAsync>
    </div>
  );
}
