// BlockNote 서식을 마크다운에 빠짐없이 보존하기 (서버/클라이언트 공용).
//
// BlockNote의 blocksToMarkdownLossy는 이름대로 "손실이 있다".
// - 글자색·배경색·밑줄: 마크다운 문법이 없어 버려진다
// - 볼드·기울임·취소선(**, *, ~~): 한국어에서 자주 깨진다. CommonMark는 ** 앞뒤가 문장부호냐
//   공백이냐로 볼드 여부를 정해서, "**(API)**를", "**"중요"**라고", 앞에 공백이 낀 볼드 등이 별표 그대로 보인다
// - 빈 줄: 연속된 빈 줄은 하나로 합쳐져 사라진다
//
// 그래서 인라인 서식은 전부 HTML 태그로 남긴다 (앞뒤 글자와 상관없이 항상 적용, GitHub에서도 보임):
//   <strong> <em> <del> <u> <span data-text-color="red"> <span data-bg-color="yellow">
// 빈 문단은 &nbsp; 한 줄로 남긴다 → 읽기 화면에서 "공백 문단"이 되어 에디터의 빈 문단과 같은 높이.
// (예전에 <br> 한 줄로 저장한 글도 빈 문단으로 읽는다. Shift+Enter 줄바꿈은 마크다운 "\" 줄바꿈으로 저장됨)
//
// 방법: 저장 전 블록의 서식을 "표식 문자"로 바꿔 끼우고 → md 변환 → 표식을 태그로.
// 불러올 땐 반대로 태그 → 표식 → md 파싱 → 표식을 다시 서식으로.
// 표식은 유니코드 사용자 영역 문자라 마크다운 변환에서 이스케이프되지 않는다.

export const COLOR_NAMES = ["gray", "brown", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;
const COLOR_SET = new Set<string>(COLOR_NAMES);

// 서식 → HTML 태그
const MARKS = { bold: "strong", italic: "em", strike: "del", underline: "u" } as const;
type Mark = keyof typeof MARKS;
const MARK_KEYS = Object.keys(MARKS) as Mark[];
// 불러올 때 같은 뜻으로 받아 줄 태그
const TAG_TO_MARK: Record<string, Mark> = { strong: "bold", b: "bold", em: "italic", i: "italic", del: "strike", s: "strike", u: "underline" };

const OPEN = "\uE000"; // 여는 표식: OPEN 종류:값 MID
const MID = "\uE001";
const CLOSE = "\uE002"; // 닫는 표식: CLOSE 태그 MID
const EMPTY = "\uE003"; // 빈 문단 자리
const TOKEN = new RegExp(`${OPEN}([tbm]):([a-z]+)${MID}|${CLOSE}([a-z]+)${MID}`, "g");

type Styles = Record<string, unknown>;
type Inline = { type: string; text?: string; styles?: Styles; content?: Inline[] | string; [k: string]: unknown };
type Block = { type?: string; props?: Record<string, unknown>; content?: unknown; children?: Block[]; [k: string]: unknown };
type Colors = { t?: string; b?: string };
type Open = { kind: string; value: string };

const valid = (v: unknown): string | undefined => (typeof v === "string" && COLOR_SET.has(v) ? v : undefined);

// ---------- 저장: 블록 → 표식 포함 블록 ----------

function encodeInline(items: Inline[], inherit: Colors): Inline[] {
  return items.map((item) => {
    if (item.type === "link" && Array.isArray(item.content)) {
      return { ...item, content: encodeInline(item.content, inherit) };
    }
    if (item.type !== "text" || typeof item.text !== "string") return item;
    const styles = { ...(item.styles ?? {}) };
    // 인라인 코드 안에는 태그를 넣을 수 없다 (그대로 글자로 보이므로) → 서식은 코드만 남긴다
    if (styles.code) return { ...item, styles: { code: true } };

    const opens: string[] = [];
    const closes: string[] = [];
    for (const mark of MARK_KEYS) {
      if (styles[mark]) {
        opens.push(`${OPEN}m:${mark}${MID}`);
        closes.unshift(`${CLOSE}${MARKS[mark]}${MID}`);
      }
      delete styles[mark];
    }
    const t = valid(styles.textColor) ?? inherit.t;
    const b = valid(styles.backgroundColor) ?? inherit.b;
    delete styles.textColor;
    delete styles.backgroundColor;
    if (t) {
      opens.push(`${OPEN}t:${t}${MID}`);
      closes.unshift(`${CLOSE}span${MID}`);
    }
    if (b) {
      opens.push(`${OPEN}b:${b}${MID}`);
      closes.unshift(`${CLOSE}span${MID}`);
    }
    if (opens.length === 0) return { ...item, styles };
    return { ...item, styles, text: opens.join("") + item.text + closes.join("") };
  });
}

function mapTable(content: unknown, fn: (items: Inline[]) => Inline[]): unknown {
  // 표: { type: "tableContent", rows: [{ cells: [Inline[] | { content: Inline[] }] }] }
  const table = content as { rows: { cells: unknown[] }[] };
  return {
    ...table,
    rows: table.rows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) =>
        Array.isArray(cell)
          ? fn(cell as Inline[])
          : cell && typeof cell === "object" && Array.isArray((cell as { content?: unknown }).content)
            ? { ...(cell as object), content: fn((cell as { content: Inline[] }).content) }
            : cell,
      ),
    })),
  };
}

