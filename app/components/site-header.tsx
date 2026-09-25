import Link from "next/link";
import { COLLECTION_LIST, type CollectionId } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { AuthNav } from "./auth";

// 로그인에 따라 바뀌는 오른쪽 버튼은 AuthNav가 브라우저에서 확인한다 (페이지를 CDN에 캐시할 수 있도록)
export function SiteHeader(props: { active?: CollectionId | "about"; writeHref?: string }) {
  return (
    <header className="flex items-center justify-between gap-6 py-7">
      <div className="flex items-center gap-7">
        <Link href="/" className="text-[20px] font-bold tracking-[-0.03em]">
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-1 text-[15px] font-semibold">
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
        </nav>
      </div>
      <div className="flex items-center gap-1 text-[14px] font-medium text-text-2">
        <AuthNav writeHref={props.writeHref} />
      </div>
    </header>
  );
}
