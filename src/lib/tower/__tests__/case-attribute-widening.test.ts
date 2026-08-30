/**
 * The Tower read path carries the attributes products reason about, and stops substituting
 * one metric for another when a value is absent.
 *
 * Two things this pins:
 *
 * 1. `gating_constraint` reaches the view. Across the portfolio it — not the readiness score — is
 *    what separates a validated case from a blocked one: every case whose constraint was
 *    "Finance value treatment" reached validation, and none of the other four constraints did.
 *    It was dropped at the Layer 1 canonical projection and never reached a product.
 *
 * 2. Readiness no longer falls back to the adoption rate and then to a literal 25. Substituting a
 *    different metric for a missing one, then inventing a number when that is missing too, is the
 *    defect class this product exists to prevent — and it is why the shipped AI Portfolio showed
 *    only two distinct readiness values across every row.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../../../..");
const read = (rel: string) => fs.readFileSync(path.resolve(ROOT, rel), "utf-8");

const GENERATOR = read("scripts/tower/generate-meridian-layer1-source.mjs");
const LAYER4 = read("scripts/tower/load-healthcare-demo-layer4-products.mjs");
const READER = read("src/lib/tower/readTowerCommandCenter.ts");
const VIEW = read("src/lib/tower/command-center/view-model.ts");
const TYPES = read("src/lib/tower/command-center/types.ts");

describe("gating_constraint survives every layer", () => {
  it("is written into the canonical use-case projection", () => {
    expect(GENERATOR).toMatch(/gating_constraint: row\.gating_constraint/);
  });
  it("is carried into the Layer 4 display payload", () => {
    expect(LAYER4).toMatch(/gating_constraint: row\.gating_constraint/);
  });
  it("is read out of the serving payload", () => {
    expect(READER).toMatch(/gatingConstraint: payloadTextFrom\(row, \["gating_constraint"\]\)/);
  });
  it("reaches the command-center view and its type", () => {
    expect(VIEW).toMatch(/gatingConstraint: item\.gatingConstraint \?\? null/);
    expect(TYPES).toMatch(/gatingConstraint: string \| null;/);
  });
});

describe("control_blocker survives every layer", () => {
  it("is written into the canonical tool projection", () => {
    expect(GENERATOR).toMatch(/control_blocker: row\.control_blocker/);
  });
  it("is carried into the Layer 4 tool payload", () => {
    expect(LAYER4).toMatch(/control_blocker: tool\.control_blocker \?\? null/);
  });
  it("reaches the view", () => {
    expect(READER).toMatch(/payloadTextFrom\(row, \["control_blocker"\]\)/);
    expect(TYPES).toMatch(/controlBlocker: string \| null;/);
  });

  it("does not treat the asserted value `none` as a named blocker", () => {
    // `none` means the rollout was reviewed and nothing was found. Read as a name it painted a
    // cleared rollout in alarm red and inflated the vendor panel's blocked count.
    expect(READER).toMatch(/trim\(\)\.toLowerCase\(\) === "none" \? null : raw/);
    expect(TYPES).toMatch(/controlBlockerReviewed: boolean;/);
  });

  it("keeps reviewed-and-clear distinct from never-recorded", () => {
    const format = read("src/lib/tower/command-center/format.ts");
    expect(format).toContain("None found");
    expect(format).toContain("Not loaded");
    // Only a named blocker is red.
    expect(format).toMatch(/blocked: "var\(--canon-red\)"/);
    expect(format).toMatch(/clear: "var\(--canon-teal-dark\)"/);
  });

  it("counts a vendor's blockers by whether one was named", () => {
    const vendor = read("src/components/tower/command-center/views/ToolsVendorPanel.tsx");
    expect(vendor).toContain("item.controlBlocker !== null ? 1 : 0");
    expect(vendor).not.toContain("item.controlBlocker ? 1 : 0");
  });

  it("labels every category on the vendor chart", () => {
    // Recharts drops colliding ticks by default, which left the largest vendor unlabelled.
    const vendor = read("src/components/tower/command-center/views/ToolsVendorPanel.tsx");
    expect(vendor).toMatch(/type="category"[^>]*interval=\{0\}/);
  });

  it("names no internal type on the client surface", () => {
    const vendor = read("src/components/tower/command-center/views/ToolsVendorPanel.tsx");
    const rendered = vendor.slice(vendor.indexOf("export function ToolsVendorPanel"));
    expect(rendered).not.toContain("TowerAiView");
  });
});

describe("readiness and risk are no longer substituted or invented", () => {
  it("readiness reads only its own key", () => {
    expect(READER).toMatch(
      /readinessScore: payloadNullableNumberFrom\(row, \["readiness_score"\]\)/,
    );
  });

  it("readiness does not fall back to an adoption rate", () => {
    const site = READER.slice(READER.indexOf("readinessScore:"));
    expect(site.slice(0, 240)).not.toMatch(/adoption_rate_percent|adoption_actual_pct/);
  });

  it("neither score defaults to a literal", () => {
    expect(READER).not.toMatch(/"adoption_actual_pct",\s*\]\) \?\? 25/);
    expect(READER).not.toMatch(/"risk_pressure_score"\]\) \?\?\s*40/);
  });

  it("absence is reported to the UI rather than rendered as zero", () => {
    expect(VIEW).toMatch(/readinessScoreLoaded: item\.readinessScore !== null/);
    expect(TYPES).toMatch(/readinessScoreLoaded: boolean;/);
  });
});

/**
 * `financeStatus` must read its own key, never the funding-status chain.
 *
 * `fundingStatus` resolves `funding_status ?? finance_status ?? review_state` — three different
 * things behind one name. On a case `funding_status` is the committee decision (fund / challenge /
 * defer); on a tool rollout it is the rollout stage (pilot / scale). So that chain never yields a
 * finance status for a case, and yields a non-null value for every row.
 *
 * That mattered twice on live data: the Verdict pipeline bucketed committee decisions against
 * finance statuses and rendered five empty rows, and a population filter built on "only cases carry
 * a status" counted 55 rows where the portfolio has 42.
 */
