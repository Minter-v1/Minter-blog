"use client";

import { useEffect, useState } from "react";

// 상단 고정 헤더의 껍데기 (#95). 내용(로고·메뉴)은 서버에서 그려 children으로 받는다
// - 스크롤하면 반투명 배경 + 아래 구분선
// - tone="night"(홈): 밤하늘 위에서는 투명 + 어두운 배경용 색(.night), 밤하늘(#night-end)을 지나면 밝은 헤더
export function HeaderShell({
  tone,
  children,
}: {
  tone?: "night";
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [overNight, setOverNight] = useState(tone === "night");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 4);
      if (tone !== "night") return;
      const end = document.getElementById("night-end");
      const h =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h",
          ),
        ) || 72;
      setOverNight(!!end && end.getBoundingClientRect().top > h);
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
  }, [tone]);

  const solid = scrolled && !overNight;
  return (
    <header
      className={`site-header flex items-center justify-between gap-4 ${overNight ? "night" : ""}`}
    >
      {/* 배경은 화면 전체 폭으로 */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 border-b transition-colors duration-200 ${
          solid ? "border-line bg-bg/80 backdrop-blur-md" : "border-transparent"
        }`}
      />
      {children}
    </header>
  );
}
