"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deriveTitleAndPlainText } from "@/lib/tiptap/content";
import { applyTaskItemCheckedInDoc } from "@/lib/tiptap/todo-doc";
import { syncTodoItemsForNote } from "@/lib/todo/sync-todo-items-for-note";

/** 在「待办聚合」页勾选完成：回写便签 JSON 并同步 `todo_items` */
export async function toggleTodoItemFromAggregate(todoItemId: string, nextDone: boolean) {
  const user = await requireUser();
  const item = await prisma.todoItem.findFirst({
    where: { id: todoItemId, userId: user.id },
    include: { note: true },
  });
  if (!item) {
    return { error: "待办不存在" };
  }
  if (item.note.isDeleted) {
    return { error: "便签已在回收站" };
  }
  const patched = applyTaskItemCheckedInDoc(item.note.contentJson, item.blockId, nextDone);
  if (!patched) {
    return { error: "无法在便签中定位该待办，请在便签中编辑保存一次后再试" };
  }
  const { contentText, title } = deriveTitleAndPlainText(patched);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.note.updateMany({
        where: { id: item.noteId, userId: user.id, isDeleted: false },
        data: {
          contentJson: patched as Prisma.InputJsonValue,
          contentText,
          title,
          syncVersion: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        throw new Error("NOTE_NOT_FOUND");
      }
      const n = await tx.note.findFirst({
        where: { id: item.noteId, userId: user.id },
        select: { syncVersion: true },
      });
      if (!n) {
        throw new Error("NOTE_NOT_FOUND");
      }
      await syncTodoItemsForNote(tx, {
        userId: user.id,
        noteId: item.noteId,
        contentJson: patched,
        noteSyncVersion: n.syncVersion,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOTE_NOT_FOUND") {
      return { error: "便签不存在或已删除" };
    }
    throw e;
  }

  revalidatePath("/todos", "page");
  revalidatePath("/notes", "layout");
  revalidatePath(`/notes/${item.noteId}`, "page");
  return { ok: true };
}
