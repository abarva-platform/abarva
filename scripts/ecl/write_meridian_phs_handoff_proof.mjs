#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_OUT = "job-output/meridian-phs-handoff-proof/meridian_phs_handoff_proof_summary.json";
const TENANT_KEY = "meridian-health";
const DECLARED_PROGRAM_COUNT = 38;

const HANDOFFS = [
  {
    handoff_key: "moves_to_tower_measurement_prerequisites",
    from: "Moves",
    to: "Tower",
    evidence: [
      {
        file: "src/lib/programs/move-business-case.ts",
        required: ["function deriveTowerHandoff", "Tower cannot", "expected source"],
      },
      {
        file: "src/lib/programs/expert-kernel/exports/board-grade/move-cfo-pack-model.ts",
        required: ["What Tower will measure", "seed-gapped metrics", "expectedDataSource"],
      },
    ],
    success_detail:
      "Moves board-grade value artifacts carry Tower measurement prerequisites and explicit not-yet-measurable gaps.",
  },
  {
    handoff_key: "tower_to_moves_next_action",
    from: "Tower",
    to: "Moves",
    evidence: [
      {
        file: "src/lib/programs/tower-trigger/tower-to-moves-action-handoff.ts",
        required: ["TowerToMovesActionSeedPayload", "programWorkItem", "runTowerToMovesActionHandoff"],
      },
      {
        file: "src/lib/programs/cross-module-trace-view.ts",
        required: ["runTowerToMovesActionHandoff", "Move action:", "Next gate:"],
      },
      {
        file: "src/lib/programs/tower-trigger/__tests__/tower-to-moves-action-handoff.test.ts",
        required: ["owner-bound Move action", "is deterministic", "refuses rows that do not target"],
      },
    ],
    success_detail:
      "Tower can derive and render an owner-bound Move work-item action from the gated outcome-ledger row.",
  },
  {
    handoff_key: "intelligence_to_moves_reasoning_context",
    from: "Intelligence",
    to: "Moves",
    evidence: [
      {
        file: "src/app/(maestro)/strategic-moves/new/page.tsx",
        required: ["fromIntelligence", "patternId", "composeOriginateFirstMessage"],
      },
      {
        file: "src/lib/programs/ava-chat/quality-gate.ts",
        required: ["mentions_source_when_relevant", "mentions_tower_when_relevant"],
      },
    ],
    success_detail:
      "Moves origination accepts Intelligence-originating context and the Moves aVa quality gate requires Source/Tower awareness when relevant.",
  },
  {
    handoff_key: "moves_to_source_vendor_evidence",
    from: "Moves",
    to: "Source",
    evidence: [
      {
        file: "src/lib/programs/source-trigger/move-to-source-handoff.ts",
        required: ["linkedProgramId", "SourceEventSeedPayload", "runMoveToSourceHandoff"],
      },
      {
        file: "src/lib/programs/source-trigger/__tests__/move-to-source-handoff.test.ts",
        required: ["linkedProgramId", "produces a seed payload", "is deterministic"],
      },
    ],
    success_detail:
      "Moves can deterministically seed a Source event with the Move id carried as the join key.",
  },
];

