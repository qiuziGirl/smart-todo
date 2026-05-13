import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckSquare, FileText, LogIn, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";

function envStatus() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");
  const dbConfigured =
    !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PROJECT_REF]");
  return { supabaseConfigured, dbConfigured };
}

export default async function Home() {
  const { supabaseConfigured, dbConfigured } = envStatus();
  const user = await getSessionUser();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
            <Sparkles className="size-3.5" />
            {user ? "M1 便签与编辑器已可用" : "M0 工程骨架已就绪"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">环境变量状态</CardTitle>
            <CardDescription>
              复制 <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> 为{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> 并填入 Supabase 与数据库连接。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant={supabaseConfigured ? "default" : "secondary"}>
              Supabase: {supabaseConfigured ? "已配置" : "占位中"}
            </Badge>
            <Badge variant={dbConfigured ? "default" : "secondary"}>
              DATABASE_URL: {dbConfigured ? "已配置" : "占位中"}
            </Badge>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={user ? "/notes" : "/login"}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto flex-col gap-1 py-4"
            )}
          >
            <LogIn className="size-5" />
            <span>{user ? "进入便签" : "登录"}</span>
          </Link>
          <Link
            href="/notes"
            className={cn(buttonVariants({ size: "lg" }), "h-auto flex-col gap-1 py-4")}
          >
            <FileText className="size-5" />
            <span>便签</span>
          </Link>
          <Link
            href="/todos"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto flex-col gap-1 py-4"
            )}
          >
            <CheckSquare className="size-5" />
            <span>待办</span>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {user ? "你已登录，可直接打开便签。" : "登录后即可创建分组与富文本便签。"}
        </p>
      </div>
    </main>
  );
}
