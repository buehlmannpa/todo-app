// Legt das Schema an. Läuft gegen Vercel Postgres wie auch gegen ein lokales Postgres.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL fehlt. Bitte .env.local anlegen (siehe .env.example).");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
});

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((statement) =>
    statement
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter((statement) => statement.length > 0);

await client.connect();
for (const statement of statements) {
  await client.query(statement);
  console.log("ok:", statement.split("\n")[0].slice(0, 70));
}
await client.end();

console.log("\nSchema ist eingerichtet.");
