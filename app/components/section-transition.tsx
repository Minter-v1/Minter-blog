"use client";

import { useEffect, useRef } from "react";

// 메뉴를 누른 순간 방향을 적어 두고, 새 섹션 본문이 붙을 때 꺼내 쓴다 (페이지 사이 공유 상태)
let pending: { dir: -1 | 0 | 1; at: number } | null = null;
export function markSectionNavigation(dir: -1 | 0 | 1) {
  pending = { dir, at: Date.now() };
}

/**
 * 섹션 본문을 감싼다. 헤더는 밖에 두어 그대로 두고 본문만 움직인다
 * - 메뉴로 옆 섹션에 오면: 이동 방향에서 40px 미끄러져 들어오며 흐림이 걷힘
 * - 스켈레톤(loading.tsx) 뒤에 내용이 붙을 때도 같은 진입 애니메이션 한 번 (깜빡임 대신)
 * - 첫 방문(새로고침, 외부 링크), 움직임 줄이기 설정: 애니메이션 없음
 *
 * React <ViewTransition>은 이 앱의 라우트 전환에서 startViewTransition이 호출되지 않아(#66 조사) 쓰지 않는다
 */
export function SectionTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const nav = pending;
    pending = null;
    // 3초가 지난 표시는 이 이동과 무관 (스켈레톤이 오래 걸린 경우는 그래도 3초 안)
    if (!el || !nav || Date.now() - nav.at > 3000) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { opacity: 0, translate: `${nav.dir * 40}px ${nav.dir === 0 ? "10px" : "0"}`, filter: "blur(3px)" },
        { opacity: 1, translate: "0 0", filter: "blur(0)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, []);
  return <div ref={ref}>{children}</div>;
}
