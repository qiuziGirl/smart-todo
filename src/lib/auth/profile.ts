import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

/** 与 auth.users 对齐的业务档案；可在 Route Handler / Server Action / Layout 中调用 */
export async function ensureProfileFromUser(user: User) {
  const meta = user.user_metadata as Record<string, string | undefined> | undefined;
  const username =
    meta?.full_name ??
    meta?.name ??
    meta?.user_name ??
    meta?.preferred_username ??
    null;
  const avatarUrl = meta?.avatar_url ?? meta?.picture ?? null;

  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? null,
      username,
      avatarUrl,
    },
    update: {
      email: user.email ?? undefined,
      username: username ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    },
  });
}
