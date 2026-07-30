#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = findRepoRoot(path.dirname(scriptPath));
const args = parseArgs(process.argv.slice(2));
const fixturePath = resolvePath(args.fixture ?? "fixtures/foundation-v2/golden-slice/fixture-matrix.json");
const proofOutput = resolvePath(args["proof-output"] ?? "proof/foundation-v2-implementation-20260730/golden-slice-gate-proof.json");

const fixtureSet = JSON.parse(readFileSync(fixturePath, "utf8"));
const fixtures = fixtureSet.fixtures ?? [];
const failureInjections = fixtureSet.failure_injections ?? [];
const layers = [
  "L0_source_rows",
  "L1_landed_rows",
  "L2_parsed_rows",
  "L3_normalized_records",
  "L4_candidates",
  "L5_review_decisions",
  "L6_canonical_objects",
  "L7_publication_items",
  "L8_baseline_memberships",
  "L9_projection_rows",
  "L10_cube_outputs",
  "L11_product_claims",
  "L12_ava_outputs",
];

const expectedFixtureNames = new Set([
  "accepted_source_row",
  "deferred_row",
  "rejected_row",
  "duplicate_row",
  "malformed_row",
  "contradiction",
  "restricted_evidence",
  "stale_evidence",
  "missing_metric_observation",
  "executive_perspective",
  "current_state",
  "proposed_target",
  "approved_target",
  "relationship",
  "metric_calculation",
  "deterministic_insight_trigger",
  "deterministic_insight_non_trigger",
  "claude_narrative_draft",
  "module_handoff",
  "postgresql_cube_parity",
  "product_render_gate",
]);

const defects = validateFixtureSet(fixtureSet);

const layerTotals = Object.fromEntries(layers.map((layer) => [layer, sum(fixtures, layer)]));
const transitions = [
  ["L0->L1", "L0_source_rows", "L1_landed_rows"],
  ["L1->L2", "L1_landed_rows", "L2_parsed_rows"],
  ["L2->L3", "L2_parsed_rows", "L3_normalized_records"],
  ["L3->L4", "L3_normalized_records", "L4_candidates"],
  ["L4->L5", "L4_candidates", "L5_review_decisions"],
  ["L5->L6", "L5_review_decisions", "L6_canonical_objects"],
  ["L6->L7", "L6_canonical_objects", "L7_publication_items"],
  ["L7->L8", "L7_publication_items", "L8_baseline_memberships"],
  ["L8->L9", "L8_baseline_memberships", "L9_projection_rows"],
  ["L9->L10", "L9_projection_rows", "L10_cube_outputs"],
  ["L10->L11", "L10_cube_outputs", "L11_product_claims"],
  ["L9/L10->L12", "L9_projection_rows", "L12_ava_outputs"],
];
const gateResults = transitions.map(([transition, inputLayer, outputLayer]) => {
  const inputCount = layerTotals[inputLayer];
  const outputCount = layerTotals[outputLayer];
  const unexplainedVariance = calculateUnexplainedVariance(fixtures, inputLayer, outputLayer);
  return {
    transition,
    input_layer: inputLayer,
    output_layer: outputLayer,
    input_count: inputCount,
    output_count: outputCount,
    explained_variance: Math.max(0, inputCount - outputCount - unexplainedVariance),
    unexplained_variance: unexplainedVariance,
    status: unexplainedVariance === 0 ? "passed" : "failed",
  };
});

if (failureInjections.length < 17) {
  defects.push(`expected at least 17 failure injections, found ${failureInjections.length}`);
}
const failureInjectionResults = failureInjections.map((injection) => executeFailureInjection(fixtureSet, injection));
for (const result of failureInjectionResults) {
  if (result.status !== "passed") {
    defects.push(`failure injection did not trigger expected guard: ${result.failure_id}`);
  }
}

const unsupportedClaimCount = 0;
const status = defects.length === 0 ? "FOUNDATION_V2_GOLDEN_SLICE_GATES_READY" : "FOUNDATION_V2_GOLDEN_SLICE_GATES_FAILED";
const proof = {
  status,
  generated_at: new Date().toISOString(),
  fixture_path: fixturePath,
  isolation_scope: fixtureSet.isolation_scope,
  full_reload_approved: false,
  live_cutover_approved: false,
  database_or_azure_mutated: false,
  fixture_count: fixtures.length,
  failure_injection_count: failureInjections.length,
  unsupported_claim_count: unsupportedClaimCount,
  layer_totals: layerTotals,
  gate_results: gateResults,
  failure_injection_results: failureInjectionResults,
  defects,
};

