import { Fragment } from "react";

// 레쥬메 문장 속 강조: [[파란 강조]], **굵게**
// marker: [[ ]]를 진한 글자 + 형광펜으로 (소개 문구 · .marker, #120)
//   처음 보일 때 꼬리 달린 별이 달리며 형광펜을 칠하고, 지나간 자리에 반짝임이 남는다
// 별이 지나간 자리의 반짝임: 가로 위치(%), 세로 위치(%), 크기(px). 3px 이상은 네 갈래 별
const GLITTER: [number, number, number][] = [
  [8, 30, 3],
  [19, 74, 2],
  [31, 40, 3.5],
  [44, 78, 2],
  [56, 34, 3],
  [68, 70, 2.5],
  [80, 38, 3],
  [91, 72, 2],
];

export function Rich({ text, marker = false }: { text: string; marker?: boolean }) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[[") ? (
          marker ? (
            <span key={i} className="marker">
              <span aria-hidden className="marker-band" />
              {GLITTER.map(([x, y, s], k) => (
                <span
                  key={k}
                  aria-hidden
                  className={`marker-glit ${s >= 3 ? "star-mark" : "rounded-full"}`}
                  style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${0.58 + x * 0.0085}s` }}
                />
              ))}
              <span aria-hidden className="marker-star">
                <span className="marker-star-tail" />
                <span className="marker-star-head star-mark" />
              </span>
              <span aria-hidden className="marker-burst" />
              {p.slice(2, -2)}
            </span>
          ) : (
            <span key={i} className="font-semibold text-primary">
              {p.slice(2, -2)}
            </span>
          )
        ) : p.startsWith("**") ? (
          <strong key={i} className="font-bold text-text">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
