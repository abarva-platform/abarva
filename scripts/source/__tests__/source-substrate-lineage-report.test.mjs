import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  assertionsFromSource,
  evaluateAssertions,
  METRICS as metrics,
  queryParameterValuesForSource,
  SOURCE_DEFINITIONS,
} from "../source-substrate-lineage-report.mjs";
const metricByKey = Object.fromEntries(
  metrics.map((metric) => [metric.key, metric]),
);

const REPORT_SOURCE = fs.readFileSync(
  "scripts/source/source-substrate-lineage-report.mjs",
  "utf8",
);

const declaredBasisDifferences = [
  {
    metric: "contract_count",
    bases: ["contract_row", "contract_family"],
    explanation: "Declared row-vs-family difference.",
  },
  {
    metric: "vendor_count",
    bases: ["vendor_ref", "vendor_family"],
    explanation: "Declared vendor-ref-vs-family difference.",
  },
  {
    metric: "total_committed_value_usd",
    bases: ["committed_value_total", "committed_value_contract_family_total"],
    explanation: "Declared row-vs-family committed value difference.",
  },
  {
    metric: "auto_renew_contract_count",
    bases: ["contract_row", "contract_family"],
    explanation: "Declared row-vs-family auto-renew count difference.",
  },
  {
    metric: "opportunity_amount_usd",
    bases: [
      "opportunity_row_amount_total",
      "opportunity_potential_valuation_total",
    ],
    explanation: "Declared opportunity spine-vs-valuation difference.",
  },
  {
    metric: "finance_confirmed_value_usd",
    bases: [
      "opportunity_finance_confirmed_valuation_total",
      "finance_realization_total",
    ],
    explanation: "Declared finance valuation-vs-realization difference.",
  },
];

function assertion(overrides) {
  return {
    tenant: "skyharbor_global",
    metric: "portfolio_annual_value_usd",
    basis: "annual_value_total",
    value: 1_000_000,
    sourceId: "source.a",
    sourceLabel: "Source A",
    table: "source.a",
    ...overrides,
  };
}

test("same metric and same basis agree within tolerance", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({ value: 100 }),
      assertion({ value: 101, sourceId: "source.b" }),
    ],
    expectedMetrics: [metricByKey.portfolio_annual_value_usd],
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].status, "AGREE");
});

test("same metric and same basis conflict outside tolerance", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({ value: 100 }),
      assertion({ value: 130, sourceId: "source.b" }),
    ],
    expectedMetrics: [metricByKey.portfolio_annual_value_usd],
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups[0].status, "CONFLICT");
});

test("one source is uncorroborated", () => {
  const result = evaluateAssertions({
    assertions: [assertion({ value: 100 })],
    expectedMetrics: [metricByKey.portfolio_annual_value_usd],
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups[0].status, "ONE_SOURCE");
});

test("missing metric for expected tenant is absent", () => {
  const result = evaluateAssertions({
    assertions: [],
    expectedMetrics: [metricByKey.portfolio_annual_value_usd],
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].status, "ABSENT");
});

test("different contract count bases are declared and not marked as conflict", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "contract_count",
        basis: "contract_row",
        value: 119,
        sourceId: "source.contract_360",
      }),
      assertion({
        metric: "contract_count",
        basis: "contract_family",
        value: 100,
        sourceId: "consumption_v4_canary.sourcing_contract_v1",
      }),
    ],
    expectedMetrics: [metricByKey.contract_count],
    expectedTenants: ["skyharbor_global"],
    declaredBasisDifferences,
  });

  assert.deepEqual(
    result.groups.map((group) => group.status).sort(),
    ["ONE_SOURCE", "ONE_SOURCE"],
  );
  assert.equal(result.basisDifferences.length, 1);
  assert.equal(result.basisDifferences[0].declared, true);
});

