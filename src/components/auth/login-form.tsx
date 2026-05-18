"use client";

import { useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import { GitBranch } from "lucide-react";

type LoginFormProps = {
  initialError?: string | null;
};

type Mode = "signin" | "signup";

export function LoginForm({ initialError }: LoginFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [info, setInfo] = useState<string | null>(null);
  const supabase = createClient();

  const signinTabRef = useRef<HTMLButtonElement>(null);
  const signupTabRef = useRef<HTMLButtonElement>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    const target = next === "signin" ? signinTabRef.current : signupTabRef.current;
    target?.focus();
  }

  function onTablistKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      switchMode(mode === "signin" ? "signup" : "signin");
    } else if (e.key === "Home") {
      e.preventDefault();
      switchMode("signin");
    } else if (e.key === "End") {
      e.preventDefault();
      switchMode("signup");
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message);
          return;
        }
        router.push("/notes");
        router.refresh();
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/notes`,
        },
      });
      if (err) {
        setError(err.message);
        return;
      }
      setInfo("若项目开启了邮箱验证，请查收邮件后再登录。");
    } finally {
      setLoading(false);
    }
  }

  async function onGitHub() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/notes`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const signinSelected = mode === "signin";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录 Smart Note</CardTitle>
        <CardDescription>GitHub 或邮箱密码；首次使用请先注册。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-wrap"
          >
            {error}
          </p>
        ) : null}
        {info ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap"
          >
            {info}
          </p>
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
        <div
          role="tablist"
          aria-label="登录方式"
          className="flex gap-2 text-sm"
          onKeyDown={onTablistKeyDown}
        >
          <button
            ref={signinTabRef}
            type="button"
            role="tab"
            id="tab-signin"
            aria-selected={signinSelected}
            aria-controls="login-panel"
            tabIndex={signinSelected ? 0 : -1}
            className={cn(
              "rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              signinSelected ? "font-medium underline" : "text-muted-foreground"
            )}
            onClick={() => switchMode("signin")}
          >
            登录
          </button>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <button
            ref={signupTabRef}
            type="button"
            role="tab"
            id="tab-signup"
            aria-selected={!signinSelected}
            aria-controls="login-panel"
            tabIndex={!signinSelected ? 0 : -1}
            className={cn(
              "rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !signinSelected ? "font-medium underline" : "text-muted-foreground"
            )}
            onClick={() => switchMode("signup")}
          >
            注册
          </button>
        </div>
        <form
          id="login-panel"
          role="tabpanel"
          aria-labelledby={signinSelected ? "tab-signin" : "tab-signup"}
          aria-busy={loading}
          onSubmit={onEmailSubmit}
          className="space-y-3"
        >
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
              autoComplete={signinSelected ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "处理中…" : signinSelected ? "邮箱登录" : "注册并发送验证邮件"}
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
