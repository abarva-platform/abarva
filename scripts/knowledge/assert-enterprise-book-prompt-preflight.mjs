#!/usr/bin/env node
// Zero-cost runtime-path proof for the enterprise_book prompt (book-mode
// architecture: scripts/knowledge/build-home-knowledge-v4-review-pack.mjs's
// "enterprise_book" pass). Mirrors assert-integrated-prompt-preflight.mjs's
// contract, but the strongest check here is stronger than that one: not
// "does the visual contract forbid data_points," but "does Claude's schema
// ever ask for a visual field at all." Book mode's whole premise is that
// visual_binding is never something Claude can fabricate into, because it
// never appears in the requested output shape.
//
// Usage: node assert-enterprise-book-prompt-preflight.mjs <prompt.json> <packet.json>

import fs from "node:fs";

const EXPECTED_DIMENSION_COUNT = 38;
const VISUAL_FIELD_NAMES = ["visual_type", "data_points", "dataset_id", "encoding", "chart", "visual_binding"];

export function assertEnterpriseBookPromptPreflight(prompt, packet) {
  const failures = [];
  const fail = (rule_id, message, extra = {}) => failures.push({ severity: "fail", rule_id, message, ...extra });

  // 1. dataset_registry present
  const registry = prompt.deterministic_dataset_registry ?? packet.deterministic_dataset_registry;
  if (!Array.isArray(registry) || registry.length === 0) {
    fail("preflight.registry_missing", "prompt (or packet) deterministic_dataset_registry is missing or empty.");
  }

  // 2. real evidence_index with ALL entries present
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

  // 3. dimension_chapters present and covers all 38 catalog keys, no
  // duplicates, no unknown keys -- this is the book-mode equivalent of
  // "dimension_dataset_bindings present" in the integrated preflight.
  const chapters = prompt.dimension_chapters;
  if (!chapters || Object.keys(chapters).length === 0) {
    fail("preflight.chapters_missing", "prompt.dimension_chapters is missing or empty.");
  } else {
    const catalogKeys = new Set((prompt.dimension_catalog ?? []).map((d) => d.key));
    const chapterKeys = Object.keys(chapters);
    if (chapterKeys.length !== EXPECTED_DIMENSION_COUNT) {
      fail("preflight.chapter_count_mismatch", `dimension_chapters has ${chapterKeys.length} entries, expected ${EXPECTED_DIMENSION_COUNT}.`);
    }
    for (const key of chapterKeys) {
      if (catalogKeys.size > 0 && !catalogKeys.has(key)) {
        fail("preflight.chapter_unknown_dimension", `dimension_chapters has an entry for "${key}" which is not in dimension_catalog.`, { dimension_key: key });
      }
    }
  }

  // 4. current source_context_hash present
  if (!prompt.common?.tenant?.source_snapshot_hash) {
    fail("preflight.source_hash_missing", "common.tenant.source_snapshot_hash is missing.");
  }

  // 5. prompt_version present
  if (!prompt.contract_version) {
    fail("preflight.prompt_version_missing", "prompt.contract_version is missing.");
  }
  if (!prompt.common?.locked_objects?.prompt_contract_version) {
    fail("preflight.prompt_version_missing", "common.locked_objects.prompt_contract_version is missing.");
  }

  // 6. expected 38-dimension list
  const dims = prompt.dimension_catalog ?? [];
  if (dims.length !== EXPECTED_DIMENSION_COUNT) {
    fail("preflight.dimension_count_mismatch", `prompt.dimension_catalog has ${dims.length} entries, expected ${EXPECTED_DIMENSION_COUNT}.`);
  }

  // 7. the OLD chart contract must be structurally absent, same as the
  // integrated preflight's check.
  if (Object.hasOwn(prompt.common ?? {}, "visual_contract_rules")) {
    fail(
      "preflight.stale_visual_contract_rules_present",
      "prompt.common.visual_contract_rules (the OLD chart contract) is still present in the enterprise_book prompt payload.",
    );
  }

  // 8. the STRONG book-mode check: no visual/chart field name may appear
  // anywhere Claude's actual requested schema (the literal field-name lists:
  // `fields`, `executive_narrative_fields`, and any other array of field
  // names) -- those arrays are the real output surface, so a name appearing
  // there really is a request. Prose fields (dimension_notes_shape,
  // hard_limits, instruction) are checked separately below, because prose
  // MUST be able to name a forbidden field in order to prohibit it --
  // "never include visual_type" necessarily contains the substring
  // "visual_type". A blunt substring scan across the whole
  // output_requirements object cannot tell a request from a prohibition and
  // will always self-defeat on its own prohibition text.
  const requirements = prompt.output_requirements ?? {};
  for (const [key, value] of Object.entries(requirements)) {
    if (!Array.isArray(value)) continue;
    for (const field of VISUAL_FIELD_NAMES) {
      if (value.includes(field)) {
        fail(
          "preflight.visual_field_requested_from_model",
          `output_requirements.${key} literally lists "${field}" as a field to return -- book mode must never ask Claude for a visual/chart field; the renderer owns every visual_binding deterministically.`,
        );
      }
    }
  }

  // 9. Prose fields (dimension_notes_shape, hard_limits, instruction) may
  // name a forbidden field ONLY inside an explicit prohibition -- "never
  // include X" / "must not include X" / "do not include X". A mention with
  // no such guard nearby is treated as silently permitting it.
  const proseFields = ["instruction", "dimension_notes_shape", "hard_limits"];
  const prohibitionPattern = /\b(never|must not|do not|don't|cannot)\s+(include|contain|use|choose|write|return)\b/i;
  for (const key of proseFields) {
    const text = asString(prompt[key] ?? requirements[key]);
    if (!text) continue;
    for (const field of VISUAL_FIELD_NAMES) {
      if (text.includes(field) && !prohibitionPattern.test(text)) {
        fail(
          "preflight.prose_field_mentions_visual_without_prohibition",
          `${key} mentions "${field}" without an explicit "never/must not include" prohibition nearby.`,
        );
      }
    }
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    failure_count: failures.length,
    failures,
  };
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , promptPath, packetPath] = process.argv;
  if (!promptPath || !packetPath) {
    console.error("Usage: node assert-enterprise-book-prompt-preflight.mjs <prompt.json> <packet.json>");
    process.exit(2);
  }
  const prompt = JSON.parse(fs.readFileSync(promptPath, "utf8"));
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  const result = assertEnterpriseBookPromptPreflight(prompt, packet);
  console.log(`status: ${result.status}`);
  console.log(`failures: ${result.failure_count}`);
  console.log();
  for (const f of result.failures) {
    console.log(`  [FAIL] ${f.rule_id}${f.dimension_key ? ` (${f.dimension_key})` : ""}: ${f.message}`);
  }
  process.exit(result.status === "pass" ? 0 : 1);
}
