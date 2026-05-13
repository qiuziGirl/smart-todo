"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export async function createGroup(name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "分组名称不能为空" };
  }
  await prisma.group.create({
    data: {
      userId: user.id,
      name: trimmed,
    },
  });
  revalidatePath("/notes", "layout");
  return { ok: true };
}

export async function renameGroup(groupId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "分组名称不能为空" };
  }
  const updated = await prisma.group.updateMany({
    where: { id: groupId, userId: user.id },
    data: { name: trimmed },
  });
  if (updated.count === 0) {
    return { error: "分组不存在" };
  }
  revalidatePath("/notes", "layout");
  return { ok: true };
}

export async function deleteGroup(groupId: string) {
  const user = await requireUser();
  await prisma.$transaction([
    prisma.note.updateMany({
      where: { userId: user.id, groupId },
      data: { groupId: null },
    }),
    prisma.group.deleteMany({
      where: { id: groupId, userId: user.id },
    }),
  ]);
  revalidatePath("/notes", "layout");
  return { ok: true };
}

export async function createGroupFromForm(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  await createGroup(name);
}
