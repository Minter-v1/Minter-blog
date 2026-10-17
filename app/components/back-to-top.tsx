"use client";

import { useEffect, useState } from "react";

// 모든 페이지 오른쪽 아래 맨 위로 버튼 (#114)
// 작은 밤하늘 원 안에서 별이 위로 솟고(.btt-star, globals.css), 바깥 링이 스크롤한 비율만큼 차오른다
// 화면 높이의 60% 넘게 내려오면 나타남
export function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
      setShown(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="맨 위로"
      tabIndex={shown ? 0 : -1}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className={`fixed right-4 bottom-5 z-40 size-[58px] rounded-full transition-[opacity,translate,scale] duration-300 ease-out sm:right-6 sm:bottom-6 ${
        shown ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2.5 scale-90 opacity-0"
      }`}
    >
      {/* 진행 링 */}
      <svg viewBox="0 0 58 58" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="btt-ring" x1="0" x2="1">
            <stop offset="0" stopColor="#d9ccf0" />
            <stop offset="1" stopColor="#5a6dcb" />
          </linearGradient>
        </defs>
        <circle cx="29" cy="29" r="27" fill="none" stroke="rgb(179 157 219 / 0.25)" strokeWidth="2.5" />
        <circle
          cx="29"
          cy="29"
          r="27"
          fill="none"
          stroke="url(#btt-ring)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
        />
      </svg>
      {/* 밤하늘 원 */}
      <span
        aria-hidden
        className="absolute inset-[5px] overflow-hidden rounded-full shadow-[0_8px_24px_rgb(30_35_80/0.35),inset_0_0_0_1px_rgb(217_204_240/0.22)]"
        style={{ background: "radial-gradient(circle at 40% 28%, #353f88, #1e2350 72%)" }}
      >
        <span className="absolute top-[28%] left-[24%] size-[1.6px] rounded-full bg-[#ede8f8] opacity-70" />
        <span className="absolute top-[70%] left-[72%] size-[1.4px] rounded-full bg-[#ede8f8] opacity-50" />
        <span className="absolute top-[22%] left-[66%] size-[1.2px] rounded-full bg-[#ede8f8] opacity-60" />
        <span className="btt-star absolute top-1/2 left-1/2">
          <span className="absolute top-1 -left-px h-3.5 w-0.5 rounded-sm bg-gradient-to-t from-[#d9ccf0]/0 to-[#d9ccf0]/85" />
          <span className="star-mark absolute -top-[5px] -left-[5px] size-2.5 bg-white drop-shadow-[0_0_4px_#d9ccf0]" />
        </span>
      </span>
    </button>
  );
}
