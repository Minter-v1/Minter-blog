"use client";

import { useEffect, useId, useState } from "react";

// ```mermaid 코드 블록을 그림으로. mermaid는 크고 브라우저 전용이라 이 블록이 있는 글에서만 불러온다.
let ready: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  ready ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict", // 글 안의 HTML·클릭 스크립트 막기
      theme: "base",
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif',
      // 블로그 톤: 회색 + 파랑 하나
      themeVariables: {
        fontSize: "14px",
        primaryColor: "#e8f3ff",
        primaryBorderColor: "#3182f6",
        primaryTextColor: "#191f28",
        secondaryColor: "#f2f4f6",
        secondaryBorderColor: "#c5ccd3",
        tertiaryColor: "#ffffff",
        tertiaryBorderColor: "#e5e8eb",
        lineColor: "#8b95a1",
        textColor: "#191f28",
        noteBkgColor: "#f2f4f6",
        noteBorderColor: "#e5e8eb",
        noteTextColor: "#4e5968",
      },
    });
    return mermaid;
  });
  return ready;
}

// mermaid는 폭에 맞춰 줄이도록(width=100%) 그려서, 가로로 긴 흐름도는 글자가 깨알같이 작아진다.
// 원래 크기로 두고 넘치면 옆으로 스크롤한다
function naturalSize(svg: string) {
  const max = svg.match(/max-width:\s*([\d.]+)px;?/);
  if (!max) return svg;
  return svg.replace(/width="100%"/, `width="${max[1]}"`).replace(max[0], "");
}

export function Mermaid({ code }: { code: string }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadMermaid()
      .then((mermaid) => mermaid.render(id, code))
      .then((r) => alive && setSvg(naturalSize(r.svg)))
      .catch((e) => {
        // 렌더링에 실패하면 mermaid가 남긴 오류 SVG를 치우고 원문을 보여 준다
        document.getElementById(`d${id}`)?.remove();
        if (alive) setError(e instanceof Error ? e.message.split("\n")[0] : String(e));
      });
    return () => {
      alive = false;
    };
  }, [id, code]);

  if (error) {
    return (
      <div className="mermaid-block mermaid-error">
        <p>다이어그램을 그리지 못했어요 · {error}</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  if (!svg) return <div className="mermaid-block skeleton h-40" aria-busy />;
  return <div className="mermaid-block" role="img" dangerouslySetInnerHTML={{ __html: svg }} />;
}
