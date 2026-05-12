import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "smart-note",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
  });
}
