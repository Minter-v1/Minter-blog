"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "./loaders";

// 이미지 편집: 드래그한 영역에 강조 박스를 그리거나 모자이크로 가린다.
// 원본 해상도 캔버스에서 작업하고, 화면에는 줄여서 보여 준다. 적용하면 새 이미지 파일로 만들어 돌려준다.

type Tool = "box" | "mosaic";
type Rect = { x: number; y: number; w: number; h: number };

const COLORS = [
  { id: "red", label: "빨강", value: "#f04452" },
  { id: "blue", label: "파랑", value: "#3182f6" },
] as const;
const MAX_UNDO = 30;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // 다른 도메인 이미지는 CORS가 허용될 때만 편집 가능
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
    img.src = src;
  });
}

const normalize = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(a.x - b.x),
  h: Math.abs(a.y - b.y),
});

// 이미지 크기에 비례한 선 두께·모자이크 칸 크기
const lineWidthOf = (c: HTMLCanvasElement) => Math.max(3, Math.round(Math.max(c.width, c.height) / 250));
const cellOf = (c: HTMLCanvasElement) => Math.max(8, Math.round(Math.max(c.width, c.height) / 70));

function drawBox(ctx: CanvasRenderingContext2D, r: Rect, color: string, lw: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.roundRect(r.x + lw / 2, r.y + lw / 2, Math.max(0, r.w - lw), Math.max(0, r.h - lw), lw * 1.5);
  ctx.stroke();
  ctx.restore();
}

