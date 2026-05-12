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
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = { title: "便签" };

export default function NotesPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            便签列表占位页
          </CardTitle>
          <CardDescription>M1 阶段将上线：分组侧栏 / 便签列表 / Tiptap 编辑器三栏布局。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>计划中的能力：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>富文本编辑（标题、列表、待办、图片、链接）</li>
            <li>分组管理 / 置顶 / 颜色标记</li>
            <li>全文搜索 / 回收站</li>
            <li>多端同步（Supabase Realtime）</li>
          </ul>
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
