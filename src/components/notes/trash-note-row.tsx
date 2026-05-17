"use client";

import { useState, useTransition } from "react";
import { permanentlyDeleteNote, restoreNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Row = {
  id: string;
  title: string | null;
  contentText: string;
};

export function TrashNoteRow({ note }: { note: Row }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const title = note.title?.trim() || "无标题";

  function onConfirm() {
    setOpen(false);
    start(() => permanentlyDeleteNote(note.id));
  }

  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">
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
          onClick={() => setOpen(true)}
        >
          彻底删除
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`彻底删除「${title}」？`}
        description="此操作不可恢复，便签内容将永久丢失。"
        confirmText="彻底删除"
        variant="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </li>
  );
}
