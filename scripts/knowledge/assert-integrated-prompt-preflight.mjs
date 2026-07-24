#!/usr/bin/env node
// Zero-cost runtime-path proof for the integrated_dimensions prompt.
//
// validate-integrated-manifest.mjs proves a CANDIDATE OUTPUT is well-formed.
// It cannot prove the RUNTIME PROMPT the deployed job actually sends to
// Claude carries the hardened contract -- a validator can be perfect while
// the assembled prompt silently omits the fields it expects (stale common
// object, a binding map key that matches no real dimension, a dataset
// registered with no available_dimensions, etc). This module asserts
// directly against the prompt object produced by makePrompt() in
// build-home-knowledge-v4-review-pack.mjs, before any model call.
//
// Usage: node assert-integrated-prompt-preflight.mjs <prompt.json> <packet.json>

import fs from "node:fs";

const EXPECTED_DIMENSION_COUNT = 38;
const REQUIRED_VISUAL_BINDING_SHAPE_KEYS = ["dataset_id", "visual_type", "dimension", "measure", "filters", "sort", "limit"];

export function assertIntegratedPromptPreflight(prompt, packet) {
  const failures = [];
  const fail = (rule_id, message, extra = {}) => failures.push({ severity: "fail", rule_id, message, ...extra });

  // 1. dataset_registry present
  const registry = prompt.deterministic_dataset_registry;
  if (!Array.isArray(registry) || registry.length === 0) {
    fail("preflight.registry_missing", "prompt.deterministic_dataset_registry is missing or empty.");
  }

  // 2. real evidence_index with ALL entries present -- not just non-empty.
  // A truncated evidence_index would still pass a naive "non-empty" check.
  const evidenceIndex = prompt.evidence_index;
  const packetEvidenceCount = (packet.evidence_index ?? []).length;
  if (!Array.isArray(evidenceIndex) || evidenceIndex.length === 0) {
    fail("preflight.evidence_index_empty", "prompt.evidence_index is missing or empty.");
  } else if (evidenceIndex.length !== packetEvidenceCount) {
    fail(
      "preflight.evidence_index_incomplete",
      `prompt.evidence_index has ${evidenceIndex.length} entries but the packet has ${packetEvidenceCount}.`,
    );
  }

  // 3. dimension_dataset_bindings present
  const bindings = prompt.dimension_dataset_bindings;
  if (!bindings || Object.keys(bindings).length === 0) {
    fail("preflight.bindings_missing", "prompt.dimension_dataset_bindings is missing or empty.");
  }

  // 4. visual_binding_contract present, with the declarative shape
  if (!prompt.visual_binding_contract?.shape) {
    fail("preflight.visual_contract_missing", "prompt.visual_binding_contract.shape is missing.");
  } else {
    for (const key of REQUIRED_VISUAL_BINDING_SHAPE_KEYS) {
      if (!(key in prompt.visual_binding_contract.shape)) {
        fail("preflight.visual_contract_shape_incomplete", `visual_binding_contract.shape is missing "${key}".`);
      }
    }
  }

  // 5. allowed dataset IDs per dimension: every binding's primary_dataset
  // must resolve against the registry actually sent in this prompt.
  const registryIds = new Set((registry ?? []).map((d) => d.dataset_id));
  const requestedDimensionKeys = new Set((prompt.dimensions ?? []).map((d) => d.key));
  for (const [dimKey, binding] of Object.entries(bindings ?? {})) {
    if (binding.primary_dataset && !registryIds.has(binding.primary_dataset)) {
      fail(
        "preflight.binding_unresolved_dataset",
        `binding for "${dimKey}" points to unregistered dataset "${binding.primary_dataset}".`,
        { dimension_key: dimKey },
      );
    }
    // A binding key that matches no requested dimension_key can never be
    // applied -- this is the exact "spend" vs "budget" class of bug: the
    // map looked complete but was silently unreachable.
    if (!requestedDimensionKeys.has(dimKey)) {
      fail(
        "preflight.binding_unreachable_dimension",
        `dimension_dataset_bindings has an entry for "${dimKey}" but no requested dimension uses that key -- unreachable.`,
        { dimension_key: dimKey },
      );
    }
  }

  // 6. allowed dimensions and measures per dataset
  for (const entry of registry ?? []) {
    if (!Array.isArray(entry.available_dimensions) || entry.available_dimensions.length === 0) {
      fail("preflight.dataset_missing_dimensions", `registered dataset "${entry.dataset_id}" has no available_dimensions.`, { dataset_id: entry.dataset_id });
    }
    if (!Array.isArray(entry.available_measures) || entry.available_measures.length === 0) {
      fail("preflight.dataset_missing_measures", `registered dataset "${entry.dataset_id}" has no available_measures.`, { dataset_id: entry.dataset_id });
    }
  }

  // 7. current source_context_hash present
  if (!prompt.common?.tenant?.source_snapshot_hash) {
    fail("preflight.source_hash_missing", "common.tenant.source_snapshot_hash is missing.");
  }

  // 8. prompt_version present (both the pass-specific binding-map version
  // and the shared prompt-contract version travel in the payload)
  if (!prompt.contract_version) {
    fail("preflight.prompt_version_missing", "prompt.contract_version is missing.");
  }
  if (!prompt.common?.locked_objects?.prompt_contract_version) {
    fail("preflight.prompt_version_missing", "common.locked_objects.prompt_contract_version is missing.");
  }

  // 9. expected 38-dimension list
  const dims = prompt.dimensions ?? [];
  if (dims.length !== EXPECTED_DIMENSION_COUNT) {
    fail("preflight.dimension_count_mismatch", `prompt.dimensions has ${dims.length} entries, expected ${EXPECTED_DIMENSION_COUNT}.`);
  }

  // 10. explicit prohibition on numeric visual payloads
  const instructionText = `${prompt.instruction ?? ""} ${prompt.visual_binding_contract?.instruction ?? ""}`;
  if (!/never\s+contain\s+data_points/i.test(instructionText)) {
    fail("preflight.prohibition_text_missing", "No explicit 'must never contain data_points' prohibition found in the prompt's instruction text.");
  }

  // 11. the OLD chart contract (data_points/encoding/annotation-required)
  // must not be present anywhere in THIS pass's payload. An "ignore this"
  // prose notice next to the field is not sufficient -- the field itself
  // must be absent. This is the exact material gap this module exists to
  // close: a validator on the candidate output cannot see this; only
  // inspecting the actual assembled prompt can.
  if (Object.hasOwn(prompt.common ?? {}, "visual_contract_rules")) {
    fail(
      "preflight.stale_visual_contract_rules_present",
      "prompt.common.visual_contract_rules (the OLD chart contract requiring data_points/encoding/annotation) is still present in the integrated prompt payload.",
    );
  }
  const promptText = JSON.stringify(prompt);
  if (/data_points",\s*"encoding",\s*"annotation"/.test(promptText)) {
    fail(
      "preflight.old_required_visual_fields_text_present",
      "The OLD requiredVisualFields list text (data_points, encoding, annotation, ...) appears verbatim in the integrated prompt payload.",
    );
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    failure_count: failures.length,
    failures,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , promptPath, packetPath] = process.argv;
  if (!promptPath || !packetPath) {
    console.error("Usage: node assert-integrated-prompt-preflight.mjs <prompt.json> <packet.json>");
    process.exit(2);
  }
  const prompt = JSON.parse(fs.readFileSync(promptPath, "utf8"));
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  const result = assertIntegratedPromptPreflight(prompt, packet);
  console.log(`status: ${result.status}`);
  console.log(`failures: ${result.failure_count}`);
  console.log();
  for (const f of result.failures) {
    console.log(`  [FAIL] ${f.rule_id}${f.dimension_key ? ` (${f.dimension_key})` : ""}${f.dataset_id ? ` (${f.dataset_id})` : ""}: ${f.message}`);
  }
  process.exit(result.status === "pass" ? 0 : 1);
}
