"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronRight } from "../icons";
import { Bone, EmptyState, Spinner } from "../loaders";

// pdf.js로 페이지를 canvas에 그린다. 브라우저 내장 뷰어(iframe)는 Android Chrome 등에서
// 표시되지 않고 다운로드로 넘어가는 경우가 있어, 모든 기기에서 같은 방식으로 보이게 직접 렌더링한다
// 한 번에 한 페이지 (#78): ← / → 방향키, 이전·다음 버튼, 좌우 스와이프로 넘긴다
// fit: "page" 한 페이지가 화면 높이 안에 들어오게 (슬라이드형 포트폴리오), "width" 폭에 맞춰 크게 (2단 논문, #92)
export function PdfViewer({
  src,
  fit = "page",
}: {
  src: string;
  fit?: "page" | "width";
}) {
  const box = useRef<HTMLDivElement>(null);
  const doc = useRef<PDFDocumentProxy | null>(null);
  // 그린 페이지 캐시 (폭이 바뀌면 비운다)
  const cache = useRef(new Map<number, Promise<HTMLCanvasElement>>());
  const width = useRef(0);
  const [state, setState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [aspect, setAspect] = useState(9 / 16); // 높이 / 너비. 첫 페이지 크기로 맞춘다

  const render = useCallback((n: number) => {
    const d = doc.current;
    const hit = cache.current.get(n);
    if (hit || !d) return hit;
    const job = (async () => {
      const p = await d.getPage(n);
      const base = p.getViewport({ scale: 1 });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = p.getViewport({
        scale: (width.current / base.width) * ratio,
      });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.setAttribute("aria-label", `${n}페이지`);
      canvas.className =
        "block rounded-xl bg-white shadow-[0_2px_12px_rgba(0,23,51,0.08)]";
      await p.render({ canvas, viewport }).promise;
      return canvas;
    })();
    cache.current.set(n, job);
    return job;
  }, []);

  // 문서 불러오기
  useEffect(() => {
    let cancelled = false;
    const pageCache = cache.current;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      try {
        const d = await pdfjs.getDocument(src).promise;
        if (cancelled) return;
        const first = (await d.getPage(1)).getViewport({ scale: 1 });
        doc.current = d;
        width.current = box.current?.clientWidth ?? 0;
        setAspect(first.height / first.width);
        setPages(d.numPages);
        setState("ready");
      } catch {
        if (!cancelled) setState("missing");
      }
    })();
    return () => {
      cancelled = true;
      doc.current?.destroy();
      doc.current = null;
      pageCache.clear();
    };
  }, [src]);

  // 현재 페이지 표시 + 다음 페이지 미리 그리기
  const [drawn, setDrawn] = useState(0);
  const [ver, setVer] = useState(0); // 폭이 바뀌어 다시 그려야 할 때 올린다
  useEffect(() => {
    if (state !== "ready") return;
    let stale = false;
    render(page)?.then((canvas) => {
      if (stale || !box.current) return;
      box.current.replaceChildren(canvas);
      setDrawn(page);
      if (page < pages) render(page + 1);
    });
    return () => {
      stale = true;
    };
  }, [state, page, pages, render, ver]);

  // 폭이 바뀌면 다시 그린다
  useEffect(() => {
    const el = box.current;
    if (!el || state !== "ready") return;
    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (Math.abs(el.clientWidth - width.current) < 24) return;
        width.current = el.clientWidth;
        cache.current.clear();
        setVer((v) => v + 1);
      }, 200);
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [state]);

  const go = useCallback(
    (d: number) => setPage((p) => Math.min(Math.max(p + d, 1), pages || 1)),
    [pages],
  );

  // 방향키 (입력 중이면 무시)
  useEffect(() => {
    if (state !== "ready") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        t.closest("input, textarea, [contenteditable=true]")
      )
        return;
      const step = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[
        e.key
      ];
      if (step) {
        e.preventDefault();
        go(step);
      } else if (e.key === "Home") setPage(1);
      else if (e.key === "End") setPage(pages);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, pages, go]);

  // 좌우 스와이프
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) =>
    (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(dx < 0 ? 1 : -1);
  };

  const navBtn =
    "flex size-10 items-center justify-center rounded-full bg-surface text-text-2 shadow-[0_2px_8px_rgba(0,23,51,0.12)] transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-30";

  if (state === "missing")
    return (
      <div className="rounded-2xl border-2 border-dashed border-fill-strong">
        <EmptyState emoji="📄" title="PDF를 준비하고 있어요" desc="곧 이 자리에서 바로 볼 수 있어요" />
      </div>
    );

  return (
    <div>
      <div
        className="relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 페이지 자리를 미리 잡아 넘길 때 높이가 흔들리지 않게. 한 페이지가 화면 높이 안에 들어오도록 폭을 줄인다 (헤더·버튼 몫 220px) */}
        <div style={{ aspectRatio: `1 / ${aspect}`, maxWidth: fit === "page"
                ? `max(280px, calc((100svh - 220px) / ${aspect}))`
                : undefined }} className="relative mx-auto w-full">
          <div ref={box} className="absolute inset-0" data-pages={pages} />
          {/* 처음 불러올 때: 페이지 모양 스켈레톤 + 스피너, 넘길 때: 스피너만 (#99) */}
          {state === "loading" && <Bone className="absolute inset-0 rounded-xl" />}
          {(state === "loading" || drawn !== page) && (
            <span role="status" aria-label="PDF 불러오는 중" className="absolute inset-0 flex items-center justify-center text-primary">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface/90 shadow-[0_2px_10px_rgba(0,23,51,0.12)]">
                <Spinner className="size-5" />
              </span>
            </span>
          )}
        </div>
        {state === "ready" && (
          <>
            {/* 페이지 왼쪽·오른쪽 절반 클릭으로도 넘김 */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => go(-1)}
              className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize"
            />
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => go(1)}
              className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize"
            />
          </>
        )}
      </div>
      {state === "ready" && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => go(-1)}
            disabled={page <= 1}
            className={navBtn}
          >
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <span
            aria-live="polite"
            className="min-w-[64px] text-center text-[14px] font-semibold text-text-2 tabular-nums"
          >
            {page} <span className="text-text-3">/ {pages}</span>
          </span>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => go(1)}
            disabled={page >= pages}
            className={navBtn}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
      {state === "ready" && (
        <p className="mt-2 hidden text-center text-[12px] text-text-3 sm:block">
          ← → 키로 넘길 수 있어요
        </p>
      )}
    </div>
  );
}
