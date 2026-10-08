/**
 * When a gate criterion names a deliverable, does it name the spelling the
 * deliverable is actually STORED under?
 *
 * Two sibling guards already cover the cases where generation
 * (`phase-gate-deliverable-reachability.test.ts`) or deliberate authorship
 * (`authorship-only-gate-criterion-reachability.test.ts`) is a criterion's sole
 * producer. Neither can see the defect pinned here, because this criterion is
 * `soft` AND has free-text fallbacks: `delivery_raci_named` passed on
 * `briefString.includes("raci")` or a P4 capture-prose regex, so it was never
 * permanently unmet and never looked broken.
 *
 * What it could not do was pass on the document it is named after. A Move on
 * the default or material process-change route GENERATES the Operating Model
 * Design (`operating_model_design` is in `phaseCanonicalKeysForRoute(3, …)`),
 * and the client-approval path writes the row under the REGISTRY key, because
 * it maps the orchestrator `deliverableType` back through
 * `deliverableKeyForOrchestratorType` first. The criterion listed
 * `operating_model` — the ORCHESTRATOR alias — alongside `delivery_raci` and
 * `raci`, and none of those three is a registry key or an allowed authorship
 * key. So all three were unwritable: the generated, signed-off document naming
 * the delivery RACI left the criterion about the delivery RACI unmet, and the
 * outcome turned on whether a human happened to type the word "raci".
 *
 * The mechanism is general — an orchestrator type and its registry key are
 * interchangeable-looking strings kept in different files — so the structural
 * case below derives the rule from `ORCH_TYPE_TO_KEY` rather than restating a
 * list. `roadmap` → `execution_roadmap` is the other live subject, and it
 * already complied; this is what makes the case a real join and not a tautology.
 *
 * Soundness of the source probe: a key that does NOT appear as a quoted literal
 * in `governance.ts` definitely cannot be read by any criterion there. A key
 * that does appear is only PLAUSIBLY read. So the probe is used to prove
 * darkness, never wiring — the wiring is proved by driving `evaluateGate`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { ALLOWED_PROGRAM_DELIVERABLE_TYPES } from "@/lib/agent/tools/program/completeDeliverable";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import {
  DELIVERABLE_REGISTRY,
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { evaluateGate, gateCriteriaForPhase } from "@/lib/programs/governance";

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: jest.fn(async () => ({
    id: "move-1",
    currentPhase: 4,
    charter: null,
    archetype: null,
  })),
}));

const GOVERNANCE_SOURCE = readFileSync(
  path.join(process.cwd(), "src/lib/programs/governance.ts"),
  "utf8",
);

/**
 * Orchestrator `deliverableType` values whose profiled registry key differs
 * from the alias itself. Written out as literals so a rename on either side is
 * a visible edit here; the mapping each one claims is then checked against
 * `deliverableKeyForOrchestratorType`, which is what the acceptance path calls.
 */
const ALIASED_ORCHESTRATOR_TYPES: Readonly<Record<string, string>> = {
  operating_model: "operating_model_design",
  roadmap: "execution_roadmap",
  estimate_model: "financial_model",
  value_model: "tower_metrics_plan",
  handoff_pack: "handoff_package",
  root_cause: "root_cause_worksheet",
  target_architecture: "target_state_architecture",
  evidence_request_pack: "discovery_plan",
};

/**
 * The one declared criterion that names NO deliverable key any producer can
 * write, and is correct anyway: `phase_3_findings_written` also passes on
 * `moduleCompleted("phase_3_findings", "findings")`, a module row rather than a
 * deliverable. Entries here are a claim that a NON-deliverable producer exists,
 * and the case below checks that claim against the evaluator's source.
 */
const MODULE_BACKED_CRITERIA: Readonly<Record<string, string>> = {
  phase_3_findings_written: 'moduleCompleted("phase_3_findings", "findings")',
};

/** Every key some phase's generation set can build, across every route shape. */
function generatedKeys(): Set<string> {
  const keys = new Set<string>();
  const routeShapes = [
    null,
    {
      route: "technical_product" as const,
      workflowChange: "none" as const,
      roleAccountabilityChange: "none" as const,
    },
    {
      route: "process_change" as const,
      workflowChange: "limited" as const,
      roleAccountabilityChange: "limited" as const,
    },
    {
      route: "process_change" as const,
      workflowChange: "material" as const,
      roleAccountabilityChange: "material" as const,
    },
  ];
  for (const phase of Object.keys(PHASE_CANONICAL_KEYS).map(Number)) {
    for (const shape of routeShapes) {
      for (const key of phaseCanonicalKeysForRoute(
        phase,
        shape as Parameters<typeof phaseCanonicalKeysForRoute>[1],
      )) {
        keys.add(key);
      }
    }
  }
  return keys;
}

/** A key some producer can actually write into `deliverables_v2.deliverable_type_key`. */
function isWritableKey(key: string): boolean {
  return (
    DELIVERABLE_REGISTRY.some((spec) => spec.deliverableTypeKey === key) ||
    ALLOWED_PROGRAM_DELIVERABLE_TYPES.has(key)
  );
}

