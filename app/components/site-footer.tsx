import Image from "next/image";
import Link from "next/link";
import { PROFILE } from "@/lib/profile";
import { SITE } from "@/lib/site";
import { ArrowUpRight } from "./icons";

// 모든 페이지 공통 푸터 (#90): 가는 구분선 + 마크 · 이름 · 역할, 오른쪽 연락처 · PDF 링크
// 헤더와 같은 폭(최대 1072px)으로 가운데
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-8 w-[min(1072px,calc(100%-2rem))] border-t border-line pt-7 pb-10 sm:w-[min(1072px,calc(100%-3rem))]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.svg" alt="" width={32} height={32} unoptimized className="rounded-lg" />
          <span className="text-[15px] font-semibold">{PROFILE.name}</span>
          <span className="text-[15px] text-text-3">{PROFILE.role}</span>
        </Link>
        <nav aria-label="연락처" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] font-semibold text-text-2">
          {PROFILE.contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              {c.label === "GitHub" ? "GitHub" : c.text}
              {c.href.startsWith("http") && (
                <ArrowUpRight className="size-3.5 text-text-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </a>
          ))}
          <Link href={PROFILE.portfolioPdf.href} className="text-primary transition-colors hover:text-primary-press">
            포트폴리오 PDF
          </Link>
        </nav>
      </div>
      <p className="mt-6 text-[12px] text-text-3">
        © {new Date().getFullYear()} {SITE.name} · {PROFILE.nameEn}
      </p>
    </footer>
  );
}
