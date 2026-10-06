/**
 * Item C-402 — `source.opportunity_evidence.evidence_status` is declared with five
 * legal values and written by four INSERT statements that all bind the same SQL
 * literal, so four of the five are produced by nothing and every predicate written
 * against the column asks a question whose answer is fixed before it is asked.
 *
 * What this suite is, and what it deliberately is not.
 *
 * It is the acceptance's clause (1) — "prove the predicate is vacuous before
 * changing it" — made executable and repeatable. Three things are proven here that
 * were previously only read off the source:
 *
 *   1. the cube predicate DISCRIMINATES when the data varies. Six sites across three
 *      migrations derive `evidence_state` from this column; each one is extracted
 *      from the migration's own bytes and executed, so a future edit that drops the
 *      `evidence_status` conjunct fails this suite rather than silently widening
 *      `evidence_state` to "this opportunity has at least one evidence row".
 *   2. the lineage metric CAN disagree with the row count it sits beside. The SQL is
 *      extracted from the report that defines it and executed over mixed rows.
 *   3. the writer population is exactly four, every one of them a literal, and the
 *      set of values they can produce is exactly one. That is the whole defect
 *      stated as a number, and it is why (1) and (2) are vacuous in production
 *      while being perfectly sound in isolation.
 *
 * It is NOT the fix. Where the authority for this value lives — the writers derive
 * it, or the column stops being persisted and the predicates read the derivation —
 * is the owner's call, and clause (4) of the acceptance needs an L4 cube
 * distribution from a real database before that call is worth making. The measured
 * population lives in `docs/architecture/c402-opportunity-evidence-status-sites.json`
 * and the numbers behind the recommendation are in the release record beside it.
 *
 * The SQL is executed in `node:sqlite`, following
 * `scripts/source/__tests__/project-contract-depth-unsized-totals.test.ts`, which
 * established the pattern of running a projection's real SQL rather than a
 * paraphrase of it. Postgres-only spellings are rewritten in ONE place each, and
 * each rewrite is asserted to have happened — a silently failed `.replace` would
 * otherwise turn this suite into a test of a string that no longer resembles the
 * query it came from.
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const REPO_ROOT = process.cwd();

const INVENTORY_PATH = path.join(
  REPO_ROOT,
  "docs/architecture/c402-opportunity-evidence-status-sites.json",
);

type InventorySite = {
  readonly file: string;
  readonly line_when_measured: number;
  readonly binding?: string;
  readonly value?: string;
};

type Inventory = {
  readonly declaration: {
    readonly file: string;
    readonly legal_values: readonly string[];
    readonly default: string;
  };
  readonly writers: readonly InventorySite[];
  readonly reachable_values: readonly string[];
  readonly unreachable_values: readonly string[];
  readonly predicate_consumers: readonly InventorySite[];
  readonly metric_consumers: readonly InventorySite[];
  readonly sibling_authorities: readonly {
    readonly symbol: string;
    readonly members?: readonly string[];
  }[];
};

const inventory = JSON.parse(
  fs.readFileSync(INVENTORY_PATH, "utf8"),
) as Inventory;

const SCAN_ROOTS = ["scripts", "src", "supabase"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js", ".sql"]);
const TEST_PATH = /(^|\/)__tests__(\/|$)|\.test\.|\.spec\./;

function sourceFilesUnder(roots: readonly string[]): readonly string[] {
  const found: string[] = [];
  for (const root of roots) {
    const absolute = path.join(REPO_ROOT, root);
    if (!fs.existsSync(absolute)) continue;
    for (const entry of fs.readdirSync(absolute, {
      recursive: true,
      encoding: "utf8",
    })) {
      const relative = path.join(root, entry);
      if (!SCAN_EXTENSIONS.has(path.extname(relative))) continue;
      if (TEST_PATH.test(relative)) continue;
      const stat = fs.statSync(path.join(REPO_ROOT, relative));
      if (!stat.isFile()) continue;
      found.push(relative);
    }
  }
  return found.sort();
}

/**
 * Split a SQL tuple on commas at paren depth zero. `$8::jsonb` and
 * `'{}'::jsonb` are single items; a nested `(SELECT …)` would be too.
 */
