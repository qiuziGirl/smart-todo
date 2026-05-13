import type { Prisma } from "@prisma/client";
import { extractTodosFromDocJson } from "@/lib/tiptap/todo-doc";

/** 在事务内根据便签正文 JSON 全量对齐 `todo_items`（删孤儿 + upsert） */
export async function syncTodoItemsForNote(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    noteId: string;
    contentJson: Prisma.InputJsonValue;
    noteSyncVersion: number;
  }
): Promise<void> {
  const rows = extractTodosFromDocJson(params.contentJson);
  const blockIds = rows.map((r) => r.blockId);

  if (blockIds.length > 0) {
    await tx.todoItem.deleteMany({
      where: {
        noteId: params.noteId,
        userId: params.userId,
        blockId: { notIn: blockIds },
      },
    });
  } else {
    await tx.todoItem.deleteMany({
      where: { noteId: params.noteId, userId: params.userId },
    });
  }

  for (const r of rows) {
    await tx.todoItem.upsert({
      where: {
        todo_items_note_id_block_id_key: {
          noteId: params.noteId,
          blockId: r.blockId,
        },
      },
      create: {
        noteId: params.noteId,
        userId: params.userId,
        blockId: r.blockId,
        text: r.text,
        isDone: r.isDone,
        dueAt: r.dueAt,
        remindAt: r.remindAt,
        syncVersion: params.noteSyncVersion,
      },
      update: {
        text: r.text,
        isDone: r.isDone,
        dueAt: r.dueAt,
        remindAt: r.remindAt,
        syncVersion: params.noteSyncVersion,
      },
    });
  }
}
