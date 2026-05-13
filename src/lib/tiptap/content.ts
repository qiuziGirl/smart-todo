import type { JSONContent } from "@tiptap/core";

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "listItem",
  "taskItem",
  "codeBlock",
]);

/** 从 Tiptap JSON 提取纯文本与标题（首行非空文本，最长 120） */
export function deriveTitleAndPlainText(docJson: unknown): {
  contentText: string;
  title: string | null;
} {
  const parts: string[] = [];

  function walk(node: JSONContent): void {
    if (node.type === "text" && typeof node.text === "string") {
      parts.push(node.text);
      return;
    }
    if (node.type === "hardBreak") {
      parts.push("\n");
      return;
    }
    if (!node.content?.length) {
      return;
    }
    for (const child of node.content) {
      walk(child);
    }
    if (node.type && BLOCK_TYPES.has(node.type)) {
      parts.push("\n");
    }
  }

  if (docJson && typeof docJson === "object") {
    walk(docJson as JSONContent);
  }

  const contentText = parts.join("").replace(/\n{3,}/g, "\n\n").trim();
  const firstLine =
    contentText
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "";

  const title = firstLine.length > 0 ? firstLine.slice(0, 120) : null;
  return { contentText, title };
}