test("same basis conflict still wins even when another declared basis exists", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "contract_count",
        basis: "contract_row",
        value: 119,
        sourceId: "source.contract_360",
      }),
      assertion({
        metric: "contract_count",
        basis: "contract_row",
        value: 130,
        sourceId: "source.vendor_contract_portfolio",
      }),
      assertion({
        metric: "contract_count",
        basis: "contract_family",
        value: 100,
        sourceId: "consumption_v4_canary.sourcing_contract_v1",
      }),
    ],
    expectedMetrics: [metricByKey.contract_count],
    expectedTenants: ["skyharbor_global"],
    declaredBasisDifferences,
  });

  const rowGroup = result.groups.find((group) => group.basis === "contract_row");
  const familyGroup = result.groups.find(
    (group) => group.basis === "contract_family",
  );

  assert.equal(rowGroup.status, "CONFLICT");
  assert.equal(familyGroup.status, "ONE_SOURCE");
  assert.equal(result.basisDifferences[0].declared, true);
});

test("query parameters match the highest SQL placeholder used by a source", () => {
  const tenant = { aliases: ["skyharbor_global", "skyharbor"] };
  const supplementalVendorRefs = ["SUPPLEMENTAL"];

  assert.deepEqual(
    queryParameterValuesForSource(
      { sql: "SELECT 1 WHERE tenant_key = ANY($1::text[])" },
      tenant,
      supplementalVendorRefs,
    ),
    [tenant.aliases],
  );

  assert.deepEqual(
    queryParameterValuesForSource(
      {
        sql: `
          SELECT 1
          WHERE tenant_key = ANY($1::text[])
            AND NOT (vendor_ref = ANY($2::text[]))
        `,
      },
      tenant,
      supplementalVendorRefs,
    ),
    [tenant.aliases, supplementalVendorRefs],
  );
});

test("vendor portfolio counts distinct vendor refs, not portfolio rows", () => {
  const source = SOURCE_DEFINITIONS.find(
    (definition) => definition.id === "source.vendor_contract_portfolio",
  );

  assert.ok(source);
  assert.match(source.sql, /COUNT\(DISTINCT vendor_ref\)::numeric AS vendor_count/);
});

test("total committed and auto-renew row-vs-family differences are declared, not false conflicts", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "total_committed_value_usd",
        basis: "committed_value_total",
        value: 5_307_815_900,
        sourceId: "source.contract_360",
      }),
      assertion({
        metric: "total_committed_value_usd",
        basis: "committed_value_contract_family_total",
        value: 5_151_584_904,
        sourceId: "consumption_v4_canary.sourcing_contract_v1",
      }),
      assertion({
        metric: "auto_renew_contract_count",
        basis: "contract_row",
        value: 45,
        sourceId: "source.contract_360",
      }),
      assertion({
        metric: "auto_renew_contract_count",
        basis: "contract_family",
        value: 12,
        sourceId: "consumption_v4_canary.sourcing_contract_v1",
      }),
    ],
    expectedMetrics: [
      metricByKey.total_committed_value_usd,
      metricByKey.auto_renew_contract_count,
    ],
    expectedTenants: ["skyharbor_global"],
    declaredBasisDifferences,
  });

  assert.equal(
    result.groups.some((group) => group.status === "CONFLICT"),
    false,
  );
  assert.equal(result.basisDifferences.length, 2);
  assert.deepEqual(
    result.basisDifferences.map((diff) => diff.metric).sort(),
    ["auto_renew_contract_count", "total_committed_value_usd"],
  );
  assert.equal(
    result.basisDifferences.every((diff) => diff.declared),
    true,
  );
});

test("source definitions include optimization opportunity and evidence readiness substrates", () => {
  const ids = SOURCE_DEFINITIONS.map((definition) => definition.id);

  assert.ok(ids.includes("source.optimization_opportunity"));
  assert.ok(ids.includes("source.opportunity_valuation"));
  assert.ok(ids.includes("source.finance_realization"));
  assert.ok(ids.includes("source.opportunity_requirement_status"));
  assert.ok(ids.includes("source.opportunity_evidence"));
});

