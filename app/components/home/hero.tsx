"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import Link from "next/link";
import { useRef } from "react";
import { COLLECTION_LIST, type CollectionId } from "@/lib/collections";
import { SITE } from "@/lib/site";
import { ArrowUpRight } from "../icons";
import { EntryMarquee, type MarqueeItem } from "./entry-marquee";

gsap.registerPlugin(useGSAP, SplitText);

export function Hero(props: { counts: Record<CollectionId, number>; recent: MarqueeItem[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create("[data-name]", { type: "chars", mask: "chars" });
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.04 })
          .from("[data-fade]", { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.06 }, "-=0.45")
          .from("[data-chip]", { autoAlpha: 0, y: 12, scale: 0.96, duration: 0.5, stagger: 0.05 }, "-=0.4");
        // 개수는 0부터 올라간다
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const obj = { v: 0 };
          tl.to(
            obj,
            { v: Number(el.dataset.count), duration: 0.9, ease: "power2.out", onUpdate: () => (el.textContent = String(Math.round(obj.v))) },
            0.4,
          );
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="pt-10">
      <h1 data-name className="text-[52px] leading-none font-bold tracking-[-0.045em]">
        {SITE.author}
      </h1>
      {SITE.bio && (
        <p data-fade className="mt-4 max-w-[560px] text-[17px] leading-[1.7] text-text-2">
          {SITE.bio}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-2">
        {COLLECTION_LIST.map((c) => (
          <Link
            key={c.id}
            data-chip
            href={`/${c.id}`}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-surface pr-4 pl-2 transition-colors hover:bg-fill-strong/60"
          >
            <span className="tossface flex size-7 items-center justify-center rounded-full bg-fill text-[16px] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              {c.emoji}
            </span>
            <span className="text-[14px] font-semibold text-text-2">{c.label}</span>
            <span data-count={props.counts[c.id]} className="text-[14px] font-bold text-primary tabular-nums">
              {props.counts[c.id]}
            </span>
          </Link>
        ))}
        <span data-fade className="mx-1 h-5 w-px bg-fill-strong" />
        {SITE.links.map((l) => (
          <a
            key={l.href}
            data-fade
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-text-3 transition-colors hover:text-text"
          >
            {l.label}
            <ArrowUpRight className="size-3.5" />
          </a>
        ))}
      </div>

      <div className="mt-12">
        <EntryMarquee items={props.recent} />
      </div>
    </section>
  );
}
