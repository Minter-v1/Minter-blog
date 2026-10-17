"use client";

import { useState } from "react";

// 이메일 주소 복사 (#89). 복사되면 잠깐 "복사됨"으로 바뀐다
export function CopyButton({
  text,
  label = "복사",
}: {
  text: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      aria-live="polite"
      className="inline-flex h-8 shrink-0 items-center rounded-lg bg-fill px-3 text-[13px] font-semibold text-text-2 transition-colors hover:bg-fill-strong/70 hover:text-primary"
    >
      {done ? "복사됨" : label}
    </button>
  );
}
