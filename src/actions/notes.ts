"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deriveTitleAndPlainText } from "@/lib/tiptap/content";

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
  title: string | null
) {
  const user = await requireUser();
  const updated = await prisma.note.updateMany({
    where: { id: noteId, userId: user.id, isDeleted: false },
    data: {
      contentJson,
      contentText,
      title,
      syncVersion: { increment: 1 },
    },
  });
  if (updated.count === 0) {
    return { error: "便签不存在或已删除" };
  }
  revalidatePath("/notes", "layout");
  revalidatePath(`/notes/${noteId}`, "page");
  return { ok: true };
}

/** 从编辑器 JSON 计算纯文本与标题并保存 */
export async function saveNoteFromEditor(noteId: string, docJson: unknown) {
  const { contentText, title } = deriveTitleAndPlainText(docJson);
  return updateNoteContent(noteId, docJson as Prisma.InputJsonValue, contentText, title);
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
  redirect("/notes/trash");
}
