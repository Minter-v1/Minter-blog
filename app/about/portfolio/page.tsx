import type { Metadata } from "next";
import Link from "next/link";
import { PROFILE } from "@/lib/profile";
import { PdfViewer } from "../../components/about/pdf-viewer";
import { ChevronRight } from "../../components/icons";
import { SiteHeader } from "../../components/site-header";

const pdf = PROFILE.portfolioPdf;

export const metadata: Metadata = {
  title: `${pdf.title} · ${PROFILE.name}`,
  description: `${PROFILE.name} · ${PROFILE.role} 포트폴리오 (PDF)`,
};

// 공개용 포트폴리오 PDF 열람 (#53). 다운로드 없이 페이지를 바로 보여 주고, 다운로드는 버튼으로 따로 둔다
export default function PortfolioPage() {
  const fileName = `${PROFILE.nameEn.replace(/\s+/g, "_")}_Portfolio_v${pdf.version}.pdf`;
  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 pb-24">
      <SiteHeader active="about" writeHref="/write" />

      <Link
        href="/about#projects"
        className="mb-4 inline-flex items-center gap-1 px-1 text-[14px] font-semibold text-text-3 hover:text-text-2"
      >
        <ChevronRight className="size-3.5 rotate-180" />
        About
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] sm:text-[30px]">{pdf.title}</h1>
          <p className="mt-1 text-[14px] text-text-3">
            {PROFILE.name} · v{pdf.version} · 프로젝트별 상세 설명은{" "}
            <Link href="/about#projects" className="font-semibold text-primary hover:underline">
              주요 프로젝트
            </Link>
            에서 볼 수 있어요
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={pdf.file}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-2xl bg-surface px-4 text-[14px] font-semibold text-text-2 hover:bg-fill-strong/60"
          >
            새 창으로 열기
          </a>
          <a
            href={pdf.file}
            download={fileName}
            className="inline-flex h-10 items-center rounded-2xl bg-primary px-4 text-[14px] font-semibold text-white hover:opacity-90"
          >
            PDF 다운로드
          </a>
        </div>
      </div>

      <div className="rounded-[24px] bg-surface p-3 sm:p-5">
        <PdfViewer src={pdf.file} />
      </div>
    </div>
  );
}
