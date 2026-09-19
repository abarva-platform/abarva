import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A gate whose vocabulary is never checked against the column it reads is a
 * gate that can be born dead.
 *
 * Backlog item 126 shipped one. The Programs pattern authority accepted
 * promotion states `published`, `validated` and `active`; the only migration
 * that defines `engagement_topics.promotion_state` constrains it to
 * `draft`, `pilot`, `mature`, `deprecated`. Every accepted state was
 * impossible, so the gate refused every row that could exist and creating a
 * program from a matched pattern stopped working on `main`. Twenty-seven CI
 * checks passed, because every unit test injects its own row source and can
 * hand the code a row the database could never produce.
 *
 * `pattern-authority-reachability.test.ts` guards that one column against
 * that one migration. This suite drives the registry-wide form: the sweep at
 * `scripts/quality/enum-reachability.mjs` reads every CHECK-constrained
 * column out of the migrations, finds the SQL in `src/` that compares values
 * against those columns, and reports any comparison that cannot match.
 *
 * Every case runs the real script as a process. The fixture cases point it at
 * a scratch tree with `--migrations` and `--src`; the last two run it against
 * this repository exactly as CI does. A mutation of the script is therefore a
 * mutation of what runs here — there is no second copy of the logic in this
 * file to keep in step.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const script = path.join(repoRoot, "scripts/quality/enum-reachability.mjs");

type Finding = {
  file: string;
  line: number;
  form: string;
  column: string;
  verdict: "UNREACHABLE" | "PARTIAL" | "WAIVED";
  compared: string[];
  permitted: string[];
  impossible: string[];
  waived: string | null;
};

type UnresolvedComparison = {
  bucket: "ambiguous" | "not-a-subject" | "resolvable-with-work";
};

type Run = {
  status: number;
  stdout: string;
  report: {
    domains: number;
    counts: { considered: number; resolved: number; unresolved: number };
    findings: Finding[];
    unresolvedComparisons?: UnresolvedComparison[];
  } | null;
};

function run(args: string[]): Run {
  let status = 0;
  let stdout = "";
  try {
    stdout = execFileSync("node", [script, ...args], {
      encoding: "utf8",
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch (error) {
    const e = error as { status?: number; stdout?: string };
    status = typeof e.status === "number" ? e.status : -1;
    stdout = e.stdout ?? "";
  }
  const start = stdout.indexOf("{");
  let report = null;
  for (
    let rootClose = stdout.lastIndexOf("\n}\n");
    start >= 0 && rootClose > start;
    rootClose = stdout.lastIndexOf("\n}\n", rootClose - 1)
  ) {
    try {
      report = JSON.parse(stdout.slice(start, rootClose + 2));
      break;
    } catch {
      // Keep walking back through nested object endings until the root object parses.
    }
  }
  return { status, stdout, report };
}

/** A scratch tree with one migration file and one source file. */
function fixture(sql: string, source: string, sourceName = "adapter.ts") {
  const root = mkdtempSync(path.join(tmpdir(), "enum-reach-"));
  mkdirSync(path.join(root, "migrations"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(path.join(root, "migrations", "001_fixture.sql"), sql);
  writeFileSync(path.join(root, "src", sourceName), source);
  return {
    root,
    args: [
      `--migrations=${path.join(root, "migrations")}`,
      `--src=${path.join(root, "src")}`,
      "--floor=0",
      "--json",
    ],
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

const PROMOTION_MIGRATION = `
CREATE TABLE engagement_topics (
  topic_key TEXT PRIMARY KEY,
  promotion_state TEXT NOT NULL DEFAULT 'draft'
    CHECK (promotion_state IN ('draft','pilot','mature','deprecated'))
);
`;

describe("enum reachability · the item 126 shape", () => {
  it("reports a comparison set no row can satisfy as UNREACHABLE", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const corpus = async (db) => db.query(`",
        "  SELECT topic_key FROM engagement_topics",
        "  WHERE promotion_state IN ('published','validated','active')",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toHaveLength(1);
      const finding = report!.findings[0];
      expect(finding.verdict).toBe("UNREACHABLE");
      expect(finding.column).toBe("engagement_topics.promotion_state");
      expect(finding.impossible).toEqual(["active", "published", "validated"]);
      expect(finding.permitted).toEqual([
        "deprecated",
        "draft",
        "mature",
        "pilot",
      ]);
      expect(finding.line).toBe(3);
      expect(status).toBe(1);
    } finally {
      f.cleanup();
    }
  });

  it("passes the vocabulary that replaced it", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const corpus = async (db) => db.query(`",
        "  SELECT topic_key FROM engagement_topics",
        "  WHERE promotion_state IN ('pilot','mature')",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toEqual([]);
      expect(report?.counts.resolved).toBe(1);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("reports a partly-stale vocabulary as PARTIAL, not as clean", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const corpus = async (db) => db.query(`",
        "  SELECT topic_key FROM engagement_topics",
        "  WHERE promotion_state IN ('pilot','mature','published')",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("PARTIAL");
      expect(report?.findings[0].impossible).toEqual(["published"]);
      expect(status).toBe(1);
    } finally {
      f.cleanup();
    }
  });

  /**
   * The line number is how a finding is acted on, and how a waiver is
   * located. Stripping SQL comments by replacing them with a single space
   * shifts every offset after them, so a finding below a comment reports the
   * wrong line and a waiver written against it silently stops applying.
   */
  it("reports the right line when a SQL comment precedes the comparison", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const corpus = async (db) => db.query(`",
        "  -- only the states a client may see, per the promotion policy",
        "  SELECT topic_key FROM engagement_topics",
        "  WHERE promotion_state IN ('published')",
        "`);",
      ].join("\n"),
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings).toHaveLength(1);
      expect(report?.findings[0].line).toBe(4);
    } finally {
      f.cleanup();
    }
  });

  it("judges a single-value equality the same way", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const one = async (db) => db.query(`",
        "  SELECT topic_key FROM engagement_topics WHERE promotion_state = 'published'",
        "`);",
      ].join("\n"),
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
      expect(report?.findings[0].form).toBe("sql-equality");
    } finally {
      f.cleanup();
    }
  });

  it("judges a query-builder chain against the table its .from() names", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "export const one = async (db) =>",
        "  db.from('engagement_topics').select('topic_key').eq('promotion_state', 'published');",
      ].join("\n"),
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
      expect(report?.findings[0].form).toBe("query-builder");
    } finally {
      f.cleanup();
    }
  });
});

