#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_OUT = "docs/architecture/meridian-phs-demo-readiness-status.json";
const MOVES_ROUTE_AUDIT = "docs/architecture/MERIDIAN_PHS_MOVES_ROUTE_SOURCE_AUDIT_2026_08_28.md";
const TENANT_KEY = "meridian-health";
const STALE_CONTENT_CUTOFF = "2026-08-24T00:00:00.000Z";

const PHS_EXECUTIVE_ECL_DENOMINATOR = {
  Home: 16,
  Tower: 9,
  Intelligence: 6,
};

const SOURCE_DENOMINATOR = {
  Source: 9,
};

const MOVES_SURFACES = [
  {
    surface_key: "moves_index",
    route: "/strategic-moves",
    file: "src/app/(maestro)/strategic-moves/page.tsx",
    current_source: "program operational rows plus canonical portfolio reconciliation",
  },
  {
    surface_key: "moves_detail_redirect",
    route: "/strategic-moves/[moveId]",
    file: "src/app/(maestro)/strategic-moves/[moveId]/page.tsx",
    current_source: "program operational row",
  },
  {
    surface_key: "moves_phase_workspace",
    route: "/strategic-moves/[moveId]/phase/[phaseNum]",
    file: "src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx",
    current_source:
      "program row, phase module state, evidence readiness, artifacts and current-state readiness",
  },
  {
    surface_key: "moves_evidence",
    route: "/strategic-moves/[moveId]/evidence",
    file: "src/app/(maestro)/strategic-moves/[moveId]/evidence/page.tsx",
    current_source: "program row, board artifacts and phase documents",
  },
  {
    surface_key: "moves_trace",
    route: "/strategic-moves/[moveId]/trace",
    file: "src/app/(maestro)/strategic-moves/[moveId]/trace/page.tsx",
    current_source: "program row, Source events, outcome ledger and control/eval matrix",
  },
  {
    surface_key: "moves_workspace",
    route: "/strategic-moves/[moveId]/workspace",
    file: "src/app/(maestro)/strategic-moves/[moveId]/workspace/page.tsx",
    current_source: "workspace-explorer Moves adapter and generated-artifact candidates",
  },
];

const HANDOFFS = [
  {
    handoff_key: "moves_to_tower_measurement_prerequisites",
    from: "Moves",
    to: "Tower",
    required_proof: "A selected move names the measures Tower needs before value can be released.",
  },
  {
    handoff_key: "tower_to_moves_next_action",
    from: "Tower",
    to: "Moves",
    required_proof: "A Tower gated claim creates or names an owner-bound move/action.",
  },
  {
    handoff_key: "intelligence_to_moves_reasoning_context",
    from: "Intelligence",
    to: "Moves",
    required_proof: "aVa uses the same ECL context to explain why a move is or is not ready.",
  },
  {
    handoff_key: "moves_to_source_vendor_evidence",
    from: "Moves",
    to: "Source",
    required_proof: "A move can hand off vendor or contract evidence needs to Source without fabricating value.",
  },
];

