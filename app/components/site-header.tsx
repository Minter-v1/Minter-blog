import Image from "next/image";
import Link from "next/link";
import { COLLECTION_LIST, type CollectionId } from "@/lib/collections";
import { PROFILE } from "@/lib/profile";
import { SITE } from "@/lib/site";
import { HeaderShell } from "./header-shell";
import { AccountMenu, MobileNav, NavDropdown, type NavGroup } from "./nav-menu";
import { sectionDirection } from "@/lib/sections";

type Active =
  | CollectionId
  | "blog"
  | "about"
  | "drafts"
  | "review"
  | "learning"
  | "portfolio";

// 상단 메뉴 (#58): 학습 블로그(Blog)와 채용용 포트폴리오(Portfolio) 두 묶음
// PDF는 Portfolio 메뉴에만 둔다 (#79). About 안 섹션 이동은 About의 섹션 바로가기로
// 로그인에 따라 바뀌는 오른쪽 메뉴는 AccountMenu가 브라우저에서 확인한다 (페이지를 CDN에 캐시할 수 있도록)
// 화면 위에 고정 (#95). tone="night"는 홈 밤하늘 위 색
export function SiteHeader(props: {
  active?: Active;
  writeHref?: string;
  tone?: "night";
}) {
  const a = props.active;
  const groups: NavGroup[] = [
    {
      id: "blog",
      label: "Blog",
      active:
        COLLECTION_LIST.some((c) => c.id === a) ||
        a === "learning" ||
        a === "blog",
      items: [
        {
          href: "/blog",
          label: "전체 보기",
          desc: "최근 기록 · 연결 지도 · 활동",
          emoji: "🏠",
          active: a === "blog",
          direction: sectionDirection(a, "blog"),
        },
        ...COLLECTION_LIST.map((c) => ({
          href: `/${c.id}`,
          label: c.label,
          desc: c.intro,
          collection: c.id,
          active: a === c.id,
          direction: sectionDirection(a, c.id),
        })),
      ],
      footer: {
        href: "/learning",
        label: "학습법",
        desc: "망각곡선 기반 복습 방식",
        emoji: "🧠",
        active: a === "learning",
        direction: sectionDirection(a, "learning"),
      },
    },
    {
      id: "portfolio",
      label: "Portfolio",
      active: a === "about" || a === "portfolio",
      items: [
        {
          href: "/about",
          label: "About",
          desc: `${PROFILE.name} · ${PROFILE.role}`,
          emoji: "👋",
          active: a === "about",
        },
        {
          href: PROFILE.portfolioPdf.href,
          label: "포트폴리오 PDF",
          desc: `v${PROFILE.portfolioPdf.version}`,
          emoji: "📄",
          active: a === "portfolio",
        },
      ],
    },
  ];

  return (
    // 본문 폭이 좁은 페이지(목록·상세 760px)에서도 헤더는 같은 폭으로 (.site-header, globals.css)
    <HeaderShell tone={props.tone}>
      <div className="flex items-center gap-7">
        <Link
          href="/"
          className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.03em]"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="rounded-lg"
          />
          {SITE.name}
        </Link>
        <nav
          className="hidden items-center gap-1 text-[15px] font-semibold lg:flex"
          aria-label="주 메뉴"
        >
          {groups.map((g) => (
            <NavDropdown key={g.id} group={g} />
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[14px] font-medium whitespace-nowrap">
        <AccountMenu writeHref={props.writeHref} active={a} />
        <MobileNav groups={groups} />
      </div>
    </HeaderShell>
  );
}
