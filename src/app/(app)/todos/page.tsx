import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { TodosView, type TodoListRow } from "@/components/todos/todos-view";

export const metadata = { title: "待办" };

export default async function TodosPage() {
  const user = await requireUser();
  const items = await prisma.todoItem.findMany({
    where: {
      userId: user.id,
      isDone: false,
      note: { isDeleted: false },
    },
    include: {
      note: { select: { id: true, title: true } },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
  });

  const serialized: TodoListRow[] = items.map((i) => ({
    id: i.id,
    text: i.text,
    blockId: i.blockId,
    dueAt: i.dueAt?.toISOString() ?? null,
    noteId: i.noteId,
    noteTitle: i.note.title,
  }));

  return <TodosView items={serialized} />;
}
