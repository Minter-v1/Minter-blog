"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CollectionId } from "@/lib/collections";
import { setAuthed, useAuthed } from "./auth";
import { CollectionIcon } from "./collection-icon";
import { useDrafts } from "./drafts";
import { ChevronDown, Close, Menu, More } from "./icons";
import { useReviewToday } from "./review";
import { markSectionNavigation } from "./section-transition";

export type NavItem = {
  href: string;
  label: string;
  desc?: string;
  emoji?: string;
  collection?: CollectionId;
  active?: boolean;
  direction?: -1 | 0 | 1; // 블로그 섹션 사이 이동 방향 (#66)
};
export type NavGroup = { id: string; label: string; active: boolean; items: NavItem[]; footer?: NavItem };

// 열림 상태 공통: 바깥 클릭·Esc·페이지 이동이면 닫는다
function useDisclosure() {
  // 연 시점의 경로를 기억해 두고, 경로가 바뀌면 자동으로 닫힌 것으로 본다
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) =>
    setOpenAt((typeof v === "function" ? v(open) : v) ? pathname : null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenAt(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const panel =
  "absolute z-40 mt-2 rounded-2xl border border-line bg-surface p-2 shadow-[0_12px_32px_rgba(0,23,51,0.12)]";

function ItemLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      onClick={() => item.direction !== undefined && markSectionNavigation(item.direction)}
      aria-current={item.active ? "page" : undefined}
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-fill ${item.active ? "bg-fill" : ""}`}
    >
      {item.collection ? (
        <CollectionIcon id={item.collection} className="mt-0.5 text-[18px]" />
      ) : (
        item.emoji && <span className="tossface mt-0.5 text-[18px]">{item.emoji}</span>
      )}
      <span className="min-w-0">
        <span className={`block text-[15px] font-semibold ${item.active ? "text-primary" : "text-text"}`}>{item.label}</span>
        {item.desc && <span className="block truncate text-[13px] font-normal text-text-3">{item.desc}</span>}
      </span>
    </Link>
  );
}

/** 데스크톱: Blog ▾ · Portfolio ▾ */
export function NavDropdown({ group }: { group: NavGroup }) {
  const { open, setOpen, ref } = useDisclosure();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
          group.active || open ? "bg-fill-strong/70 text-text" : "text-text-3 hover:bg-fill-strong/50 hover:text-text"
        }`}
      >
        {group.label}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`${panel} left-0 w-[300px]`}>
          {group.items.map((item) => (
            <ItemLink key={item.href} item={item} />
          ))}
          {group.footer && (
            <>
              <div className="mx-3 my-1 border-t border-line" />
              <ItemLink item={group.footer} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** 모바일: 햄버거 패널 (가로 스크롤 메뉴 대신) */
export function MobileNav({ groups }: { groups: NavGroup[] }) {
  const { open, setOpen, ref } = useDisclosure();
  return (
    <div ref={ref} className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-lg text-text-2 hover:bg-fill-strong/60"
      >
        {open ? <Close className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div className={`${panel} right-4 left-4 max-h-[75vh] overflow-y-auto sm:right-6 sm:left-auto sm:w-[340px]`}>
          {groups.map((g) => (
            <div key={g.id} className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[12px] font-bold tracking-wide text-text-3 uppercase">{g.label}</p>
              {g.items.map((item) => (
                <ItemLink key={item.href} item={item} />
              ))}
              {g.footer && <ItemLink item={g.footer} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 오른쪽 계정 메뉴: 로그인 / ⋯(복습 · 작성 중 · 로그아웃) + 작성 */
export function AccountMenu({ writeHref, active }: { writeHref?: string; active?: string }) {
  const authed = useAuthed();
  const review = useReviewToday();
  const drafts = useDrafts();
  const { open, setOpen, ref } = useDisclosure();
  if (authed === null) return <span className="h-9 w-9" aria-hidden />;
  if (!authed) {
    return (
      <Link href="/login" className="rounded-lg px-3 py-1.5 text-text-3 hover:bg-fill-strong/60 hover:text-text">
        로그인
      </Link>
    );
  }
  const reviewCount = review?.length ?? 0;
  const draftCount = drafts?.length ?? 0;
  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-label="계정 메뉴"
          onClick={() => setOpen((v) => !v)}
          className="relative flex size-9 items-center justify-center rounded-lg text-text-2 hover:bg-fill-strong/60"
        >
          <More className="size-5" />
          {reviewCount + draftCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />}
        </button>
        {open && (
          <div className={`${panel} right-0 w-[200px] text-[15px]`}>
            <Link
              href="/review"
              aria-current={active === "review" ? "page" : undefined}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-fill"
            >
              복습
              {reviewCount > 0 && <span className="font-semibold text-primary tabular-nums">{reviewCount}</span>}
            </Link>
            <Link
              href="/drafts"
              aria-current={active === "drafts" ? "page" : undefined}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-fill"
            >
              작성 중
              {draftCount > 0 && <span className="font-semibold text-primary tabular-nums">{draftCount}</span>}
            </Link>
            <div className="mx-3 my-1 border-t border-line" />
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2.5 text-left text-text-3 hover:bg-fill"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                setAuthed(false);
                setOpen(false);
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
      {writeHref && (
        <Link
          href={writeHref}
          className="ml-1 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-press"
        >
          작성
        </Link>
      )}
    </>
  );
}
