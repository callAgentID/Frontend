import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { release: process.env.CALLBLICK_RELEASE || "local" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
