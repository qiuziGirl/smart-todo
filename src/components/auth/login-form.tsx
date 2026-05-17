"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

type LoginFormProps = {
  appUrl: string;
  initialError?: string | null;
};

export function LoginForm({ appUrl, initialError }: LoginFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const supabase = createClient();

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.push("/notes");
        router.refresh();
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/notes`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("若项目开启了邮箱验证，请查收邮件后再登录。");
    } finally {
      setLoading(false);
    }
  }

  async function onGitHub() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/notes`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 Smart Note</CardTitle>
        <CardDescription>GitHub 或邮箱密码；首次使用请先注册。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled={loading}
          onClick={onGitHub}
        >
          <GitBranch className="size-4" />
          使用 GitHub 登录
        </Button>
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
            或
          </span>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={mode === "signin" ? "font-medium underline" : "text-muted-foreground"}
            onClick={() => setMode("signin")}
          >
            登录
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            type="button"
            className={mode === "signup" ? "font-medium underline" : "text-muted-foreground"}
            onClick={() => setMode("signup")}
          >
            注册
          </button>
        </div>
        <form onSubmit={onEmailSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "处理中…" : mode === "signin" ? "邮箱登录" : "注册并发送验证邮件"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          返回首页
        </Link>
      </CardFooter>
    </Card>
  );
}
