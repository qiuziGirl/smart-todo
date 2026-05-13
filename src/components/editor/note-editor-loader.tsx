"use client";

import dynamic from "next/dynamic";
import type { NoteEditorProps } from "@/components/editor/note-editor";

const NoteEditorDynamic = dynamic(
  () => import("@/components/editor/note-editor").then((m) => m.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        加载编辑器…
      </div>
    ),
  }
);

export function NoteEditorLoader(props: NoteEditorProps) {
  return <NoteEditorDynamic {...props} />;
}