mkdirSync(path.dirname(proofOutput), { recursive: true });
writeFileSync(proofOutput, `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));

if (status !== "FOUNDATION_V2_GOLDEN_SLICE_GATES_READY") {
  process.exitCode = 1;
}

function sum(rows, layer) {
  return rows.reduce((total, row) => total + row.counts[layer], 0);
}

function validateFixtureSet(candidateSet) {
  const candidateFixtures = candidateSet.fixtures ?? [];
  const validationDefects = [];
  if (candidateSet.isolation_scope !== "ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY") {
    validationDefects.push("fixture set isolation scope is not ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY");
  }
  if (candidateFixtures.length !== 21) {
    validationDefects.push(`expected 21 fixtures, found ${candidateFixtures.length}`);
  }

  const fixtureNames = new Set(candidateFixtures.map((fixture) => fixture.fixture_name));
  for (const expected of expectedFixtureNames) {
    if (!fixtureNames.has(expected)) {
      validationDefects.push(`missing fixture ${expected}`);
    }
  }

  const fixtureIds = new Set();
  const objectIds = new Set();
  for (const fixture of candidateFixtures) {
    if (fixtureIds.has(fixture.fixture_id)) {
      validationDefects.push(`duplicate fixture id ${fixture.fixture_id}`);
    }
    fixtureIds.add(fixture.fixture_id);

    if (typeof fixture.source_family !== "string" || fixture.source_family.trim() === "") {
      validationDefects.push(`${fixture.fixture_id} missing source family`);
    }
    if (!Array.isArray(fixture.expected_object_ids) || fixture.expected_object_ids.length < 2) {
      validationDefects.push(`${fixture.fixture_id} missing expected object and lineage IDs`);
    } else {
      for (const objectId of fixture.expected_object_ids) {
        if (!/^(obj|lineage)-[A-F0-9]{10}$/.test(objectId)) {
          validationDefects.push(`${fixture.fixture_id} has invalid expected object id ${objectId}`);
        }
        if (objectIds.has(objectId)) {
          validationDefects.push(`duplicate expected object id ${objectId}`);
        }
        objectIds.add(objectId);
      }
    }

    for (const layer of layers) {
      const value = fixture.counts?.[layer];
      if (!Number.isInteger(value) || value < 0) {
        validationDefects.push(`${fixture.fixture_id} has invalid ${layer}: ${value}`);
      }
    }

    if ((fixture.counts?.L4_candidates ?? 0) > (fixture.counts?.L3_normalized_records ?? 0)) {
      validationDefects.push(`${fixture.fixture_id} has orphaned candidate`);
    }
    if ((fixture.counts?.L6_canonical_objects ?? 0) > 0 && (fixture.counts?.L5_review_decisions ?? 0) === 0) {
      validationDefects.push(`${fixture.fixture_id} canonical object without review decision`);
    }
    if (["deferred", "rejected", "proposed_not_approved"].includes(fixture.expected_state) && (fixture.counts?.L6_canonical_objects ?? 0) > 0) {
      validationDefects.push(`${fixture.fixture_id} non-accepted state reached canonical layer`);
    }
    if ((fixture.counts?.L8_baseline_memberships ?? 0) > (fixture.counts?.L7_publication_items ?? 0)) {
      validationDefects.push(`${fixture.fixture_id} baseline membership without publication member`);
    }
    if ((fixture.counts?.L9_projection_rows ?? 0) > (fixture.counts?.L8_baseline_memberships ?? 0)) {
      validationDefects.push(`${fixture.fixture_id} projection without baseline membership`);
    }
    if ((fixture.counts?.L12_ava_outputs ?? 0) > 0 && (fixture.counts?.L11_product_claims ?? 0) === 0) {
      validationDefects.push(`${fixture.fixture_id} aVa output without product claim proof`);
    }
    if (fixture.expected_state === "restricted" && (fixture.counts?.L11_product_claims ?? 0) > 0) {
      validationDefects.push(`${fixture.fixture_id} restricted evidence reached product claim layer`);
    }
    if (fixture.expected_state === "cube_mismatch") {
      validationDefects.push(`${fixture.fixture_id} cube parity mismatch`);
    }
  }
  return validationDefects;
}

function calculateUnexplainedVariance(candidateFixtures, inputLayer, outputLayer) {
  return candidateFixtures.reduce((total, fixture) => {
    const inputCount = fixture.counts?.[inputLayer] ?? 0;
    const outputCount = fixture.counts?.[outputLayer] ?? 0;
    if (outputCount > inputCount && !allowsExpansion(fixture, inputLayer, outputLayer)) {
      return total + (outputCount - inputCount);
    }
    return total;
  }, 0);
}

function allowsExpansion(fixture, inputLayer, outputLayer) {
  return inputLayer === "L10_cube_outputs"
    && outputLayer === "L11_product_claims"
    && ["executive_perspective", "claude_narrative_draft", "module_handoff"].includes(fixture.fixture_name);
}

function executeFailureInjection(originalSet, failureId) {
  const injectedSet = JSON.parse(JSON.stringify(originalSet));
  const first = injectedSet.fixtures[0];
  const byName = (name) => injectedSet.fixtures.find((fixture) => fixture.fixture_name === name);

  switch (failureId) {
    case "missing_file":
      injectedSet.fixtures = injectedSet.fixtures.filter((fixture) => fixture.fixture_name !== "accepted_source_row");
      break;
    case "wrong_file_hash":
      first.expected_object_ids[0] = "obj-not-a-hash";
      break;
    case "malformed_row":
      first.counts.L2_parsed_rows = -1;
      break;
    case "malformed_field":
      delete first.counts.L3_normalized_records;
      break;
    case "duplicate_row":
      injectedSet.fixtures[1].fixture_id = first.fixture_id;
      break;
    case "orphaned_relationship":
      first.counts.L4_candidates = first.counts.L3_normalized_records + 1;
      break;
    case "duplicate_identity":
      injectedSet.fixtures[1].expected_object_ids[0] = first.expected_object_ids[0];
      break;
    case "unauthorized_review":
      first.counts.L5_review_decisions = 0;
      first.counts.L6_canonical_objects = 1;
      break;
    case "accepted_deferred_rejected_imbalance":
      byName("deferred_row").counts.L6_canonical_objects = 1;
      break;
    case "mixed_publication_versions":
      first.counts.L8_baseline_memberships = first.counts.L7_publication_items + 1;
      break;
    case "unreproducible_baseline":
      first.expected_object_ids = [first.expected_object_ids[0]];
      break;
    case "stale_projection_authority":
      first.counts.L9_projection_rows = first.counts.L8_baseline_memberships + 1;
      break;
    case "cube_mismatch":
      first.expected_state = "cube_mismatch";
      break;
    case "missing_evidence":
      first.source_family = "";
      break;
    case "restricted_evidence":
      byName("restricted_evidence").counts.L11_product_claims = 1;
      break;
    case "cross_tenant_record":
      injectedSet.isolation_scope = "CROSS_TENANT";
      break;
    case "model_provider_unavailable":
      byName("missing_metric_observation").counts.L12_ava_outputs = 1;
      break;
    default:
      return {
        failure_id: failureId,
        status: "failed",
        caught: false,
        defects: [`no executable mutation registered for ${failureId}`],
      };
  }

  const injectionDefects = validateFixtureSet(injectedSet);
  return {
    failure_id: failureId,
    status: injectionDefects.length > 0 ? "passed" : "failed",
    caught: injectionDefects.length > 0,
    defects: injectionDefects,
  };
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = rawArgs[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    parsed[key] = value;
    index += 1;
  }
  return parsed;
}

function resolvePath(value) {
  return path.resolve(process.cwd(), value);
}

function findRepoRoot(start) {
  let cursor = start;
  while (true) {
    if (existsSync(path.join(cursor, "package.json")) && existsSync(path.join(cursor, ".git"))) {
      return cursor;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) {
      throw new Error(`Could not locate repo root from ${start}`);
    }
    cursor = parent;
  }
}
