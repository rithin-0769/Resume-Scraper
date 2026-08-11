import { ensureDatabase, getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database health check failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
