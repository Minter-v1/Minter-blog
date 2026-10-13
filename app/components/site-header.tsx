import Link from "next/link";
import { COLLECTION_LIST, type CollectionId } from "@/lib/collections";
import { PROFILE } from "@/lib/profile";
import { SITE } from "@/lib/site";
import { AccountMenu, MobileNav, NavDropdown, type NavGroup } from "./nav-menu";

type Active = CollectionId | "blog" | "about" | "drafts" | "review" | "learning" | "portfolio";

// 상단 메뉴 (#58): 학습 블로그(Blog)와 채용용 포트폴리오(Portfolio) 두 묶음
// 로그인에 따라 바뀌는 오른쪽 메뉴는 AccountMenu가 브라우저에서 확인한다 (페이지를 CDN에 캐시할 수 있도록)
export function SiteHeader(props: { active?: Active; writeHref?: string }) {
  const a = props.active;
  const groups: NavGroup[] = [
    {
      id: "blog",
      label: "Blog",
      active: COLLECTION_LIST.some((c) => c.id === a) || a === "learning" || a === "blog",
      items: [
        { href: "/blog", label: "전체 보기", desc: "최근 기록 · 연결 지도 · 활동", emoji: "🏠", active: a === "blog" },
        ...COLLECTION_LIST.map((c) => ({ href: `/${c.id}`, label: c.label, desc: c.intro, collection: c.id, active: a === c.id })),
      ],
      footer: { href: "/learning", label: "학습법", desc: "망각곡선 기반 복습 방식", emoji: "🧠", active: a === "learning" },
    },
    {
      id: "portfolio",
      label: "Portfolio",
      active: a === "about" || a === "portfolio",
      items: [
        { href: "/about", label: "About", desc: `${PROFILE.name} · ${PROFILE.role}`, emoji: "👋", active: a === "about" },
        { href: "/about#projects", label: "주요 프로젝트", desc: "프로젝트별 설계와 트러블슈팅", emoji: "🗂️" },
        { href: PROFILE.portfolioPdf.href, label: "포트폴리오 PDF", desc: `v${PROFILE.portfolioPdf.version}`, emoji: "📄", active: a === "portfolio" },
      ],
    },
  ];

  return (
    // 본문 폭이 좁은 페이지(목록·상세 760px)에서도 헤더는 같은 폭으로
    // z-50: 가운데 정렬용 transform이 쌓임 맥락을 만들어, z-index가 없으면 드롭다운이 본문 transform 요소 아래로 깔린다 (#62)
    <header className="relative z-50 flex items-center justify-between gap-4 pt-5 pb-4 lg:left-1/2 lg:w-[max(100%,min(1072px,calc(100vw-3rem)))] lg:-translate-x-1/2 lg:py-7">
      <div className="flex items-center gap-7">
        <Link href="/" className="text-[20px] font-bold tracking-[-0.03em]">
          {SITE.name}
        </Link>
        <nav className="hidden items-center gap-1 text-[15px] font-semibold lg:flex" aria-label="주 메뉴">
          {groups.map((g) => (
            <NavDropdown key={g.id} group={g} />
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[14px] font-medium whitespace-nowrap">
        <Link
          href={PROFILE.portfolioPdf.href}
          className="mr-1 hidden rounded-xl border border-line px-3.5 py-1.5 font-semibold text-text-2 transition-colors hover:border-primary hover:text-primary sm:inline-flex"
        >
          PDF 보기
        </Link>
        <AccountMenu writeHref={props.writeHref} active={a} />
        <MobileNav groups={groups} pdfHref={PROFILE.portfolioPdf.href} />
      </div>
    </header>
  );
}
