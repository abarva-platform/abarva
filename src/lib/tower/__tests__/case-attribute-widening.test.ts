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
    expect(READER).toMatch(/controlBlocker: payloadTextFrom\(row, \["control_blocker"\]\)/);
    expect(TYPES).toMatch(/controlBlocker: string \| null;/);
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