/** Minimal fluent stub over the five tables `evaluateGate` reads. */
function supabaseWith(
  deliverables: ReadonlyArray<Record<string, unknown>>,
): Parameters<typeof evaluateGate>[4] extends { supabase?: infer S }
  ? S
  : never {
  const tables: Record<string, unknown[]> = {
    deliverables_v2: [...deliverables],
    program_modules: [],
    engagement_participants: [],
    program_approval_requests: [],
    program_milestones: [],
  };
  const builder = (table: string) => {
    const result = { data: tables[table] ?? [], error: null };
    const chain: Record<string, unknown> = {
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    for (const method of ["select", "eq", "in", "order", "limit"]) {
      chain[method] = () => chain;
    }
    return chain;
  };
  return { from: builder } as never;
}

const CTX = { clientId: "client-1", userId: "user-1" } as Parameters<
  typeof evaluateGate
>[0];

/**
 * A signed-off row as the acceptance path writes one: the registry key, and a
 * linked approved artifact, because this document is GENERATED rather than
 * hand-authored.
 */
function generatedRow(key: string, status = "signed_off") {
  return {
    id: `deliverable-${key}`,
    deliverable_type_key: key,
    status,
    approved_artifact_id: null,
    structured_data: { source: "deliverable_generation" },
  };
}

async function failedChecksFor(
  deliverables: ReadonlyArray<Record<string, unknown>>,
): Promise<string[]> {
  const result = await evaluateGate(CTX, "move-1", 4, 5, {
    supabase: supabaseWith(deliverables),
  });
  return result.failedChecks.map((check) => check.check);
}

describe("gate criteria read the spelling a deliverable is stored under", () => {
  it("keeps every pinned orchestrator alias mapping to the registry key it claims", () => {
    // The premise. If `deliverableKeyForOrchestratorType` stops agreeing, the
    // structural case below is comparing against the wrong registry key.
    const drifted: string[] = [];
    for (const [alias, registryKey] of Object.entries(
      ALIASED_ORCHESTRATOR_TYPES,
    )) {
      const resolved = deliverableKeyForOrchestratorType(alias);
      if (resolved !== registryKey) {
        drifted.push(`${alias}: expected ${registryKey}, got ${resolved}`);
      }
      if (alias === registryKey) drifted.push(`${alias}: not an alias`);
    }
    expect(drifted).toEqual([]);
  });

  it("names the registry key beside any orchestrator alias a criterion reads", () => {
    // The defect, structurally: an alias nothing can write, listed without the
    // key everything writes. Both live subjects are checked — `roadmap` already
    // complied, so this is a join over the two maps, not a restatement of one.
    expect(aliasesNamedWithoutTheirRegistryKey(GOVERNANCE_SOURCE)).toEqual([]);
  });

  it("reports the alias-only spelling when the registry key is absent", () => {
    // A clean result above is only worth something if the detector can fail.
    // Reconstruct the pre-fix evaluator from the real file by deleting every
    // mention of the registry key, and the original defect reappears.
    const beforeTheFix = GOVERNANCE_SOURCE.replaceAll(
      '"operating_model_design"',
      '"design_spec"',
    );
    expect(aliasesNamedWithoutTheirRegistryKey(beforeTheFix)).toEqual([
      "operating_model without operating_model_design",
    ]);
  });

  it("confirms which orchestrator aliases no producer can write", () => {
    // Why naming the alias alone was dark here rather than merely redundant.
    // `roadmap` is the instructive contrast: it is BOTH an orchestrator alias
    // and a legacy registry key, so a criterion naming it is already reading a
    // writable spelling. `operating_model` is not a registry key and not an
    // allowed authorship key, so the criterion that named it alone was reading
    // a string nothing in the product ever writes.
    const writability = Object.fromEntries(
      Object.keys(ALIASED_ORCHESTRATOR_TYPES)
        .filter((alias) => GOVERNANCE_SOURCE.includes(`"${alias}"`))
        .map((alias) => [alias, isWritableKey(alias)]),
    );
    expect(writability).toEqual({ operating_model: false, roadmap: true });
  });

  it("passes the delivery RACI criterion from the generated Operating Model Design", async () => {
    // The behavioural half. No capture text and no charter here, so neither
    // prose fallback can carry it: this passes only if the criterion reads the
    // registry key the acceptance path writes.
    const failed = await failedChecksFor([generatedRow("operating_model_design")]);
    expect(failed).not.toContain("delivery_raci_named");
  });

  it("still reports the delivery RACI criterion unmet with no record at all", async () => {
    // Pins that the case above is not passing on a fallback, and that the
    // widened list did not make the criterion unconditionally true.
    expect(await failedChecksFor([])).toContain("delivery_raci_named");
    expect(
      await failedChecksFor([generatedRow("unrelated_working_doc")]),
    ).toContain("delivery_raci_named");
  });

  it("reads this criterion as presence, not sign-off, on the row it now accepts", async () => {
    // Recording the contract rather than changing it. This case reads
    // `isPresent`, so a row that is not signed off ticks it — unlike the P4
    // HARD rows beside it, which read `isSignedOff`. Widening the key list
    // inherits that looseness, so it is asserted here rather than left to be
    // discovered as a surprise. Tightening it would make a soft criterion
    // stricter and is a separate decision.
    const draft = await failedChecksFor([
      generatedRow("operating_model_design", "in_review"),
    ]);
    expect(draft).not.toContain("delivery_raci_named");
    expect(draft).toContain("readiness_and_change_plan_signed_off");
  });

  it("builds the Operating Model Design on the routes that produce an operating model", () => {
    // The criterion is only reachable from generation where the route asks for
    // the document. `technical_product` and bounded `process_change` correctly
    // omit it, so the P4 row stays fallback-only there by design.
    expect(generatedKeys()).toContain("operating_model_design");
    expect(phaseCanonicalKeysForRoute(3, null)).toContain(
      "operating_model_design",
    );
  });

  it("reads the criterion's own lookup keys out of the evaluator, comments and all", () => {
    // The class guard below is vacuous if the extractor finds nothing, and the
    // lookup it reads is now split across lines with an interleaved comment.
    expect(deliverableKeysReadBy("delivery_raci_named").sort()).toEqual([
      "delivery_raci",
      "operating_model",
      "operating_model_design",
      "raci",
    ]);
  });

  it("finds exactly the declared criteria whose deliverable lookups are all unwritable", () => {
    // The detection half of the class guard, asserted as a positive result so
    // the guard cannot pass by finding nothing. `phase_3_findings_written` is
    // the one real subject today; before the fix `delivery_raci_named` was the
    // second, which is what this list would have shown.
    expect(criteriaNamingOnlyUnwritableKeys()).toEqual([
      "phase_3_findings_written",
    ]);
  });

  it("accounts for every criterion it finds by a named non-deliverable producer", () => {
    // The regression guard for the whole class. A criterion whose deliverable
    // lookups are all unwritable must have a non-deliverable producer, named
    // and justified; otherwise it is a row the product can never tick.
    const unaccounted = criteriaNamingOnlyUnwritableKeys().filter(
      (criterion) => !(criterion in MODULE_BACKED_CRITERIA),
    );
    expect(unaccounted).toEqual([]);
  });

  it("does not justify as module-backed a criterion with no module path", () => {
    // Keeps the exemption above from becoming a parking space.
    const contradicted = Object.entries(MODULE_BACKED_CRITERIA).filter(
      ([, modulePath]) => !GOVERNANCE_SOURCE.includes(modulePath),
    );
    expect(contradicted).toEqual([]);
  });
});

/**
 * The deliverable keys a criterion's own `case` block looks up, read out of the
 * evaluator's source. Used only to find criteria that name NOTHING writable —
 * the sound direction of the probe described in this file's header.
 */
function deliverableKeysReadBy(criterion: string): string[] {
  const start = GOVERNANCE_SOURCE.indexOf(`case "${criterion}":`);
  if (start < 0) return [];
  const end = GOVERNANCE_SOURCE.indexOf("break;", start);
  const block = GOVERNANCE_SOURCE.slice(start, end < 0 ? undefined : end);
  const keys = new Set<string>();
  const callPattern = /findDeliverables?\(\s*((?:"[a-z0-9_]+"\s*,?\s*(?:\/\/[^\n]*\n\s*)*)+)\)/g;
  for (const call of block.matchAll(callPattern)) {
    for (const key of call[1].matchAll(/"([a-z0-9_]+)"/g)) keys.add(key[1]);
  }
  return [...keys];
}

/**
 * Every declared gate criterion, across all six phases, whose `case` block looks
 * deliverables up and names not one spelling a producer can write. Exemptions
 * are applied by the caller, so the detection itself stays assertable.
 */
function criteriaNamingOnlyUnwritableKeys(): string[] {
  const found: string[] = [];
  for (const phase of [0, 1, 2, 3, 4, 5]) {
    for (const criterion of gateCriteriaForPhase(phase) ?? []) {
      const keys = deliverableKeysReadBy(criterion.key);
      if (keys.length === 0) continue;
      if (keys.some((key) => isWritableKey(key))) continue;
      if (!found.includes(criterion.key)) found.push(criterion.key);
    }
  }
  return found.sort();
}

/**
 * Orchestrator aliases a gate evaluator names while never naming the registry
 * key they resolve to — the spelling a producer would actually have written.
 * Takes the source so the detector can be shown to fail on a known-bad input.
 */
function aliasesNamedWithoutTheirRegistryKey(source: string): string[] {
  const aliasOnly: string[] = [];
  for (const [alias, registryKey] of Object.entries(
    ALIASED_ORCHESTRATOR_TYPES,
  )) {
    if (!source.includes(`"${alias}"`)) continue;
    if (!source.includes(`"${registryKey}"`)) {
      aliasOnly.push(`${alias} without ${registryKey}`);
    }
  }
  return aliasOnly.sort();
}
