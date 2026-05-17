"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
import { CheckSquare, ExternalLink } from "lucide-react";
import { toggleTodoItemFromAggregate } from "@/actions/todos";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TodoListRow = {
  id: string;
  text: string;
  blockId: string;
  dueAt: string | null;
  noteId: string;
  noteTitle: string | null;
};

type Bucket = "today" | "future" | "overdue" | "undated";

function classifyDue(dueAt: string | null, now: Date): Bucket {
  if (!dueAt) {
    return "undated";
  }
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) {
    return "undated";
  }
  const d0 = startOfDay(d);
  const n0 = startOfDay(now);
  if (isBefore(d0, n0)) {
    return "overdue";
  }
  if (isSameDay(d0, n0)) {
    return "today";
  }
  if (isAfter(d0, n0)) {
    return "future";
  }
  return "undated";
}

const TABS: { id: Bucket; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "future", label: "未来" },
  { id: "overdue", label: "已过期" },
  { id: "undated", label: "无到期日" },
];

export function TodosView({ items }: { items: TodoListRow[] }) {
  const [tab, setTab] = useState<Bucket>("today");
  const [pending, start] = useTransition();
  const now = useMemo(() => new Date(), []);

  const byBucket = useMemo(() => {
    const m: Record<Bucket, TodoListRow[]> = {
      today: [],
      future: [],
      overdue: [],
      undated: [],
    };
    for (const row of items) {
      m[classifyDue(row.dueAt, now)].push(row);
    }
    return m;
  }, [items, now]);

  const list = byBucket[tab];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-start gap-3">
        <CheckSquare className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">待办</h1>
          <p className="text-sm text-muted-foreground">
            展示所有便签中<strong>未完成</strong>的待办项；勾选后将同步回便签正文。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {TABS.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={tab === t.id ? "secondary" : "ghost"}
            className={cn("flex-1 sm:flex-none")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="ml-1 text-sm text-muted-foreground">({byBucket[t.id].length})</span>
          </Button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          当前分类下没有待办。
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((row) => (
            <li
              key={row.id}
              className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm shadow-sm"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
                disabled={pending}
                onChange={() => {
                  start(async () => {
                    await toggleTodoItemFromAggregate(row.id, true);
                  });
                }}
                aria-label="标记为已完成"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{row.text}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {row.noteTitle?.trim() || "无标题便签"}
                  {row.dueAt && (
                    <span className="ml-2">
                      到期 {new Date(row.dueAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              <Link
                href={`/notes/${row.noteId}?block=${encodeURIComponent(row.blockId)}`}
                title="在便签中打开"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "inline-flex shrink-0"
                )}
              >
                <ExternalLink className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
