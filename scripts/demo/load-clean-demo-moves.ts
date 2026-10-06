// Planner for the clean demo Move set (scripts/demo/clean-demo-moves.ts).
//
//   npx tsx scripts/demo/load-clean-demo-moves.ts                 # human-readable plan
//   npx tsx scripts/demo/load-clean-demo-moves.ts --clean-test    # also list test-move archive patterns
//   npx tsx scripts/demo/load-clean-demo-moves.ts --json          # emit the load spec as JSON
//
// This script DOES NOT WRITE TO THE DATABASE and opens no connection. New runtime
// code must use the Azure/Postgres data-plane (not a direct Supabase client), and
// the load itself is a COORDINATED operator step run through an ACA data-build job
// with the evidence/phase workstream (#8907), so the two do not collide. This
// script's job is to produce the plan and the exact, honest payloads that the
// governed ACA job upserts — nothing more.
//
// HONEST PAYLOADS (enforced in this file and in its tests):
//   • identity (name, graph node, display code), sponsor, charter CONTENT, and the
//     current phase the move sits at;
//   • an honest value stance — value is null / pending, NEVER a fabricated funded
//     figure;
//   • gates_passed is empty — gate/evidence honesty is owned by the evidence/phase
//     workstream, never fabricated here.

import {
  CLEAN_DEMO_MOVES,
  CLEAN_DEMO_TENANT_KEY,
  type DemoMove,
} from "./clean-demo-moves";

type OutputMode = "plan" | "json";

interface Flags {
  mode: OutputMode;
  cleanTestMoves: boolean;
}

function parseFlags(): Flags {
  const args = new Set(process.argv.slice(2));
  return {
    mode: args.has("--json") ? "json" : "plan",
    cleanTestMoves: args.has("--clean-test") || args.has("--clean-test-moves"),
  };
}

const GRAPH_NODE_PREFIX = "eng_demo_clean";

