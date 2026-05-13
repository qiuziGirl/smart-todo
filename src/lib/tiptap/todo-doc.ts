import type { JSONContent } from "@tiptap/core";
import { nanoid } from "nanoid";

/** 为缺少 `attrs.id` 的 taskItem 写入稳定 blockId（与 DB `TodoItem.blockId` 对齐） */
export function ensureTaskItemBlockIds(docJson: unknown): JSONContent {
  const doc = JSON.parse(JSON.stringify(docJson)) as JSONContent;

  function walk(node: JSONContent): void {
    if (node.type === "taskItem") {
      const attrs = { ...(node.attrs ?? {}) };
      if (!attrs.id || typeof attrs.id !== "string") {
        attrs.id = nanoid();
      }
      node.attrs = attrs;
    }
    node.content?.forEach(walk);
  }

  walk(doc);
  return doc;
}

function parseOptionalIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function collectTaskItemPlainText(node: JSONContent): string {
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  if (!node.content?.length) {
    return "";
  }
  return node.content.map(collectTaskItemPlainText).join("");
}

export type ExtractedTodoRow = {
  blockId: string;
  text: string;
  isDone: boolean;
  dueAt: Date | null;
  remindAt: Date | null;
};

/** 从 Tiptap JSON 抽取未完成/已完成待办行（仅含带 `attrs.id` 的 taskItem） */
export function extractTodosFromDocJson(docJson: unknown): ExtractedTodoRow[] {
  const rows: ExtractedTodoRow[] = [];
  const doc = docJson as JSONContent | null;
  if (!doc || typeof doc !== "object") {
    return rows;
  }

  function walk(node: JSONContent): void {
    if (node.type === "taskItem") {
      const attrs = node.attrs ?? {};
      const blockId = attrs.id;
      if (typeof blockId !== "string" || blockId.length === 0) {
        node.content?.forEach(walk);
        return;
      }
      const text = (node.content ?? []).map(collectTaskItemPlainText).join("").trim();
      rows.push({
        blockId,
        text: text.length > 0 ? text : "（空待办）",
        isDone: attrs.checked === true,
        dueAt: parseOptionalIsoDate(attrs.dueAt),
        remindAt: parseOptionalIsoDate(attrs.remindAt),
      });
    }
    node.content?.forEach(walk);
  }

  walk(doc);
  return rows;
}

/** 深度克隆并更新指定 taskItem 的 checked（按 attrs.id 匹配） */
export function applyTaskItemCheckedInDoc(
  docJson: unknown,
  blockId: string,
  checked: boolean
): JSONContent | null {
  const doc = JSON.parse(JSON.stringify(docJson)) as JSONContent;
  let hit = false;

  function walk(node: JSONContent): void {
    if (node.type === "taskItem" && node.attrs && node.attrs.id === blockId) {
      node.attrs = { ...node.attrs, checked };
      hit = true;
    }
    node.content?.forEach(walk);
  }

  walk(doc);
  return hit ? doc : null;
}