describe("enum reachability · what is NOT a column domain", () => {
  /**
   * The first draft of the sweep read every `col IN (...)` inside any CHECK
   * as that column's domain. `source.opportunity_claim` has a table-level
   * constraint `claim_role <> 'sizing' OR ... OR basis IN ('not_recorded',
   * 'judgment')` — a conditional rule — and reading it as a domain made the
   * live, correct query `basis IN ('calculated','benchmark')` report as a
   * defect. Only a whole-expression domain form counts.
   */
  it("ignores a conditional CHECK that merely mentions the column", () => {
    const f = fixture(
      [
        "CREATE TABLE claim (",
        "  claim_role TEXT NOT NULL,",
        "  amount NUMERIC NULL,",
        "  basis TEXT NOT NULL CHECK (basis IN ('client_record','calculated','benchmark','judgment')),",
        "  CONSTRAINT amount_state CHECK (",
        "    claim_role <> 'sizing' OR amount IS NOT NULL OR basis IN ('judgment')",
        "  )",
        ");",
      ].join("\n"),
      [
        "export const q = async (db) => db.query(`",
        "  SELECT 1 FROM claim WHERE basis IN ('calculated','benchmark')",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toEqual([]);
      expect(report?.counts.resolved).toBe(1);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("treats the nullable shape as a domain", () => {
    const f = fixture(
      [
        "CREATE TABLE t (",
        "  s TEXT NULL CHECK (s IS NULL OR s IN ('a','b'))",
        ");",
      ].join("\n"),
      "export const q = async (db) => db.query(`SELECT 1 FROM t WHERE s IN ('c')`);",
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings[0]?.verdict).toBe("UNREACHABLE");
    } finally {
      f.cleanup();
    }
  });

  it("lets a later migration redefine the domain", () => {
    const f = fixture(PROMOTION_MIGRATION, "export const x = 1;");
    try {
      writeFileSync(
        path.join(f.root, "migrations", "002_widen.sql"),
        "ALTER TABLE engagement_topics DROP CONSTRAINT engagement_topics_promotion_state_check;\n" +
          "ALTER TABLE engagement_topics ADD CONSTRAINT engagement_topics_promotion_state_check\n" +
          "  CHECK (promotion_state IN ('draft','pilot','mature','deprecated','published'));\n",
      );
      writeFileSync(
        path.join(f.root, "src", "adapter.ts"),
        "export const q = async (db) => db.query(`SELECT 1 FROM engagement_topics WHERE promotion_state IN ('published')`);",
      );
      const { status, report } = run(f.args);
      expect(report?.findings).toEqual([]);
      expect(report?.counts.resolved).toBe(1);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });
});

describe("enum reachability · resolution is never guessed", () => {
  /**
   * Column names collide. `lifecycle_state` is constrained on eleven tables
   * in this repository with five different vocabularies. A sweep that matched
   * on the column name alone would report the correct query against one table
   * as a defect because another table spells its states differently.
   */
  it("does not judge an unqualified column when two tables in the statement constrain it", () => {
    const f = fixture(
      [
        "CREATE TABLE a (state TEXT CHECK (state IN ('x','y')));",
        "CREATE TABLE b (state TEXT CHECK (state IN ('p','q')));",
      ].join("\n"),
      "export const q = async (db) => db.query(`SELECT 1 FROM a JOIN b ON true WHERE state IN ('x')`);",
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toEqual([]);
      expect(report?.counts.resolved).toBe(0);
      expect(report?.counts.unresolved).toBeGreaterThan(0);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("judges the same comparison once an alias names the table", () => {
    const f = fixture(
      [
        "CREATE TABLE a (state TEXT CHECK (state IN ('x','y')));",
        "CREATE TABLE b (state TEXT CHECK (state IN ('p','q')));",
      ].join("\n"),
      "export const q = async (db) => db.query(`SELECT 1 FROM a JOIN b bb ON true WHERE bb.state IN ('x')`);",
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings).toHaveLength(1);
      expect(report?.findings[0].column).toBe("b.state");
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
    } finally {
      f.cleanup();
    }
  });

  /**
   * The CTE has to be named after a real table for this case to mean
   * anything. A CTE with a name no migration constrains resolves to nothing
   * either way, so it would pass whether or not CTEs were understood — the
   * first version of this case did exactly that and a mutation that treated
   * every CTE as a base table survived it.
   */
  it("does not treat a CTE named after a real table as that table", () => {
    const f = fixture(
      "CREATE TABLE a (state TEXT CHECK (state IN ('x','y')));",
      [
        "export const q = async (db) => db.query(`",
        "  WITH a AS (SELECT 'p'::text AS state)",
        "  SELECT 1 FROM a r WHERE r.state IN ('p')",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toEqual([]);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("judges a qualified table-name reference when the statement names that table", () => {
    const f = fixture(
      "CREATE TABLE source.approval_request (approval_state TEXT CHECK (approval_state IN ('pending','approved','sent_back','cancelled')));",
      [
        "export const q = async (db) => db.query(`",
        "  INSERT INTO source.approval_request (approval_state)",
        "  VALUES ('pending')",
        "  ON CONFLICT (approval_state)",
        "  DO UPDATE SET approval_state = CASE",
        "    WHEN source.approval_request.approval_state = 'sent_back' THEN 'pending'",
        "    ELSE source.approval_request.approval_state",
        "  END",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.counts.resolved).toBe(1);
      expect(report?.counts.unresolved).toBe(0);
      expect(report?.findings).toEqual([]);
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("does not judge a qualified table-name reference when that table does not constrain the column", () => {
    const f = fixture(
      [
        "CREATE TABLE source_artifacts (approval_state TEXT CHECK (approval_state IN ('draft','approved')));",
        "CREATE TABLE source.approval_request (approval_state TEXT);",
      ].join("\n"),
      [
        "export const q = async (db) => db.query(`",
        "  INSERT INTO source.approval_request (approval_state)",
        "  VALUES ('pending')",
        "  ON CONFLICT (approval_state)",
        "  DO UPDATE SET approval_state = CASE",
        "    WHEN source.approval_request.approval_state = 'sent_back' THEN 'pending'",
        "    ELSE source.approval_request.approval_state",
        "  END",
        "`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run([...f.args, "--include-unresolved"]);
      expect(report?.counts.resolved).toBe(0);
      expect(report?.counts.unresolved).toBe(1);
      expect(report?.unresolvedComparisons).toHaveLength(1);
      expect(report!.unresolvedComparisons![0].bucket).toBe("not-a-subject");
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });
});

describe("enum reachability · a deliberate impossible comparison is declared, not inferred", () => {
  /**
   * Backlog item 49 recorded why the tempting blanket rule is wrong: a
   * retirement or residual check names the value that should be absent, and
   * a rule with no exception would fail exactly the checks that work. So the
   * exception is written at the call site with a reason, and it is still
   * printed on every run.
   */
  const residual = [
    "// enum-reachability-waiver: residual check proving migration 001 left no rows",
    "export const q = async (db) => db.query(`SELECT 1 FROM engagement_topics WHERE promotion_state = 'published'`);",
  ].join("\n");

  it("downgrades a waived finding to WAIVED and exits clean", () => {
    const f = fixture(PROMOTION_MIGRATION, residual);
    try {
      const { status, report } = run(f.args);
      expect(report?.findings).toHaveLength(1);
      expect(report?.findings[0].verdict).toBe("WAIVED");
      expect(report?.findings[0].waived).toBe(
        "residual check proving migration 001 left no rows",
      );
      expect(status).toBe(0);
    } finally {
      f.cleanup();
    }
  });

  it("still prints the waived finding rather than hiding it", () => {
    const f = fixture(PROMOTION_MIGRATION, residual);
    try {
      const { stdout } = run(f.args.filter((a) => a !== "--json"));
      expect(stdout).toContain("WAIVED");
      expect(stdout).toContain("engagement_topics.promotion_state");
      expect(stdout).toContain("residual check proving migration 001");
    } finally {
      f.cleanup();
    }
  });

  it("waives nothing when the reason is too short to be one", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "// enum-reachability-waiver: legacy",
        "export const q = async (db) => db.query(`SELECT 1 FROM engagement_topics WHERE promotion_state = 'published'`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
      expect(status).toBe(1);
    } finally {
      f.cleanup();
    }
  });

  it("waives nothing when the marker carries no reason", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "// enum-reachability-waiver:",
        "export const q = async (db) => db.query(`SELECT 1 FROM engagement_topics WHERE promotion_state = 'published'`);",
      ].join("\n"),
    );
    try {
      const { status, report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
      expect(status).toBe(1);
    } finally {
      f.cleanup();
    }
  });

  it("does not let a waiver three lines away reach a different comparison", () => {
    const f = fixture(
      PROMOTION_MIGRATION,
      [
        "// enum-reachability-waiver: residual check proving migration 001 left no rows",
        "const a = 1;",
        "const b = 2;",
        "const c = 3;",
        "export const q = async (db) => db.query(`SELECT 1 FROM engagement_topics WHERE promotion_state = 'published'`);",
      ].join("\n"),
    );
    try {
      const { report } = run(f.args);
      expect(report?.findings[0].verdict).toBe("UNREACHABLE");
    } finally {
      f.cleanup();
    }
  });
});

describe("enum reachability · the sweep must keep having a subject", () => {
  /**
   * The failure this repository keeps repeating is a check that passes
   * because it is looking at nothing: an audit whose subject file was
   * deleted read as an empty string and went green (item 47), and a CI gate
   * proved a control existed by finding its name in a comment. A sweep that
   * resolves zero comparisons reports "clean" in exactly the same voice as a
   * sweep that resolved a hundred. So resolution has a floor, and falling
   * below it is a distinct verdict with its own exit code.
   */
  it("reports VACUOUS with exit 3 when resolution falls below the floor", () => {
    const f = fixture(PROMOTION_MIGRATION, "export const nothing = 1;");
    try {
      const { status, stdout } = run([
        ...f.args.filter((a) => !a.startsWith("--floor")),
        "--floor=1",
      ]);
      expect(stdout).toContain("VACUOUS");
      expect(status).toBe(3);
    } finally {
      f.cleanup();
    }
  });

  it("resolves at least the floor against this repository", () => {
    const { report } = run(["--json"]);
    expect(report).not.toBeNull();
    expect(report!.counts.resolved).toBeGreaterThanOrEqual(60);
    expect(report!.domains).toBeGreaterThan(400);
  });
});

describe("enum reachability · this repository", () => {
  it("compares no value a constrained column cannot hold", () => {
    const { status, stdout } = run([]);
    expect(stdout).not.toContain("VACUOUS");
    expect(status).toBe(0);
  });
});