function splitTopLevel(tuple: string): readonly string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";
  for (const char of tuple) {
    if (char === "'") quoted = !quoted;
    if (!quoted && char === "(") depth += 1;
    if (!quoted && char === ")") depth -= 1;
    if (!quoted && depth === 0 && char === ",") {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

function balancedFrom(body: string, openAt: number): string {
  let depth = 0;
  let quoted = false;
  for (let index = openAt; index < body.length; index += 1) {
    const char = body[index];
    if (char === "'") quoted = !quoted;
    if (quoted) continue;
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return body.slice(openAt + 1, index);
    }
  }
  throw new Error(`Unbalanced parentheses from offset ${openAt}`);
}

type Writer = {
  readonly file: string;
  readonly line: number;
  readonly binding: "literal" | "parameter" | "expression" | "column_absent";
  readonly value: string | null;
};

const INSERT_MARKER = "INSERT INTO source.opportunity_evidence";

function writersIn(file: string): readonly Writer[] {
  const body = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
  const writers: Writer[] = [];
  let at = body.indexOf(INSERT_MARKER);
  while (at >= 0) {
    const line = body.slice(0, at).split("\n").length;
    const columnsOpen = body.indexOf("(", at + INSERT_MARKER.length);
    const columns = splitTopLevel(balancedFrom(body, columnsOpen)).map((name) =>
      name.replace(/\s+/g, ""),
    );
    const statusIndex = columns.indexOf("evidence_status");
    if (statusIndex < 0) {
      writers.push({ file, line, binding: "column_absent", value: null });
    } else {
      const valuesAt = body.indexOf("VALUES", columnsOpen);
      const tupleOpen = body.indexOf("(", valuesAt);
      const values = splitTopLevel(balancedFrom(body, tupleOpen));
      const bound = values[statusIndex] ?? "";
      const literal = /^'([^']*)'$/.exec(bound);
      writers.push({
        file,
        line,
        binding: literal
          ? "literal"
          : /^\$\d+(::[a-z\[\]]+)?$/.test(bound)
            ? "parameter"
            : "expression",
        value: literal ? literal[1] : bound,
      });
    }
    at = body.indexOf(INSERT_MARKER, at + INSERT_MARKER.length);
  }
  return writers;
}

const scannedFiles = sourceFilesUnder(SCAN_ROOTS);
const discoveredWriters = scannedFiles.flatMap((file) =>
  fs.readFileSync(path.join(REPO_ROOT, file), "utf8").includes(INSERT_MARKER)
    ? writersIn(file)
    : [],
);

const PREDICATE_PATTERN =
  /CASE\s+WHEN EXISTS \(\s*SELECT 1\s+FROM source\.opportunity_evidence e[\s\S]*?END AS evidence_state/g;

type Predicate = {
  readonly file: string;
  readonly line: number;
  readonly sql: string;
};

const discoveredPredicates: readonly Predicate[] = scannedFiles.flatMap(
  (file) => {
    if (path.extname(file) !== ".sql") return [];
    const body = fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
    return [...body.matchAll(PREDICATE_PATTERN)].map((match) => ({
      file,
      line: body.slice(0, match.index ?? 0).split("\n").length,
      sql: match[0],
    }));
  },
);

function seededDatabase(statuses: readonly string[]): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("ATTACH DATABASE ':memory:' AS source");
  db.exec(`
    CREATE TABLE source.optimization_opportunity (
      tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT
    );
    CREATE TABLE source.opportunity_evidence (
      tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT, evidence_status TEXT
    );
    INSERT INTO source.optimization_opportunity
      VALUES ('synthetic', 'v1', 'opportunity-1');
  `);
  for (const status of statuses) {
    db.prepare(
      "INSERT INTO source.opportunity_evidence VALUES ('synthetic','v1','opportunity-1',?)",
    ).run(status);
  }
  return db;
}

function evidenceStateFor(
  predicate: Predicate,
  statuses: readonly string[],
): string {
  const db = seededDatabase(statuses);
  try {
    const row = db
      .prepare(
        `SELECT ${predicate.sql} FROM source.optimization_opportunity o`,
      )
      .get() as { evidence_state: string };
    return row.evidence_state;
  } finally {
    db.close();
  }
}

const LINEAGE_REPORT = "scripts/source/source-substrate-lineage-report.mjs";

function lineageMetricSql(): string {
  const body = fs.readFileSync(path.join(REPO_ROOT, LINEAGE_REPORT), "utf8");
  const definitionAt = body.indexOf('id: "source.opportunity_evidence"');
  if (definitionAt < 0) {
    throw new Error(
      `${LINEAGE_REPORT} no longer declares a source.opportunity_evidence definition`,
    );
  }
  const sqlOpen = body.indexOf("sql: `", definitionAt);
  const sqlClose = body.indexOf("`,", sqlOpen + "sql: `".length);
  return body.slice(sqlOpen + "sql: `".length, sqlClose);
}

