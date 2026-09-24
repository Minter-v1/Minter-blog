import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function SiteHeader(props: { authed: boolean; count?: number; repoUrl?: string; showWrite?: boolean }) {
  return (
    <header className="flex items-center justify-between py-8">
      <Link href="/" className="text-[22px] font-bold tracking-[-0.03em]">
        IT 용어 사전
        {props.count !== undefined && (
          <span className="ml-2 align-middle text-[15px] font-semibold text-primary tabular-nums">{props.count}</span>
        )}
      </Link>
      <nav className="flex items-center gap-1 text-[14px] font-medium text-text-2">
        {props.repoUrl && (
          <a href={props.repoUrl} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60">
            GitHub
          </a>
        )}
        {props.authed ? (
          <LogoutButton />
        ) : (
          <Link href="/login" className="rounded-lg px-3 py-1.5 hover:bg-fill-strong/60">
            로그인
          </Link>
        )}
        {props.authed && props.showWrite && (
          <Link
            href="/write"
            className="ml-2 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-press"
          >
            작성
          </Link>
        )}
      </nav>
    </header>
  );
}
