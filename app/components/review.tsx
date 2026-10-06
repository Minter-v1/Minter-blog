"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { REVIEW_TOTAL } from "@/lib/review";
import { useAuthed } from "./auth";
import { Check } from "./icons";
import { Spinner } from "./loaders";

// 오늘 복습할 글(나만 보임)을 브라우저에서 한 번 불러와 헤더 링크와 글 상세 버튼이 나눠 쓴다.
// 공개 페이지는 CDN 캐시라서 서버가 그려 줄 수 없다
type TodayItem = { ref: string; stage: number; days: number };

let today: TodayItem[] | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  pending ??= fetch("/api/review", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<{ today: TodayItem[] }>) : { today: [] }))
    .then((d) => {
      today = d.today;
      listeners.forEach((l) => l());
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** 복습 완료 뒤 헤더 숫자와 버튼을 새로 */
export function refreshReview() {
  if (today !== null || pending) load();
}

function useReviewToday(): TodayItem[] | null {
  const authed = useAuthed();
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => today,
    () => null,
  );
  useEffect(() => {
    if (authed && today === null) load();
  }, [authed]);
  if (authed === false) return [];
  return authed ? value : null;
}

/** 헤더: 로그인했고 오늘 복습할 글이 있을 때만 */
export function ReviewLink({ active }: { active?: boolean }) {
  const list = useReviewToday();
  if (!list || list.length === 0) return null;
  return (
    <Link
      href="/review"
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${active ? "bg-fill-strong/70 text-text" : "hover:bg-fill-strong/60"}`}
    >
      복습<span className="ml-1 font-semibold text-primary tabular-nums">{list.length}</span>
    </Link>
  );
}

/** 복습 진행도: 마친 횟수만큼 채운 점 */
export function ReviewProgress({ stage }: { stage: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`복습 ${stage}/${REVIEW_TOTAL}회`}>
      {Array.from({ length: REVIEW_TOTAL }, (_, i) => (
        <span key={i} className={`size-1.5 rounded-full ${i < stage ? "bg-primary" : "bg-fill-strong"}`} />
      ))}
    </span>
  );
}

/** 복습 완료 버튼. 누르면 커밋하고 화면을 새로 그린다 */
export function ReviewDoneButton({ refKey, className = "" }: { refKey: string; className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: refKey }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `저장하지 못했어요 (${res.status})`);
      setState("done");
      refreshReview();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("idle");
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={submit}
        disabled={state !== "idle"}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-default ${
          state === "done" ? "bg-primary-weak text-primary" : "bg-primary text-white hover:bg-primary-press disabled:opacity-70"
        } ${className}`}
      >
        {state === "saving" && <Spinner className="size-3.5" />}
        {state === "done" && <Check className="size-3.5" />}
        {state === "done" ? "복습 완료" : state === "saving" ? "저장 중…" : "복습 완료"}
      </button>
      {error && <span className="text-[12px] text-danger">{error}</span>}
    </span>
  );
}

/** 글 상세 하단: 오늘 복습할 글이면 복습 완료 버튼 */
export function ReviewCheck({ refKey }: { refKey: string }) {
  const list = useReviewToday();
  const item = list?.find((i) => i.ref === refKey);
  if (!item) return null;
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fill px-5 py-4">
      <div>
        <p className="text-[15px] font-semibold">오늘 복습할 글이에요</p>
        <p className="mt-0.5 flex items-center gap-2 text-[13px] text-text-3">
          <ReviewProgress stage={item.stage} />
          {item.stage + 1}번째 복습{item.days > 0 && ` · ${item.days}일 밀림`}
        </p>
      </div>
      <ReviewDoneButton refKey={refKey} />
    </div>
  );
}
