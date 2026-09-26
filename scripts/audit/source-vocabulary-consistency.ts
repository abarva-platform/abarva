#!/usr/bin/env tsx

import { SOURCE_STAGE_GATE_TRANSITIONS } from "../../src/lib/source/source-stage-gates";
import {
  getSourceJourneyForEvent,
  SOURCE_JOURNEYS,
  type SourceJourneyDefinition,
  type SourceSourcingMotion,
} from "../../src/lib/source/sourcing-motion-journeys";
import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_EVIDENCE_REQUIREMENTS,
  SOURCE_GATE_CRITERIA,
  specByCode,
} from "../../src/lib/source/canonical-specs";
import {
  SOURCE_LEGACY_STAGE_ALIASES,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "../../src/lib/source/constants";
import { getStageCanvasConfig, stageLabelToKey } from "../../src/lib/source/stage-canvas-config";
import type { SourceStageKey } from "../../src/lib/source/types";

type Failure = {
  section: string;
  detail: string;
};

const failures: Failure[] = [];
const canonicalStageKeys = SOURCE_STAGE_ORDER as readonly SourceStageKey[];
const canonicalStageKeySet = new Set<string>(canonicalStageKeys);
const terminalStageKeys = new Set<string>([...canonicalStageKeys, "closed"]);
const artifactCodes = new Set(SOURCE_ARTIFACT_SPECS.map((spec) => spec.code));

const allowedJourneyLabelOverrides: Partial<
  Record<SourceSourcingMotion, Partial<Record<SourceStageKey, string>>>
> = {
  contract_optimization: {
    pricing: "Commercial Baseline",
    bafo: "Negotiation Plan",
    transition: "Agreement",
  },
};

function record(section: string, detail: string): void {
  failures.push({ section, detail });
}

function assert(condition: unknown, section: string, detail: string): void {
  if (!condition) record(section, detail);
}

function labelForStage(stage: SourceStageKey | "closed"): string {
  if (stage === "closed") return "Closed";
  return SOURCE_STAGE_LABELS[stage] ?? stage;
}

function indexOfStage(stage: SourceStageKey | "closed"): number {
  if (stage === "closed") return canonicalStageKeys.length;
  return canonicalStageKeys.indexOf(stage);
}

function expectedTransitionLabel(
  from: SourceStageKey,
  to: SourceStageKey | "closed",
): string {
  return `${labelForStage(from)} -> ${labelForStage(to)}`;
}

function assertNoDuplicates(values: readonly string[], section: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) record(section, `duplicate value: ${value}`);
    seen.add(value);
  }
}

function assertCanonicalStage(stage: unknown, section: string, label: string): void {
  assert(
    typeof stage === "string" && canonicalStageKeySet.has(stage),
    section,
    `${label} references non-canonical Source stage: ${String(stage)}`,
  );
}

function assertTerminalStage(stage: unknown, section: string, label: string): void {
  assert(
    typeof stage === "string" && terminalStageKeys.has(stage),
    section,
    `${label} references non-canonical Source terminal stage: ${String(stage)}`,
  );
}

function assertJourneyLabels(
  motion: SourceSourcingMotion,
  journey: SourceJourneyDefinition,
): void {
  assert(journey.id === motion, "journeys", `${motion} has mismatched id ${journey.id}`);

  for (const skippedStage of journey.skippedStageKeys) {
    assertCanonicalStage(skippedStage, "journeys", `${motion}.skippedStageKeys`);
  }

  assertNoDuplicates(
    journey.stages.map((stage) => stage.key),
    `journeys.${motion}.stages`,
  );

  for (const stage of journey.stages) {
    assertCanonicalStage(stage.key, "journeys", `${motion}.stages`);

    const canonicalLabel = SOURCE_STAGE_LABELS[stage.key];
    const allowedOverride = allowedJourneyLabelOverrides[motion]?.[stage.key];
    const expectedLabel = allowedOverride ?? canonicalLabel;
    assert(
      stage.label === expectedLabel,
      "journeys",
      `${motion}.${stage.key} label "${stage.label}" should be "${expectedLabel}"`,
    );
  }
}

assert(canonicalStageKeys.length === 11, "stage-order", "Source must keep the 11-stage lifecycle");
assertNoDuplicates(canonicalStageKeys, "stage-order");

for (const [index, stage] of canonicalStageKeys.entries()) {
  const label = SOURCE_STAGE_LABELS[stage];
  assert(typeof label === "string" && label.length > 0, "stage-labels", `${stage} has no label`);
  assert(
    stageLabelToKey(label) === stage,
    "stage-labels",
    `${stage} label "${label}" does not round-trip through stageLabelToKey`,
  );

  const config = getStageCanvasConfig(stage);
  assert(config, "stage-canvas", `${stage} has no stage canvas config`);
  if (config) {
    assert(
      config.stageKey === stage,
      "stage-canvas",
      `${stage} canvas config points at ${config.stageKey}`,
    );
    assert(
      config.stepNumber === index + 1,
      "stage-canvas",
      `${stage} canvas step is ${config.stepNumber}; expected ${index + 1}`,
    );
  }
}

