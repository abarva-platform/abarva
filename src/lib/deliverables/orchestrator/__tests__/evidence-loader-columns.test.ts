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
import ts from "typescript";
import { MOVE_ADMISSION_ARTIFACT_COLUMNS, MOVE_ADMISSION_EVIDENCE_COLUMNS, MOVE_ADMISSION_REVIEW_COLUMNS } from "@/lib/programs/move-agent-admission";
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

const SHARED_COLUMNS: Record<string, readonly string[]> = {
  PROGRAM_MODULE_EVIDENCE_COLUMNS,
  MOVE_ADMISSION_ARTIFACT_COLUMNS,
  MOVE_ADMISSION_EVIDENCE_COLUMNS,
  MOVE_ADMISSION_REVIEW_COLUMNS,
};

function selectedColumns(expression: ts.Expression): string[] {
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)) return selectedColumns(expression.expression);
  if (ts.isStringLiteral(expression)) return expression.text.split(",").map(column => column.trim());
  if (ts.isConditionalExpression(expression)) return [...selectedColumns(expression.whenTrue), ...selectedColumns(expression.whenFalse)];
  if (ts.isIdentifier(expression) && SHARED_COLUMNS[expression.text]) return [...SHARED_COLUMNS[expression.text]];
  if (ts.isArrayLiteralExpression(expression)) return expression.elements.flatMap(element => selectedColumns(ts.isSpreadElement(element) ? element.expression : element as ts.Expression));
  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === "join") return selectedColumns(expression.expression.expression);
  throw new Error(`Unresolved evidence select: ${expression.getText()}`);
}

function loaderSelects(source: string): Array<{ table: string; columns: string[] }> {
  const tree = ts.createSourceFile("evidence-loader.ts", source, ts.ScriptTarget.Latest, true);
  const selects: Array<{ table: string; columns: string[] }> = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "select") {
      const from = node.expression.expression;
      if (!ts.isCallExpression(from) || !ts.isPropertyAccessExpression(from.expression) || from.expression.name.text !== "from" || !ts.isStringLiteral(from.arguments[0])) throw new Error("Evidence select has no declared table");
      selects.push({ table: from.arguments[0].text, columns: selectedColumns(node.arguments[0]) });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return selects;
}

function missingSelectedColumns(source: string): string[] {
  return loaderSelects(source).flatMap(select => {
    const columns = tableColumns(select.table);
    return select.columns.filter(column => !columns.has(column)).map(column => `${select.table}.${column}`);
  });
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

  it("checks every literal, conditional and shared-column select against its table", () => {
    const source = fs.readFileSync(path.join(__dirname, "../evidence-assembler.ts"), "utf8");
    const tables = [...new Set(loaderSelects(source).map(select => select.table))].sort();
    expect(tables).toEqual(["engagements", "program_modules", "evidence_ledger", "program_evidence_reviews", "program_evidence_items", "move_artifacts", "deliverables_v2", "deliverable_versions", "generated_artifacts"].sort());
    expect(missingSelectedColumns(source)).toEqual([]);
  });

  it("detects a nonexistent column in either conditional branch", () => {
    for (const select of ['strict ? "id, not_a_column" : "id"', 'strict ? "id" : "id, not_a_column"']) {
      expect(missingSelectedColumns(`db.from("evidence_ledger").select(${select})`)).toEqual(["evidence_ledger.not_a_column"]);
    }
  });

  it("refuses an unresolved select instead of silently omitting it", () => {
    expect(() => loaderSelects('db.from("evidence_ledger").select(UNKNOWN_COLUMNS.join(", "))')).toThrow(/Unresolved evidence select/);
  });
});
