#!/usr/bin/env node
// Deterministic validator for the integrated Home Book manifest shape
// (scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
// integrated_dimensions pass). Distinct from validate-dimension-contradictions.mjs
// (targets the OLD 5-tab per-dimension shape) -- this targets the NEW
// {enterprise_story, dimensions[]} shape. No model call, no cost.
//
// Usage: node validate-integrated-manifest.mjs <candidate.json> <packet.json> [--bindings <bindings.json>]

import fs from "node:fs";

const EXPECTED_DIMENSION_COUNT = 38;

// Any key on visual_binding outside this allow-list is treated as a
// model-generated value. The allow-list distinguishes DATA (forbidden --
// data_points, series, values, percentages, computed_totals, x_values,
// y_values) from legitimate PRESENTATION instructions (permitted -- title,
// annotation_instruction, format, orientation): the contract prohibits the
// model inventing figures, not the model giving the renderer useful
// non-numeric styling hints.
const VISUAL_BINDING_ALLOWED_KEYS = new Set([
  "dataset_id", "visual_type", "dimension", "measure", "filters", "sort", "limit",
  "title", "annotation_instruction", "format", "orientation", "interpretation",
]);

function checkVisualBindingForFabrication(dim) {
  const vb = dim.visual_binding;
  if (!vb || typeof vb !== "object") return [];
  const failures = [];
  for (const key of Object.keys(vb)) {
    if (!VISUAL_BINDING_ALLOWED_KEYS.has(key)) {
      failures.push({
        severity: "fail",
        type: "forbidden_visual_field",
        dimension_key: dim.dimension_key,
        field: key,
        message: `visual_binding.${key} is not in the allowed declarative shape (${Array.from(VISUAL_BINDING_ALLOWED_KEYS).join(", ")}) -- likely model-generated data.`,
      });
    }
  }
  return failures;
}

// Same non-fabricable-pointer principle as visual_binding: graph_binding
// must be a real, code-computed SUMMARY (counts, real relationship types)
// -- never actual node/edge names or a full graph payload, which would
// both leak raw data and give a model something to fabricate into.
const GRAPH_BINDING_ALLOWED_KEYS = new Set([
  "relationship_source", "projection_type", "node_count", "edge_count", "relationship_types", "empty_state",
]);

function checkGraphBindingForFabrication(dim) {
  const gb = dim.graph_binding;
  if (!gb || typeof gb !== "object") return [];
  const failures = [];
  for (const key of Object.keys(gb)) {
    if (!GRAPH_BINDING_ALLOWED_KEYS.has(key)) {
      failures.push({
        severity: "fail",
        type: "forbidden_graph_field",
        dimension_key: dim.dimension_key,
        field: key,
        message: `graph_binding.${key} is not in the allowed summary shape (${Array.from(GRAPH_BINDING_ALLOWED_KEYS).join(", ")}) -- graph_binding must be a count/type summary, never raw nodes or edges.`,
      });
    }
  }
  if (Array.isArray(gb.node_count) || Array.isArray(gb.edge_count)) {
    failures.push({
      severity: "fail",
      type: "forbidden_graph_field",
      dimension_key: dim.dimension_key,
      message: "graph_binding.node_count/edge_count must be numbers, not arrays -- an array here would mean actual node/edge data leaked in.",
    });
  }
  return failures;
}

