import { Plugin, PluginKey } from "prosemirror-state";

// 에디터 기호 자동 변환 (#143): Notion처럼 `->`를 치면 → 로.
// - 마지막 글자를 칠 때 바로 앞 글자와 합쳐 규칙에 맞으면 기호로 바꾼다
// - 코드 블록 · 인라인 코드 안에서는 그대로
// - 바뀐 직후 Backspace를 누르면 원래 글자로 되돌린다
const RULES: { from: string; to: string }[] = [
  { from: "<->", to: "↔" },
  { from: "←>", to: "↔" }, // `<-`가 먼저 ←로 바뀐 뒤 `>`를 치는 경우
  { from: "->", to: "→" },
  { from: "<-", to: "←" },
  { from: "=>", to: "⇒" },
  { from: ">=", to: "≥" },
  { from: "<=", to: "≤" },
  { from: "!=", to: "≠" },
];
const UNDO: Record<string, string> = { "←>": "<->" };

const key = new PluginKey<{ pos: number; original: string } | null>("editor-symbols");

export function symbolsPlugin() {
  return new Plugin<{ pos: number; original: string } | null>({
    key,
    state: {
      init: () => null,
      // 방금 바꾼 자리: 다음 입력이 오면 잊는다
      apply: (tr, prev) => {
        const meta = tr.getMeta(key);
        if (meta !== undefined) return meta;
        return tr.docChanged || tr.selectionSet ? null : prev;
      },
    },
    props: {
      handleTextInput(view, from, to, text) {
        if (from !== to || text.length !== 1) return false;
        const $from = view.state.doc.resolve(from);
        if ($from.parent.type.spec.code) return false;
        if ([...$from.marks(), ...(view.state.storedMarks ?? [])].some((m) => m.type.spec.code)) return false;
        const before = $from.parent.textBetween(Math.max(0, $from.parentOffset - 2), $from.parentOffset, undefined, "￼");
        const typed = before + text;
        const rule = RULES.find((r) => typed.endsWith(r.from));
        if (!rule) return false;
        const start = from - (rule.from.length - 1);
        const original = UNDO[rule.from] ?? rule.from;
        const tr = view.state.tr.insertText(rule.to, start, to);
        tr.setMeta(key, { pos: start + rule.to.length, original });
        view.dispatch(tr);
        return true;
      },
      handleKeyDown(view, event) {
        if (event.key !== "Backspace") return false;
        const last = key.getState(view.state);
        const { selection } = view.state;
        if (!last || !selection.empty || selection.from !== last.pos) return false;
        view.dispatch(view.state.tr.insertText(last.original, last.pos - 1, last.pos).setMeta(key, null));
        return true;
      },
    },
  });
}
