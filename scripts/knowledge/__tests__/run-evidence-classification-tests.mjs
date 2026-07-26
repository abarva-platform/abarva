#!/usr/bin/env node
// Zero-cost, zero-network regression suite for a real cross-field confusion
// bug: Claude sometimes writes evidence_maturity's legitimate "directional"
// value into a dimension tab's `classification` field instead. Confirmed
// against a real regenerated skyharbor-air candidate (legacy pipeline, not
// book mode): validateCandidate() -> validateDimensionTabs() and
// validateClosedEnums() both failed on `integrations.evidence_tab` and
// `vendors.evidence_tab` with classification "directional", which is not in
// classificationEnum. "directional" IS a real, legitimate value -- but only
// for the separate evidence_maturity field on use-case items.
//
// Fix is producer-side, not a validator weakening: classificationEnum is
// unchanged (still 5 values, no "directional"); a known, documented
// confusion is remapped to the value the prompt itself already names as
// correct (strategic_inference) before the gate runs; any OTHER unknown
// classification still fails exactly as before.
//
// Run: node scripts/knowledge/__tests__/run-evidence-classification-tests.mjs

import {
  classificationEnum,
  evidenceMaturityEnum,
  normalizeDirectionalClassification,
  normalizeLegacyDimensionClassifications,
  validateClosedEnums,
  validateDimensionTabs,
} from "../build-home-knowledge-v4-review-pack.mjs";

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`[FAIL] ${message}`);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

function validTab(classification = "loaded_fact") {
  return { headline: "x", executive_read: "x", classification };
}

function makeDimension(dimensionKey, { evidenceTabClassification = "loaded_fact", primaryVisualClassification = "loaded_fact" } = {}) {
  return {
    dimension_key: dimensionKey,
    summary_tab: validTab(),
    data_tab: { ...validTab(), filters: [], rows: [] },
    relationship_tab: { ...validTab(), graph_nodes: [], graph_edges: [], paths_to_show: [] },
    gaps_tab: { ...validTab(), decision_gaps: [], evidence_to_collect: [] },
    evidence_tab: { ...validTab(evidenceTabClassification), source_inventory: [], what_it_proves: "x", what_it_does_not_prove: "x", next_evidence_request: "x" },
    primary_visual: { visual_type: "horizontal_bar", title: "x", executive_question: "x", classification: primaryVisualClassification, data_points: [], encoding: {}, annotation: "x", evidence_boundary: "x", empty_state: "x" },
  };
}

// --- classificationEnum / evidenceMaturityEnum are unchanged (no weakening) ---

assert(
  classificationEnum.length === 5 && !classificationEnum.includes("directional"),
  `classificationEnum still has exactly 5 values and never includes "directional" (the validator was not weakened) -- got [${classificationEnum.join(", ")}]`,
);

assert(
  evidenceMaturityEnum.includes("directional"),
  `evidenceMaturityEnum still legitimately includes "directional" for its real field (evidence_maturity, on use-case items) -- got [${evidenceMaturityEnum.join(", ")}]`,
);

// --- normalizeDirectionalClassification: pure function ---

assert(
  normalizeDirectionalClassification("directional") === "strategic_inference",
  'normalizeDirectionalClassification("directional") remaps to "strategic_inference" (the value the prompt itself already names as correct for directional-source data)',
);

for (const value of classificationEnum) {
  assert(
    normalizeDirectionalClassification(value) === value,
    `normalizeDirectionalClassification("${value}") passes a real allowed value through unchanged`,
  );
}

assert(
  normalizeDirectionalClassification("made_up_value") === "made_up_value",
  'normalizeDirectionalClassification("made_up_value") does NOT touch an unrelated unknown value -- this is a single known remap, not a fuzzy catch-all',
);

// --- normalizeLegacyDimensionClassifications: the real bug scenario ---

const buggyDimensions = [
  makeDimension("integrations", { evidenceTabClassification: "directional" }),
  makeDimension("vendors", { evidenceTabClassification: "directional" }),
  makeDimension("apps"),
];

const { dimensions: fixedDimensions, remapped } = normalizeLegacyDimensionClassifications(buggyDimensions);

