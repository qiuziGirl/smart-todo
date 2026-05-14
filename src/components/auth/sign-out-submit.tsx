"use client";

import { Loader2Icon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SignOutSubmit() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      className={pending ? "gap-1.5" : undefined}
    >
      {pending ? (
        <>
          <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden />
          退出中…
        </>
      ) : (
        "退出"
      )}
    </Button>
  );
}
