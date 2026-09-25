"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { setAuthed } from "../components/auth";
import { Spinner } from "../components/loaders";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      router.replace("/");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "로그인에 실패했어요.");
    setPending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-[400px] rounded-[28px] bg-surface p-8">
        <Link href="/" className="text-[14px] font-semibold text-text-3 hover:text-text-2">
          {SITE.name}
        </Link>
        <h1 className="mt-2 text-[24px] leading-snug font-bold tracking-[-0.03em]">
          비밀번호를
          <br />
          입력해 주세요
        </h1>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          aria-label="비밀번호"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-8 h-14 w-full rounded-2xl bg-fill px-5 text-[17px] outline-none placeholder:text-text-3 focus:ring-2 ${
            error ? "ring-2 ring-danger" : "focus:ring-primary"
          }`}
        />
        <p className="mt-2 h-5 text-[13px] text-danger">{error}</p>
        <button
          type="submit"
          disabled={pending || !password}
          className="mt-4 h-14 w-full rounded-2xl bg-primary text-[17px] font-semibold text-white transition-colors hover:bg-primary-press active:scale-[0.99] disabled:bg-fill-strong disabled:text-text-3"
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner />}
            {pending ? "확인 중…" : "확인"}
          </span>
        </button>
      </form>
    </div>
  );
}
