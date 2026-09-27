import Link from "next/link";
import { COLLECTION_LIST, type CollectionId } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { AuthNav } from "./auth";
import { DraftsLink } from "./drafts";
import { NavScroller } from "./nav-scroller";

// 로그인에 따라 바뀌는 오른쪽 버튼은 AuthNav가 브라우저에서 확인한다 (페이지를 CDN에 캐시할 수 있도록)
export function SiteHeader(props: { active?: CollectionId | "about" | "drafts"; writeHref?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-5 pb-4 lg:flex-nowrap lg:py-7">
      <div className="contents lg:flex lg:items-center lg:gap-7">
        <Link href="/" className="text-[20px] font-bold tracking-[-0.03em]">
          {SITE.name}
        </Link>
        {/* 좁은 화면: 로고·로그인 아래 줄에서 옆으로 밀어 보는 메뉴 */}
        <NavScroller className="order-last -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-1 text-[15px] font-semibold whitespace-nowrap [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-3 lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0">
          {COLLECTION_LIST.map((c) => (
            <Link
              key={c.id}
              href={`/${c.id}`}
              aria-current={props.active === c.id ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                props.active === c.id ? "bg-fill-strong/70 text-text" : "text-text-3 hover:bg-fill-strong/50 hover:text-text"
              }`}
            >
              {c.label}
            </Link>
          ))}
          <Link
            href="/about"
            aria-current={props.active === "about" ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              props.active === "about" ? "bg-fill-strong/70 text-text" : "text-text-3 hover:bg-fill-strong/50 hover:text-text"
            }`}
          >
            About
          </Link>
        </NavScroller>
      </div>
      <div className="flex items-center gap-1 text-[14px] font-medium text-text-2">
        <AuthNav writeHref={props.writeHref} extra={<DraftsLink active={props.active === "drafts"} />} />
      </div>
    </header>
  );
}
