import Link from "next/link";
import { createBlankNote } from "@/actions/notes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { NoteList } from "@/components/notes/note-list";
import { GroupsPanel } from "@/components/notes/groups-panel";
import { Trash2 } from "lucide-react";

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [groups, notes] = await Promise.all([
    prisma.group.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.note.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, updatedAt: true, isPinned: true, contentText: true },
    }),
  ]);

  const listItems = notes.map((n) => ({
    id: n.id,
    title: n.title,
    updatedAt: n.updatedAt.toISOString(),
    isPinned: n.isPinned,
    preview: n.contentText.replace(/\s+/g, " ").trim().slice(0, 100),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="border-b p-2 md:hidden">
        <form action={createBlankNote}>
          <Button type="submit" size="sm" variant="secondary" className="w-full">
            新建便签
          </Button>
        </form>
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-2 border-b p-3 md:w-52 md:border-b-0 md:border-r">
        <Link
          href="/notes/trash"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 justify-center")}
        >
          <Trash2 className="size-4" />
          回收站
        </Link>
        <GroupsPanel groups={groups} />
      </aside>
      <aside className="flex max-h-44 w-full shrink-0 flex-col border-b md:max-h-none md:w-64 md:border-b-0 md:border-r">
        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">便签列表</div>
        <ScrollArea className="h-44 md:flex-1 md:min-h-0">
          <NoteList notes={listItems} />
        </ScrollArea>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