const isTable = (c: unknown) => !!c && typeof c === "object" && (c as { type?: string }).type === "tableContent";

function encodeContent(content: unknown, inherit: Colors): unknown {
  if (Array.isArray(content)) return encodeInline(content as Inline[], inherit);
  if (isTable(content)) return mapTable(content, (items) => encodeInline(items, inherit));
  return content;
}

function encodeStyles<T extends Block>(blocks: T[]): T[] {
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
      children: block.children ? encodeStyles(block.children) : block.children,
    };
  });
}

const isEmptyParagraph = (b: Block) =>
  b.type === "paragraph" &&
  (!Array.isArray(b.content) || (b.content as Inline[]).every((c) => c.type === "text" && !c.text)) &&
  !b.children?.length;

// 빈 문단에 표식을 넣어 마크다운 변환에서 사라지지 않게 한다. 문서 끝의 빈 문단(에디터가 늘 하나 둠)은 버린다
function markEmptyParagraphs<T extends Block>(blocks: T[], top: boolean): T[] {
  let list = blocks;
  if (top) {
    let end = list.length;
    while (end > 0 && isEmptyParagraph(list[end - 1])) end--;
    list = list.slice(0, end);
  }
  return list.map((b) =>
    isEmptyParagraph(b)
      ? { ...b, content: [{ type: "text", text: EMPTY, styles: {} }] }
      : { ...b, children: b.children ? markEmptyParagraphs(b.children, false) : b.children },
  );
}

/** 저장용: 블록 → 서식·빈 줄 표식이 들어간 블록. blocksToMarkdownLossy 전에 쓴다 */
export function encodeBlocks<T extends Block>(blocks: T[]): T[] {
  return encodeStyles(markEmptyParagraphs(blocks, true));
}

/** 저장용: blocksToMarkdownLossy 결과의 표식 → HTML 태그, 빈 문단 → &nbsp; */
export function tokensToHtml(markdown: string): string {
  return markdown
    .replace(TOKEN, (_, kind: string | undefined, value: string | undefined, closeTag: string | undefined) => {
      if (closeTag) return `</${closeTag}>`;
      if (kind === "m") return `<${MARKS[value as Mark]}>`;
      return kind === "t" ? `<span data-text-color="${value}">` : `<span data-bg-color="${value}">`;
    })
    .replaceAll(EMPTY, "&nbsp;");
}

// ---------- 불러오기: md → 표식 포함 md → 블록 → 서식 ----------

const TAG = /<(\/?)(strong|b|em|i|del|s|u|span)((?:\s+data-(?:text|bg)-color="[a-z]+")?)\s*>/g;

