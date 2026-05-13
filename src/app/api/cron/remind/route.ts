import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getAppOrigin(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) {
    return base;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3005";
}

function assertCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:noreply@example.com",
    publicKey,
    privateKey
  );

  const now = Date.now();
  const from = new Date(now - 30_000);
  const to = new Date(now + 70_000);

  const items = await prisma.todoItem.findMany({
    where: {
      isDone: false,
      remindAt: {
        gte: from,
        lte: to,
      },
      note: { isDeleted: false },
    },
    include: {
      note: { select: { id: true, title: true } },
    },
    take: 200,
  });

  const origin = getAppOrigin();
  let sent = 0;
  let failures = 0;

  for (const item of items) {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: item.userId, deviceType: "web" },
    });

    const title = "待办提醒";
    const body = item.text.length > 120 ? `${item.text.slice(0, 120)}…` : item.text;
    const u = new URL(`${origin}/notes/${item.noteId}`);
    u.searchParams.set("block", item.blockId);
    const payload = JSON.stringify({
      title,
      body,
      url: u.toString(),
    });

    for (const s of subs) {
      const keys = s.keys as { p256dh?: string; auth?: string };
      if (!keys?.p256dh || !keys?.auth) {
        continue;
      }
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
          },
          payload,
          { TTL: 120 }
        );
        sent += 1;
      } catch (err: unknown) {
        failures += 1;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.deleteMany({ where: { id: s.id } });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: items.length,
    sent,
    failures,
  });
}
