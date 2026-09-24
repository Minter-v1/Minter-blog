// GSAP 공식 헬퍼 "seamlessLoop"(horizontalLoop)를 필요한 부분만 옮긴 것.
// https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop
// 요소들을 x축으로 끊김 없이 무한 반복시키는 타임라인을 돌려준다. xPercent 기반이라 폭이 바뀌어도 맞는다.

import { gsap } from "gsap";

export function horizontalLoop(
  elements: Element[],
  config: { speed?: number; paused?: boolean; reversed?: boolean; paddingRight?: number } = {},
) {
  const items = gsap.utils.toArray<HTMLElement>(elements);
  const tl = gsap.timeline({
    repeat: -1,
    paused: config.paused,
    defaults: { ease: "none" },
    onReverseComplete: () => {
      tl.totalTime(tl.rawTime() + tl.duration() * 100);
    },
  });
  const length = items.length;
  const startX = items[0].offsetLeft;
  const widths: number[] = [];
  const xPercents: number[] = [];
  const pixelsPerSecond = (config.speed ?? 1) * 100;
  const snap = gsap.utils.snap(1);

  gsap.set(items, {
    xPercent: (i: number, el: HTMLElement) => {
      const w = (widths[i] = parseFloat(String(gsap.getProperty(el, "width", "px"))));
      xPercents[i] = snap(
        (parseFloat(String(gsap.getProperty(el, "x", "px"))) / w) * 100 + Number(gsap.getProperty(el, "xPercent")),
      );
      return xPercents[i];
    },
  });
  gsap.set(items, { x: 0 });

  const last = items[length - 1];
  const totalWidth =
    last.offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    last.offsetWidth * Number(gsap.getProperty(last, "scaleX")) +
    (config.paddingRight ?? 0);

  for (let i = 0; i < length; i++) {
    const item = items[i];
    const curX = (xPercents[i] / 100) * widths[i];
    const distanceToStart = item.offsetLeft + curX - startX;
    const distanceToLoop = distanceToStart + widths[i] * Number(gsap.getProperty(item, "scaleX"));
    tl.to(
      item,
      { xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100), duration: distanceToLoop / pixelsPerSecond },
      0,
    ).fromTo(
      item,
      { xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100) },
      {
        xPercent: xPercents[i],
        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
        immediateRender: false,
      },
      distanceToLoop / pixelsPerSecond,
    );
  }

  // 미리 한 바퀴 돌려 두면 첫 프레임이 매끄럽다 (공식 헬퍼와 동일)
  tl.progress(1, true).progress(0, true);
  if (config.reversed) {
    tl.vars.onReverseComplete?.();
    tl.reverse();
  }
  return tl;
}
