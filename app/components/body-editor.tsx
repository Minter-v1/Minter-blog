"use client";

import { BlockNoteSchema, createCodeBlockSpec } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import { codeBlockOptions, syntaxHighlighter } from "@blocknote/code-block";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef } from "react";

export type BodyEditorApi = { getMarkdown: () => string; focus: () => void; reset: (markdown: string) => void };

// ``` + 스페이스로 만든 코드 블록은 언어가 ""인데, BlockNote는 지원 목록에 없는 언어를 만나면
// 렌더링 중에 예외를 던진다. ""를 text의 별칭으로 등록해 막는다.
const supportedLanguages = {
  ...codeBlockOptions.supportedLanguages,
  text: {
    ...codeBlockOptions.supportedLanguages.text,
    aliases: [...(codeBlockOptions.supportedLanguages.text.aliases ?? []), ""],
  },
};

const schema = BlockNoteSchema.create().extend({
  blockSpecs: { codeBlock: createCodeBlockSpec({ ...codeBlockOptions, supportedLanguages }) },
});

function languageId(lang: string) {
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
  const { initialMarkdown, onReady } = props;

  useEffect(() => {
    if (initialMarkdown.trim()) {
      editor.replaceBlocks(editor.document, editor.tryParseMarkdownToBlocks(normalizeFences(initialMarkdown)));
    }
    setTimeout(() => (loading.current = false), 0);
    onReady({
      getMarkdown: () => editor.blocksToMarkdownLossy(),
      focus: () => editor.focus(),
      reset: (markdown) => {
        // 비우거나 템플릿을 다시 까는 것 자체는 "수정"이 아니므로 onChange를 막아 둔다
        loading.current = true;
        editor.replaceBlocks(
          editor.document,
          markdown.trim() ? editor.tryParseMarkdownToBlocks(normalizeFences(markdown)) : [{ type: "paragraph" }],
        );
        setTimeout(() => (loading.current = false), 0);
      },
    });
  }, [editor, initialMarkdown, onReady]);

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      className="body-editor"
      onChange={() => {
        if (!loading.current) props.onChange();
      }}
    />
  );
}
