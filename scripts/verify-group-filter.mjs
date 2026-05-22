import { readFileSync } from "node:fs";

const files = {
  groupRow: readFileSync(
    new URL("../src/components/notes/group-row.tsx", import.meta.url),
    "utf8",
  ),
  groupsPanel: readFileSync(
    new URL("../src/components/notes/groups-panel.tsx", import.meta.url),
    "utf8",
  ),
  noteList: readFileSync(
    new URL("../src/components/notes/note-list.tsx", import.meta.url),
    "utf8",
  ),
  notesLayout: readFileSync(
    new URL("../src/app/(app)/notes/layout.tsx", import.meta.url),
    "utf8",
  ),
  noteTypes: readFileSync(
    new URL("../src/types/note.ts", import.meta.url),
    "utf8",
  ),
};

const checks = [
  {
    name: "group rows use real links for keyboard-accessible filtering",
    pass:
      /import Link from "next\/link"/.test(files.groupRow) &&
      /<Link[\s\S]*href=/.test(files.groupRow) &&
      /aria-current/.test(files.groupRow),
  },
  {
    name: "group rows read current URL search params and set groupId",
    pass:
      /useSearchParams/.test(files.groupRow) &&
      /params\.set\("groupId", group\.id\)/.test(files.groupRow),
  },
  {
    name: "groups panel provides a clear all-notes filter state",
    pass:
      /全部便签/.test(files.groupsPanel) &&
      /aria-current/.test(files.groupsPanel) &&
      /params\.delete\("groupId"\)/.test(files.groupsPanel),
  },
  {
    name: "note list filters by selected groupId and preserves filter in note links",
    pass:
      /useSearchParams/.test(files.noteList) &&
      /notes\.filter\(\(note\) => note\.groupId === activeGroupId\)/.test(
        files.noteList,
      ) &&
      /href=\{noteHref\(n\.id\)\}/.test(files.noteList),
  },
  {
    name: "server note query includes groupId for client filtering",
    pass:
      /groupId: true/.test(files.notesLayout) &&
      /groupId: n\.groupId/.test(files.notesLayout) &&
      /groupId: string \| null/.test(files.noteTypes),
  },
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Group filter verification failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Group filter verification passed.");
