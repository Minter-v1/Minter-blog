import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROFILE } from "@/lib/profile";
import { PdfViewer } from "../../../components/about/pdf-viewer";
import { ChevronRight } from "../../../components/icons";
import { SiteHeader } from "../../../components/site-header";

type Props = PageProps<"/about/papers/[slug]">;

// 논문 원문 보기 (#92). 파일(public/papers/)이 있는 논문만 페이지를 만든다
const withFile = () => PROFILE.papers.filter((p) => p.file);

export function generateStaticParams() {
  return withFile().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const p = withFile().find((x) => x.slug === slug);
  return p
    ? { title: `${p.title} · 논문`, description: `${p.venue} · ${p.date}` }
    : {};
}

export default async function PaperPage(props: Props) {
  const { slug } = await props.params;
  const p = withFile().find((x) => x.slug === slug);
  if (!p?.file) notFound();
  const fileName = `${PROFILE.nameEn.replace(/\s+/g, "_")}_${p.slug}.pdf`;

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 pb-24">
      <SiteHeader active="about" writeHref="/write" />

      <Link
        href="/about#papers"
        className="mb-4 inline-flex items-center gap-1 px-1 text-[14px] font-semibold text-text-3 hover:text-text-2"
      >
        <ChevronRight className="size-3.5 rotate-180" />
        논문
      </Link>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-primary tabular-nums">
            {p.date}
          </p>
          <h1 className="mt-1 text-[24px] leading-snug font-bold tracking-[-0.03em] sm:text-[28px]">
            {p.title}
          </h1>
          <p className="mt-1 text-[14px] text-text-3">{p.venue}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={p.file}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-2xl bg-surface px-4 text-[14px] font-semibold text-text-2 hover:bg-fill-strong/60"
          >
            새 창으로 열기
          </a>
          <a
            href={p.file}
            download={fileName}
            className="inline-flex h-10 items-center rounded-2xl bg-primary px-4 text-[14px] font-semibold text-white hover:opacity-90"
          >
            PDF 다운로드
          </a>
        </div>
      </div>

      <div className="rounded-[24px] bg-surface p-3 sm:p-5">
        <PdfViewer src={p.file} fit="width" />
      </div>
    </div>
  );
}
