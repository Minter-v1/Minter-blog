"use client";

import { useEffect, useRef, useState } from "react";

// pdf.js로 각 페이지를 canvas에 그린다. 브라우저 내장 뷰어(iframe)는 Android Chrome 등에서
// 표시되지 않고 다운로드로 넘어가는 경우가 있어, 모든 기기에서 같은 방식으로 보이게 직접 렌더링한다
export function PdfViewer({ src }: { src: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const el = box.current;
    if (!el) return;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      let doc;
      try {
        doc = await pdfjs.getDocument(src).promise;
      } catch {
        if (!cancelled) setState("missing");
        return;
      }
      if (cancelled) return;
      setPages(doc.numPages);
      el.replaceChildren();
      const width = el.clientWidth;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= doc.numPages && !cancelled; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.setAttribute("aria-label", `${n}페이지`);
        canvas.className = "rounded-xl bg-white shadow-[0_2px_12px_rgba(0,23,51,0.08)]";
        el.appendChild(canvas);
        await page.render({ canvas, viewport }).promise;
        if (n === 1 && !cancelled) setState("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <>
      {state === "loading" && <p className="py-16 text-center text-[14px] text-text-3">PDF를 불러오는 중…</p>}
      {state === "missing" && (
        <p className="rounded-2xl border-2 border-dashed border-fill-strong py-12 text-center text-[14px] text-text-3">
          포트폴리오 PDF를 준비하고 있어요
        </p>
      )}
      <div ref={box} className="space-y-4" data-pages={pages} />
    </>
  );
}