export function validateIntegratedManifest(candidate, packet, options = {}) {
  const failures = [];
  const warnings = [];

  const datasets = new Map((packet.deterministic_dataset_registry ?? []).map((d) => [d.dataset_id, d]));
  const datasetIds = new Set(datasets.keys());
  const evidenceIds = new Set((packet.evidence_index ?? []).map((e) => e.evidence_id));
  // specificity: "low" for a real, ID-resolvable evidence row whose locator
  // is only a generic placeholder (e.g. "synthetic locator 4") -- valid
  // enough to resolve, too generic to actually establish a specific claim.
  // Review finding: 72 of 80 real skyharbor-air evidence rows are this
  // shape. ID resolution alone (the check above/below) cannot see this;
  // this is a distinct, additional semantic check.
  const evidenceSpecificity = new Map((packet.evidence_index ?? []).map((e) => [e.evidence_id, e.specificity ?? "high"]));
  const bindings = options.bindings ?? {};

  if (!candidate.enterprise_story_integrated && !candidate.enterprise_story) {
    failures.push({ severity: "fail", type: "missing_enterprise_story", message: "No enterprise_story present." });
  }

  const dims = candidate.dimensions ?? [];
  if (dims.length !== EXPECTED_DIMENSION_COUNT) {
    failures.push({
      severity: "fail",
      type: "dimension_count_mismatch",
      message: `Expected ${EXPECTED_DIMENSION_COUNT} dimensions, found ${dims.length}.`,
    });
  }

  const seenKeys = new Set();
  for (const dim of dims) {
    const key = dim.dimension_key;
    if (!key) {
      failures.push({ severity: "fail", type: "missing_dimension_key", message: "A dimension is missing dimension_key." });
      continue;
    }
    if (seenKeys.has(key)) {
      failures.push({ severity: "fail", type: "duplicate_dimension_key", dimension_key: key, message: `Dimension key "${key}" appears more than once.` });
    }
    seenKeys.add(key);

    // Fabricated visual data -- the highest-priority check.
    failures.push(...checkVisualBindingForFabrication(dim));
    failures.push(...checkGraphBindingForFabrication(dim));

    // Dataset bindings must resolve to a real, registered dataset_id.
    for (const bindingField of ["data_binding", "relationship_binding", "gap_binding"]) {
      const b = dim[bindingField];
      if (b?.dataset_id && !datasetIds.has(b.dataset_id)) {
        failures.push({
          severity: "fail",
          type: "unresolved_dataset_binding",
          dimension_key: key,
          message: `${bindingField}.dataset_id "${b.dataset_id}" is not in deterministic_dataset_registry.`,
        });
      }
    }
    if (dim.visual_binding?.dataset_id && !datasetIds.has(dim.visual_binding.dataset_id)) {
      failures.push({
        severity: "fail",
        type: "unresolved_dataset_binding",
        dimension_key: key,
        message: `visual_binding.dataset_id "${dim.visual_binding.dataset_id}" is not in deterministic_dataset_registry.`,
      });
    }

    // visual_binding.dimension/measure must be real fields on the bound
    // dataset, not invented ones -- the schema-shape check (no data_points
    // etc.) does not catch a syntactically valid field name that doesn't
    // exist on that dataset's registry entry.
    if (dim.visual_binding?.dataset_id) {
      const datasetEntry = datasets.get(dim.visual_binding.dataset_id);
      if (datasetEntry) {
        if (dim.visual_binding.dimension && !(datasetEntry.available_dimensions ?? []).includes(dim.visual_binding.dimension)) {
          failures.push({
            severity: "fail",
            type: "unknown_visual_field",
            dimension_key: key,
            message: `visual_binding.dimension "${dim.visual_binding.dimension}" is not in ${dim.visual_binding.dataset_id}'s available_dimensions.`,
          });
        }
        if (dim.visual_binding.measure && !(datasetEntry.available_measures ?? []).includes(dim.visual_binding.measure)) {
          failures.push({
            severity: "fail",
            type: "unknown_visual_field",
            dimension_key: key,
            message: `visual_binding.measure "${dim.visual_binding.measure}" is not in ${dim.visual_binding.dataset_id}'s available_measures.`,
          });
        }
      }
    }

    // A dimension with a governed binding available must use it, not an
    // unapproved dataset, and must not skip the binding entirely.
    const approvedBinding = bindings[key];
    if (approvedBinding) {
      const usedDatasetId = dim.data_binding?.dataset_id ?? dim.visual_binding?.dataset_id;
      if (usedDatasetId && usedDatasetId !== approvedBinding.primary_dataset) {
        failures.push({
          severity: "fail",
          type: "unapproved_dataset_for_dimension",
          dimension_key: key,
          message: `Dimension "${key}" bound to "${usedDatasetId}", but the approved primary_dataset is "${approvedBinding.primary_dataset}".`,
        });
      }
      if (!usedDatasetId) {
        warnings.push({
          severity: "warn",
          type: "missing_expected_binding",
          dimension_key: key,
          message: `Dimension "${key}" has an approved dataset binding ("${approvedBinding.primary_dataset}") but did not use it.`,
        });
      }
    }

    // Evidence references must resolve against the real evidence_index.
    const allRefs = [
      ...(dim.evidence_refs ?? []),
      ...(dim.key_insights ?? []).flatMap((i) => i.evidence_refs ?? []),
    ];
    for (const ref of allRefs) {
      if (!evidenceIds.has(ref)) {
        failures.push({
          severity: "fail",
          type: "unresolved_evidence_id",
          dimension_key: key,
          message: `Evidence ID "${ref}" is not in evidence_index.`,
        });
      }
    }
    for (const insight of dim.key_insights ?? []) {
      const refs = insight.evidence_refs ?? [];
      // An empty evidence_refs array is only acceptable when it is an
      // HONEST "not_evidenced" marker (the contract this pass now asks for),
      // not a silent omission -- those are materially different: one
      // discloses the gap, the other hides it.
      if (refs.length === 0 && insight.evidence_status !== "not_evidenced") {
        failures.push({
          severity: "fail",
          type: "insight_without_evidence",
          dimension_key: key,
          message: `key_insight "${(insight.statement ?? "").slice(0, 60)}..." has no evidence_refs and no evidence_status: "not_evidenced" marker.`,
        });
        continue;
      }
      // Semantic weakness check: every cited ID resolves, but if EVERY one
      // of them is a low-specificity placeholder locator, that is too weak
      // to actually establish a precise claim -- flag it, don't silently
      // accept ID-resolution as sufficient support.
      if (refs.length > 0 && refs.every((r) => evidenceSpecificity.get(r) === "low") && insight.evidence_status !== "not_evidenced") {
        warnings.push({
          severity: "warn",
          type: "weak_evidence_specificity",
          dimension_key: key,
          message: `key_insight "${(insight.statement ?? "").slice(0, 60)}..." is supported only by low-specificity placeholder evidence (${refs.join(", ")}) -- technically resolved, but too generic to establish this specific claim.`,
        });
      }
    }
  }

  // Freshness: compare the packet's own source_snapshot_hash against what
  // the candidate claims it was generated against.
  const candidateHash = candidate.tenant?.source_snapshot_hash ?? candidate.locked_objects?.source_snapshot_hash;
  const currentHash = packet.tenant?.source_snapshot_hash;
  if (candidateHash && currentHash && candidateHash !== currentHash) {
    failures.push({
      severity: "fail",
      type: "stale_source_context_hash",
      message: `Candidate generated against hash ${candidateHash}, current source hash is ${currentHash}.`,
    });
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    failure_count: failures.length,
    warning_count: warnings.length,
    failures,
    warnings,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , candidatePath, packetPath, ...rest] = process.argv;
  if (!candidatePath || !packetPath) {
    console.error("Usage: node validate-integrated-manifest.mjs <candidate.json> <packet.json> [--bindings <bindings.json>]");
    process.exit(2);
  }
  const bindingsFlagIndex = rest.indexOf("--bindings");
  const bindings = bindingsFlagIndex >= 0
    ? JSON.parse(fs.readFileSync(rest[bindingsFlagIndex + 1], "utf8"))
    : {};

  const candidate = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  const result = validateIntegratedManifest(candidate, packet, { bindings });

  console.log(`status: ${result.status}`);
  console.log();
  console.log(formatCategorySummary(result));
  console.log();
  for (const f of result.failures) {
    console.log(`  [FAIL] ${f.type}${f.dimension_key ? ` (${f.dimension_key})` : ""}: ${f.message}`);
  }
  for (const w of result.warnings) {
    console.log(`  [warn] ${w.type}${w.dimension_key ? ` (${w.dimension_key})` : ""}: ${w.message}`);
  }
  process.exit(result.status === "pass" ? 0 : 1);
}

// Groups every finding by type/rule id and reports hard-failure vs. warning
// counts separately per category, plus totals -- so "234 failures" is never
// reported as an opaque number without a per-rule reconciliation.
export function formatCategorySummary(result) {
  const byType = new Map();
  for (const f of result.failures) {
    const entry = byType.get(f.type) ?? { hard: 0, warn: 0 };
    entry.hard += 1;
    byType.set(f.type, entry);
  }
  for (const w of result.warnings) {
    const entry = byType.get(w.type) ?? { hard: 0, warn: 0 };
    entry.warn += 1;
    byType.set(w.type, entry);
  }
  const lines = [];
  for (const [type, { hard, warn }] of byType) {
    const label = type.padEnd(32);
    if (hard > 0 && warn > 0) lines.push(`${label}${hard} hard / ${warn} warning`);
    else if (warn > 0) lines.push(`${label}0 hard / ${warn} warning`);
    else lines.push(`${label}${hard}`);
  }
  lines.push("".padEnd(32, "-"));
  lines.push(`${"total_hard_failures".padEnd(32)}${result.failure_count}`);
  lines.push(`${"total_warnings".padEnd(32)}${result.warning_count}`);
  return lines.join("\n");
}
