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

  it("does not print risk as an independent portfolio score", () => {
    // Layer 4 writes no `risk_score` for any row, so `num(null)` made every one of the governed
    // rows read `0%` — the safest-looking value in the table, on every line of it.
    expect(LAYER4).not.toMatch(/\brisk_score\b/);
    expect(contract).not.toContain("formatPct(item.riskScore)");
    expect(contract).toContain("controlBlockerCell(item)");
  });

  it("does not print a readiness score the source never wrote", () => {
    expect(contract).toMatch(/item\.readinessScoreLoaded\s*\n?\s*\?\s*formatPct\(item\.readinessScore\)/);
  });

  it("does not print $0 for spend that was never recorded", () => {
    // A tool rollout carries no cost at all. `$0` is a claim about price; this is a gap.
    expect(contract).toMatch(
      /item\.aiSpendLoaded\s*\?\s*formatUsdM\(item\.aiSpendUsd\)\s*:\s*"Not loaded"/,
    );
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
      // Generated SQL quotes its identifiers: `"ecl_projection"."tower_ai_portfolio"`. Matching
      // only the unquoted spelling reports that no migration exists while one sits in the same
      // directory — which is the answer this guard is here to prevent anyone believing.
      return TOWER_TABLES.some((t) =>
        new RegExp(
          `create table if not exists "?ecl_projection"?\\."?${t}"?`,
          "i",
        ).test(sql),
      );
    });
    // The document's claim has to track the repository. A migration now exists, so the document
    // must no longer say one does not — and if the migration were ever removed, it must say so
    // again. Either half drifting is the failure this guards.
    expect([creates, doc.includes("no migration in this repository")]).toEqual([
      creates,
      !creates,
    ]);
  });
});

