import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Pool } from "pg";

/**
 * Zwei Treiber, eine Schnittstelle:
 *
 *  - Neon (Vercel Postgres) wird über HTTP angesprochen. Das ist in einer
 *    serverlosen Umgebung deutlich schneller, weil keine TCP Verbindung
 *    aufgebaut werden muss.
 *  - Jede andere Adresse, typischerweise ein lokales Postgres für die
 *    Entwicklung, läuft über den klassischen Treiber pg.
 */

let neonClient: NeonQueryFunction<false, false> | null = null;
let pool: Pool | null = null;

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ist nicht gesetzt. Bitte .env.local anlegen (siehe .env.example).",
    );
  }
  return url;
}

function usesNeon(url: string): boolean {
  if (process.env.DB_DRIVER === "neon") return true;
  if (process.env.DB_DRIVER === "pg") return false;
  return /neon\.tech|neon\.build|vercel-storage\.com/.test(url);
}

function buildText(strings: TemplateStringsArray, count: number): string {
  let text = "";
  for (let index = 0; index < strings.length; index += 1) {
    text += strings[index];
    if (index < count) text += `$${index + 1}`;
  }
  return text;
}

async function poolClient(): Promise<Pool> {
  if (!pool) {
    const { Pool: PgPool } = await import("pg");
    const url = connectionString();
    pool = new PgPool({
      connectionString: url,
      ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
      max: 5,
    });
  }
  return pool;
}

/**
 * Tagged Template für Postgres Abfragen. Werte werden immer als Parameter
 * übergeben, damit keine SQL Injection möglich ist.
 *
 *   const rows = await sql<UserRow>`select * from users where id = ${id}`;
 */
export async function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const url = connectionString();

  if (usesNeon(url)) {
    if (!neonClient) neonClient = neon(url);
    return neonClient(strings, ...values) as unknown as Promise<T[]>;
  }

  const client = await poolClient();
  const result = await client.query(buildText(strings, values.length), values as unknown[]);
  return result.rows as T[];
}
