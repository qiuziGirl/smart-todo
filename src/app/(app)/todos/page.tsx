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
import { ArrowLeft, CheckSquare } from "lucide-react";

export const metadata = { title: "待办" };

export default function TodosPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="size-5" />
            待办聚合占位页
          </CardTitle>
          <CardDescription>
            M2 阶段将上线：跨便签聚合所有未完成 checkbox，按今日 / 未来 / 已过期 切换视图。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          点击聚合视图中的任一待办，可跳转到所在便签精确定位。
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
