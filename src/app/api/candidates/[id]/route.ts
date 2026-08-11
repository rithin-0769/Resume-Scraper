import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getDb } from "@/db";
import { candidates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const db = getDb();
  const { id } = await params;
  const rows = await db.select().from(candidates).where(eq(candidates.id, parseInt(id)));
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const db = getDb();
  const { id } = await params;
  await db.delete(candidates).where(eq(candidates.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