describe("the active assessment is declared, not inferred", () => {
  const migration = read(
    "supabase/migrations/20260830050000_tower_assessment_lifecycle.sql",
  );

  it("declares at most one active generation per tenant, in the database", () => {
    // Nothing previously prevented two active generations; the ranking silently picked one.
    expect(migration).toMatch(
      /create unique index if not exists tower_assessment_lifecycle_one_active[\s\S]*?where state = 'active'/,
    );
  });

  it("keeps retired distinct from active, and dated", () => {
    expect(migration).toContain("check (state in ('active', 'retired'))");
    expect(migration).toContain("check ((state = 'retired') = (retired_at is not null))");
  });

  it("lets a declaration beat the ranking", () => {
    // The declared branch is unconditional; the inferred branch is gated on the absence of a
    // declaration. If that `not exists` were ever dropped, both branches would return rows and
    // a retired generation would reappear alongside the active one.
    expect(migration).toContain("where l.state = 'active'");
    expect(migration).toMatch(
      /and not exists \([\s\S]*?tower_assessment_lifecycle declared[\s\S]*?state = 'active'/,
    );
  });

  it("carries a real tenant policy rather than RLS with no policy", () => {
    // The four sibling projection tables have RLS on and zero policies, which denies reads to any
    // role that does not bypass RLS and leaves isolation resting on the reader's where-clause.
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("create policy tower_assessment_lifecycle_tenant_select");
    expect(migration).toContain("current_setting('app.tenant_key', true)");
  });

  it("does not move any tenant's reads on the day it lands", () => {
    // The fallback must be the prior ranking verbatim, or this migration is a behaviour change
    // disguised as a structural one.
    for (const signal of [
      "candidates.priority desc",
      "candidates.projection_version desc",
      "candidates.created_at desc",
      "candidates.assessment_id desc",
    ]) {
      expect([signal, migration.includes(signal)]).toEqual([signal, true]);
    }
  });
});

describe("risk is not readiness printed twice", () => {
  const contract = read("src/components/tower/command-center/views/ContractTabs.tsx");

  it("does not render risk pressure beside readiness", () => {
    // Layer 4 writes `risk_pressure_score` as `100 - readiness_score`. Rendered next to readiness
    // under its own heading, every pair on the live page summed to exactly 100 — two columns
    // presenting one number as two independent assessments of a case.
    expect(contract).not.toContain("formatPct(program.riskPressureScore)");
  });

  it("fails if the upstream ever makes risk a real measurement", () => {
    // The day `risk_pressure_score` stops being the complement of readiness it becomes worth
    // showing again, and this guard is how that gets noticed rather than staying hidden.
    expect(LAYER4).toContain("risk_pressure_score: sqlNum(100 - num(row.readiness_score))");
  });

  it("still writes no risk_score anywhere", () => {
    expect(LAYER4).not.toMatch(/\brisk_score\b/);
  });
});

describe("the rules hold across every panel, not just the ones already fixed", () => {
  const VIEW_DIR = "src/components/tower/command-center/views";
  const panels = fs
    .readdirSync(path.resolve(ROOT, VIEW_DIR))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => [f, read(`${VIEW_DIR}/${f}`)] as const);

  it("has panels to check", () => {
    expect(panels.length).toBeGreaterThan(8);
  });

  it("never substitutes one metric for another with || or ??", () => {
    // Named-field guards only catch the fields you thought of. Three substitutions survived an
    // earlier sweep because they used different field names: fundedAmountUsd || fundedUsd,
    // totalProgramSubjectCount || programCount, and a queue count falling back to the combined
    // length of two unrelated arrays. This matches the shape instead.
    //
    // A sort comparator (`a.x - b.x || a.y - b.y`) is the standard tiebreak idiom and is excluded.
    // The rule is about substituting one *metric* for another. A literal fallback is a different
    // thing: `|| 1` guards a denominator, `?? null` and `|| 0` state absence. Only a fallback to
    // another field is a substitution.
    // Matched positively: the right-hand side must itself be a field reference. A negative
    // lookahead does not work here — `\s*` backtracks to zero width and tests the space rather
    // than the token after it, so `|| 1` reads as a substitution when it is a denominator guard.
    const SUBSTITUTION =
      /\b(?:s|item|row|view|program|summary)\.[a-zA-Z]+(?:Usd|Count|Score|Pct)\s*(?:\|\||\?\?)\s*[a-zA-Z_$][\w$]*\.[a-zA-Z]/;
    for (const [name, source] of panels) {
      const offending = source
        .split("\n")
        .filter((line) => !/[-+]\s*[a-z]|=>|\.sort\(|localeCompare/.test(line))
        .filter((line) => SUBSTITUTION.test(line));
      expect([name, offending]).toEqual([name, []]);
    }
  });

  it("names no internal type or layer on a client surface", () => {
    // "view model", "payload", a Tower* type name — vocabulary from the build, where a CXO reads.
    const BUILDER = /(view model|viewModel|payload_json|display_payload|mart row|projection row)/i;
    for (const [name, source] of panels) {
      const rendered = source
        .split("\n")
        .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
        .filter((line) => BUILDER.test(line));
      expect([name, rendered]).toEqual([name, []]);
    }
  });

  it("gates no headline on a hardcoded constant", () => {
    // `const loadedTargets = 0` made a headline branch unreachable, so the panel could only ever
    // state one of its two conclusions whatever the data held.
    for (const [name, source] of panels) {
      // The name must be captured to be back-referenced. Without the group the `\1` never
      // matches anything and the guard silently always passes — the same defect it exists to
      // catch, one level up.
      const DEAD_GATE = /const\s+([a-zA-Z]+)\s*=\s*0;[\s\S]{0,400}?\b\1\s*[><]/;
      expect([name, DEAD_GATE.test(source)]).toEqual([name, false]);
    }
  });
});

describe("the loader declares the generation it just wrote", () => {
  it("retires the prior generation before activating this one", () => {
    // A partial unique index permits one active generation per tenant. Activating before retiring
    // would be rejected — so the order is load-bearing, not stylistic.
    const retire = LAYER4.indexOf("set state = 'retired'");
    const activate = LAYER4.indexOf("insert into ecl_projection.tower_assessment_lifecycle");
    expect(retire).toBeGreaterThan(-1);
    expect(activate).toBeGreaterThan(retire);
  });

  it("does not retire the generation it is about to activate", () => {
    // Without this the reload of an existing generation would retire and then re-activate itself,
    // losing its original activation date for no reason.
    expect(LAYER4).toContain(
      "and not (assessment_id = ${assessment} and projection_version = ${PROJECTION_VERSION})",
    );
  });

  it("declares inside the same transaction as the rows it describes", () => {
    // A generation that fails to load must never be declared active. The declaration sits between
    // the last insert and the commit.
    const declare = LAYER4.indexOf("lifecycleDeclarationSql(options),");
    const commit = LAYER4.indexOf('"commit;",');
    expect(declare).toBeGreaterThan(-1);
    expect(commit).toBeGreaterThan(declare);
  });

  it("loads unchanged where the lifecycle table does not exist", () => {
    expect(LAYER4).toContain(
      "if to_regclass('ecl_projection.tower_assessment_lifecycle') is null then",
    );
  });
});

describe("the initiative drill-down carries what the canonical layer already had", () => {
  const drawer = read(
    "src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx",
  );

  it("carries each detail field from its own canonical column", () => {
    // canonical_projects and canonical_ai_use_cases held all five of these before the payload
    // dropped them. Each reads its own key; none falls back to another.
    for (const field of [
      "project_name",
      "lifecycle_stage",
      "finance_partner_role",
      "success_metric",
      "payback_months_target",
    ]) {
      expect([field, LAYER4.includes(field)]).toEqual([field, true]);
      expect([field, READER.includes(`"${field}"`)]).toEqual([field, true]);
    }
  });

  it("drops an observation that cannot be placed in time", () => {
    // A month-less observation cannot be read as part of a sequence, and a sequence is the
    // entire point of showing the waterfall by month.
    expect(READER).toContain("if (month === null) return null;");
  });

  it("says so when no observation is recorded, instead of drawing an empty frame", () => {
    expect(drawer).toContain("No monthly value observations are recorded");
    expect(drawer).toContain("measurement gap, not evidence");
  });

  it("renders absence as absence in every new detail row", () => {
    for (const field of [
      "a.projectName ?? \"Not recorded\"",
      "a.lifecycleStage ?? \"Not recorded\"",
      "a.financePartnerRole ?? \"Not recorded\"",
      "a.successMetric ?? \"Not recorded\"",
    ]) {
      expect([field, drawer.includes(field)]).toEqual([field, true]);
    }
  });
});

describe("the finance trail and evidence reach the drill-down", () => {
  const drawer = read(
    "src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx",
  );

  it("reads two canonical files the Layer 4 build had never opened", () => {
    expect(LAYER4).toContain("canonical_finance_approval_events.csv");
    expect(LAYER4).toContain("canonical_evidence_items.csv");
  });

  it("puts only business-case evidence on a business case", () => {
    // The evidence file points at projects and monthly observations too — 154 of its 196 rows.
    // Joining without the type filter would hang a project's evidence off a case.
    expect(LAYER4).toContain('row.related_object_type === "business_case"');
  });

  it("carries a recorded zero as a recorded zero", () => {
    // 28 of the 84 events record a literal 0 and none is empty. That is a stated amount, so
    // rendering it as absent would be inventing a gap the source does not have.
    expect(READER).toContain("nullableNum(e.amount_usd as Numeric) ?? 0");
  });

  it("says so when a case has no finance event, rather than implying none was needed", () => {
    expect(drawer).toContain("No finance events are recorded against this case");
  });

  it("does not rename canonical event types, only spaces them", () => {
    expect(drawer).toContain('value.replace(/_/g, " ")');
  });
});

describe("the outcome fields survive the canonical layer", () => {
  const generator = read("scripts/tower/generate-meridian-layer1-source.mjs");
  const drawer = read(
    "src/components/tower/command-center/drawers/AiInitiativeDrawer.tsx",
  );

  it("carries the money row and the operating metric into canonical", () => {
    // These were in Layer 1 and dropped when canonical was built, so the value story survived the
    // adapter boundary and the operational one did not.
    for (const field of [
      "actual_spend_ytd_usd: row.actual_spend_ytd_usd",
      "forecast_spend_usd: row.forecast_spend_usd",
      "technology_owner_role: row.technology_owner_role",
      "baseline_value: row.baseline_value",
      "target_value: row.target_value",
      "actual_value: row.actual_value",
    ]) {
      expect([field, generator.includes(field)]).toEqual([field, true]);
    }
  });

  it("keeps a recorded zero out of the null bucket", () => {
    // `num(x) || null` turns a baseline of 0, or a project that has genuinely spent nothing, into
    // a gap. Both are stated facts.
    expect(LAYER4).not.toMatch(/num\((?:row|project\?)\.[a-z_]+\) \|\| null/);
    expect(LAYER4).toContain("metric_baseline_value: numOrNull(row.baseline_value)");
  });

  it("does not show the baseline as though it were the latest reading", () => {
    expect(drawer).toContain("No month records a reading");
    expect(drawer).toContain(".find((m) => m.actualValue !== null)");
  });

  it("distinguishes a project that spent nothing from one never recorded", () => {
    expect(drawer).toContain('a.actualSpendYtdUsd === null\n                ? "Not recorded"');
  });
});

describe("the active generation is enforced by the data, not by one reader", () => {
  const migration = read(
    "supabase/migrations/20260830190000_tower_serving_active_generation_join.sql",
  );

  it("joins the active-keys function in both serving functions", () => {
    const joins = migration.match(
      /join serving\.tower_active_assessment_keys\(\) active/g,
    );
    expect(joins?.length).toBe(2);
  });

  it("matches on all three identity columns", () => {
    // Tenant alone is not an identity. Two generations of the same tenant differ by assessment
    // and version, and matching on fewer columns lets a retired generation through.
    for (const col of [
      "active.tenant_key = p.tenant_key",
      "active.assessment_id = p.assessment_id",
      "active.projection_version = p.projection_version",
    ]) {
      expect([col, (migration.match(new RegExp(col.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length]).toEqual([col, 2]);
    }
  });

  it("keeps the page predicate the deployed command function already had", () => {
    expect(migration).toContain("where page_key_arg = 'all' or p.page_key = page_key_arg;");
  });

  it("records that the ai function's missing page predicate is out of scope", () => {
    // Widening a live read-path fix past one clause is how a reporting bug becomes a data bug.
    expect(migration).toContain("Deliberately not fixed here");
    expect(migration).toContain("page_key");
  });
});

describe("tenant isolation is a property of the data", () => {
  const rls = read(
    "supabase/migrations/20260830210000_tower_projection_tenant_policies.sql",
  );

  it("covers every projection table Tower reads", () => {
    for (const t of [
      "tower_ai_portfolio",
      "tower_command_center",
      "tower_value_chain",
      "tower_evidence_queue",
    ]) {
      expect([t, rls.includes(t)]).toEqual([t, true]);
    }
  });

  it("uses the tenant GUC the reader actually sets", () => {
    // readTowerCommandCenter calls set_config('app.tenant_key', ...) before every query. A policy
    // keyed on anything else would evaluate false and return zero rows, which presents as
    // "not seeded" rather than as an error.
    // Doubled quotes: the predicate is built through `format()`, so it lives inside a SQL string
    // literal. Checking for the unescaped spelling would pass on a migration that never runs.
    expect(rls).toContain("current_setting(''app.tenant_key'', true)");
    // `is_local = true`: the key is scoped to the transaction, not the session. With connection
    // pooling a session-scoped key persists on the connection, and the next request to reuse it
    // inherits the previous tenant's key — which is precisely the leak the policy exists to stop.
    expect(READER).toContain("SELECT set_config('app.tenant_key', $1, true)");
  });

  it("adds policies without forcing RLS on the owner", () => {
    // A table with RLS on and no policies already denies everything to a non-bypassing role, so a
    // permissive policy can only grant. Forcing RLS would change that and could remove access
    // from the very role the product reads with.
    expect(rls).not.toMatch(/force\s+row\s+level\s+security/i);
  });

  it("is idempotent", () => {
    expect(rls).toContain("if not exists (");
  });
});

describe("a lens returns its own rows", () => {
  const mig = read(
    "supabase/migrations/20260830230000_tower_serving_page_key_split.sql",
  );

  it("honours the page_key argument the views already pass", () => {
    // Both views call tower_ai_rows with different page keys and the deployed function ignored the
    // argument, so both returned the same active-generation rows. A lens that returns everything is
    // not a lens.
    expect(mig).toContain(
      "where coalesce(p.display_payload_json ->> 'page_key', 'ai_portfolio') = page_key_arg",
    );
  });

  it("keeps the active-generation join it is patched on top of", () => {
    // The patch is applied to the body deployed after the join landed. Losing the join here would
    // silently reintroduce retired generations while appearing to fix the lens.
    expect(mig).toContain("join serving.tower_active_assessment_keys() active");
    expect(mig).toContain("and active.projection_version = p.projection_version");
  });

  it("defaults to the case page key, which is what the loader writes", () => {
    expect(LAYER4).toContain('page_key: "ai_portfolio"');
    expect(LAYER4).toContain('page_key: "adoption_lens"');
  });
});

describe("the remaining Tower lenses stay scoped", () => {
  const mig = read(
    "supabase/migrations/20260830234500_tower_serving_remaining_lens_scope.sql",
  );

  it("keeps value-proof and cost-lens rows on the active generation", () => {
    expect(mig).toContain("create or replace function serving.tower_value_rows");
    expect(mig).toContain("from ecl_projection.tower_value_chain p");
    expect(mig).toContain("join serving.tower_active_assessment_keys() active");
    expect(mig).toContain("and active.assessment_id = p.assessment_id");
    expect(mig).toContain("and active.projection_version = p.projection_version");
  });

  it("keeps evidence and risk-lens rows on the active generation", () => {
    expect(mig).toContain("create or replace function serving.tower_evidence_rows");
    expect(mig).toContain("from ecl_projection.tower_evidence_queue p");
    const joins = mig.match(/join serving\.tower_active_assessment_keys\(\) active/g);
    expect(joins?.length).toBe(2);
  });

  it("honours the requested page key for every lens function it rewrites", () => {
    expect(mig).toContain("where page_key_arg = 'all' or p.page_key = page_key_arg;");
    expect(mig).toContain("where p.page_key = page_key_arg;");
  });
});

describe("aVa suggests what the visible surface can answer", () => {
  const shell = read(
    "src/components/tower/command-center/TowerCommandCenterAvaShell.tsx",
  );

  it("reads the same page context the answer path reads", () => {
    // The answers were made surface-aware before the prompts were. A prompt drawn from a
    // different source than the answer can describe a surface the answer would not use.
    expect(shell).toContain(
      "buildSuggestions(view, pageContext.activeTab, pageContext.activeView)",
    );
  });

  it("offers rollout prompts on the rollouts surface", () => {
    expect(shell).toContain("rollouts below target should move first");
    expect(shell).toContain("Which rollouts support no business case?");
  });

  it("derives counts from the view rather than writing them into the text", () => {
    // A prompt naming a population the tenant does not have is the same defect as a panel
    // asserting a finding: it reads as fact and was written, not measured.
    expect(shell).toContain("belowTarget > 0");
    expect(shell).toContain("blockedRollouts > 0");
    expect(shell).toMatch(/\$\{belowTarget\}/);
  });

  it("falls back to portfolio-wide prompts rather than offering an empty question", () => {
    expect(shell).toContain("What value is claimable today, and what is blocked?");
  });

  it("counts a rollout as below target only when both readings exist", () => {
    // adoption < null is not false in a useful way; a rollout with no target cannot be short of
    // one, and counting it would inflate the number the prompt states.
    expect(shell).toContain("item.adoptionTargetPct !== null");
    expect(shell).toContain("adoption !== undefined");
  });
});