// 코드 블록·인라인 코드 안의 태그는 건드리지 않는다
export function htmlToTokens(markdown: string): string {
  const stack: string[] = []; // 우리가 연 태그만 닫는다
  const convert = (text: string) =>
    text
      // 한 줄 전체가 &nbsp; 또는 <br>(예전 형식)이면 빈 문단
      .replace(/^([ \t]*)(?:&nbsp;|<br\s*\/?>)[ \t]*$/gm, `$1${EMPTY}`)
      .replace(TAG, (m, slash: string, tag: string, attr: string) => {
        if (slash) {
          if (stack[stack.length - 1] !== tag) return m;
          stack.pop();
          return `${CLOSE}${tag}${MID}`;
        }
        if (tag === "span") {
          const c = attr.match(/data-(text|bg)-color="([a-z]+)"/);
          if (!c || !COLOR_SET.has(c[2])) return m;
          stack.push("span");
          return `${OPEN}${c[1] === "text" ? "t" : "b"}:${c[2]}${MID}`;
        }
        if (attr) return m;
        stack.push(tag);
        return `${OPEN}m:${TAG_TO_MARK[tag]}${MID}`;
      });
  return markdown
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .split(/(`[^`\n]*`)/g)
            .map((p, j) => (j % 2 === 1 ? p : convert(p)))
            .join(""),
    )
    .join("");
}

function applyStack(item: Inline, stack: Open[]): Inline {
  if (item.type !== "text" || stack.length === 0) return item;
  const styles = { ...(item.styles ?? {}) };
  for (const s of stack) {
    if (s.kind === "t") styles.textColor = s.value;
    else if (s.kind === "b") styles.backgroundColor = s.value;
    else styles[s.value] = true;
  }
  return { ...item, styles };
}

function decodeInline(items: Inline[], stack: Open[]): Inline[] {
  const out: Inline[] = [];
  for (const item of items) {
    if (item.type === "link" && Array.isArray(item.content)) {
      out.push({ ...item, content: decodeInline(item.content, stack) });
      continue;
    }
    if (item.type !== "text" || typeof item.text !== "string" || !/[\uE000-\uE003]/.test(item.text)) {
      out.push(applyStack(item, stack));
      continue;
    }
    let last = 0;
    const text = item.text;
    for (const m of text.matchAll(TOKEN)) {
      if (m.index! > last) out.push(applyStack({ ...item, text: text.slice(last, m.index) }, stack));
      if (m[1]) stack.push({ kind: m[1], value: m[2] });
      else stack.pop();
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push(applyStack({ ...item, text: text.slice(last) }, stack));
  }
  // 빈 문단 표식, Shift+Enter 줄바꿈을 다시 읽을 때 다음 줄 앞에 붙는 공백 정리
  return out
    .filter((c) => !(c.type === "text" && (c.text === EMPTY || c.text === "")))
    .map((c) => (c.type === "text" && typeof c.text === "string" ? { ...c, text: c.text.replace(/\n /g, "\n") } : c));
}

function decodeContent(content: unknown): unknown {
  if (Array.isArray(content)) return decodeInline(content as Inline[], []);
  if (isTable(content)) return mapTable(content, (items) => decodeInline(items, []));
  return content;
}

/** 읽기 화면용: 예전 형식(<br> 한 줄) 빈 문단을 &nbsp; 문단으로 (코드 블록 안은 그대로) */
export function normalizeEmptyLines(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/^([ \t]*)<br\s*\/?>[ \t]*$/gm, "$1&nbsp;")))
    .join("");
}

/** 불러오기용: tryParseMarkdownToBlocks 결과 → 서식·빈 문단·줄바꿈 복원 */
export function decodeBlocks<T extends Block>(blocks: T[]): T[] {
  return blocks.map((block) => ({
    ...block,
    content: decodeContent(block.content),
    children: block.children ? decodeBlocks(block.children) : block.children,
  }));
}