export function graphNodeId(move: DemoMove): string {
  return `${GRAPH_NODE_PREFIX}_${move.initiativeLink.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

/**
 * The engagement row this move maps to, for the governed ACA job to upsert.
 * Honest by construction: no funded value (value is null + an honest caveat), the
 * current phase is the move's entry phase, and gates_passed is empty — gate state
 * is not asserted here.
 */
export function engagementPayload(move: DemoMove): Record<string, unknown> {
  return {
    graph_node_id: graphNodeId(move),
    name: move.name,
    display_code: move.displayCode,
    sponsor: {
      name: move.sponsor.name,
      role: move.sponsor.role,
      email: move.sponsor.email,
    },
    problem_statement: move.thesis,
    industry_code: move.industryCode,
    function_code: move.functionCode,
    objective_code: move.objectiveCode,
    topic_code: move.topicCode,
    program_archetype: move.programArchetype,
    origin_source: "intelligence_candidate",
    status: "active",
    // Shaping candidate — NOT 'approved'/funded. Current phase is where it sits;
    // gate/evidence backing is established by the normal flow.
    lifecycle_state: "shaping",
    current_phase: move.entryPhase,
    // No fabricated funded value. Carry the honest stance, never a $ figure.
    value_projected_low_usd: null,
    value_projected_high_usd: null,
    value_verified_status: "pending",
    value_assumptions_jsonb: {
      seed_key: "clean-demo-moves",
      stance: move.valueStance,
      caveat:
        "Candidate in shaping; not a funded or audited value. To be validated in the business case.",
    },
    charter: move.charter
      ? {
          seed_key: "clean-demo-moves",
          scaffold: {
            thesis: move.thesis,
            sponsor: `${move.sponsor.name}, ${move.sponsor.role}`,
            sponsor_and_progress_preference: move.charter.sponsorAndProgressPreference,
            scope_boundary: move.charter.scopeBoundary,
            success_criteria: move.charter.successCriteria,
            stakeholder_map: move.charter.stakeholderMap,
            decision_rights: move.charter.decisionRights,
            evidence_plan: move.charter.evidencePlan,
            systems: move.systems,
            data_domains: move.dataDomains,
            open_evidence: move.openEvidence,
          },
        }
      : {
          seed_key: "clean-demo-moves",
          scaffold: {
            thesis: move.thesis,
            sponsor: `${move.sponsor.name}, ${move.sponsor.role}`,
            systems: move.systems,
            data_domains: move.dataDomains,
            open_evidence: move.openEvidence,
          },
        },
    // Intentionally empty — gate/evidence honesty is owned by the evidence/phase
    // workstream (#8907), never fabricated by this plan.
    gates_passed: [] as unknown[],
    synthetic_demo: true,
  };
}

/** Name patterns that mark a test-run move to archive (never a real demo move). */
export const TEST_MOVE_PATTERNS: readonly RegExp[] = [
  /\bE2E\s+\d+\b/i,
  /\bClaude\s+E2E\b/i,
  /\b(qa|codex|proof|canary)[-\s]+synthetic\b/i,
];

/** The full load spec the governed ACA job consumes (idempotent upsert + archive). */
export function buildLoadSpec(flags: Flags): Record<string, unknown> {
  return {
    tenant_key: CLEAN_DEMO_TENANT_KEY,
    upsert_by: "graph_node_id",
    engagements: CLEAN_DEMO_MOVES.map(engagementPayload),
    archive_test_moves: flags.cleanTestMoves,
    archive_name_patterns: flags.cleanTestMoves
      ? TEST_MOVE_PATTERNS.map((re) => re.source)
      : [],
    archive_action: "set lifecycle_state to 'archived' (never hard-delete)",
    note: "Apply via the governed ACA data-build job with the evidence/phase workstream; this script writes nothing.",
  };
}

function log(message: string): void {
  console.log(`plan · ${message}`);
}

function printPlan(flags: Flags): void {
  log(`tenant: ${CLEAN_DEMO_TENANT_KEY}`);
  log(`${CLEAN_DEMO_MOVES.length} clean demo move(s) to upsert by graph_node_id:`);
  for (const move of CLEAN_DEMO_MOVES) {
    const p = engagementPayload(move);
    // Prove the invariants in the plan itself.
    if (p.value_projected_low_usd !== null || p.value_projected_high_usd !== null) {
      throw new Error(`invariant: ${move.initiativeLink} must not carry a funded value`);
    }
    if ((p.gates_passed as unknown[]).length !== 0) {
      throw new Error(`invariant: ${move.initiativeLink} must not assert gate approvals`);
    }
    log(
      `  • ${move.initiativeLink} · ${move.name} · P${move.entryPhase} · sponsor ${move.sponsor.name} (${move.sponsor.role}) · value=null/pending · charter=${move.charter ? "yes" : "n/a"} · gates_passed=[]`,
    );
  }
  if (flags.cleanTestMoves) {
    log(`would archive moves whose name matches a test-run pattern (lifecycle_state 'archived', never hard-delete):`);
    for (const re of TEST_MOVE_PATTERNS) log(`  • /${re.source}/${re.flags}`);
  } else {
    log(`(pass --clean-test to also plan archiving test-named moves)`);
  }
  log(`this script writes nothing. Apply the plan via the governed ACA data-build job.`);
}

function main(): void {
  const flags = parseFlags();
  if (flags.mode === "json") {
    console.log(JSON.stringify(buildLoadSpec(flags), null, 2));
    return;
  }
  printPlan(flags);
}

// Run only as a CLI, never on import (so tests can import the helpers above).
// When executed with tsx, process.argv[1] is this script; under the jest runner
// it is the test runner, so main() does not fire on import.
const invokedPath = process.argv[1] ?? "";
if (/load-clean-demo-moves(\.ts)?$/.test(invokedPath)) {
  main();
}