describe("financeStatus is not the funding-status chain", () => {
  it("reads finance_status directly in the reader", () => {
    expect(READER).toMatch(
      /financeStatus: payloadTextFrom\(row, \["finance_status"\]\)/,
    );
  });

  it("does not source it from fundingStatus in the view model", () => {
    expect(VIEW).not.toMatch(/financeStatus: item\.fundingStatus/);
    expect(VIEW).toMatch(/financeStatus: item\.financeStatus \?\? null/);
  });

  it("keeps fundingStatus separate rather than merging the two", () => {
    // fundingStatus still exists and still has its fallback chain; the point is that
    // financeStatus no longer borrows from it.
    expect(READER).toMatch(/fundingStatus:/);
    const site = READER.slice(READER.indexOf("financeStatus: payloadTextFrom"));
    expect(site.slice(0, 120)).not.toMatch(/funding_status|review_state/);
  });
});

describe("tool rollout adoption target and supported-case count", () => {
  const panel = read("src/components/tower/command-center/views/ToolsTablePanel.tsx");

  it("reads the adoption target and case count from the source row", () => {
    const reader = read("src/lib/tower/readTowerCommandCenter.ts");
    expect(reader).toContain('payloadNullableNumberFrom(row, ["adoption_target_pct"])');
    expect(reader).toContain('"linked_business_case_count"');
  });

  it("does not infer a supported-case count from a shared vendor or system name", () => {
    // The count is asserted on the row. A vendor-name match counts every other row from the
    // same vendor, which is not a relationship — and reads as one on a CXO surface.
    expect(panel).not.toContain("other.vendor === item.vendor");
    expect(panel).not.toContain("other.system === item.system");
  });

  it("derives the below-target headline instead of hardcoding its inputs", () => {
    // `const loadedTargets = 0` made the "below their own target" branch unreachable, so the
    // panel claimed targets were absent whatever the data held.
    expect(panel).not.toMatch(/const\s+(loadedTargets|belowTarget)\s*=\s*0\s*;/);
    expect(panel).toContain("row.targetPct !== null");
  });

  it("never labels an adoption reading as measured against an unloaded target", () => {
    expect(panel).not.toContain("vs Not loaded");
  });
});

describe("an unrecorded number is not zero", () => {
  const contract = read("src/components/tower/command-center/views/ContractTabs.tsx");

  it("does not print a risk score the source never wrote", () => {
    // Layer 4 writes no `risk_score` for any row, so `num(null)` made every one of the governed
    // rows read `0%` — the safest-looking value in the table, on every line of it.
    expect(LAYER4).not.toMatch(/\brisk_score\b/);
    expect(contract).toContain('item.riskScoreLoaded ? formatPct(item.riskScore) : "Not scored"');
  });

  it("does not print a readiness score the source never wrote", () => {
    expect(contract).toMatch(/item\.readinessScoreLoaded\s*\n?\s*\?\s*formatPct\(item\.readinessScore\)/);
  });

  it("does not print $0 for spend that was never recorded", () => {
    // A tool rollout carries no cost at all. `$0` is a claim about price; this is a gap.
    expect(contract).toContain('item.aiSpendLoaded ? formatUsdM(item.aiSpendUsd) : "Not loaded"');
  });

  it("derives the spend flag where the null still exists", () => {
    // The value stays coerced because portfolio totals sum it, so the flag cannot be recovered
    // downstream — it has to be captured in the reader.
    expect(READER).toContain("const aiSpendLoaded =");
    expect(READER).toContain("approvedFundingRaw !== null || monthlyCostRaw !== null");
  });
});
