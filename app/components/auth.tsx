"use client";

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