/**
 * Two Postgres spellings `node:sqlite` does not accept. Each rewrite asserts it
 * changed something, so a migration of the report to another spelling fails here
 * instead of quietly leaving an unexecuted string behind.
 */
function sqliteDialect(sql: string): string {
  const withoutCasts = sql.replace(/::numeric/g, "");
  expect(withoutCasts).not.toEqual(sql);
  const withTenant = withoutCasts.replace(
    /tenant_key = ANY\(\$1::text\[\]\)/,
    "tenant_key = 'synthetic'",
  );
  expect(withTenant).not.toEqual(withoutCasts);
  return withTenant;
}

function lineageCounts(
  statuses: readonly string[],
): { rowCount: number; availableCount: number } {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("ATTACH DATABASE ':memory:' AS source");
    db.exec(
      "CREATE TABLE source.opportunity_evidence (tenant_key TEXT, evidence_status TEXT)",
    );
    for (const status of statuses) {
      db.prepare(
        "INSERT INTO source.opportunity_evidence VALUES ('synthetic',?)",
      ).run(status);
    }
    const row = db.prepare(sqliteDialect(lineageMetricSql())).get() as {
      __source_row_count: number;
      evidence_available_count: number;
    };
    return {
      rowCount: Number(row.__source_row_count),
      availableCount: Number(row.evidence_available_count),
    };
  } finally {
    db.close();
  }
}

