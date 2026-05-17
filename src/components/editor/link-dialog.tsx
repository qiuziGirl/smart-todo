"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onSubmit: (url: string) => void;
  onRemove?: () => void;
};

export function LinkDialog({
  open,
  onOpenChange,
  initialUrl,
  onSubmit,
  onRemove,
}: LinkDialogProps) {
  const hasInitial = !!initialUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasInitial ? "编辑链接" : "插入链接"}</DialogTitle>
          <DialogDescription>
            为所选文本添加超链接；留空并点击「移除链接」可清除现有链接。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <LinkDialogForm
            key={initialUrl ?? ""}
            initialUrl={initialUrl}
            hasInitial={hasInitial}
            onSubmit={(href) => {
              onSubmit(href);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            onRemove={
              onRemove
                ? () => {
                    onRemove();
                    onOpenChange(false);
                  }
                : undefined
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type LinkDialogFormProps = {
  initialUrl?: string;
  hasInitial: boolean;
  onSubmit: (url: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
};

function LinkDialogForm({
  initialUrl,
  hasInitial,
  onSubmit,
  onCancel,
  onRemove,
}: LinkDialogFormProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const focusRef = React.useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (el) {
      window.setTimeout(() => {
        el.focus();
        el.select();
      }, 0);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = (inputRef.current?.value ?? "").trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="link-url">链接地址</Label>
      <Input
        id="link-url"
        ref={focusRef}
        type="url"
        inputMode="url"
        autoComplete="off"
        defaultValue={initialUrl ?? "https://"}
        placeholder="https://example.com"
      />
      <DialogFooter>
        {hasInitial && onRemove ? (
          <Button type="button" variant="destructive" onClick={onRemove}>
            移除链接
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">确认</Button>
      </DialogFooter>
    </form>
  );
}
