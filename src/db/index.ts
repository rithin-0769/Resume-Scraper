import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type GlobalDbState = typeof globalThis & {
  __resumeScraperPool?: Pool;
  __resumeScraperSchemaReady?: Promise<void>;
};

const globalForDb = globalThis as GlobalDbState;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return databaseUrl;
}

function shouldUseSsl(databaseUrl: string) {
  try {
    const { hostname } = new URL(databaseUrl);
    return !["localhost", "127.0.0.1"].includes(hostname);
  } catch {
    return true;
  }
}

export function getPool() {
  if (globalForDb.__resumeScraperPool) {
    return globalForDb.__resumeScraperPool;
  }

  const databaseUrl = getDatabaseUrl();
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  globalForDb.__resumeScraperPool = pool;
  return pool;
}

export function getDb() {
  return drizzle(getPool());
}

export async function ensureDatabase() {
  if (!globalForDb.__resumeScraperSchemaReady) {
    globalForDb.__resumeScraperSchemaReady = (async () => {
      const db = getDb();

      await db.execute(sql`
        create table if not exists candidates (
          id serial primary key,
          name text not null,
          email text,
          phone text,
          address text,
          linkedin text,
          github text,
          summary text,
          raw_text text not null,
          file_name text,
          education jsonb not null default '[]'::jsonb,
          skills jsonb not null default '[]'::jsonb,
          soft_skills jsonb not null default '[]'::jsonb,
          experience jsonb not null default '[]'::jsonb,
          certifications jsonb not null default '[]'::jsonb,
          projects jsonb not null default '[]'::jsonb,
          languages jsonb not null default '[]'::jsonb,
          total_experience real default 0,
          confidence integer default 0,
          quality_score integer default 0,
          created_at timestamp not null default now()
        )
      `);

      await db.execute(sql`
        create index if not exists candidates_created_at_idx
        on candidates (created_at desc)
      `);

      await db.execute(sql`
        create index if not exists candidates_email_idx
        on candidates (email)
      `);
    })().catch((error) => {
      globalForDb.__resumeScraperSchemaReady = undefined;
      throw error;
    });
  }

  await globalForDb.__resumeScraperSchemaReady;
}
