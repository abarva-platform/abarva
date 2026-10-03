// Loader for the clean demo Move set (scripts/demo/clean-demo-moves.ts).
//
// DRY-RUN BY DEFAULT, AND DB-FREE IN DRY-RUN.
//   npx tsx scripts/demo/load-clean-demo-moves.ts                 # plan only, no DB
//   npx tsx scripts/demo/load-clean-demo-moves.ts --clean-test    # also plan archiving test-named moves
//   npx tsx scripts/demo/load-clean-demo-moves.ts --apply         # mutate the DB (coordinated step)
//
// Dry-run prints the exact payloads it would upsert WITHOUT connecting to the
// database, so it can be run anywhere to validate the plan. Only `--apply`
// touches the DB — and that is a COORDINATED operator step, run with the
// evidence/phase workstream (#8907) so the two do not collide. Prefer running
// `--apply` through an ACA data-build job (docs/ops/aca-data-build-job-rule.md),
// not a local session.
//
// WHAT IT SEEDS (deliberately narrow):
//   • the move's IDENTITY (name, graph node, codes), its sponsor, its charter
//     CONTENT, an HONEST value stance (never a fabricated funded figure), and
//     the current phase it sits at.
// WHAT IT DOES NOT DO (owned by the evidence/phase workstream):
//   • it does NOT assert gate approvals or evidence sufficiency. gates_passed is
//     left empty; real gate/evidence state is established by the normal flow and
//     the correctness workstream, never fabricated here.

import {
  CLEAN_DEMO_MOVES,
  CLEAN_DEMO_TENANT_KEY,
  type DemoMove,
} from "./clean-demo-moves";

type ApplyMode = "dry-run" | "apply";

interface Flags {
  mode: ApplyMode;
  cleanTestMoves: boolean;
}

function parseFlags(): Flags {
  const args = new Set(process.argv.slice(2));
  return {
    mode: args.has("--apply") ? "apply" : "dry-run",
    cleanTestMoves: args.has("--clean-test") || args.has("--clean-test-moves"),
  };
}

function log(mode: ApplyMode, message: string): void {
  console.log(`${mode === "apply" ? "apply" : "dry-run"} · ${message}`);
}

const GRAPH_NODE_PREFIX = "eng_demo_clean";

export function graphNodeId(move: DemoMove): string {
  return `${GRAPH_NODE_PREFIX}_${move.initiativeLink.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

/**
 * The engagement row this move maps to. Honest by construction: no funded value
 * (value is null + an honest caveat), current phase is the move's entry phase,
 * and gates_passed is empty — gate/evidence state is not asserted here.
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
    program_archetype: "ai_product_enablement",
    origin_source: "intelligence_candidate",
    status: "active",
    // Shaping candidate — NOT 'approved'/funded. The current phase is where the
    // move sits; gate/evidence backing is established by the normal flow.
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
    // workstream (#8907), never fabricated by this loader.
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

function printDryRunPlan(flags: Flags): void {
  const mode: ApplyMode = "dry-run";
  log(mode, `tenant: ${CLEAN_DEMO_TENANT_KEY}`);
  log(mode, `would upsert ${CLEAN_DEMO_MOVES.length} clean demo move(s) by initiativeLink:`);
  for (const move of CLEAN_DEMO_MOVES) {
    const p = engagementPayload(move);
    log(
      mode,
      `  • ${move.initiativeLink} · ${move.name} · P${move.entryPhase} · sponsor ${move.sponsor.name} (${move.sponsor.role}) · value=null/pending · charter=${move.charter ? "yes" : "n/a"} · gates_passed=[]`,
    );
    // Prove the invariants in the plan output itself.
    if (p.value_projected_low_usd !== null || p.value_projected_high_usd !== null) {
      throw new Error(`invariant: ${move.initiativeLink} must not carry a funded value`);
    }
    if ((p.gates_passed as unknown[]).length !== 0) {
      throw new Error(`invariant: ${move.initiativeLink} must not assert gate approvals`);
    }
  }
  if (flags.cleanTestMoves) {
    log(mode, `would archive moves whose name matches a test-run pattern:`);
    for (const re of TEST_MOVE_PATTERNS) log(mode, `  • /${re.source}/${re.flags}`);
    log(mode, `  (archive = set status 'archived'; never hard-delete)`);
  } else {
    log(mode, `(pass --clean-test to also plan archiving test-named moves)`);
  }
  log(mode, `no database connection was opened. Run --apply via a coordinated ACA job to mutate.`);
}

async function applyToDatabase(flags: Flags): Promise<void> {
  // Import the DB client lazily so dry-run never needs it or its env.
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "apply mode needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run this through the coordinated ACA data-build job, not a local session.",
    );
  }
  const sb = createClient(url, key);
  const mode: ApplyMode = "apply";
  log(mode, `tenant: ${CLEAN_DEMO_TENANT_KEY}`);

  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("id, name")
    .ilike("name", "%Meridian%")
    .maybeSingle();
  if (clientErr) throw clientErr;
  if (!client) throw new Error("demo client not found for apply");
  const clientId = (client as { id: string }).id;

  if (flags.cleanTestMoves) {
    const { data: all, error } = await sb
      .from("engagements")
      .select("id, name")
      .eq("client_id", clientId);
    if (error) throw error;
    for (const row of (all ?? []) as Array<{ id: string; name: string }>) {
      if (TEST_MOVE_PATTERNS.some((re) => re.test(row.name))) {
        const { error: upErr } = await sb
          .from("engagements")
          .update({ status: "archived" })
          .eq("id", row.id);
        if (upErr) throw upErr;
        log(mode, `archived test-named move · ${row.name} · ${row.id}`);
      }
    }
  }

  for (const move of CLEAN_DEMO_MOVES) {
    const payload = { ...engagementPayload(move), client_id: clientId };
    const { data: existing, error } = await sb
      .from("engagements")
      .select("id")
      .eq("client_id", clientId)
      .eq("graph_node_id", graphNodeId(move))
      .maybeSingle();
    if (error) throw error;
    if (existing) {
      const id = (existing as { id: string }).id;
      const { error: upErr } = await sb.from("engagements").update(payload).eq("id", id);
      if (upErr) throw upErr;
      log(mode, `updated · ${move.name} · ${id}`);
    } else {
      const { data: ins, error: insErr } = await sb
        .from("engagements")
        .insert(payload)
        .select("id")
        .single();
      if (insErr) throw insErr;
      log(mode, `created · ${move.name} · ${(ins as { id: string }).id}`);
    }
  }
}

async function main(): Promise<void> {
  const flags = parseFlags();
  if (flags.mode === "dry-run") {
    printDryRunPlan(flags);
    return;
  }
  await applyToDatabase(flags);
}

// Run only as a CLI, never on import (so tests can import the helpers above).
// When executed with tsx, process.argv[1] is this script; under the jest runner
// it is the test runner, so main() does not fire on import.
const invokedPath = process.argv[1] ?? "";
if (/load-clean-demo-moves(\.ts)?$/.test(invokedPath)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