function applyMosaic(ctx: CanvasRenderingContext2D, r: Rect, cell: number) {
  const x0 = Math.max(0, Math.floor(r.x));
  const y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(ctx.canvas.width, Math.ceil(r.x + r.w));
  const y1 = Math.min(ctx.canvas.height, Math.ceil(r.y + r.h));
  if (x1 <= x0 || y1 <= y0) return;
  const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const { width, height } = data;
  for (let cy = 0; cy < height; cy += cell) {
    for (let cx = 0; cx < width; cx += cell) {
      let r2 = 0, g = 0, b = 0, n = 0;
      const ey = Math.min(cy + cell, height), ex = Math.min(cx + cell, width);
      for (let y = cy; y < ey; y++) {
        for (let x = cx; x < ex; x++) {
          const i = (y * width + x) * 4;
          r2 += data.data[i];
          g += data.data[i + 1];
          b += data.data[i + 2];
          n++;
        }
      }
      for (let y = cy; y < ey; y++) {
        for (let x = cx; x < ex; x++) {
          const i = (y * width + x) * 4;
          data.data[i] = r2 / n;
          data.data[i + 1] = g / n;
          data.data[i + 2] = b / n;
          data.data[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(data, x0, y0);
}

export function ImageEditor(props: { src: string; onCancel: () => void; onApply: (file: File) => Promise<void> }) {
  const { onCancel } = props;
  const work = useRef<HTMLCanvasElement | null>(null); // 원본 해상도, 확정된 편집 결과
  const view = useRef<HTMLCanvasElement>(null); // 화면용 (work + 드래그 중인 영역)
  const undo = useRef<ImageData[]>([]);
  const drag = useRef<{ start: { x: number; y: number }; now: { x: number; y: number } } | null>(null);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [steps, setSteps] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const type = /\.jpe?g(\?|$)/i.test(props.src) ? "image/jpeg" : "image/png";

  const render = useCallback(() => {
    const w = work.current, v = view.current;
    if (!w || !v) return;
    const ctx = v.getContext("2d")!;
    ctx.drawImage(w, 0, 0);
    const d = drag.current;
    if (!d) return;
    const r = normalize(d.start, d.now);
    if (tool === "box") drawBox(ctx, r, color, lineWidthOf(w));
    else {
      // 모자이크는 미리 씌워 보고, 점선으로 영역 표시
      applyMosaic(ctx, r, cellOf(w));
      ctx.save();
      ctx.setLineDash([lineWidthOf(w) * 2, lineWidthOf(w) * 1.5]);
      ctx.lineWidth = Math.max(1, lineWidthOf(w) / 2);
      ctx.strokeStyle = "#191f28";
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }
  }, [tool, color]);

  useEffect(() => {
    let alive = true;
    loadImage(props.src)
      .then((img) => {
        if (!alive) return;
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        ctx.getImageData(0, 0, 1, 1); // 다른 도메인 이미지라 읽을 수 없으면 여기서 예외
        work.current = c;
        const v = view.current!;
        v.width = c.width;
        v.height = c.height;
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setError(
          e instanceof DOMException ? "다른 사이트의 이미지는 편집할 수 없어요. 내려받아 다시 올려 주세요." : String(e.message ?? e),
        );
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [props.src]);

  useEffect(() => {
    if (status === "ready") render();
  }, [status, render]);

  const undoLast = useCallback(() => {
    const prev = undo.current.pop();
    if (!prev || !work.current) return;
    work.current.getContext("2d")!.putImageData(prev, 0, 0);
    setSteps(undo.current.length);
    render();
  }, [render]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoLast();
      } else if (e.key === "b") setTool("box");
      else if (e.key === "m") setTool("mosaic");
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel, undoLast]);

  // 화면 좌표 → 원본 이미지 좌표
  const toImage = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const v = view.current!;
    const r = v.getBoundingClientRect();
    return {
      x: Math.min(v.width, Math.max(0, ((e.clientX - r.left) / r.width) * v.width)),
      y: Math.min(v.height, Math.max(0, ((e.clientY - r.top) / r.height) * v.height)),
    };
  };

  function commit() {
    const d = drag.current;
    drag.current = null;
    const w = work.current;
    if (!d || !w) return;
    const r = normalize(d.start, d.now);
    if (r.w < 4 || r.h < 4) return render(); // 클릭만 한 경우
    const ctx = w.getContext("2d", { willReadFrequently: true })!;
    undo.current.push(ctx.getImageData(0, 0, w.width, w.height));
    if (undo.current.length > MAX_UNDO) undo.current.shift();
    if (tool === "box") drawBox(ctx, r, color, lineWidthOf(w));
    else applyMosaic(ctx, r, cellOf(w));
    setSteps(undo.current.length);
    render();
  }

  async function apply() {
    const w = work.current;
    if (!w) return;
    setStatus("saving");
    try {
      const blob = await new Promise<Blob | null>((resolve) => w.toBlob(resolve, type, 0.92));
      if (!blob) throw new Error("이미지를 만들지 못했어요.");
      await props.onApply(new File([blob], `edited.${type === "image/jpeg" ? "jpg" : "png"}`, { type }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("ready");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#191f28]/80 backdrop-blur-sm" role="dialog" aria-label="이미지 편집">
      <div className="flex flex-wrap items-center gap-2 bg-surface px-4 py-3 sm:gap-3 sm:px-6">
        <p className="mr-2 text-[15px] font-bold">이미지 편집</p>
        <div className="flex gap-1 rounded-xl bg-fill p-1">
          {(
            [
              ["box", "강조 박스", "B"],
              ["mosaic", "모자이크", "M"],
            ] as const
          ).map(([id, label, key]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              aria-pressed={tool === id}
              title={`${label} (${key})`}
              className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                tool === id ? "bg-surface text-text shadow-sm" : "text-text-3 hover:text-text-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tool === "box" && (
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                aria-pressed={color === c.value}
                className={`size-7 rounded-full border-[3px] transition-transform hover:scale-110 ${
                  color === c.value ? "border-text/80" : "border-transparent"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={undoLast}
            disabled={steps === 0}
            className="h-9 rounded-xl px-3 text-[14px] font-semibold text-text-2 transition-colors hover:bg-fill disabled:opacity-40"
            title="되돌리기 (⌘Z)"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-xl px-3 text-[14px] font-semibold text-text-2 transition-colors hover:bg-fill"
          >
            취소
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={status !== "ready" || steps === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-[14px] font-semibold text-white transition-colors hover:bg-primary-press disabled:bg-fill-strong disabled:text-text-3"
          >
            {status === "saving" && <Spinner className="size-3.5" />}
            {status === "saving" ? "올리는 중…" : "적용"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-8">
        {status === "loading" && <Spinner className="size-6 text-white" />}
        {status === "error" && <p className="rounded-2xl bg-surface px-5 py-4 text-[14px] text-danger">{error}</p>}
        <canvas
          ref={view}
          className={`max-h-full max-w-full touch-none rounded-lg bg-white shadow-2xl ${status === "loading" || status === "error" ? "hidden" : ""} ${
            tool === "box" ? "cursor-crosshair" : "cursor-cell"
          }`}
          onPointerDown={(e) => {
            if (status !== "ready") return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = toImage(e);
            drag.current = { start: p, now: p };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            drag.current.now = toImage(e);
            render();
          }}
          onPointerUp={commit}
          onPointerCancel={() => {
            drag.current = null;
            render();
          }}
        />
      </div>
      <p className="pb-4 text-center text-[13px] text-white/70">
        {tool === "box" ? "드래그해서 강조할 영역을 그려요" : "드래그한 영역을 모자이크로 가려요"}
        {status === "ready" && error && <span className="ml-2 text-[#ffb4b4]">{error}</span>}
      </p>
    </div>,
    document.body,
  );
}

type ImageSlot = { id: string; src: string; top: number; right: number; bottom: number; left: number };

/**
 * 에디터 안 이미지마다 오른쪽 위에 '편집' 버튼. (코드 블록 선택기처럼 에디터 DOM 바깥에 겹쳐 띄운다)
 * 적용하면 편집한 이미지를 새로 올리고 그 블록의 주소를 바꾼다. 원본 파일은 글을 저장할 때 repo에서 지워진다.
 */
export function ImageEditButtons(props: {
  root: HTMLElement | null;
  uploadFile: (file: File) => Promise<string>;
  setImageUrl: (blockId: string, url: string) => void;
}) {
  const { root } = props;
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [editing, setEditing] = useState<ImageSlot | null>(null);

  useEffect(() => {
    const editor = root?.querySelector<HTMLElement>(".bn-container");
    if (!root || !editor) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const base = root.getBoundingClientRect();
        const next = [...editor.querySelectorAll<HTMLImageElement>('[data-content-type="image"] img')].flatMap((img): ImageSlot[] => {
          const id = img.closest<HTMLElement>("[data-id]")?.dataset.id;
          const r = img.getBoundingClientRect();
          if (!id || !img.getAttribute("src") || r.width < 40) return [];
          return [
            {
              id,
              src: img.getAttribute("src")!,
              top: Math.round(r.top - base.top),
              right: Math.round(r.right - base.left),
              bottom: Math.round(r.bottom - base.top),
              left: Math.round(r.left - base.left),
            },
          ];
        });
        setSlots((prev) =>
          prev.length === next.length &&
          prev.every((p, i) => (Object.keys(p) as (keyof ImageSlot)[]).every((k) => p[k] === next[i][k]))
            ? prev
            : next,
        );
      });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(editor, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style", "width"] });
    const ro = new ResizeObserver(measure);
    ro.observe(editor);
    // 이미지는 늦게 로드되며 크기가 바뀐다
    editor.addEventListener("load", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      ro.disconnect();
      editor.removeEventListener("load", measure, true);
    };
  }, [root]);

  // 마우스가 올라간 이미지에만 버튼을 보인다 (터치 기기는 늘 보임)
  useEffect(() => {
    if (!root) return;
    const onMove = (e: PointerEvent) => {
      const base = root.getBoundingClientRect();
      const x = e.clientX - base.left, y = e.clientY - base.top;
      const hit = slots.find((s) => x >= s.left && x <= s.right && y >= s.top && y <= s.bottom);
      setHovered(hit?.id ?? null);
    };
    const onLeave = () => setHovered(null);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [root, slots]);

  return (
    <>
      {slots.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setEditing(s)}
          className={`absolute z-10 inline-flex h-8 items-center gap-1 rounded-xl whitespace-nowrap bg-surface/95 px-3 text-[13px] font-semibold text-text-2 shadow-[0_4px_14px_rgba(0,23,51,0.16)] backdrop-blur transition-[opacity,background-color] hover:bg-surface hover:text-text pointer-coarse:opacity-100 ${
            hovered === s.id ? "opacity-100" : "pointer-events-none opacity-0 pointer-coarse:pointer-events-auto"
          }`}
          // 오른쪽 끝 기준 — left로 두면 남은 폭이 좁아 '편/집'이 세로로 꺾인다
          style={{ top: s.top + 10, right: (root?.clientWidth ?? 0) - s.right + 10 }}
        >
          <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          편집
        </button>
      ))}
      {editing && (
        <ImageEditor
          src={editing.src}
          onCancel={() => setEditing(null)}
          onApply={async (file) => {
            const url = await props.uploadFile(file);
            props.setImageUrl(editing.id, url);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