assert(remapped === 2, `exactly 2 fields remapped (integrations.evidence_tab, vendors.evidence_tab) -- got ${remapped}`);
assert(
  fixedDimensions.find((d) => d.dimension_key === "integrations").evidence_tab.classification === "strategic_inference",
  "integrations.evidence_tab.classification is remapped from directional to strategic_inference",
);
assert(
  fixedDimensions.find((d) => d.dimension_key === "vendors").evidence_tab.classification === "strategic_inference",
  "vendors.evidence_tab.classification is remapped from directional to strategic_inference",
);
assert(
  fixedDimensions.find((d) => d.dimension_key === "apps").evidence_tab.classification === "loaded_fact",
  "a dimension with no directional confusion (apps) is left completely unchanged",
);

// primary_visual.classification also gets the same treatment
const primaryVisualBug = normalizeLegacyDimensionClassifications([
  makeDimension("risks", { primaryVisualClassification: "directional" }),
]);
assert(
  primaryVisualBug.dimensions[0].primary_visual.classification === "strategic_inference" && primaryVisualBug.remapped === 1,
  "primary_visual.classification also gets the directional -> strategic_inference remap",
);

// an unrelated unknown classification is NOT swallowed -- still reaches the validator
const garbageDimension = normalizeLegacyDimensionClassifications([
  makeDimension("data", { evidenceTabClassification: "made_up_value" }),
]);
assert(
  garbageDimension.dimensions[0].evidence_tab.classification === "made_up_value" && garbageDimension.remapped === 0,
  "an unrelated unknown classification (made_up_value) is left untouched by the normalizer, not silently accepted",
);

// no tenant-specific hardcoding: the function takes only `dimensions`, no tenant key, and
// behaves identically regardless of which real dimension_key is present.
assert(
  normalizeLegacyDimensionClassifications.length === 1,
  "normalizeLegacyDimensionClassifications takes only a dimensions array -- no tenant parameter exists to hardcode against",
);
const acrossTenantDimensionKeys = ["integrations", "vendors", "risks", "budget", "programs"].map((key) =>
  normalizeLegacyDimensionClassifications([makeDimension(key, { evidenceTabClassification: "directional" })]).remapped,
);
assert(
  acrossTenantDimensionKeys.every((count) => count === 1),
  `the same remap fires identically across every real dimension_key, not a tenant- or dimension-specific special case (got [${acrossTenantDimensionKeys.join(", ")}])`,
);

// --- End-to-end: the real validators, before and after normalization ---

const candidateWithBug = { requested_dimensions: ["integrations", "vendors"], dimensions: buggyDimensions.slice(0, 2) };

const beforeTabs = validateDimensionTabs(candidateWithBug);
const beforeEnums = validateClosedEnums(candidateWithBug);
assert(
  beforeTabs.some((f) => f.type === "dimension_tab_missing_classification") || beforeEnums.some((f) => f.message.includes("directional")),
  "before normalization, the real validators reproduce the actual failure (dimension_tab_missing_classification / disallowed classification directional)",
);

const { dimensions: candidateFixed } = normalizeLegacyDimensionClassifications(candidateWithBug.dimensions);
const candidateAfter = { ...candidateWithBug, dimensions: candidateFixed };
const afterTabs = validateDimensionTabs(candidateAfter);
const afterEnums = validateClosedEnums(candidateAfter);
assert(
  afterTabs.filter((f) => f.type === "dimension_tab_missing_classification").length === 0 &&
    !afterEnums.some((f) => f.message.includes("directional")),
  "after normalization, the same candidate produces zero classification-related findings for the real bug scenario",
);

// A genuinely unknown value must still fail -- the validator was not weakened.
const candidateWithGarbage = {
  requested_dimensions: ["data"],
  dimensions: [makeDimension("data", { evidenceTabClassification: "made_up_value" })],
};
const { dimensions: garbageFixed } = normalizeLegacyDimensionClassifications(candidateWithGarbage.dimensions);
const garbageValidation = validateDimensionTabs({ ...candidateWithGarbage, dimensions: garbageFixed });
assert(
  garbageValidation.some((f) => f.type === "dimension_tab_missing_classification"),
  "an unrelated unknown classification (made_up_value) still fails validateDimensionTabs after normalization -- the gate is not weakened",
);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log("\nAll evidence-classification tests passed.");
