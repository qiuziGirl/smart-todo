import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "登录" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录占位页</CardTitle>
          <CardDescription>
            M0 阶段未接入 Supabase Auth。M1 起将启用 GitHub OAuth + 邮箱/密码双轨登录。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          请先在 Supabase 控制台创建项目，启用 GitHub Provider 与 Email Provider，
          并把密钥填入 <code className="px-1 py-0.5 rounded bg-muted">.env.local</code>。
        </CardContent>
        <CardFooter>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" />
            返回首页
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