for (const [legacy, canonical] of Object.entries(SOURCE_LEGACY_STAGE_ALIASES)) {
  if (!canonical) {
    record("legacy-stage-aliases", `${legacy} has no canonical target`);
    continue;
  }
  assertCanonicalStage(canonical, "legacy-stage-aliases", legacy);
  assert(
    SOURCE_STAGE_LABELS[legacy as SourceStageKey] === SOURCE_STAGE_LABELS[canonical],
    "legacy-stage-aliases",
    `${legacy} label "${SOURCE_STAGE_LABELS[legacy as SourceStageKey]}" should mirror ${canonical} label "${SOURCE_STAGE_LABELS[canonical]}"`,
  );
}

assertNoDuplicates(
  SOURCE_ARTIFACT_SPECS.map((spec) => spec.code),
  "artifact-specs",
);
for (const spec of SOURCE_ARTIFACT_SPECS) {
  assertCanonicalStage(spec.stage, "artifact-specs", `${spec.code}.stage`);
  assert(spec.name.trim().length > 0, "artifact-specs", `${spec.code} has no name`);
}

assertNoDuplicates(
  SOURCE_EVIDENCE_REQUIREMENTS.map((requirement) => requirement.requirementId),
  "evidence-requirements",
);
for (const requirement of SOURCE_EVIDENCE_REQUIREMENTS) {
  assertCanonicalStage(
    requirement.stage,
    "evidence-requirements",
    `${requirement.requirementId}.stage`,
  );
  assert(
    requirement.label.trim().length > 0,
    "evidence-requirements",
    `${requirement.requirementId} has no label`,
  );
}

assertNoDuplicates(
  SOURCE_GATE_CRITERIA.map((criterion) => criterion.criterionId),
  "gate-criteria",
);
for (const criterion of SOURCE_GATE_CRITERIA) {
  assertCanonicalStage(criterion.fromStage, "gate-criteria", `${criterion.criterionId}.fromStage`);
  assertTerminalStage(criterion.toStage, "gate-criteria", `${criterion.criterionId}.toStage`);

  const fromIndex = indexOfStage(criterion.fromStage);
  const toIndex = indexOfStage(criterion.toStage);
  assert(
    toIndex === fromIndex + 1,
    "gate-criteria",
    `${criterion.criterionId} must flow from ${criterion.fromStage} to the next stage, not ${criterion.toStage}`,
  );

  for (const code of criterion.linkedArtifactCodes) {
    const spec = specByCode(code);
    assert(artifactCodes.has(code), "gate-criteria", `${criterion.criterionId} links unknown artifact ${code}`);
    if (spec && criterion.toStage !== "closed") {
      assert(
        spec.stage === criterion.fromStage || spec.stage === criterion.toStage,
        "gate-criteria",
        `${criterion.criterionId} links ${code} from ${spec.stage}; expected ${criterion.fromStage} or ${criterion.toStage}`,
      );
    }
  }
}

assertNoDuplicates(
  SOURCE_STAGE_GATE_TRANSITIONS.map((transition) => transition.id),
  "stage-gate-transitions",
);
for (const transition of SOURCE_STAGE_GATE_TRANSITIONS) {
  assertCanonicalStage(transition.from, "stage-gate-transitions", `${transition.id}.from`);
  assertTerminalStage(transition.to, "stage-gate-transitions", `${transition.id}.to`);

  const expectedLabel = expectedTransitionLabel(transition.from, transition.to);
  assert(
    transition.label === expectedLabel,
    "stage-gate-transitions",
    `${transition.id} label "${transition.label}" should be "${expectedLabel}"`,
  );

  const fromIndex = indexOfStage(transition.from);
  const toIndex = indexOfStage(transition.to);
  assert(
    toIndex === fromIndex + 1,
    "stage-gate-transitions",
    `${transition.id} must flow from ${transition.from} to the next stage, not ${transition.to}`,
  );
}

assertJourneyLabels("competitive_rfp", SOURCE_JOURNEYS.competitive_rfp);
assertJourneyLabels("contract_optimization", SOURCE_JOURNEYS.contract_optimization);
assert(
  getSourceJourneyForEvent({ sourcingMotion: "competitive_rfp" }) === SOURCE_JOURNEYS.competitive_rfp,
  "journey-routing",
  "competitive_rfp does not route to the competitive Source journey",
);
assert(
  getSourceJourneyForEvent({ sourcingMotion: "contract_optimization" }) ===
    SOURCE_JOURNEYS.contract_optimization,
  "journey-routing",
  "contract_optimization does not route to the contract optimization journey",
);

if (failures.length > 0) {
  console.error("FAIL audit:source-vocabulary-consistency");
  for (const failure of failures) {
    console.error(`- [${failure.section}] ${failure.detail}`);
  }
  process.exit(1);
}

console.log(
  [
    "PASS audit:source-vocabulary-consistency",
    `${canonicalStageKeys.length} stages`,
    `${SOURCE_STAGE_GATE_TRANSITIONS.length} transitions`,
    `${SOURCE_ARTIFACT_SPECS.length} artifact specs`,
    `${SOURCE_GATE_CRITERIA.length} gate criteria`,
    `${SOURCE_EVIDENCE_REQUIREMENTS.length} evidence requirements`,
    `${Object.keys(SOURCE_JOURNEYS).length} journeys`,
  ].join(" | "),
);
