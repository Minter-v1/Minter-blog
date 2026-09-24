// BlockNote 글자색·배경색을 마크다운에 보존하기 (서버/클라이언트 공용).
//
// 마크다운에는 색 문법이 없어서 BlockNote의 blocksToMarkdownLossy가 색을 버린다.
// 그래서 색 있는 글자를 md 안의 작은 HTML로 남긴다:
//   <span data-text-color="red">강조</span>   <span data-bg-color="yellow">형광펜</span>
// - 저장: 블록의 색 스타일 → 표식 문자로 감싸기 → md 변환 → 표식을 <span>으로
// - 불러오기: <span> → 표식 문자 → md 파싱 → 표식을 다시 색 스타일로
// 표식은 유니코드 사용자 영역 문자라 마크다운 변환에서 이스케이프되지 않는다.

export const COLOR_NAMES = ["gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;
const COLOR_SET = new Set<string>(COLOR_NAMES);

const OPEN = "";
const MID = "";
const CLOSE = "";
const TOKEN = new RegExp(`${OPEN}([tb]):([a-z]+)${MID}|${CLOSE}`, "g");

type Styles = Record<string, unknown>;
type Inline = { type: string; text?: string; styles?: Styles; content?: Inline[] | string; [k: string]: unknown };
type Block = { props?: Record<string, unknown>; content?: unknown; children?: Block[]; [k: string]: unknown };
type Colors = { t?: string; b?: string };

const valid = (v: unknown): string | undefined => (typeof v === "string" && COLOR_SET.has(v) ? v : undefined);

// ---------- 저장: 블록 → 표식 포함 블록 ----------

function encodeInline(items: Inline[], inherit: Colors): Inline[] {
  return items.map((item) => {
    if (item.type === "link" && Array.isArray(item.content)) {
      return { ...item, content: encodeInline(item.content, inherit) };
    }
    if (item.type !== "text" || typeof item.text !== "string") return item;
    const styles = { ...(item.styles ?? {}) };
    const t = valid(styles.textColor) ?? inherit.t;
    const b = valid(styles.backgroundColor) ?? inherit.b;
    delete styles.textColor;
    delete styles.backgroundColor;
    if (!t && !b) return { ...item, styles };
    const open = (t ? `${OPEN}t:${t}${MID}` : "") + (b ? `${OPEN}b:${b}${MID}` : "");
    const close = (t ? CLOSE : "") + (b ? CLOSE : "");
    return { ...item, styles, text: open + item.text + close };
  });
}

function encodeContent(content: unknown, inherit: Colors): unknown {
  if (Array.isArray(content)) return encodeInline(content as Inline[], inherit);
  // 표: { type: "tableContent", rows: [{ cells: [Inline[] | { content: Inline[] }] }] }
  if (content && typeof content === "object" && (content as { type?: string }).type === "tableContent") {
    const table = content as { rows: { cells: unknown[] }[] };
    return {
      ...table,
      rows: table.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          Array.isArray(cell)
            ? encodeInline(cell as Inline[], inherit)
            : cell && typeof cell === "object" && Array.isArray((cell as { content?: unknown }).content)
              ? { ...(cell as object), content: encodeInline((cell as { content: Inline[] }).content, inherit) }
              : cell,
        ),
      })),
    };
  }
  return content;
}

export function encodeColors<T extends Block>(blocks: T[]): T[] {
  return blocks.map((block) => {
    // 블록 전체에 준 색(블록 메뉴 → 색)은 안쪽 글자에 옮겨 담는다
    const inherit: Colors = { t: valid(block.props?.textColor), b: valid(block.props?.backgroundColor) };
    const props = block.props ? { ...block.props } : undefined;
    if (props && inherit.t) props.textColor = "default";
    if (props && inherit.b) props.backgroundColor = "default";
    return {
      ...block,
      ...(props ? { props } : {}),
      content: encodeContent(block.content, inherit),
      children: block.children ? encodeColors(block.children) : block.children,
    };
  });
}

export function tokensToHtml(markdown: string): string {
  return markdown.replace(TOKEN, (_, kind: string, name: string) => {
    if (kind === undefined) return "</span>";
    return kind === "t" ? `<span data-text-color="${name}">` : `<span data-bg-color="${name}">`;
  });
}

// ---------- 불러오기: md → 표식 포함 md → 블록 → 색 스타일 ----------

const SPAN = /<span data-(text|bg)-color="([a-z]+)">|<\/span>/g;

// 코드 블록·인라인 코드 안의 <span>은 건드리지 않는다
export function htmlToTokens(markdown: string): string {
  let depth = 0;
  const convert = (text: string) =>
    text.replace(SPAN, (m, kind: string | undefined, name: string | undefined) => {
      if (kind && name && COLOR_SET.has(name)) {
        depth++;
        return `${OPEN}${kind === "text" ? "t" : "b"}:${name}${MID}`;
      }
      if (!kind && depth > 0) {
        depth--;
        return CLOSE;
      }
      return m;
    });
  return markdown
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.split(/(`[^`\n]*`)/g).map((p, j) => (j % 2 === 1 ? p : convert(p))).join("")))
    .join("");
}

function decodeInline(items: Inline[], stack: { kind: string; name: string }[]): Inline[] {
  const out: Inline[] = [];
  for (const item of items) {
    if (item.type === "link" && Array.isArray(item.content)) {
      out.push({ ...item, content: decodeInline(item.content, stack) });
      continue;
    }
    if (item.type !== "text" || typeof item.text !== "string" || !/[-]/.test(item.text)) {
      out.push(applyStack(item, stack));
      continue;
    }
    let last = 0;
    const text = item.text;
    for (const m of text.matchAll(TOKEN)) {
      if (m.index! > last) out.push(applyStack({ ...item, text: text.slice(last, m.index) }, stack));
      if (m[1]) stack.push({ kind: m[1], name: m[2] });
      else stack.pop();
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push(applyStack({ ...item, text: text.slice(last) }, stack));
  }
  return out;
}

function applyStack(item: Inline, stack: { kind: string; name: string }[]): Inline {
  if (item.type !== "text" || stack.length === 0) return item;
  const styles = { ...(item.styles ?? {}) };
  for (const s of stack) {
    if (s.kind === "t") styles.textColor = s.name;
    else styles.backgroundColor = s.name;
  }
  return { ...item, styles };
}

function decodeContent(content: unknown): unknown {
  if (Array.isArray(content)) return decodeInline(content as Inline[], []);
  if (content && typeof content === "object" && (content as { type?: string }).type === "tableContent") {
    const table = content as { rows: { cells: unknown[] }[] };
    return {
      ...table,
      rows: table.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          Array.isArray(cell)
            ? decodeInline(cell as Inline[], [])
            : cell && typeof cell === "object" && Array.isArray((cell as { content?: unknown }).content)
              ? { ...(cell as object), content: decodeInline((cell as { content: Inline[] }).content, []) }
              : cell,
        ),
      })),
    };
  }
  return content;
}

export function decodeColors<T extends Block>(blocks: T[]): T[] {
  return blocks.map((block) => ({
    ...block,
    content: decodeContent(block.content),
    children: block.children ? decodeColors(block.children) : block.children,
  }));
}
