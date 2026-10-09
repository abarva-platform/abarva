/**
 * The public-source storage contract, enforced twice: by CHECK constraints in
 * the migration and by the repository-side validator, so a bad source is
 * refused with a reason before it reaches the database. These cases pin each
 * rule on BOTH sides and cross-check the two against the same exported
 * constants, so the SQL and the TypeScript cannot drift apart silently.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => {
    throw new Error("the contract suite never touches the store");
  },
}));

import { CONFIDENCE_LEVELS } from "@/lib/governance/context-corpus-policy";
import {
  RUN_COLUMNS,
  SOURCE_COLUMNS,
  SOURCE_DEDUPE_CONFLICT,
} from "../public-research/repository";
import {
  PUBLIC_SOURCE_DECISIONS,
  PUBLIC_SOURCE_EXCERPT_MAX_CHARS,
  PUBLIC_SOURCE_KIND,
  RESEARCH_RUN_STATUSES,
  charLength,
  normalizePublicSourceUrl,
  validatePublicSource,
  validateResearchRun,
  type NewPublicSource,
} from "../public-research/types";

const MIGRATION = "20261010130000_move_public_research.sql";

function sql(): string {
  return readFileSync(
    join(process.cwd(), "supabase/migrations", MIGRATION),
    "utf8",
  );
}

function tableBlock(table: string): string {
  const match = new RegExp(
    `CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`,
    "i",
  ).exec(sql());
  expect(match).not.toBeNull();
  return match![1]!;
}

function declaredColumns(table: string): string[] {
  return tableBlock(table)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("--"))
    .map((line) => line.split(/\s+/)[0]!);
}

function quotedList(values: readonly string[]): string {
  return values.map((v) => `'${v}'`).join(",\\s*");
}

function source(over: Partial<NewPublicSource> = {}): NewPublicSource {
  return {
    url: "https://example.org/rule",
    title: "A published rule",
    retrievedAt: "2026-10-10T00:00:00.000Z",
    excerpt: "The rule applies to every eligible program.",
    ...over,
  };
}

function reasonsFor(over: Partial<NewPublicSource>): string {
  const result = validatePublicSource(source(over));
  expect(result.ok).toBe(false);
  return result.ok ? "" : result.reasons.join(" | ");
}

describe("migration constraints", () => {
  it("allows only kind 'public_source'", () => {
    expect(PUBLIC_SOURCE_KIND).toBe("public_source");
    expect(sql()).toMatch(/CHECK\s*\(\s*kind\s*=\s*'public_source'\s*\)/i);
    expect(sql()).toMatch(/kind TEXT NOT NULL DEFAULT 'public_source'/i);
  });

  it("allows only https URLs", () => {
    expect(sql()).toMatch(
      /CHECK\s*\(\s*url\s*~\s*'\^https:\/\/\[\^\[:space:\]\]\+\$'\s*\)/i,
    );
  });

  it("bounds the excerpt to the same limit the validator uses", () => {
    expect(PUBLIC_SOURCE_EXCERPT_MAX_CHARS).toBe(300);
    expect(sql()).toMatch(
      new RegExp(
        `CHECK\\s*\\(\\s*char_length\\(excerpt\\)\\s*>=\\s*1\\s+AND\\s+char_length\\(excerpt\\)\\s*<=\\s*${PUBLIC_SOURCE_EXCERPT_MAX_CHARS}\\s*\\)`,
        "i",
      ),
    );
  });

  it("lists exactly the decisions, run statuses and confidence levels the code uses", () => {
    expect(sql()).toMatch(
      new RegExp(
        `CHECK\\s*\\(\\s*decision IN \\(${quotedList(PUBLIC_SOURCE_DECISIONS)}\\)\\s*\\)`,
        "i",
      ),
    );
    expect(sql()).toMatch(
      new RegExp(
        `CHECK\\s*\\(\\s*status IN \\(${quotedList(RESEARCH_RUN_STATUSES)}\\)\\s*\\)`,
        "i",
      ),
    );
    expect(sql()).toMatch(
      new RegExp(
        `confidence IS NULL OR confidence IN \\(${quotedList(CONFIDENCE_LEVELS)}\\)`,
        "i",
      ),
    );
    expect(sql()).toMatch(/decision TEXT NOT NULL DEFAULT 'pending'/i);
  });

  it("requires a reviewer and a time on every decided source, and neither on a pending one", () => {
    expect(sql()).toMatch(
      /decision = 'pending' AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL\)\s*OR \(decision <> 'pending' AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL/i,
    );
  });

  it("dedupes on (tenant, Move, URL, md5 of the excerpt), the key the writer names", () => {
    expect(sql()).toMatch(
      /excerpt_md5 TEXT GENERATED ALWAYS AS \(md5\(excerpt\)\) STORED/i,
    );
    const unique =
      /CREATE UNIQUE INDEX IF NOT EXISTS \w+\s+ON move_public_sources \(([^)]*)\)/i.exec(
        sql(),
      );
    expect(unique).not.toBeNull();
    expect(
      unique![1]!
        .split(",")
        .map((c) => c.trim())
        .join(","),
    ).toBe(SOURCE_DEDUPE_CONFLICT);
  });

  it("fences both tables by tenant with RLS and denies session writes", () => {
    for (const table of ["move_public_research_runs", "move_public_sources"]) {
      expect(sql()).toMatch(
        new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, "i"),
      );
      expect(sql()).toMatch(
        new RegExp(
          `CREATE POLICY "authenticated_read_${table}" ON ${table}\\s+FOR SELECT TO authenticated\\s+USING \\(\\s*tenant_key = \\(auth\\.jwt\\(\\) ->> 'tenant_key'\\)\\s+AND program_id IN \\(SELECT id FROM engagements\\)`,
          "i",
        ),
      );
      for (const op of ["insert", "update", "delete"]) {
        expect(sql()).toMatch(
          new RegExp(
            `CREATE POLICY "authenticated_${op}_${table}" ON ${table}\\s+FOR ${op.toUpperCase()} TO authenticated (USING|WITH CHECK) \\(false\\)`,
            "i",
          ),
        );
      }
      expect(sql()).toMatch(
        new RegExp(`GRANT SELECT ON ${table} TO authenticated;`, "i"),
      );
    }
    expect(sql()).not.toMatch(/DISABLE ROW LEVEL SECURITY/i);
    expect(sql()).not.toMatch(/GRANT (INSERT|UPDATE|DELETE|ALL)/i);
  });

  it("declares every column the repository selects", () => {
    const runs = declaredColumns("move_public_research_runs");
    const sources = declaredColumns("move_public_sources");
    for (const column of RUN_COLUMNS.split(",").map((c) => c.trim())) {
      expect(runs).toContain(column);
    }
    for (const column of SOURCE_COLUMNS.split(",").map((c) => c.trim())) {
      expect(sources).toContain(column);
    }
  });

  it("is idempotent: guarded tables, indexes, constraints and policies", () => {
    const text = sql();
    expect(text).not.toMatch(/CREATE TABLE (?!IF NOT EXISTS)/i);
    expect(text).not.toMatch(/CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/i);
    const policies = text.match(/CREATE POLICY "([^"]+)"/g) ?? [];
    expect(policies.length).toBeGreaterThan(0);
    for (const policy of policies) {
      const name = /"([^"]+)"/.exec(policy)![1];
      expect(text).toContain(`DROP POLICY IF EXISTS "${name}"`);
    }
    const constraints = text.match(/ADD CONSTRAINT/g) ?? [];
    const guarded = text.match(/WHEN duplicate_object THEN NULL;/g) ?? [];
    expect(guarded.length).toBe(constraints.length);
  });
});

describe("validatePublicSource", () => {
  it("accepts a well-formed source and normalizes it for storage", () => {
    const result = validatePublicSource(
      source({
        url: "  https://Example.org/Rule?x=1  ",
        title: "  A published rule ",
        publisher: "  ",
        publishedAt: "2024-02-29",
        excerpt: "  quoted text  ",
        confidence: "low",
        kind: "public_source",
      }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        url: "https://example.org/Rule?x=1",
        title: "A published rule",
        publisher: null,
        publishedAt: "2024-02-29",
        retrievedAt: "2026-10-10T00:00:00.000Z",
        excerpt: "quoted text",
        claim: null,
        confidence: "low",
      },
    });
  });

  it("refuses every non-https URL", () => {
    for (const url of [
      "http://example.org/rule",
      "ftp://example.org/rule",
      "javascript:alert(1)",
      "data:text/html,hello",
      "file:///etc/passwd",
      "//example.org/rule",
      "example.org/rule",
    ]) {
      expect(reasonsFor({ url })).toMatch(/https|absolute/);
    }
  });

  it("refuses a URL with credentials or whitespace, or none at all", () => {
    expect(reasonsFor({ url: "https://user:pass@example.org/" })).toMatch(
      /credentials/,
    );
    expect(reasonsFor({ url: "https://example.org/a b" })).toMatch(
      /whitespace/,
    );
    expect(reasonsFor({ url: "" })).toMatch(/url is required/);
    expect(normalizePublicSourceUrl("https://example.org").ok).toBe(true);
  });

  it(`accepts an excerpt of exactly ${PUBLIC_SOURCE_EXCERPT_MAX_CHARS} characters and refuses one more`, () => {
    const atLimit = "a".repeat(PUBLIC_SOURCE_EXCERPT_MAX_CHARS);
    expect(validatePublicSource(source({ excerpt: atLimit })).ok).toBe(true);
    expect(reasonsFor({ excerpt: `${atLimit}a` })).toMatch(
      /301 characters; the limit is 300/,
    );
    expect(reasonsFor({ excerpt: "   " })).toMatch(/excerpt is required/);
  });

  it("counts characters as Postgres does (code points), not UTF-16 units", () => {
    const face = "\u{1F600}";
    expect(face.length).toBe(2);
    expect(charLength(face)).toBe(1);
    const atLimit = face.repeat(PUBLIC_SOURCE_EXCERPT_MAX_CHARS);
    expect(validatePublicSource(source({ excerpt: atLimit })).ok).toBe(true);
    expect(reasonsFor({ excerpt: `${atLimit}${face}` })).toMatch(
      /limit is 300/,
    );
  });

  it("refuses a foreign kind, a missing title, a bad date, a bad retrieval time and an unknown confidence", () => {
    expect(reasonsFor({ kind: "client_private" })).toMatch(
      /kind must be public_source/,
    );
    expect(reasonsFor({ title: " " })).toMatch(/title is required/);
    expect(reasonsFor({ publishedAt: "2023-02-29" })).toMatch(/publishedAt/);
    expect(reasonsFor({ publishedAt: "March 2024" })).toMatch(/publishedAt/);
    expect(reasonsFor({ retrievedAt: "yesterday" })).toMatch(/retrievedAt/);
    expect(reasonsFor({ confidence: "certain" as never })).toMatch(
      /confidence/,
    );
  });
});

describe("validateResearchRun", () => {
  const run = {
    phase: 2,
    briefHash: "abc",
    status: "ok" as const,
    sourceCount: 0,
    startedAt: "2026-10-10T00:00:00.000Z",
  };

  it("accepts every declared status", () => {
    for (const status of RESEARCH_RUN_STATUSES) {
      expect(validateResearchRun({ ...run, status }).ok).toBe(true);
    }
  });

  it("refuses an unknown status, a blank brief hash, a bad count and an out-of-range phase", () => {
    const result = validateResearchRun({
      ...run,
      status: "cancelled" as never,
      briefHash: " ",
      sourceCount: 1.5,
      phase: 6,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reasons).toHaveLength(4);
    expect(validateResearchRun({ ...run, phase: null }).ok).toBe(true);
    expect(validateResearchRun({ ...run, startedAt: "soon" }).ok).toBe(false);
  });
});
