"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import {
  BlockColorsItem,
  DragHandleMenu,
  FormattingToolbar,
  FormattingToolbarController,
  RemoveBlockItem,
  SideMenu,
  SideMenuController,
  blockTypeSelectItems,
  useBlockNoteEditor,
  useComponentsContext,
  useDictionary,
  useExtensionState,
} from "@blocknote/react";

// 글을 쓰다가 제목 레벨·블록 종류를 바꾸려면 원래는 글자를 드래그해 툴바의 작은 드롭다운을 찾아야 했다.
// ⋮⋮ 블록 메뉴에 '전환'을 넣어 바로 바꿀 수 있게 하고, 읽기 화면이 다루지 않는 종류(제목4~6, 접는 제목·목록)는 뺀다.

const TURN_INTO = [
  { label: "본문", type: "paragraph" },
  { label: "제목 1", type: "heading", level: 1 },
  { label: "제목 2", type: "heading", level: 2 },
  { label: "제목 3", type: "heading", level: 3 },
  { label: "인용", type: "quote" },
  { label: "글머리 목록", type: "bulletListItem" },
  { label: "번호 목록", type: "numberedListItem" },
  { label: "체크리스트", type: "checkListItem" },
] as const;
const TEXT_BLOCKS = new Set<string>(TURN_INTO.map((t) => t.type));

function TurnIntoItems() {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useExtensionState(SideMenuExtension, { editor, selector: (s) => s?.block });
  if (!block || !TEXT_BLOCKS.has(block.type)) return null;
  const level = (block.props as { level?: number }).level;

  return (
    <>
      <Components.Generic.Menu.Divider className="bn-menu-divider" />
      <Components.Generic.Menu.Label className="bn-menu-label">전환</Components.Generic.Menu.Label>
      {TURN_INTO.map((t) => {
        const active = block.type === t.type && (!("level" in t) || level === t.level);
        return (
          <Components.Generic.Menu.Item
            key={t.label}
            className="bn-menu-item"
            checked={active}
            onClick={() =>
              editor.updateBlock(block, {
                type: t.type,
                props: "level" in t ? { level: t.level, isToggleable: false } : {},
              } as Parameters<typeof editor.updateBlock>[1])
            }
          >
            {t.label}
          </Components.Generic.Menu.Item>
        );
      })}
    </>
  );
}

export function EditorSideMenu() {
  const dict = useDictionary();
  return (
    <SideMenuController
      sideMenu={(props) => (
        <SideMenu
          {...props}
          dragHandleMenu={() => (
            <DragHandleMenu>
              <RemoveBlockItem>{dict.drag_handle.delete_menuitem}</RemoveBlockItem>
              <BlockColorsItem>{dict.drag_handle.colors_menuitem}</BlockColorsItem>
              <TurnIntoItems />
            </DragHandleMenu>
          )}
        />
      )}
    />
  );
}

export function EditorFormattingToolbar() {
  const dict = useDictionary();
  const items = blockTypeSelectItems(dict).filter(
    (i) => !i.props?.isToggleable && !(typeof i.props?.level === "number" && i.props.level > 3) && i.type !== "toggleListItem",
  );
  return (
    <FormattingToolbarController formattingToolbar={() => <FormattingToolbar blockTypeSelectItems={items} />} />
  );
}
