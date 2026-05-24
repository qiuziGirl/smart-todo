"use client";

import { FormEvent, useRef } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NoteSearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentQuery = searchParams.get("q") ?? "";

  function applyQuery(raw: string) {
    const next = raw.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    params.delete("block");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    applyQuery(String(formData.get("q") ?? ""));
  }

  function onClear() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    applyQuery("");
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-1.5 border-b px-2 py-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          name="q"
          aria-label="搜索便签"
          placeholder="搜索标题或正文"
          defaultValue={currentQuery}
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="outline">
        搜索
      </Button>
      {currentQuery.trim() ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="清空搜索"
          onClick={onClear}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </form>
  );
}
