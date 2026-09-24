"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.refresh();
      }}
    >
      로그아웃
    </button>
  );
}
