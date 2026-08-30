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

  it("derives the spend flag from what Layer 4 asserted, not from the row's columns", () => {
    // `payload_json` is `to_jsonb(p)`, so it carries the projection table's own
    // `monthly_cost_usd` column for every row. Reading through it made every tool rollout look
    // funded and render "$0". `display_payload_json` carries only what the loader wrote: a case
    // payload has `approved_funding_usd`, a rollout payload has no cost key at all.
    expect(READER).toContain("const aiSpendLoaded =");
    expect(READER).toMatch(/aiSpendLoaded =\s*\n?\s*displayNullableNumberFrom\(row, \[/);
    expect(READER).not.toContain("approvedFundingRaw !== null || monthlyCostRaw !== null");
  });

  it("keeps the display-only reader from falling back to the row body", () => {
    const body = READER.slice(
      READER.indexOf("function displayNullableNumberFrom"),
      READER.indexOf("function payloadNullableNumberFrom"),
    );
    expect(body).toContain("displayPayload(row)");
    expect(body).not.toContain("payload(row)");
  });
});

describe("the owner queue counts cases, not rollouts", () => {
  const panel = read("src/components/tower/command-center/views/QueueOwnerPanel.tsx");

  it("excludes rows that carry no finance status", () => {
    // A tool rollout has a business owner but no investment, no sponsor-stated value and no
    // finance status. Under a column headed CASES it added a row contributing only the count,
    // and hasOpenProof returned true for every one because a rollout never carries a benefit
    // claim — turning 42 cases into 55 and the queue into 47.
    expect(panel).toContain("if (item.financeStatus === null) continue;");
  });

  it("takes its denominator from the same population as its rows", () => {
    expect(panel).not.toContain("const total = view.allInitiatives.length;");
    expect(panel).toContain("rows.reduce((sum, row) => sum + row.count, 0)");
  });
});

describe("one metric, declared", () => {
  const files = {
    "CommandCenterView.tsx": read(
      "src/components/tower/command-center/views/CommandCenterView.tsx",
    ),
    "ContractTabs.tsx": read(
      "src/components/tower/command-center/views/ContractTabs.tsx",
    ),
    "TowerCommandCenter.tsx": read(
      "src/components/tower/command-center/TowerCommandCenter.tsx",
    ),
  };

  it("never falls back from attributed AI spend to AI-tagged spend", () => {
    // Different measures. `||` also swaps on a legitimate zero, so the figure a reader sees is
    // not the one the label names, and nothing on the page says which one it got.
    for (const [name, source] of Object.entries(files)) {
      expect([name, source.includes("aiAttributedInitiativeSpendUsd || ")]).toEqual([name, false]);
      // `?? null` is honest absence; `?? someOtherMetric` is a substitution.
      expect([name, /aiAttributedInitiativeSpendUsd \?\? (?!null)/.test(source)]).toEqual([name, false]);
    }
  });

  it("never falls back from the tracked asset count to the row count", () => {
    for (const [name, source] of Object.entries(files)) {
      expect([name, source.includes("aiInitiativeCount || ")]).toEqual([name, false]);
      expect([name, /aiInitiativeCount \?\? (?!null)/.test(source)]).toEqual([name, false]);
    }
  });

  it("never falls back from blocked value to value at stake", () => {
    expect(files["ContractTabs.tsx"]).not.toContain("blockedUsd || program.valueAtStakeUsd");
  });
});

describe("a domain is not a sponsor", () => {
  it("reads the domain column from the loader's domain_name", () => {
    // The column headed DOMAIN listed people — "Chief Data and AI Officer", "CMIO",
    // "VP Controller" — because `functionLabel` was mapped from `ownerRole`, while the loader
    // was writing a real `domain_name` onto the same display payload.
    expect(READER).toContain('domainName: nullableText(display.domain_name)');
    expect(VIEW).toContain("functionLabel: trimOrNull(row.domainName ?? null)");
  });

  it("does not fall back to the sponsor when the domain is absent", () => {
    // The panel already renders "Domain not loaded"; substituting the sponsor is the defect.
    expect(VIEW).not.toMatch(/functionLabel:[^\n]*ownerRole/);
  });

  it("still carries the domain the loader writes onto the case display payload", () => {
    expect(LAYER4).toContain("domain_name: project?.domain_name ?? row.domain_key");
  });
});

describe("the spend flag survives the view model", () => {
  it("carries the reader's flag instead of recomputing it from a non-nullable field", () => {
    // `aiTaggedSpendUsd` is typed `number`. `item.aiTaggedSpendUsd !== null` is therefore always
    // true, and TypeScript does not object — so the view model silently discarded the reader's
    // derivation and every row rendered as funded. Two fixes to the reader had no effect because
    // both were downstream of this line.
    expect(VIEW).toContain("aiSpendLoaded: item.aiSpendLoaded ?? false");
    expect(VIEW).not.toContain("aiSpendLoaded: item.aiTaggedSpendUsd !== null");
  });

  it("does not derive any loaded-flag from a non-nullable number", () => {
    // The whole class: a `!== null` test on a field the type says is never null.
    const nonNullable = ["aiTaggedSpendUsd", "aiSpendUsd", "financeValidatedValueUsd"];
    for (const field of nonNullable) {
      expect([field, VIEW.includes(`Loaded: item.${field} !== null`)]).toEqual([field, false]);
    }
  });
});

describe("the projection schema reference does not silently rot", () => {
  const doc = read("docs/architecture/TOWER_PROJECTION_SCHEMA_REFERENCE.md");
  const TOWER_TABLES = [
    "tower_ai_portfolio",
    "tower_command_center",
    "tower_value_chain",
    "tower_evidence_queue",
  ];

  it("still describes every table Tower reads", () => {
    for (const t of TOWER_TABLES) {
      expect([t, doc.includes(t)]).toEqual([t, true]);
    }
  });

  it("stops claiming no migration exists once one does", () => {
    // The document's central claim is that these tables are unversioned. The day a migration
    // lands, that claim becomes false and the document has to be revisited rather than left
    // asserting something the repository contradicts.
    const migrations = fs.existsSync(path.resolve(ROOT, "supabase/migrations"))
      ? fs.readdirSync(path.resolve(ROOT, "supabase/migrations"))
      : [];
    const creates = migrations.some((file) => {
      const sql = read(`supabase/migrations/${file}`);
      return TOWER_TABLES.some((t) =>
        sql.includes(`create table if not exists ecl_projection.${t}`),
      );
    });
    expect([creates, doc.includes("not yet a migration")]).toEqual([creates, !creates]);
  });
});
