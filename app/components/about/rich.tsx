import { Fragment } from "react";

// 레쥬메 문장 속 강조: [[파란 강조]], **굵게**
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[[") ? (
          <span key={i} className="font-semibold text-primary">
            {p.slice(2, -2)}
          </span>
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
