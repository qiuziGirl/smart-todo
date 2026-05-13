import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { TrashNoteRow } from "@/components/notes/trash-note-row";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "回收站" };

export default async function TrashPage() {
  const user = await requireUser();
  const notes = await prisma.note.findMany({
    where: { userId: user.id, isDeleted: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, contentText: true },
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Link href="/notes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" />
          返回便签
        </Link>
        <h1 className="text-lg font-medium">回收站</h1>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">回收站为空。</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {notes.map((n) => (
            <TrashNoteRow key={n.id} note={n} />
          ))}
        </ul>
      )}
    </div>
  );
}
