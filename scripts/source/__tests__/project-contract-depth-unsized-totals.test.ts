import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const projection = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "scripts/source/project-contract-depth-package-layer4.ts",
  ),
  "utf8",
);

function between(start: string, end: string): string {
  const startAt = projection.indexOf(start);
  if (startAt < 0) throw new Error(`Missing projection segment: ${start}`);
  const endAt = projection.indexOf(end, startAt + start.length);
  if (endAt < 0) throw new Error(`Missing projection segment: ${end}`);
  return projection.slice(startAt, endAt);
}

describe("Source opportunity action totals", () => {
  it("keeps one unsized action when multiple eligible claims disagree", () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec("ATTACH DATABASE ':memory:' AS source");
      db.function(
        "jsonb_array_length",
        (value: unknown) => JSON.parse(String(value)).length,
      );
      db.exec(`
        CREATE TABLE source.opportunity_claim (
          tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT,
          claim_role TEXT, basis TEXT, evidence_status TEXT, source_refs TEXT,
          amount_usd REAL, amount_low_usd REAL, amount_high_usd REAL,
          calculation_run_id TEXT, calculation_rule_id TEXT,
          calculation_rule_version TEXT, benchmark_id TEXT
        );
        CREATE TABLE source.optimization_opportunity (
          tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT,
          stage TEXT, amount_state TEXT
        );
        INSERT INTO source.optimization_opportunity VALUES
          ('synthetic', 'v1', 'duplicate-sized', 'validated', 'exact'),
          ('synthetic', 'v1', 'duplicate-identical', 'validated', 'exact');
        INSERT INTO source.opportunity_claim VALUES
          ('synthetic', 'v1', 'duplicate-sized', 'sizing', 'calculated',
           'supported', '["evidence-a"]', 500, NULL, NULL, 'run-a', 'rule-a', 'v1', NULL),
          ('synthetic', 'v1', 'duplicate-sized', 'sizing', 'benchmark',
           'partial', '["evidence-b"]', 700, NULL, NULL, NULL, NULL, NULL, 'benchmark-b'),
          ('synthetic', 'v1', 'duplicate-identical', 'sizing', 'calculated',
           'supported', '["evidence-c"]', 300, NULL, NULL, 'run-c', 'rule-c', 'v1', NULL),
          ('synthetic', 'v1', 'duplicate-identical', 'sizing', 'benchmark',
           'partial', '["evidence-d"]', 300, NULL, NULL, NULL, NULL, NULL, 'benchmark-d');
      `);
      const sizingCte = between(
        "accepted_sizing AS (\n",
        "\n    ),\n    sourcing AS (",
      ).replace(/^accepted_sizing AS \(\n/, "");
      const annualValue = between(
        "COALESCE(accepted.amount_high_usd, accepted.amount_usd) AS annual_value_exposed",
        ",\n        COALESCE(accepted.amount_low_usd",
      );
      const actionAmount = between(
        "o.annual_value_exposed::numeric AS candidate_amount_usd",
        ",\n      o.priority",
      ).replace("::numeric", "");
      db.exec(`
        CREATE TEMP VIEW action_candidate AS
        WITH accepted_sizing AS (${sizingCte}),
        consumption_opportunity AS (
          SELECT o.opportunity_id, ${annualValue}
          FROM source.optimization_opportunity o
          LEFT JOIN accepted_sizing accepted
            ON accepted.tenant_key = o.tenant_key
           AND accepted.dataset_version = o.dataset_version
           AND accepted.opportunity_id = o.opportunity_id
        )
        SELECT o.opportunity_id, ${actionAmount}
        FROM consumption_opportunity o
      `);
      const rows = db
        .prepare("SELECT * FROM action_candidate ORDER BY opportunity_id")
        .all();
      expect(rows).toEqual([
        { opportunity_id: "duplicate-identical", candidate_amount_usd: null },
        { opportunity_id: "duplicate-sized", candidate_amount_usd: null },
      ]);
      expect(
        db
          .prepare(
            "SELECT COALESCE(SUM(candidate_amount_usd), 0) AS candidate_amount_usd FROM action_candidate",
          )
          .get(),
      ).toEqual({ candidate_amount_usd: 0 });
    } finally {
      db.close();
    }
  });

  it("counts only recorded-method sized claims, not authored signal amounts", () => {
    const db = new DatabaseSync(":memory:");
    try {
      db.exec("ATTACH DATABASE ':memory:' AS source");
      db.function(
        "jsonb_array_length",
        (value: unknown) => JSON.parse(String(value)).length,
      );
      db.exec(`
        CREATE TABLE source.opportunity_claim (
          tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT,
          claim_role TEXT, basis TEXT, evidence_status TEXT, source_refs TEXT,
          amount_usd REAL, amount_low_usd REAL, amount_high_usd REAL,
          calculation_run_id TEXT, calculation_rule_id TEXT,
          calculation_rule_version TEXT, benchmark_id TEXT
        );
        CREATE TABLE source.optimization_opportunity (
          tenant_key TEXT, dataset_version TEXT, opportunity_id TEXT,
          stage TEXT, amount_state TEXT
        );
      `);

      const insert = db.prepare(`
        INSERT INTO source.opportunity_claim VALUES
        ('synthetic', 'v1', ?, 'sizing', ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)
      `);
      const insertOpportunity = db.prepare(`
        INSERT INTO source.optimization_opportunity VALUES ('synthetic', 'v1', ?, ?, ?)
      `);
      const cases = [
        [
          "calculated-sized",
          "calculated",
          "supported",
          '["evidence-1"]',
          120,
          "run-1",
          "rule-1",
          "v1",
          null,
          "validated",
          "exact",
        ],
        [
          "benchmark-sized",
          "benchmark",
          "partial",
          '["evidence-2"]',
          80,
          null,
          null,
          null,
          "benchmark-1",
          "quantified",
          "range",
        ],
        [
          "calculated-no-rule",
          "calculated",
          "supported",
          '["evidence-3"]',
          900,
          "run-2",
          null,
          "v1",
          null,
          "validated",
          "exact",
        ],
        [
          "calculated-no-version",
          "calculated",
          "supported",
          '["evidence-4"]',
          300,
          "run-3",
          "rule-3",
          null,
          null,
          "validated",
          "exact",
        ],
        [
          "benchmark-signal",
          "benchmark",
          "supported",
          '["evidence-5"]',
          700,
          null,
          null,
          null,
          "benchmark-2",
          "signal",
          "not_sized",
        ],
        [
          "benchmark-not-sized",
          "benchmark",
          "supported",
          '["evidence-6"]',
          400,
          null,
          null,
          null,
          "benchmark-3",
          "validated",
          "not_sized",
        ],
        [
          "benchmark-no-refs",
          "benchmark",
          "supported",
          "[]",
          200,
          null,
          null,
          null,
          "benchmark-4",
          "validated",
          "exact",
        ],
        [
          "benchmark-no-evidence",
          "benchmark",
          "missing",
          '["evidence-8"]',
          150,
          null,
          null,
          null,
          "benchmark-5",
          "validated",
          "exact",
        ],
        [
          "not-recorded-signal",
          "not_recorded",
          "supported",
          '["evidence-9"]',
          600,
          null,
          null,
          null,
          null,
          "signal",
          "not_sized",
        ],
      ] as const;
      for (const [
        id,
        basis,
        evidence,
        refs,
        amount,
        run,
        rule,
        version,
        benchmark,
        stage,
        amountState,
      ] of cases) {
        insert.run(
          id,
          basis,
          evidence,
          refs,
          amount,
          run,
          rule,
          version,
          benchmark,
        );
        insertOpportunity.run(id, stage, amountState);
      }

      const sizingCte = between(
        "accepted_sizing AS (\n",
        "\n    ),\n    sourcing AS (",
      ).replace(/^accepted_sizing AS \(\n/, "");
      const annualValue = between(
        "COALESCE(accepted.amount_high_usd, accepted.amount_usd) AS annual_value_exposed",
        ",\n        COALESCE(accepted.amount_low_usd",
      );
      const actionAmount = between(
        "o.annual_value_exposed::numeric AS candidate_amount_usd",
        ",\n      o.priority",
      ).replace("::numeric", "");
      const storyline = between(
        "CREATE OR REPLACE VIEW source.source_page_storyline_v1 AS",
        "CREATE OR REPLACE VIEW source.contract_tab_intelligence_v1 AS",
      );
      const executiveAmount = storyline.match(
        /COALESCE\(sum\(candidate_amount_usd\), 0\)::numeric AS candidate_amount_usd/,
      )?.[0];
      if (!executiveAmount) throw new Error("Missing executive candidate sum");

      db.exec(`
        CREATE TEMP VIEW action_candidate AS
        WITH accepted_sizing AS (${sizingCte}),
        consumption_opportunity AS (
          SELECT o.opportunity_id, ${annualValue}
          FROM source.optimization_opportunity o
          LEFT JOIN accepted_sizing accepted
            ON accepted.tenant_key = o.tenant_key
           AND accepted.dataset_version = o.dataset_version
           AND accepted.opportunity_id = o.opportunity_id
        ),
        action_candidate AS (
          SELECT opportunity_id, ${actionAmount}
          FROM consumption_opportunity o
        )
        SELECT * FROM action_candidate
      `);
      const amounts = db
        .prepare(
          `
        SELECT opportunity_id, candidate_amount_usd FROM action_candidate
      `,
        )
        .all() as Array<{
        opportunity_id: string;
        candidate_amount_usd: number | null;
      }>;
      expect(
        Object.fromEntries(
          amounts.map((row) => [row.opportunity_id, row.candidate_amount_usd]),
        ),
      ).toEqual({
        "calculated-sized": 120,
        "benchmark-sized": 80,
        "calculated-no-rule": null,
        "calculated-no-version": null,
        "benchmark-signal": null,
        "benchmark-not-sized": null,
        "benchmark-no-refs": null,
        "benchmark-no-evidence": null,
        "not-recorded-signal": null,
      });
      const rows = db
        .prepare(
          `
        SELECT ${executiveAmount.replace("::numeric", "")}
        FROM action_candidate
      `,
        )
        .get() as { candidate_amount_usd: number };

      expect(rows.candidate_amount_usd).toBe(200);
    } finally {
      db.close();
    }
  });
});
