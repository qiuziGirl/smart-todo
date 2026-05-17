"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NoteListItem } from "@/types/note";
import { Pin } from "lucide-react";

type NoteListProps = {
  notes: NoteListItem[];
};

export function NoteList({ notes }: NoteListProps) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/notes/") ? pathname.split("/")[2] : null;

  if (notes.length === 0) {
    return (
      <p className="p-3 text-sm text-muted-foreground">暂无便签，点击右侧新建。</p>
    );
  }

  return (
    <ul className="divide-y">
      {notes.map((n) => {
        const active = activeId === n.id;
        return (
          <li key={n.id}>
            <Link
              href={`/notes/${n.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-auto w-full justify-start rounded-none px-3 py-2.5 text-left font-normal",
                active && "bg-muted"
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1 truncate text-sm font-medium">
                  {n.isPinned ? <Pin className="size-3 shrink-0" /> : null}
                  {n.title?.trim() || "无标题"}
                </span>
                {n.preview ? (
                  <span className="truncate text-sm text-muted-foreground">{n.preview}</span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
