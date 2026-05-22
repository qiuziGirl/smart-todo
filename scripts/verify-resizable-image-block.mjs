import { existsSync, readFileSync } from "node:fs";

const extensionPath = new URL("../src/lib/tiptap/resizable-image.tsx", import.meta.url);
const editorPath = new URL("../src/components/editor/note-editor.tsx", import.meta.url);
const cssPath = new URL("../src/app/globals.css", import.meta.url);

const extension = existsSync(extensionPath) ? readFileSync(extensionPath, "utf8") : "";
const editor = readFileSync(editorPath, "utf8");
const css = readFileSync(cssPath, "utf8");

const checks = [
  {
    name: "editor uses the custom resizable image extension instead of the stock image extension",
    pass:
      /import \{ ResizableImage \} from "@\/lib\/tiptap\/resizable-image"/.test(editor) &&
      /ResizableImage\.configure\(\{ allowBase64: false \}\)/.test(editor) &&
      !/import Image from "@tiptap\/extension-image"/.test(editor),
  },
  {
    name: "custom image extension preserves image attrs and adds align and caption",
    pass:
      /Image\.extend/.test(extension) &&
      /align:\s*\{[\s\S]*default:\s*"left"/.test(extension) &&
      /caption:\s*\{[\s\S]*default:\s*null/.test(extension),
  },
  {
    name: "node view exposes resize, alignment, replace, delete, and caption controls",
    pass:
      /ReactNodeViewRenderer/.test(extension) &&
      /updateImageAttributes\(\{ width:/.test(extension) &&
      /aria-label="左对齐"/.test(extension) &&
      /aria-label="居中对齐"/.test(extension) &&
      /aria-label="右对齐"/.test(extension) &&
      /aria-label="替换图片"/.test(extension) &&
      /aria-label="删除图片"/.test(extension) &&
      /placeholder="添加说明"/.test(extension),
  },
  {
    name: "node view exposes Feishu-like image preview affordance",
    pass:
      /aria-label="预览图片"/.test(extension) &&
      /aria-label="关闭图片预览"/.test(extension) &&
      /role="dialog"/.test(extension) &&
      /Escape/.test(extension) &&
      /\.tiptap-image-preview-button/.test(css) &&
      /\.tiptap-image-preview-backdrop/.test(css) &&
      /\.tiptap-image-preview-dialog/.test(css),
  },
  {
    name: "replace image reuses the existing note image upload action",
    pass:
      /import \{ uploadNoteImage \} from "@\/actions\/upload"/.test(extension) &&
      /uploadNoteImage\(fd\)/.test(extension),
  },
  {
    name: "CSS includes image block, toolbar, resize handle, and caption styles",
    pass:
      /\.tiptap-image-block/.test(css) &&
      /\.tiptap-image-toolbar/.test(css) &&
      /\.tiptap-image-resize-handle/.test(css) &&
      /\.tiptap-image-caption/.test(css),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Resizable image block verification failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Resizable image block verification passed.");
