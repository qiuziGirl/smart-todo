"use client";

import { useTransition } from "react";
import { permanentlyDeleteNote, restoreNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  title: string | null;
  contentText: string;
};

export function TrashNoteRow({ note }: { note: Row }) {
  const [pending, start] = useTransition();

  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{note.title?.trim() || "无标题"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {note.contentText.replace(/\s+/g, " ").trim().slice(0, 120) || "（无正文）"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => start(() => restoreNote(note.id))}
        >
          还原
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("确定彻底删除？不可恢复。")) return;
            start(() => permanentlyDeleteNote(note.id));
          }}
        >
          彻底删除
        </Button>
      </div>
    </li>
  );
}
