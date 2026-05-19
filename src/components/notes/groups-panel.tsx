"use client";

import { createGroupFromForm } from "@/actions/groups";
import { GroupRow } from "@/components/notes/group-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GroupListItem } from "@/types/note";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function GroupsPanel({ groups }: { groups: GroupListItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = !searchParams.get("groupId");
  const targetPathname = pathname.startsWith("/notes/trash") ? "/notes" : pathname;
  const params = new URLSearchParams(searchParams.toString());
  params.delete("groupId");
  params.delete("block");
  const href = `${targetPathname}${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-sm font-medium text-muted-foreground">分组</p>
      <form action={createGroupFromForm} className="flex gap-1">
        <Input name="name" placeholder="新分组" className="h-8 text-sm" required maxLength={64} />
        <Button type="submit" size="sm" variant="outline">
          添加
        </Button>
      </form>
      <div className="flex flex-col gap-0.5">
        <Link
          href={href}
          scroll={false}
          className={cn(
            "rounded-md px-2 py-1.5 text-sm font-medium outline-none hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            active && "bg-muted",
          )}
          aria-current={active ? "true" : undefined}
        >
          全部便签
        </Link>
        {groups.map((g) => (
          <GroupRow key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}
