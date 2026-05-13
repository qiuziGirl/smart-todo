import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createBlankNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default async function NotesIndexPage() {
  const user = await requireUser();
  const first = await prisma.note.findFirst({
    where: { userId: user.id, isDeleted: false },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    select: { id: true },
  });
  if (first) {
    redirect(`/notes/${first.id}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="size-12 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-medium">还没有便签</h2>
        <p className="text-sm text-muted-foreground">创建第一条便签开始记录。</p>
      </div>
      <form action={createBlankNote}>
        <Button type="submit">新建便签</Button>
      </form>
    </div>
  );
}
