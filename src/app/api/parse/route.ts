import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/parser";

export async function POST(req: NextRequest) {
  try {
    const { rawText, fileName } = await req.json();
    if (!rawText || rawText.trim().length < 10) return NextResponse.json({ error: "rawText required" }, { status: 400 });
    const parsed = parseResume(rawText, fileName);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}