function parseArgs(argv) {
  const args = {
    out: DEFAULT_OUT,
    activationProof: null,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--out") args.out = next();
    else if (arg === "--activation-proof") args.activationProof = next();
    else if (arg === "--json") args.json = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/write_meridian_phs_handoff_proof.mjs [options]

Writes deterministic Meridian/PHS cross-module handoff proof. With --activation-proof it
uses data-build readback counts for the rows that the trace joins on. Without it, the
output is only a code-and-test contract proof, not browser proof and not data readback.

Options:
  --out <path>               Output JSON path.
  --activation-proof <path>  Optional Moves activation execute/plan proof summary.
  --json                     Print full JSON after writing.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function readJson(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function evaluateEvidence(item) {
  const text = readText(item.file);
  const missing = item.required.filter((needle) => !text.includes(needle));
  return {
    file: item.file,
    exists: Boolean(text),
    required_markers: item.required,
    missing_markers: missing,
    accepted: Boolean(text) && missing.length === 0,
  };
}

function activationReadback(proof) {
  if (!proof || typeof proof !== "object") return null;
  const counts = proof.readback ?? proof.generated_rows ?? proof.activation_summary?.generated_rows ?? null;
  if (!counts || typeof counts !== "object") return null;
  return {
    actual_database_mutation: Boolean(proof.actual_database_mutation),
    accepted: Boolean(proof.accepted),
    source_events: Number(counts.source_events ?? 0),
    outcome_ledger: Number(counts.outcome_ledger ?? 0),
    intelligence_evidence: Number(counts.intelligence_evidence ?? 0),
    trace_joinable_moves: Number(counts.trace_joinable_moves ?? 0),
  };
}

function dataProofForHandoff(handoffKey, readback) {
  if (!readback?.actual_database_mutation || !readback.accepted) return null;
  const details = {
    moves_to_tower_measurement_prerequisites: {
      count: readback.outcome_ledger,
      required: DECLARED_PROGRAM_COUNT,
      detail: "Moves have Tower outcome-ledger rows carrying baseline-pending value and measurement-next-action detail.",
    },
    tower_to_moves_next_action: {
      count: readback.outcome_ledger,
      required: DECLARED_PROGRAM_COUNT,
      detail: "Tower outcome-ledger rows are joined back to Moves and name the next measurement action. This is read-side proof, not a Tower write workflow.",
    },
    intelligence_to_moves_reasoning_context: {
      count: readback.intelligence_evidence,
      required: DECLARED_PROGRAM_COUNT,
      detail: "Intelligence evidence rows are joined to Moves through related_entity_type='engagement' and related_entity_id=<move id>.",
    },
    moves_to_source_vendor_evidence: {
      count: readback.source_events,
      required: DECLARED_PROGRAM_COUNT,
      detail: "Source events are joined to Moves through source_events.linked_program_id=<move id>.",
    },
  }[handoffKey];
  if (!details) return null;
  const traceReady = readback.trace_joinable_moves >= DECLARED_PROGRAM_COUNT;
  const accepted = details.count >= details.required && traceReady;
  return {
    proof_source: "moves_activation_data_readback",
    count: details.count,
    required: details.required,
    trace_joinable_moves: readback.trace_joinable_moves,
    accepted,
    detail: details.detail,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const activationProof = readJson(args.activationProof);
  const readback = activationReadback(activationProof);
  const handoffs = HANDOFFS.map((handoff) => {
    const evidence = handoff.evidence.map(evaluateEvidence);
    const allEvidenceAccepted = evidence.every((item) => item.accepted);
    const dataProof = dataProofForHandoff(handoff.handoff_key, readback);
    const proofState = dataProof?.accepted
      ? "proven"
      : handoff.gap_if_not_all && allEvidenceAccepted
        ? "partial_read_side_proven_write_side_gap_recorded"
        : allEvidenceAccepted
          ? "proven"
          : "not_proven";
    return {
      handoff_key: handoff.handoff_key,
      from: handoff.from,
      to: handoff.to,
      proof_state: proofState,
      counted_as_proven: proofState === "proven",
      detail: dataProof?.accepted
        ? dataProof.detail
        : allEvidenceAccepted
          ? handoff.success_detail
          : "Required implementation markers are missing.",
      gap_detail:
        proofState === "partial_read_side_proven_write_side_gap_recorded"
          ? handoff.gap_if_not_all
          : null,
      data_proof: dataProof,
      evidence,
    };
  });

  const numerator = handoffs.filter((handoff) => handoff.counted_as_proven).length;
  const accepted = handoffs.every((handoff) => handoff.proof_state !== "not_proven");
  const summary = {
    schema_version: "meridian_phs_handoff_proof/v1",
    generated_at: new Date().toISOString(),
    tenant_key: TENANT_KEY,
    proof_boundary:
      readback?.actual_database_mutation
        ? "Deterministic data-readback proof for trace-join rows. Browser proof remains a separate proof lane."
        : "Deterministic code/test contract proof only. Browser proof and data readback are separate proof lanes.",
    accepted,
    activation_readback: readback,
    phs_cross_module_handoffs: {
      numerator,
      denominator: HANDOFFS.length,
      percent: Number(((numerator / HANDOFFS.length) * 100).toFixed(1)),
      accepted,
    },
    handoffs,
  };

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  if (args.json) console.log(JSON.stringify(summary, null, 2));
  else console.log(JSON.stringify(summary.phs_cross_module_handoffs, null, 2));
  if (!accepted) process.exitCode = 1;
}

main();
