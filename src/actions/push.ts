"use server";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

type PushSubscriptionJSON = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

/** 持久化当前浏览器的 Web Push 订阅（同一 endpoint 幂等 upsert） */
export async function savePushSubscription(subscription: unknown) {
  const user = await requireUser();
  if (!subscription || typeof subscription !== "object") {
    return { error: "无效的订阅数据" };
  }
  const sub = subscription as PushSubscriptionJSON;
  if (!sub.endpoint || typeof sub.endpoint !== "string") {
    return { error: "缺少 endpoint" };
  }
  const p256dh = sub.keys?.p256dh;
  const auth = sub.keys?.auth;
  if (!p256dh || !auth) {
    return { error: "缺少 keys.p256dh / keys.auth" };
  }

  const keys: Prisma.InputJsonValue = { p256dh, auth };

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: user.id,
        endpoint: sub.endpoint,
      },
    },
    create: {
      userId: user.id,
      deviceType: "web",
      endpoint: sub.endpoint,
      keys,
    },
    update: {
      keys,
    },
  });

  return { ok: true as const };
}

/** 移除当前 endpoint 对应的订阅（用户关闭提醒时可选调用） */
export async function removePushSubscription(endpoint: string) {
  const user = await requireUser();
  if (!endpoint) {
    return { error: "缺少 endpoint" };
  }
  await prisma.pushSubscription.deleteMany({
    where: { userId: user.id, endpoint },
  });
  return { ok: true as const };
}
