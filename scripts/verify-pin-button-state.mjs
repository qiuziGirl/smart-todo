import { readFileSync } from "node:fs";

const editor = readFileSync(
  new URL("../src/components/editor/note-editor.tsx", import.meta.url),
  "utf8",
);

const checks = [
  {
    name: "pinned button exposes distinct accessible labels for both states",
    pass:
      /aria-label=\{pinned \? "取消置顶" : "置顶"\}/.test(editor),
  },
  {
    name: "pin button shows the same custom tooltip pattern on hover and focus",
    pass:
      /group-hover\/button:opacity-100/.test(editor) &&
      /group-focus-visible\/button:opacity-100/.test(editor) &&
      /\{pinned \? "取消置顶" : "置顶"\}/.test(editor) &&
      /bg-popover/.test(editor) &&
      /text-popover-foreground/.test(editor) &&
      /top-full/.test(editor) &&
      !/bottom-full/.test(editor),
  },
  {
    name: "pinned active state uses a subtle toolbar-friendly active class",
    pass:
      /pinned &&/.test(editor) &&
      /bg-muted/.test(editor) &&
      /text-foreground/.test(editor) &&
      /ring-1/.test(editor) &&
      /ring-border/.test(editor) &&
      !/bg-primary/.test(editor) &&
      !/text-primary-foreground/.test(editor),
  },
  {
    name: "pinned icon is visually distinct from unpinned icon",
    pass:
      /fill-current/.test(editor) &&
      /-rotate-45/.test(editor),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Pin button state verification failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Pin button state verification passed.");
