"use client";

import * as React from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";
  const Icon = isDestructive ? AlertTriangle : HelpCircle;

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-0 sm:max-w-md"
      >
        <DialogHeader className="flex-row items-start gap-3 p-5 pb-4">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
              isDestructive
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <DialogTitle className="text-base font-semibold leading-snug">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>
        <DialogFooter className="m-0 gap-2 rounded-b-xl border-t bg-muted/40 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            size="lg"
            disabled={pending}
            onClick={() => void handleConfirm()}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
