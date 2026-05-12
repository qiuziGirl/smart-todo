import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckSquare, FileText, LogIn, Sparkles } from "lucide-react";

function envStatus() {
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");
  const dbConfigured =
    !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PROJECT_REF]");
  return { supabaseConfigured, dbConfigured };
}

export default function Home() {
  const { supabaseConfigured, dbConfigured } = envStatus();

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
            <Sparkles className="size-3.5" />
            M0 工程骨架已就绪
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">环境变量状态</CardTitle>
            <CardDescription>
              当前为占位值时，登录与同步功能不可用。复制{" "}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">.env.example</code> 为{" "}
              <code className="text-xs px-1 py-0.5 rounded bg-muted">.env.local</code> 并填入真实 Supabase 配置。
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
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto py-4 flex-col gap-1"
            )}
          >
            <LogIn className="size-5" />
            <span>登录</span>
          </Link>
          <Link
            href="/notes"
            className={cn(buttonVariants({ size: "lg" }), "h-auto py-4 flex-col gap-1")}
          >
            <FileText className="size-5" />
            <span>便签</span>
          </Link>
          <Link
            href="/todos"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto py-4 flex-col gap-1"
            )}
          >
            <CheckSquare className="size-5" />
            <span>待办</span>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          下一站：M1 便签 CRUD 与 Tiptap 富文本编辑器。
        </p>
      </div>
    </main>
  );
}
