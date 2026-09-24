"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRef } from "react";
import { COLLECTION_LIST, entryHref, type CollectionId } from "@/lib/collections";
import { ChevronRight } from "../icons";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type CardItem = { collection: CollectionId; slug: string; title: string };

export function CollectionCards(props: { counts: Record<CollectionId, number>; recent: Record<CollectionId, CardItem[]> }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
        gsap.from(cards, {
          y: 32,
          autoAlpha: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
        // 이모지는 카드에 올리면 톡 튀어 오른다
        for (const card of cards) {
          const emoji = card.querySelector("[data-emoji]");
          const pop = () =>
            gsap.fromTo(emoji, { y: 0, rotate: 0 }, { y: -6, rotate: -8, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 });
          card.addEventListener("pointerenter", pop);
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root}>
      <h2 className="mb-4 px-1 text-[20px] font-bold tracking-[-0.03em]">컬렉션</h2>
      <div className="grid grid-cols-4 gap-4">
        {COLLECTION_LIST.map((c) => (
          <div
            key={c.id}
            data-card
            className="group relative flex flex-col rounded-[24px] bg-surface p-6 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,23,51,0.08)]"
          >
            <Link href={`/${c.id}`} className="absolute inset-0 rounded-[24px]" aria-label={c.label} />
            <div className="flex items-start justify-between">
              <span data-emoji className="tossface flex size-12 items-center justify-center rounded-2xl bg-fill text-[26px]">
                {c.emoji}
              </span>
              <span className="text-[24px] font-bold tracking-[-0.03em] tabular-nums">{props.counts[c.id]}</span>
            </div>
            <h3 className="mt-4 text-[17px] font-bold tracking-[-0.02em]">{c.label}</h3>
            <p className="mt-0.5 text-[13px] text-text-3">{c.intro}</p>
            <ul className="relative mt-4 space-y-0.5 border-t border-line pt-3">
              {props.recent[c.id].map((e) => (
                <li key={e.slug}>
                  <Link
                    href={entryHref(e.collection, e.slug)}
                    className={`-mx-2 block truncate rounded-lg px-2 py-1.5 text-[13px] font-medium text-text-2 transition-colors hover:bg-fill hover:text-text ${
                      c.id === "git" ? "font-mono text-[12px]" : ""
                    }`}
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
              {props.recent[c.id].length === 0 && <li className="py-1.5 text-[13px] text-text-3">없음</li>}
            </ul>
            <span className="relative mt-auto inline-flex items-center gap-0.5 pt-4 text-[13px] font-semibold text-text-3 transition-colors group-hover:text-text">
              전체 보기
              <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
