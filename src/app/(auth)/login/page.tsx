import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "登录" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect("/notes");
  }

  const sp = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <LoginForm initialError={sp.error} />
    </main>
  );
}
