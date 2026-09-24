"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * About 페이지 애니메이션을 한곳에서:
 * - [data-name] 이름 글자가 아래에서 올라온다
 * - [data-count] 숫자는 0부터 카운트업
 * - [data-reveal] 요소는 화면에 들어올 때 차례로 떠오른다 (ScrollTrigger.batch)
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create("[data-name]", { type: "chars", mask: "chars" });
        gsap.from(split.chars, { yPercent: 110, duration: 0.8, ease: "power3.out", stagger: 0.05 });

        // 사진은 아래에서 위로 걷히듯 드러나며 살짝 줌아웃
        gsap.from("[data-photo]", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.1, ease: "power4.out", delay: 0.15 });
        gsap.from("[data-photo] img", { scale: 1.15, duration: 1.4, ease: "power3.out", delay: 0.15 });

        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: Number(el.dataset.count),
            duration: 1,
            ease: "power2.out",
            delay: 0.3,
            onUpdate: () => (el.textContent = String(Math.round(obj.v))),
          });
        });

        gsap.set("[data-reveal]", { autoAlpha: 0, y: 28 });
        const batch = ScrollTrigger.batch("[data-reveal]", {
          start: "top 88%",
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 }),
        });
        return () => {
          split.revert();
          batch.forEach((t) => t.kill());
        };
      });
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
