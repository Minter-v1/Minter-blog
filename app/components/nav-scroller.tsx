"use client";

import { useEffect, useRef } from "react";

// 좁은 화면에서 옆으로 밀리는 메뉴: 지금 페이지 메뉴가 화면 밖에 있으면 보이는 곳으로 옮겨 둔다
export function NavScroller(props: { className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    // 페이지가 스트리밍으로 늦게 드러나면 처음엔 폭이 0 → 실제 크기가 잡힌 순간에 한 번만 맞춘다
    const ro = new ResizeObserver(() => {
      if (nav.clientWidth === 0) return;
      ro.disconnect();
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || nav.scrollWidth <= nav.clientWidth) return;
      const offset = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
      nav.scrollLeft += offset - (nav.clientWidth - active.offsetWidth) / 2;
    });
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);
  return (
    <nav ref={ref} className={props.className}>
      {props.children}
    </nav>
  );
}
