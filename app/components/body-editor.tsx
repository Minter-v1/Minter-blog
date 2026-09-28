"use client";

import { BlockNoteSchema, createCodeBlockSpec } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import { codeBlockOptions, syntaxHighlighter } from "@blocknote/code-block";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef, useState } from "react";
import { CodeBlockOverlays } from "./code-lang-picker";
import { EditorFormattingToolbar, EditorSideMenu } from "./editor-menus";
import { decodeBlocks, encodeBlocks, htmlToTokens, tokensToHtml } from "@/lib/rich-markdown";

export type BodyEditorApi = { getMarkdown: () => string; focus: () => void; reset: (markdown: string) => void };

// 새 코드 블록의 기본 언어는 bash(Shell).
// ``` + 스페이스로 만든 코드 블록은 언어가 ""인데, BlockNote는 지원 목록에 없는 언어를 만나면
// 렌더링 중에 예외를 던진다. ""를 Shell의 별칭으로 등록해 막으면서 기본 언어도 맞춘다.
const DEFAULT_LANGUAGE = "shellscript";
const supportedLanguages = {
  ...codeBlockOptions.supportedLanguages,
  [DEFAULT_LANGUAGE]: {
    ...codeBlockOptions.supportedLanguages[DEFAULT_LANGUAGE],
    aliases: [...(codeBlockOptions.supportedLanguages[DEFAULT_LANGUAGE].aliases ?? []), ""],
  },
};

const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    codeBlock: createCodeBlockSpec({ ...codeBlockOptions, supportedLanguages, defaultLanguage: DEFAULT_LANGUAGE }),
  },
});

function languageId(lang: string) {
  // 이미 저장된 글의 언어 없는 코드 블록(```)은 그대로 일반 텍스트로 (기본값 bash로 바뀌지 않게)
  if (!lang) return "text";
  const l = lang.toLowerCase();
  const hit = Object.entries(supportedLanguages).find(
    ([id, { aliases }]) => id === l || (aliases ?? []).some((a) => a.toLowerCase() === l),
  );
  return hit && hit[0] ? hit[0] : "text";
}

// 렌더링은 언어 "id"만 인정한다(```ts 같은 별칭도 예외). 불러올 md의 여는 코드 펜스를 전부 정식 id로 바꾼다
function normalizeFences(markdown: string) {
  let open: string | null = null;
  return markdown
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*)(`{3,}|~{3,})\s*([^\s`]*)(.*)$/);
      if (!m) return line;
      const [, indent, fence, lang, rest] = m;
      if (open) {
        if (fence[0] === open[0] && fence.length >= open.length && !lang && !rest.trim()) open = null;
        return line;
      }
      open = fence;
      return `${indent}${fence}${languageId(lang)}${rest}`;
    })
    .join("\n");
}

// next/dynamic(ssr: false)로만 불러온다. BlockNote는 브라우저 전용.
export default function BodyEditor(props: {
  initialMarkdown: string;
  uploadFile: (file: File) => Promise<string>;
  onReady: (api: BodyEditorApi) => void;
  onChange: () => void;
}) {
  const editor = useCreateBlockNote({
    schema,
    extensions: [syntaxHighlighter],
    dictionary: {
      ...ko,
      placeholders: { ...ko.placeholders, emptyDocument: "자세한 설명을 적어 보세요. '/'로 블록 추가", default: "'/'로 블록 추가" },
    },
    uploadFile: props.uploadFile,
  });

  const loading = useRef(true);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const { initialMarkdown, onReady } = props;

  useEffect(() => {
    // md → 블록. 저장해 둔 <span data-*-color>, <br>을 다시 글자색·배경색·빈 줄로 되살린다
    const fromMarkdown = (markdown: string) =>
      decodeBlocks(editor.tryParseMarkdownToBlocks(normalizeFences(htmlToTokens(markdown))));

    if (initialMarkdown.trim()) {
      editor.replaceBlocks(editor.document, fromMarkdown(initialMarkdown));
    }
    setTimeout(() => (loading.current = false), 0);
    onReady({
      // 글자색·배경색·빈 줄은 마크다운이 보존하지 못해 <span data-*-color>, <br>로 남긴다 (lib/rich-markdown.ts)
      getMarkdown: () => tokensToHtml(editor.blocksToMarkdownLossy(encodeBlocks(editor.document))),
      focus: () => editor.focus(),
      reset: (markdown) => {
        // 비우거나 템플릿을 다시 까는 것 자체는 "수정"이 아니므로 onChange를 막아 둔다
        loading.current = true;
        editor.replaceBlocks(
          editor.document,
          markdown.trim() ? fromMarkdown(markdown) : [{ type: "paragraph" }],
        );
        setTimeout(() => (loading.current = false), 0);
      },
    });
  }, [editor, initialMarkdown, onReady]);

  return (
    <div ref={setRoot} className="relative">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="body-editor"
        sideMenu={false}
        formattingToolbar={false}
        onChange={() => {
          if (!loading.current) props.onChange();
        }}
      >
        <EditorSideMenu />
        <EditorFormattingToolbar />
      </BlockNoteView>
      <CodeBlockOverlays root={root} />
    </div>
  );
}