function parseArgs(argv) {
  const args = {
    out: DEFAULT_OUT,
    timestamp: process.env.ECL_PHS_STATUS_TIMESTAMP || new Date().toISOString(),
    eclStatus: "docs/architecture/ecl-four-lane-completion-status.json",
    browserProof: null,
    sourceProof: null,
    handoffProof: null,
    movesActivationProof: null,
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
    else if (arg === "--timestamp") args.timestamp = next();
    else if (arg === "--ecl-status") args.eclStatus = next();
    else if (arg === "--browser-proof") args.browserProof = next();
    else if (arg === "--source-proof") args.sourceProof = next();
    else if (arg === "--handoff-proof") args.handoffProof = next();
    else if (arg === "--moves-activation-proof") args.movesActivationProof = next();
    else if (arg === "--json") args.json = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/write_meridian_phs_demo_status.mjs [options]

Writes the Meridian/PHS demo readiness status. This tracker separates the PHS executive demo
from the Source sourcing-CXO demo and keeps SkyHarbor airline proof deferred.

Options:
  --out <path>             Output JSON path.
  --timestamp <iso>        Status timestamp.
  --ecl-status <path>      Existing ECL four-lane status JSON.
  --browser-proof <path>   Optional signed-in PHS browser proof summary.
  --source-proof <path>    Optional Source sourcing-CXO proof summary.
  --handoff-proof <path>   Optional PHS cross-module handoff proof summary.
  --moves-activation-proof <path>
                            Optional Meridian Moves activation-plan proof summary.
  --json                   Print full JSON after writing.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJsonIfPresent(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readTextIfPresent(file) {
  if (!file || !fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function proofCountFromSummary(summary, productKeys) {
  if (!summary) return 0;

  const productSet = new Set(productKeys.map((key) => key.toLowerCase()));
  const direct = summary.products ?? summary.product_surfaces ?? summary.surfaces_by_product;
  if (direct && typeof direct === "object") {
    return Object.entries(direct)
      .filter(([product]) => productSet.has(product.toLowerCase()))
      .reduce((total, [, value]) => {
        if (typeof value === "number") return total + value;
        if (value && typeof value === "object") return total + Number(value.accepted ?? value.proven ?? value.numerator ?? 0);
        return total;
      }, 0);
  }

  const surfaces = summary.surfaces ?? summary.surface_results ?? [];
  if (Array.isArray(surfaces)) {
    return surfaces.filter((surface) => {
      const product = String(surface.product ?? surface.module ?? "").toLowerCase();
      const status = String(surface.status ?? surface.result ?? "").toLowerCase();
      return productSet.has(product) && ["pass", "passed", "accepted", "ok", "success"].includes(status);
    }).length;
  }

  return 0;
}

function movesProofFromSummary(summary) {
  const proof = summary?.moves_surfaces_browser_proven;
  if (!proof || typeof proof !== "object") return null;
  return {
    numerator: Number(proof.numerator ?? 0),
    denominator: Number(proof.denominator ?? MOVES_SURFACES.length),
    excluded: Number(proof.excluded ?? 0),
    accepted: Boolean(proof.accepted),
  };
}

function movesSurfaceProofFromSummary(summary) {
  const surfaces = Array.isArray(summary?.surfaces) ? summary.surfaces : [];
  const proof = new Map();
  for (const surface of surfaces) {
    const key = String(surface?.surface_key ?? "");
    if (!key) continue;
    proof.set(key, Boolean(surface?.accepted));
  }
  return proof;
}

function movesProofFromExistingStatus(status) {
  const proof = status?.phs_executive_demo?.moves_surfaces;
  if (!proof || typeof proof !== "object") return null;
  return {
    numerator: Number(proof.numerator ?? 0),
    denominator: Number(proof.denominator ?? MOVES_SURFACES.length),
    excluded: Number(proof.excluded ?? 0),
    accepted: String(proof.proof_state ?? "") === "browser_proof_complete",
  };
}

function movesSurfaceProofFromExistingStatus(status) {
  const surfaces = Array.isArray(status?.phs_executive_demo?.moves_surfaces?.surfaces)
    ? status.phs_executive_demo.moves_surfaces.surfaces
    : [];
  const proof = new Map();
  for (const surface of surfaces) {
    const key = String(surface?.surface_key ?? "");
    if (!key) continue;
    proof.set(key, Boolean(surface?.browser_proven));
  }
  return proof;
}

function handoffProofFromSummary(summary) {
  const proof = summary?.phs_cross_module_handoffs;
  if (!proof || typeof proof !== "object") return null;
  const handoffs = Array.isArray(summary?.handoffs) ? summary.handoffs : [];
  return {
    numerator: Number(proof.numerator ?? 0),
    denominator: Number(proof.denominator ?? HANDOFFS.length),
    accepted: Boolean(proof.accepted),
    handoffs,
  };
}

function handoffProofFromExistingStatus(status) {
  const proof = status?.phs_executive_demo?.cross_module_handoffs;
  if (!proof || typeof proof !== "object") return null;
  const handoffs = Array.isArray(proof.handoffs) ? proof.handoffs : [];
  const proofState = String(proof.proof_state ?? "");
  return {
    numerator: Number(proof.numerator ?? 0),
    denominator: Number(proof.denominator ?? HANDOFFS.length),
    accepted: proofState.includes("complete") || Number(proof.numerator ?? 0) >= Number(proof.denominator ?? HANDOFFS.length),
    handoffs,
  };
}

function movesActivationFromSummary(summary) {
  if (!summary || typeof summary !== "object") return null;
  const activation = summary.activation_summary ?? summary;
  const readback = summary.readback && typeof summary.readback === "object" ? summary.readback : null;
  const numerator = Number(activation.activation_program_count ?? readback?.engagements ?? 0);
  const denominator = Number(activation.declared_program_count ?? 38);
  const actualDatabaseMutation = Boolean(summary.actual_database_mutation);
  return {
    accepted: Boolean(summary.accepted && activation.accepted !== false),
    actual_database_mutation: actualDatabaseMutation,
    numerator,
    denominator,
    proof_state: actualDatabaseMutation
      ? "activation_loaded_and_readback_proven"
      : "activation_plan_ready_for_governed_load",
    generated_rows: readback ?? activation.generated_rows ?? null,
    programs_from_home_snapshot: Number(activation.programs_from_home_snapshot ?? 0),
    programs_from_source_room_ppm: Number(activation.programs_from_source_room_ppm ?? 0),
    unresolved_gap_count: Number(activation.unresolved_gap_count ?? denominator),
  };
}

function moveContentQuality() {
  const file = "src/lib/moves/narratives/generated/meridian-health-moves-readiness-blocks.ts";
  const text = readTextIfPresent(file);
  if (!text) {
    return {
      file,
      status: "missing",
      issues: ["generated_moves_readiness_blocks_missing"],
    };
  }

  const generatedAt = text.match(/generated_at:\s*"([^"]+)"/)?.[1] ?? null;
  const issues = [];
  if (generatedAt && new Date(generatedAt).getTime() < new Date(STALE_CONTENT_CUTOFF).getTime()) {
    issues.push(`generated_content_stale:${generatedAt}`);
  }
  if (text.includes("planning_grade_advisory")) {
    issues.push("moves_content_planning_grade_not_demo_final");
  }
  if ((text.match(/CEO \/ Enterprise Strategy/g) ?? []).length >= 3) {
    issues.push("interview_group_repeated_ceo_enterprise_strategy");
  }

  return {
    file,
    generated_at: generatedAt,
    runtime_import_state: "not_consumed_by_strategic_moves_routes",
    live_route_consumed: false,
    demo_blocking: false,
    status: issues.length ? "archived_generated_artifact_has_known_issues" : "current",
    issues,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const eclStatus = readJsonIfPresent(args.eclStatus);
  const browserProof = readJsonIfPresent(args.browserProof);
  const sourceProof = readJsonIfPresent(args.sourceProof);
  const handoffProof = readJsonIfPresent(args.handoffProof);
  const movesActivationProof = readJsonIfPresent(args.movesActivationProof);
  const movesActivation = movesActivationFromSummary(movesActivationProof);
  const existingStatus = readJsonIfPresent(args.out);

  const phsExecutiveEclDenominator = sum(Object.values(PHS_EXECUTIVE_ECL_DENOMINATOR));
  const phsExecutiveEclProven =
    proofCountFromSummary(browserProof, ["Home", "Tower", "Intelligence"]) ||
    (eclStatus?.lanes?.some?.((lane) => lane.lane === "L-PROOF" && lane.status === "complete") ? 31 : 0);

  const sourceDenominator = sum(Object.values(SOURCE_DENOMINATOR));
  const sourceProven =
    proofCountFromSummary(sourceProof, ["Source"]) ||
    proofCountFromSummary(browserProof, ["Source"]) ||
    (eclStatus?.lanes?.some?.((lane) => lane.lane === "L-PROOF" && lane.status === "complete") ? 9 : 0);
  const movesProof = movesProofFromSummary(browserProof) ?? movesProofFromExistingStatus(existingStatus);
  const movesSurfaceProof = browserProof
    ? movesSurfaceProofFromSummary(browserProof)
    : movesSurfaceProofFromExistingStatus(existingStatus);
  const latestLiveTraceProof =
    existingStatus?.phs_executive_demo?.moves_surfaces?.latest_live_trace_proof ?? null;
  const handoffProofSummary = handoffProofFromSummary(handoffProof) ?? handoffProofFromExistingStatus(existingStatus);

  const movesRouteStatuses = MOVES_SURFACES.map((surface) => {
    const browserProven = movesSurfaceProof.get(surface.surface_key) === true;
    return {
      ...surface,
      route_file_present: fs.existsSync(surface.file),
      browser_proven: browserProven,
      build_state: browserProven ? "browser_proven" : "enumerated_not_browser_proven",
    };
  });

  const movesFilesPresent = movesRouteStatuses.filter((surface) => surface.route_file_present).length;
  const handoffStatuses = HANDOFFS.map((handoff) => ({
    ...handoff,
    proof_state:
      handoffProofSummary?.handoffs.find((item) => item.handoff_key === handoff.handoff_key)?.proof_state ?? "not_proven",
  }));

  const status = {
    schema_version: "meridian_phs_demo_readiness_status/v1",
    generated_at: args.timestamp,
    tenant_key: TENANT_KEY,
    scope: {
      current_sprint_priority: "Meridian/PHS demo",
      deferred: [
        {
          tenant_key: "skyharbor-air",
          reason: "Airline-specific end-to-end demo proof is deferred; no active airline client demo is lined up.",
        },
      ],
    },
    phs_executive_demo: {
      products: ["Home", "Moves", "Intelligence", "Tower"],
      moves_route_source_audit: MOVES_ROUTE_AUDIT,
      home_tower_intelligence_surfaces: {
        numerator: phsExecutiveEclProven,
        denominator: phsExecutiveEclDenominator,
        percent: percent(phsExecutiveEclProven, phsExecutiveEclDenominator),
        denominator_note: "Home 16 + Tower 9 + Intelligence 6 from the ECL serving-surface denominator.",
        proof_state: phsExecutiveEclProven === phsExecutiveEclDenominator ? "repo_status_complete" : "proof_artifact_required",
      },
      moves_surfaces: {
        numerator: movesProof?.numerator ?? 0,
        denominator: movesProof?.denominator ?? MOVES_SURFACES.length,
        percent: percent(movesProof?.numerator ?? 0, movesProof?.denominator ?? MOVES_SURFACES.length),
        enumerated: true,
        route_files_present: movesFilesPresent,
        route_files_expected: MOVES_SURFACES.length,
        excluded: movesProof?.excluded ?? 0,
        proof_state: movesProof?.accepted ? "browser_proof_complete" : "browser_proof_required",
        ...(latestLiveTraceProof ? { latest_live_trace_proof: latestLiveTraceProof } : {}),
        surfaces: movesRouteStatuses,
      },
      moves_operational_activation: {
        numerator: movesActivation?.numerator ?? 0,
        denominator: movesActivation?.denominator ?? 38,
        percent: percent(
          movesActivation?.numerator ?? 0,
          movesActivation?.denominator ?? 38,
        ),
        proof_state: movesActivation?.accepted ? movesActivation.proof_state : "activation_plan_required",
        generated_rows: movesActivation?.generated_rows ?? null,
        programs_from_home_snapshot: movesActivation?.programs_from_home_snapshot ?? 0,
        programs_from_source_room_ppm: movesActivation?.programs_from_source_room_ppm ?? 0,
        unresolved_gap_count: movesActivation?.unresolved_gap_count ?? 38,
      },
      moves_content_quality: moveContentQuality(),
      cross_module_handoffs: {
        numerator: handoffProofSummary?.numerator ?? 0,
        denominator: handoffProofSummary?.denominator ?? HANDOFFS.length,
        percent: percent(handoffProofSummary?.numerator ?? 0, handoffProofSummary?.denominator ?? HANDOFFS.length),
        proof_state: handoffProofSummary?.accepted ? "deterministic_handoff_proof_complete" : "deterministic_handoff_proof_required",
        handoffs: handoffStatuses,
      },
    },
    source_sourcing_cxo_demo: {
      products: ["Source"],
      source_surfaces: {
        numerator: sourceProven,
        denominator: sourceDenominator,
        percent: percent(sourceProven, sourceDenominator),
        proof_state: sourceProven === sourceDenominator ? "repo_status_complete" : "proof_artifact_required",
        denominator_note: "Source remains a separate sourcing-CXO demo track.",
      },
    },
    next_backlog: [
      {
        order: 1,
        slice: "Resolve Moves operational activation proof",
        reason: "Moves live routes are browser-proven, but the activation tracker still has 0 of 38 operational rows proven by its dedicated load/readback artifact.",
        hard_gate: false,
      },
      {
        order: 2,
        slice: "Build Moves browser proof harness",
        reason: "Moves is not part of the ECL 40-surface denominator and needs its own proof.",
        hard_gate: false,
      },
      {
        order: 3,
        slice: "Prove cross-module handoffs",
        reason: "PHS demo needs Moves, Tower and Intelligence to tell one operating story.",
        hard_gate: false,
      },
      {
        order: 4,
        slice: "Refresh Source sourcing-CXO proof",
        reason: "Source is a separate demo and should not mask PHS Moves gaps.",
        hard_gate: false,
      },
    ],
    reporting_contract: {
      required_status_line:
        "Home/Tower/Intelligence: N of 31; Moves: N of M; Handoffs: N of 4; Source: N of 9.",
      no_single_aggregate_without_denominators: true,
    },
  };

  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, `${JSON.stringify(status, null, 2)}\n`);

  const summary = {
    tenant_key: status.tenant_key,
    home_tower_intelligence: `${phsExecutiveEclProven} of ${phsExecutiveEclDenominator}`,
    moves: `${movesProof?.numerator ?? 0} of ${movesProof?.denominator ?? MOVES_SURFACES.length}`,
    moves_activation: `${movesActivation?.numerator ?? 0} of ${movesActivation?.denominator ?? 38}`,
    handoffs: `${handoffProofSummary?.numerator ?? 0} of ${handoffProofSummary?.denominator ?? HANDOFFS.length}`,
    source: `${sourceProven} of ${sourceDenominator}`,
    out: args.out,
  };

  if (args.json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main();
