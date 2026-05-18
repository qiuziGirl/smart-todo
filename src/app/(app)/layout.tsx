import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { ensureProfileFromUser } from "@/lib/auth/profile";
import { signOut } from "@/actions/auth";
import { SignOutSubmit } from "@/components/auth/sign-out-submit";
import { createBlankNote } from "@/actions/notes";
import { AppSyncBridge } from "@/components/app/app-sync-bridge";
import { WebPushSubscribeButton } from "@/components/push/web-push-subscribe-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  await ensureProfileFromUser(user);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppSyncBridge userId={user.id} />
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:gap-3 sm:px-4">
        <Link href="/notes" className="shrink-0 text-xl font-semibold tracking-tight">
          Smart Note
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 text-base">
          <Link href="/notes" className={buttonVariants({ variant: "ghost", size: "default" })}>
            便签
          </Link>
          <Link href="/todos" className={buttonVariants({ variant: "ghost", size: "default" })}>
            待办
          </Link>
        </nav>
        <form action={createBlankNote} className="hidden shrink-0 sm:block">
          <Button type="submit" size="default" variant="secondary">
            新建便签
          </Button>
        </form>
        <div className="min-w-2 flex-1" />
        <WebPushSubscribeButton />
        <span className="hidden max-w-[200px] truncate text-base text-muted-foreground md:inline">
          {user.email}
        </span>
        <form action={signOut} className="shrink-0">
          <SignOutSubmit />
        </form>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
