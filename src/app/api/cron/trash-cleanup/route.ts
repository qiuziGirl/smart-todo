import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_DAYS = 30;

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

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const where = {
    isDeleted: true,
    deletedAt: {
      lt: cutoff,
    },
  };
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  if (dryRun) {
    const eligible = await prisma.note.count({ where });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      retentionDays: RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
      eligible,
      deleted: 0,
    });
  }

  const deleted = await prisma.note.deleteMany({ where });

  return NextResponse.json({
    ok: true,
    dryRun: false,
    retentionDays: RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
    eligible: deleted.count,
    deleted: deleted.count,
  });
}
