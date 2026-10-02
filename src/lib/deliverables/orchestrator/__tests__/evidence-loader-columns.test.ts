// The evidence loader's queries against the tables as the migrations define
// them.
//
// Every other test of the loader stubs the database, so a query naming a
// column that does not exist passes all of them and fails only in production
// — silently, because the loader treats a failed read as "nothing to load".
// That is how saved phase inputs were missing from every deliverable's
// evidence. These read the migrations and check the column names.

import fs from "node:fs";
import path from "node:path";
import { PROGRAM_MODULE_EVIDENCE_COLUMNS } from "../program-module-evidence-columns";

const ROOT = path.resolve(__dirname, "../../../../..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const migrations = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8"))
  .join("\n");

const NOT_COLUMNS = new Set([
  "primary",
  "unique",
  "constraint",
  "foreign",
  "check",
  "exclude",
  "like",
]);

/** Columns a table has: its CREATE TABLE body plus every ADD COLUMN. */
function tableColumns(table: string): Set<string> {
  const columns = new Set<string>();
  const create = new RegExp(
    `CREATE TABLE (?:IF NOT EXISTS )?(?:public\\.)?${table}\\s*\\(([\\s\\S]*?)\\n\\);`,
    "gi",
  );
  for (const match of migrations.matchAll(create)) {
    for (const line of match[1].split("\n")) {
      const name = line.match(/^\s*"?([a-z_0-9]+)"?\s+[A-Za-z]/)?.[1];
      if (name && !NOT_COLUMNS.has(name.toLowerCase())) columns.add(name);
    }
  }
  const alter = new RegExp(
    `ALTER TABLE (?:IF EXISTS )?(?:ONLY )?(?:public\\.)?${table}\\b([\\s\\S]*?);`,
    "gi",
  );
  for (const match of migrations.matchAll(alter)) {
    for (const added of match[1].matchAll(
      /ADD COLUMN (?:IF NOT EXISTS )?"?([a-z_0-9]+)"?/gi,
    )) {
      columns.add(added[1]);
    }
  }
  return columns;
}

describe("evidence loader queries name columns that exist", () => {
  it("finds the table definitions it checks against", () => {
    // Not vacuous: an empty column set would make every check below fail,
    // and a parser that found nothing would be caught here first.
    const columns = tableColumns("program_modules");
    expect(columns.has("state_jsonb")).toBe(true);
    expect(columns.has("module_key")).toBe(true);
    expect(columns.size).toBeGreaterThanOrEqual(10);
  });

  it("reads saved phase inputs with columns program_modules has", () => {
    const columns = tableColumns("program_modules");
    const missing = PROGRAM_MODULE_EVIDENCE_COLUMNS.filter(
      (column) => !columns.has(column),
    );
    expect(missing).toEqual([]);
    // The column the loader used to select, and the table never had.
    expect(columns.has("updated_at")).toBe(false);
  });

  it("names existing columns in every literal select in the loader", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "../evidence-assembler.ts"),
      "utf8",
    );
    const selects = [
      ...source.matchAll(/\.from\("([a-z_0-9]+)"\)\s*\.select\(\s*"([^"]+)"/g),
    ];
    // Not vacuous: the loader has several literal selects.
    expect(selects.length).toBeGreaterThanOrEqual(5);
    const problems: string[] = [];
    for (const [, table, list] of selects) {
      const columns = tableColumns(table);
      for (const column of list.split(",").map((c) => c.trim())) {
        if (!columns.has(column)) problems.push(`${table}.${column}`);
      }
    }
    expect(problems).toEqual([]);
  });
});
