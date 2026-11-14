import { NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/market/config";

export function GET() {
  return NextResponse.json({ symbols: SYMBOLS });
}
