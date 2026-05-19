"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GroupListItem } from "@/types/note";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function GroupRow({ group }: { group: GroupListItem }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const active = searchParams.get("groupId") === group.id;
  const targetPathname = pathname.startsWith("/notes/trash") ? "/notes" : pathname;
  const params = new URLSearchParams(searchParams.toString());
  params.set("groupId", group.id);
  params.delete("block");
  const href = `${targetPathname}${params.toString() ? `?${params.toString()}` : ""}`;

  function onConfirm() {
    setOpen(false);
    start(async () => {
      await deleteGroup(group.id);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted/80",
        active && "bg-muted",
      )}
    >
      <Link
        href={href}
        scroll={false}
        className="flex min-w-0 flex-1 cursor-pointer rounded-sm px-1 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        title={group.name}
        aria-current={active ? "true" : undefined}
      >
        <span className="truncate">
          {group.name}
        </span>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-7 shrink-0 text-muted-foreground"
        disabled={pending}
        onClick={() => setOpen(true)}
        aria-label="删除分组"
      >
        <Trash2 className="size-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`删除分组「${group.name}」？`}
        description="该分组下的便签将移入「未分组」，不会被删除。"
        confirmText="删除分组"
        variant="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </div>
  );
}
