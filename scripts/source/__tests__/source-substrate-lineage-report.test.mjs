import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateAssertions,
  queryParameterValuesForSource,
} from "../source-substrate-lineage-report.mjs";

const metrics = [
  { key: "portfolio_annual_value_usd", label: "Portfolio annual value" },
  { key: "contract_count", label: "Contract count" },
  { key: "vendor_count", label: "Vendor count" },
];

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
    expectedMetrics: metrics.slice(0, 1),
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
    expectedMetrics: metrics.slice(0, 1),
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups[0].status, "CONFLICT");
});

test("one source is uncorroborated", () => {
  const result = evaluateAssertions({
    assertions: [assertion({ value: 100 })],
    expectedMetrics: metrics.slice(0, 1),
    expectedTenants: ["skyharbor_global"],
  });

  assert.equal(result.groups[0].status, "ONE_SOURCE");
});

test("missing metric for expected tenant is absent", () => {
  const result = evaluateAssertions({
    assertions: [],
    expectedMetrics: metrics.slice(0, 1),
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
    expectedMetrics: [metrics[1]],
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
    expectedMetrics: [metrics[1]],
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
