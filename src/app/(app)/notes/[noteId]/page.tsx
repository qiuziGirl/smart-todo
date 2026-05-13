import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { NoteEditorLoader } from "@/components/editor/note-editor-loader";

export default async function NoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ block?: string }>;
}) {
  const { noteId } = await params;
  const { block } = await searchParams;
  const user = await requireUser();
  const [note, groups] = await Promise.all([
    prisma.note.findFirst({
      where: { id: noteId, userId: user.id, isDeleted: false },
      select: {
        id: true,
        contentJson: true,
        isPinned: true,
        color: true,
        groupId: true,
        syncVersion: true,
      },
    }),
    prisma.group.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!note) {
    notFound();
  }

  const initial =
    note.contentJson && typeof note.contentJson === "object"
      ? (note.contentJson as object)
      : { type: "doc", content: [{ type: "paragraph" }] };

  return (
    <NoteEditorLoader
      noteId={note.id}
      initialContent={initial}
      initialPinned={note.isPinned}
      initialColor={note.color}
      initialGroupId={note.groupId}
      serverSyncVersion={note.syncVersion}
      groups={groups}
      anchorBlockId={block ?? null}
    />
  );
}
