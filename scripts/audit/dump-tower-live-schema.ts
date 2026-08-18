#!/usr/bin/env npx tsx
/**
 * Dump the live `tower` schema, so the repository can describe what is actually deployed.
 *
 * Six separate columns and constraints were discovered by failing against them, one deploy cycle at
 * a time: `provenance_id`, `outcome_metric_ref`, `claim_input_hash`, a `subject_kind` CHECK, a
 * `metric_ref` foreign key, and two columns whose names differed from what the migrations imply.
 * None of them appears in any migration in this repository.
 *
 * That is not a projector problem. It means anyone reading `supabase/migrations/` to understand
 * `tower.*` is reading an incomplete description, and every future writer rediscovers the same list
 * the same expensive way.
 *
 * This reads the deployed schema and emits it as SQL. The output is a *description*, not a
 * migration to run against production — the objects already exist there. It is committed so the
 * repository stops disagreeing with reality, and so the next person can read instead of guess.
 *
 * Usage:
 *   npx tsx scripts/audit/dump-tower-live-schema.ts --out-dir <dir>
 *
 * Read-only. Opens a connection, issues catalogue queries, writes a file.
 */

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const outDir = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/tower-schema";
})();

async function main(): Promise<number> {
  const connectionString =
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("ABARVA_AZURE_DATABASE_URL or DATABASE_URL is required");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const tables = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'tower' and table_type = 'BASE TABLE' order by table_name`,
    );
    const columns = await client.query<{
      table_name: string; column_name: string; data_type: string;
      is_nullable: string; column_default: string | null; ordinal_position: number;
    }>(
      `select table_name, column_name, data_type, is_nullable, column_default, ordinal_position
         from information_schema.columns where table_schema = 'tower'
        order by table_name, ordinal_position`,
    );
    const constraints = await client.query<{ table_name: string; conname: string; contype: string; def: string }>(
      `select t.relname as table_name, c.conname, c.contype::text, pg_get_constraintdef(c.oid) as def
         from pg_constraint c
         join pg_class t on t.oid = c.conrelid
         join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'tower' order by t.relname, c.contype, c.conname`,
    );

    const lines: string[] = [
      "-- Live `tower` schema, captured from the deployed database.",
      "--",
      "-- This is a DESCRIPTION of what exists, not a migration to apply. It was written because six",
      "-- columns and constraints in this schema were discovered by failing against them one deploy",
      "-- cycle at a time, and none of them appeared in any migration in this repository.",
      "--",
      "-- Regenerate with: npx tsx scripts/audit/dump-tower-live-schema.ts",
      "",
    ];

    for (const { table_name } of tables.rows) {
      const cols = columns.rows.filter((c) => c.table_name === table_name);
      lines.push(`-- ${"=".repeat(74)}`);
      lines.push(`CREATE TABLE IF NOT EXISTS tower.${table_name} (`);
      const parts = cols.map((c) => {
        const nullable = c.is_nullable === "NO" ? " NOT NULL" : "";
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : "";
        return `  ${c.column_name} ${c.data_type}${nullable}${def}`;
      });
      lines.push(parts.join(",\n"));
      lines.push(");");
      for (const con of constraints.rows.filter((x) => x.table_name === table_name)) {
        const kind = con.contype === "p" ? "primary key" : con.contype === "f" ? "foreign key"
          : con.contype === "c" ? "check" : con.contype === "u" ? "unique" : con.contype;
        lines.push(`-- ${kind}`);
        lines.push(`ALTER TABLE tower.${table_name} ADD CONSTRAINT ${con.conname} ${con.def};`);
      }
      lines.push("");
    }

    fs.mkdirSync(path.resolve(outDir), { recursive: true });
    const file = path.join(path.resolve(outDir), "tower-live-schema.sql");
    fs.writeFileSync(file, lines.join("\n"));

    const summary = {
      generatedAt: new Date().toISOString(),
      tables: tables.rows.length,
      columns: columns.rows.length,
      constraints: constraints.rows.length,
      byType: constraints.rows.reduce<Record<string, number>>((acc, c) => {
        acc[c.contype] = (acc[c.contype] ?? 0) + 1;
        return acc;
      }, {}),
      file,
    };
    fs.writeFileSync(path.join(path.resolve(outDir), "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(JSON.stringify(summary, null, 2));
    console.log("\n----- BEGIN SCHEMA -----");
    console.log(lines.join("\n"));
    console.log("----- END SCHEMA -----");
    return 0;
  } finally {
    await client.end();
  }
}

main().then((c) => process.exit(c)).catch((e) => {
  console.error("dump-tower-live-schema failed:", e);
  process.exit(1);
});
