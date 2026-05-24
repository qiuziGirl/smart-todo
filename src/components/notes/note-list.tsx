"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NoteListItem } from "@/types/note";
import { Pin } from "lucide-react";

type NoteListProps = {
  notes: NoteListItem[];
};

export function NoteList({ notes }: NoteListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = pathname.startsWith("/notes/") ? pathname.split("/")[2] : null;
  const activeGroupId = searchParams.get("groupId");
  const keyword = (searchParams.get("q") ?? "").trim().toLowerCase();
  const groupedNotes = activeGroupId
    ? notes.filter((note) => note.groupId === activeGroupId)
    : notes;
  const filteredNotes = keyword
    ? groupedNotes.filter((note) =>
        `${note.title ?? ""} ${note.searchText}`.toLowerCase().includes(keyword)
      )
    : groupedNotes;

  function noteHref(noteId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("block");
    const query = params.toString();
    return `/notes/${noteId}${query ? `?${query}` : ""}`;
  }

  if (filteredNotes.length === 0) {
    const hasGroup = Boolean(activeGroupId);
    const hasKeyword = Boolean(keyword);
    let text = "暂无便签，点击右侧新建。";
    if (hasGroup && hasKeyword) {
      text = "该分组下没有匹配的便签。";
    } else if (hasGroup) {
      text = "该分组暂无便签。";
    } else if (hasKeyword) {
      text = "没有匹配的便签。";
    }
    return (
      <p className="p-3 text-sm text-muted-foreground">
        {text}
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {filteredNotes.map((n) => {
        const active = activeId === n.id;
        return (
          <li key={n.id}>
            <Link
              href={noteHref(n.id)}
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
