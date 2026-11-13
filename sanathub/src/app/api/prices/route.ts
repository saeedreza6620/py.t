import { NextResponse } from "next/server";
import { getPriceBoard } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  const board = await getPriceBoard();
  return NextResponse.json(board, { headers: { "Cache-Control": "no-store" } });
}