describe("C-402 — the evidence_status predicate is sound and its input is a constant", () => {
  it("finds exactly the writer population the inventory records, and every one binds a literal", () => {
    const discovered = discoveredWriters
      .map((writer) => `${writer.file} ${writer.binding} ${writer.value}`)
      .sort();
    const declared = inventory.writers
      .map((writer) => `${writer.file} ${writer.binding} ${writer.value}`)
      .sort();

    // Deliberately compared as sets of file+binding+value, not by line number:
    // see `line_numbers_are_evidence_not_assertions` in the inventory. A writer
    // that starts deriving the status, a writer added, or a writer removed all
    // land here — and the remedy is to update the inventory in the same change,
    // because the inventory is the measurement this item turns on.
    expect(discovered).toEqual(declared);
    expect(discovered).toHaveLength(4);
    expect(
      discoveredWriters.every((writer) => writer.binding === "literal"),
    ).toBe(true);
  });

  it("names every legal value no writer can produce", () => {
    const produced = [
      ...new Set(
        discoveredWriters
          .map((writer) => writer.value)
          .filter((value): value is string => value !== null),
      ),
    ].sort();
    const unreachable = inventory.declaration.legal_values
      .filter((value) => !produced.includes(value))
      .sort();

    expect(produced).toEqual([...inventory.reachable_values].sort());
    expect(produced).toEqual(["EVIDENCE_AVAILABLE"]);
    expect(unreachable).toEqual([...inventory.unreachable_values].sort());
    // Four of five legal values are written by nothing. Each unreachable value
    // is a branch of every predicate below that no production row can take.
    expect(unreachable).toHaveLength(4);
  });

  it("declares the five legal values the spine migration actually constrains", () => {
    const declaration = fs.readFileSync(
      path.join(REPO_ROOT, inventory.declaration.file),
      "utf8",
    );
    const check = /evidence_status TEXT NOT NULL DEFAULT '([A-Z_]+)' CHECK \(\s*evidence_status IN \(([^)]*)\)/.exec(
      declaration,
    );
    expect(check).not.toBeNull();
    const [, defaultValue, values] = check as RegExpExecArray;
    expect(defaultValue).toEqual(inventory.declaration.default);
    expect(
      values
        .split(",")
        .map((value) => value.trim().replace(/'/g, ""))
        .filter((value) => value.length > 0)
        .sort(),
    ).toEqual([...inventory.declaration.legal_values].sort());
  });

  it("finds every cube predicate that derives evidence_state from the column", () => {
    const discovered = discoveredPredicates
      .map((predicate) => predicate.file)
      .sort();
    expect(discovered).toEqual(
      inventory.predicate_consumers.map((site) => site.file).sort(),
    );
    // Three migrations, two projections each. The backlog item named two of the
    // three; this count is what makes the third one impossible to miss again.
    expect(discovered).toHaveLength(6);
    expect(new Set(discovered).size).toBe(3);
  });

  it.each(
    // Indexed, because the six sites are byte-identical and a failure has to
    // name which one moved.
    discoveredPredicates.map((predicate, index) => [
      `${predicate.file.split("/").pop()}:${predicate.line} (#${index + 1})`,
      predicate,
    ]) as [string, Predicate][],
  )(
    "%s reads 'present' only for an EVIDENCE_AVAILABLE row",
    (_label, predicate) => {
      expect(evidenceStateFor(predicate, ["EVIDENCE_AVAILABLE"])).toBe(
        "present",
      );
      // The flip the acceptance asks for, on the real predicate text.
      expect(evidenceStateFor(predicate, ["EVIDENCE_MISSING"])).toBe("missing");
      expect(evidenceStateFor(predicate, ["CONFLICTED"])).toBe("missing");
      expect(evidenceStateFor(predicate, ["NOT_ESTABLISHED"])).toBe("missing");
      expect(evidenceStateFor(predicate, ["WORKFLOW_REQUIRED"])).toBe("missing");
      // Any one available row is enough — the predicate is an EXISTS, so mixed
      // quality reads as present. That is the shape a reader should know about
      // before trusting `evidence_state` as a quality signal.
      expect(
        evidenceStateFor(predicate, ["EVIDENCE_MISSING", "EVIDENCE_AVAILABLE"]),
      ).toBe("present");
    },
  );

  it.each(
    discoveredPredicates.map((predicate, index) => [
      `${predicate.file.split("/").pop()}:${predicate.line} (#${index + 1})`,
      predicate,
    ]) as [string, Predicate][],
  )(
    "%s cannot tell an evidence-free opportunity from one with unusable evidence, once the writers are constant",
    (_label, predicate) => {
      // With one reachable value, these two inputs are the only two a
      // production row can present, and the predicate answers them identically
      // to "has at least one row" — the degeneration the item describes.
      expect(evidenceStateFor(predicate, [])).toBe("missing");
      expect(evidenceStateFor(predicate, ["EVIDENCE_AVAILABLE"])).toBe(
        "present",
      );
      // And the value that would make the distinction is unreachable, so this
      // third case cannot occur in production today. It is asserted anyway,
      // because it is what changes the day a writer starts deriving.
      expect(evidenceStateFor(predicate, ["EVIDENCE_MISSING"])).toBe("missing");
    },
  );

  it("computes evidence_available_count so that it CAN fall below the row count", () => {
    const mixed = lineageCounts([
      "EVIDENCE_AVAILABLE",
      "EVIDENCE_MISSING",
      "CONFLICTED",
    ]);
    expect(mixed.rowCount).toBe(3);
    expect(mixed.availableCount).toBe(1);
    expect(mixed.availableCount).toBeLessThan(mixed.rowCount);
  });

  it("returns evidence_available_count equal to the row count for every input the writers can produce", () => {
    // The metric is sound (the case above) and uninformative (this one): the
    // only value any writer binds is the one the FILTER selects, so the figure
    // meant to qualify the row count is the row count.
    for (const size of [1, 3, 7]) {
      const counts = lineageCounts(
        Array.from({ length: size }, () => "EVIDENCE_AVAILABLE"),
      );
      expect(counts.rowCount).toBe(size);
      expect(counts.availableCount).toBe(size);
    }
  });

  it("keeps CONFLICTED out of the computed authority, so it is unreachable by construction", () => {
    const ledger = fs.readFileSync(
      path.join(
        REPO_ROOT,
        "src/lib/source/data-model/contract-optimization-ledger.ts",
      ),
      "utf8",
    );
    const union =
      /export type ContractOptimizationEvidenceStatus =([\s\S]*?);/.exec(ledger);
    expect(union).not.toBeNull();
    const members = (union as RegExpExecArray)[1]
      .split("|")
      .map((member) => member.trim().replace(/'/g, ""))
      .filter((member) => member.length > 0)
      .sort();

    const declaredType = inventory.sibling_authorities.find(
      (sibling) => sibling.symbol === "ContractOptimizationEvidenceStatus",
    );
    expect(declaredType?.members).toBeDefined();
    expect(members).toEqual([...(declaredType?.members ?? [])].sort());
    // The column's CHECK permits five values; the only rule in the repository
    // that computes this enum can produce four. So CONFLICTED is not merely
    // unwritten today — no existing derivation can reach it, which is the
    // answer to clause (3) of the acceptance and is decided by the owner, not
    // here.
    expect(members).not.toContain("CONFLICTED");
    expect(inventory.declaration.legal_values).toContain("CONFLICTED");
    expect(
      inventory.declaration.legal_values.filter(
        (value) => !members.includes(value),
      ),
    ).toEqual(["CONFLICTED"]);
  });
});
