"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

// 로그인 여부를 브라우저에서 한 번만 물어보고 모든 컴포넌트가 나눠 쓴다.
// null = 아직 모름 (확인 전에는 버튼 자리를 비워 둔다)
let authed: boolean | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setAuthed(value: boolean) {
  authed = value;
  emit();
}

function load() {
  pending ??= fetch("/api/session", { cache: "no-store" })
    .then((r) => r.json() as Promise<{ authed?: boolean }>)
    .then((d) => setAuthed(!!d.authed))
    .catch(() => setAuthed(false));
  return pending;
}

export function useAuthed(): boolean | null {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => authed,
    () => null,
  );
  useEffect(() => {
    if (authed === null) load();
  }, []);
  return value;
}

/** 로그인했을 때만 보이는 부분 (수정 버튼 등) */
export function AuthOnly({ children }: { children: React.ReactNode }) {
  return useAuthed() ? <>{children}</> : null;
}

/** 헤더 오른쪽: 로그인 / 로그아웃 · 작성 */
export function AuthNav({ writeHref }: { writeHref?: string }) {
  const value = useAuthed();
  if (value === null) return <span className="h-9 w-20" aria-hidden />;
  if (!value) {
    return (
      <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60">
        로그인
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60"
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          setAuthed(false);
        }}
      >
        로그아웃
      </button>
      {writeHref && (
        <Link
          href={writeHref}
          className="ml-2 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-press"
        >
          작성
        </Link>
      )}
    </>
  );
}
