"use client";

import { useEffect, useRef, useState } from "react";
import { missingTemplateMarkdown, type LearningTemplate } from "@/lib/learning-template";
import { Check, ChevronDown } from "./icons";

const button =
  "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-text-2 transition-colors hover:bg-fill hover:text-text";

/**
 * 글쓰기 화면의 학습 템플릿 (#133). 템플릿이 하나면 버튼, 여럿이면 드롭다운으로 고른다.
 * 열 때 본문을 보고, 섹션이 이미 다 들어간 템플릿엔 ✓
 */
export function TemplateMenu(props: { templates: LearningTemplate[]; getBody: () => string; onPick: (t: LearningTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const [filled, setFilled] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (props.templates.length === 1) {
    return (
      <button
        type="button"
        onClick={() => props.onPick(props.templates[0])}
        title="섹션 제목과 작성 가이드를 넣어요. 안 쓴 섹션은 작성 완료로 저장할 때 빠져요"
        className={button}
      >
        학습 템플릿
      </button>
    );
  }

  const toggle = () => {
    if (!open) {
      const body = props.getBody();
      setFilled(new Set(props.templates.filter((t) => missingTemplateMarkdown(t, body).count === 0).map((t) => t.id)));
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className={button}>
        템플릿
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        role="menu"
        data-open={open}
        inert={!open}
        className="dropdown absolute right-0 z-40 mt-2 w-[280px] rounded-2xl border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(0,23,51,0.12)]"
      >
        <p className="px-3 pt-1.5 pb-1 text-[12px] font-medium text-text-3">아직 없는 섹션만 본문 끝에 추가해요</p>
        {props.templates.map((t) => (
          <button
            key={t.id}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              props.onPick(t);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-fill"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-text">{t.name}</span>
              <span className="mt-0.5 block truncate text-[12px] text-text-3">{t.summary}</span>
            </span>
            {filled.has(t.id) && (
              <>
                <Check className="size-4 shrink-0 text-primary" />
                <span className="sr-only">이미 넣음</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
