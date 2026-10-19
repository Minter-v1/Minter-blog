import { Fragment } from "react";

// 레쥬메 문장 속 강조: [[파란 강조]], **굵게**
// marker: [[ ]]를 진한 글자 + 형광펜으로 (소개 문구, 처음 보일 때 빛이 한 번 지나감 · .marker, #120)
export function Rich({ text, marker = false }: { text: string; marker?: boolean }) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[[") ? (
          marker ? (
            <span key={i} className="marker">
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
