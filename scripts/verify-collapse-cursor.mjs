import { readFileSync } from "node:fs";

const layout = readFileSync(
  new URL("../src/components/notes/notes-resizable-layout.tsx", import.meta.url),
  "utf8",
);
const resizable = readFileSync(
  new URL("../src/components/ui/resizable.tsx", import.meta.url),
  "utf8",
);

const checks = [
  {
    name: "notes resizable group disables react-resizable-panels global cursor override",
    pass: /<ResizablePanelGroup[\s\S]*\sdisableCursor(?:\s|>|=)/.test(layout),
  },
  {
    name: "resizable handle keeps resize affordance when global cursor override is disabled",
    pass: /cursor-col-resize/.test(resizable),
  },
  {
    name: "collapse buttons explicitly use hand cursor",
    pass:
      (layout.match(/cursor-pointer/g) ?? []).length >= 2 &&
      !/onPointerEnter|onPointerLeave/.test(layout),
  },
  {
    name: "collapse button icons do not become the cursor target",
    pass: (layout.match(/pointer-events-none/g) ?? []).length >= 4,
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Collapse cursor verification failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Collapse cursor verification passed.");