test("source substrate lineage report emits an ACA structured proof event", () => {
  assert.match(
    REPORT_SOURCE,
    /structured_event:\s*"source_substrate_lineage_report"/,
  );
});

test("package audit script enables stdout structured-event extraction", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.match(
    pkg.scripts["audit:source-substrate-lineage"],
    /SOURCE_SUBSTRATE_LINEAGE_EMIT_STRUCTURED_EVENT=1/,
  );
});

test("source rows with zero source row count are absent, not zero", () => {
  const source = {
    id: "source.empty",
    label: "Empty source",
    table: "source.empty",
    basisByMetric: { contract_count: "contract_row" },
  };

  assert.deepEqual(
    assertionsFromSource("skyharbor_global", source, [
      { __source_row_count: "0", contract_count: "0" },
    ]),
    [],
  );
});

test("row-backed zero is a quoteable assertion", () => {
  const source = {
    id: "source.zero",
    label: "Zero source",
    table: "source.zero",
    basisByMetric: { evidence_gap_count: "requirement_status_gap_row" },
  };

  assert.deepEqual(
    assertionsFromSource("skyharbor_global", source, [
      { __source_row_count: "7", evidence_gap_count: "0" },
    ]),
    [
      {
        tenant: "skyharbor_global",
        metric: "evidence_gap_count",
        basis: "requirement_status_gap_row",
        value: 0,
        sourceId: "source.zero",
        sourceLabel: "Zero source",
        table: "source.zero",
      },
    ],
  );
});

test("opportunity amount same-basis disagreement is a conflict", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "opportunity_amount_usd",
        basis: "opportunity_row_amount_total",
        value: 6_800_000,
        sourceId: "source.optimization_opportunity",
      }),
      assertion({
        metric: "opportunity_amount_usd",
        basis: "opportunity_row_amount_total",
        value: 5_900_000,
        sourceId: "source.contract_360_projection",
      }),
    ],
    expectedMetrics: [metricByKey.opportunity_amount_usd],
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups[0].status, "CONFLICT");
});

test("opportunity amount spine-vs-valuation difference is declared", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "opportunity_amount_usd",
        basis: "opportunity_row_amount_total",
        value: 6_800_000,
        sourceId: "source.optimization_opportunity",
      }),
      assertion({
        metric: "opportunity_amount_usd",
        basis: "opportunity_potential_valuation_total",
        value: 6_800_000,
        sourceId: "source.opportunity_valuation",
      }),
    ],
    expectedMetrics: [metricByKey.opportunity_amount_usd],
    expectedTenants: ["skyharbor_global"],
    declaredBasisDifferences,
  });

  assert.equal(
    result.groups.some((group) => group.status === "CONFLICT"),
    false,
  );
  assert.equal(result.basisDifferences.length, 1);
  assert.equal(result.basisDifferences[0].declared, true);
});

test("evidence readiness counts can be proven independently", () => {
  const result = evaluateAssertions({
    assertions: [
      assertion({
        metric: "evidence_requirement_count",
        basis: "requirement_status_required_row",
        value: 7,
        sourceId: "source.opportunity_requirement_status",
      }),
      assertion({
        metric: "evidence_ready_count",
        basis: "requirement_status_met_row",
        value: 7,
        sourceId: "source.opportunity_requirement_status",
      }),
      assertion({
        metric: "evidence_gap_count",
        basis: "requirement_status_gap_row",
        value: 0,
        sourceId: "source.opportunity_requirement_status",
      }),
    ],
    expectedMetrics: [
      metricByKey.evidence_requirement_count,
      metricByKey.evidence_ready_count,
      metricByKey.evidence_gap_count,
    ],
    expectedTenants: ["skyharbor_global"],
  });

  assert.deepEqual(
    result.groups.map((group) => group.status),
    ["ONE_SOURCE", "ONE_SOURCE", "ONE_SOURCE"],
  );
});
