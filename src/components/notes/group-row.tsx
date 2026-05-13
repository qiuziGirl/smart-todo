"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import type { GroupListItem } from "@/types/note";
import { Trash2 } from "lucide-react";

export function GroupRow({ group }: { group: GroupListItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!confirm(`删除分组「${group.name}」？便签将移入「未分组」。`)) return;
    start(async () => {
      await deleteGroup(group.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted/80">
      <span className="flex-1 truncate px-1 text-sm" title={group.name}>
        {group.name}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-7 shrink-0 text-muted-foreground"
        disabled={pending}
        onClick={onDelete}
        aria-label="删除分组"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
