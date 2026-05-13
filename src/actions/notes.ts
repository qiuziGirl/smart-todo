"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deriveTitleAndPlainText } from "@/lib/tiptap/content";
import { ensureTaskItemBlockIds } from "@/lib/tiptap/todo-doc";
import { syncTodoItemsForNote } from "@/lib/todo/sync-todo-items-for-note";

export type NoteContentSaveResult =
  | { ok: true; syncVersion: number }
  | { error: string }
  | { conflict: true; serverSyncVersion: number };

const defaultDoc: Prisma.InputJsonValue = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** 供表单 / 按钮调用：新建空白便签并跳转 */
export async function createBlankNote() {
  const user = await requireUser();
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      groupId: null,
      contentJson: defaultDoc,
      contentText: "",
      title: null,
    },
  });
  revalidatePath("/notes", "layout");
  redirect(`/notes/${note.id}`);
}

export async function createNoteInGroup(groupId: string) {
  const user = await requireUser();
  const g = await prisma.group.findFirst({
    where: { id: groupId, userId: user.id },
  });
  if (!g) {
    return { error: "分组不存在" };
  }
  const note = await prisma.note.create({
    data: {
      userId: user.id,
      groupId,
      contentJson: defaultDoc,
      contentText: "",
      title: null,
    },
  });
  revalidatePath("/notes", "layout");
  redirect(`/notes/${note.id}`);
}

export async function updateNoteContent(
  noteId: string,
  contentJson: Prisma.InputJsonValue,
  contentText: string,
  title: string | null,
  options?: {
    /** 与 DB 行一致时才写入；用于乐观并发 */
    expectedSyncVersion?: number | null;
    /** 离线队列重放时跳过版本校验（LWW） */
    skipExpectedVersion?: boolean;
  }
): Promise<NoteContentSaveResult> {
  const user = await requireUser();
  const useVersionLock =
    options?.skipExpectedVersion !== true &&
    options?.expectedSyncVersion !== undefined &&
    options?.expectedSyncVersion !== null;

  const versionWhere = useVersionLock ? { syncVersion: options!.expectedSyncVersion! } : {};

  let resultSync = 0;
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.note.updateMany({
        where: {
          id: noteId,
          userId: user.id,
          isDeleted: false,
          ...versionWhere,
        },
        data: {
          contentJson,
          contentText,
          title,
          syncVersion: { increment: 1 },
        },
      });
      if (updated.count === 0) {
        const row = await tx.note.findFirst({
          where: { id: noteId, userId: user.id },
          select: { syncVersion: true, isDeleted: true },
        });
        if (!row || row.isDeleted) {
          throw new Error("NOTE_NOT_FOUND");
        }
        throw new Error("SYNC_CONFLICT");
      }
      const n = await tx.note.findFirst({
        where: { id: noteId, userId: user.id },
        select: { syncVersion: true },
      });
      if (!n) {
        throw new Error("NOTE_NOT_FOUND");
      }
      resultSync = n.syncVersion;
      await syncTodoItemsForNote(tx, {
        userId: user.id,
        noteId,
        contentJson,
        noteSyncVersion: n.syncVersion,
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOTE_NOT_FOUND") {
      return { error: "便签不存在或已删除" };
    }
    if (e instanceof Error && e.message === "SYNC_CONFLICT") {
      const row = await prisma.note.findFirst({
        where: { id: noteId, userId: user.id, isDeleted: false },
        select: { syncVersion: true },
      });
      return { conflict: true, serverSyncVersion: row?.syncVersion ?? -1 };
    }
    throw e;
  }
  revalidatePath("/notes", "layout");
  revalidatePath(`/notes/${noteId}`, "page");
  revalidatePath("/todos", "page");
  return { ok: true, syncVersion: resultSync };
}

/** 从编辑器 JSON 计算纯文本与标题并保存 */
export async function saveNoteFromEditor(
  noteId: string,
  docJson: unknown,
  options?: {
    expectedSyncVersion?: number | null;
    skipExpectedVersion?: boolean;
  }
): Promise<NoteContentSaveResult> {
  const withIds = ensureTaskItemBlockIds(docJson) as Prisma.InputJsonValue;
  const { contentText, title } = deriveTitleAndPlainText(withIds);
  return updateNoteContent(noteId, withIds, contentText, title, options);
}

export async function moveNoteToGroup(noteId: string, groupId: string | null) {
  const user = await requireUser();
  if (groupId) {
    const g = await prisma.group.findFirst({
      where: { id: groupId, userId: user.id },
    });
    if (!g) {
      return { error: "分组不存在" };
    }
  }
  const updated = await prisma.note.updateMany({
    where: { id: noteId, userId: user.id, isDeleted: false },
    data: { groupId },
  });
  if (updated.count === 0) {
    return { error: "便签不存在" };
  }
  revalidatePath("/notes", "layout");
  return { ok: true };
}

export async function softDeleteNote(noteId: string) {
  const user = await requireUser();
  await prisma.note.updateMany({
    where: { id: noteId, userId: user.id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  revalidatePath("/notes", "layout");
  revalidatePath("/notes/trash", "page");
  revalidatePath("/todos", "page");
  redirect("/notes");
}

export async function restoreNote(noteId: string) {
  const user = await requireUser();
  await prisma.note.updateMany({
    where: { id: noteId, userId: user.id },
    data: { isDeleted: false, deletedAt: null },
  });
  revalidatePath("/notes", "layout");
  revalidatePath("/notes/trash", "page");
  revalidatePath("/todos", "page");
  redirect(`/notes/${noteId}`);
}

export async function togglePinNote(noteId: string, isPinned: boolean) {
  const user = await requireUser();
  await prisma.note.updateMany({
    where: { id: noteId, userId: user.id, isDeleted: false },
    data: { isPinned },
  });
  revalidatePath("/notes", "layout");
  return { ok: true };
}

export async function setNoteColor(noteId: string, color: string | null) {
  const user = await requireUser();
  await prisma.note.updateMany({
    where: { id: noteId, userId: user.id, isDeleted: false },
    data: { color },
  });
  revalidatePath("/notes", "layout");
  revalidatePath(`/notes/${noteId}`, "page");
  return { ok: true };
}

export async function permanentlyDeleteNote(noteId: string) {
  const user = await requireUser();
  await prisma.note.deleteMany({
    where: { id: noteId, userId: user.id, isDeleted: true },
  });
  revalidatePath("/notes", "layout");
  revalidatePath("/notes/trash", "page");
  revalidatePath("/todos", "page");
  redirect("/notes/trash");
}
