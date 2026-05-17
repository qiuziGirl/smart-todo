import { createGroupFromForm } from "@/actions/groups";
import { GroupRow } from "@/components/notes/group-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupListItem } from "@/types/note";

export function GroupsPanel({ groups }: { groups: GroupListItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-medium text-muted-foreground">分组</p>
      <form action={createGroupFromForm} className="flex gap-1">
        <Input name="name" placeholder="新分组" className="h-8 text-sm" required maxLength={64} />
        <Button type="submit" size="sm" variant="outline">
          添加
        </Button>
      </form>
      <div className="flex flex-col gap-0.5">
        {groups.map((g) => (
          <GroupRow key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
