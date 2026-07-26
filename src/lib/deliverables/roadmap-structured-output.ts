import "server-only";

// PR9 — the GOVERNED STRUCTURED-OUTPUT contract for the P4 execution roadmap.
//
// The roadmap generation must emit a machine-readable block, explicitly, ALONGSIDE
// its prose — never derived by parsing prose or SVG. This module owns:
//   • the exact block delimiters + the instruction the model is given,
//   • the strict Zod schema the block must satisfy,
//   • the parser that extracts + validates the block and FAILS HONESTLY.
//
// Governance stance: the model emits the CONTENT (conclusion, horizons, cells,
// gates, milestones, dependencies, evidence, risks, appendix) plus its CLAIMED
// lifecycle-state and source-lineage refs. It does NOT get to assert the
// authoritative governance state — the governed builder cross-checks the claimed
// lifecycle ref against the real Move state and blocks on mismatch. Absence,
// malformation, or schema failure yields `roadmap_structured_output_invalid` and
// NO contract — never a prose-inferred fallback.

import { z } from "zod";
import type { RoadmapStructuredInput } from "./roadmap-contract-extractor";
import {
  ROADMAP_LIFECYCLE_STATES,
  type RoadmapLifecycleState,
} from "./roadmap-lifecycle";

/** Sentinel markers. Deliberately NOT a ```json fence: the roadmap prose itself
 * carries ``` fences, so a fence-based extractor would slice the wrong block.
 * The model is told to emit exactly one delimited block. */
export const ROADMAP_SO_OPEN = "<<<ROADMAP_STRUCTURED_OUTPUT>>>";
export const ROADMAP_SO_CLOSE = "<<<END_ROADMAP_STRUCTURED_OUTPUT>>>";

export const ROADMAP_STRUCTURED_OUTPUT_VERSION = "1.0.0";

/** The five permitted evidence statuses — mirrors the contract's enum. Note
 * `approved` is syntactically allowed here but the governed builder blocks any
 * `approved` item that lacks authoritative approved-evidence. */
const EVIDENCE = z.enum([
  "approved",
  "recommended",
  "illustrative",
  "client_decision_required",
  "evidence_required",
]);

const CELL = z
  .object({
    workstream: z.string().min(1),
    horizon: z.string().min(1),
    outcome: z.string().min(1),
    majorActivity: z.string().optional(),
    dependency: z.string().optional(),
    decisionOrGate: z.string().optional(),
    ownerRole: z.string().optional(),
    timing: z.string().optional(),
    successMeasure: z.string().optional(),
    // Optional: absent → the extractor defaults to evidence_required (never approved).
    evidenceStatus: EVIDENCE.optional(),
  })
  .strict();

const GATE = z
  .object({
    name: z.string().min(1),
    betweenHorizons: z.string().optional(),
    criteria: z.string().optional(),
  })
  .strict();

const MILESTONE = z
  .object({ name: z.string().min(1), horizon: z.string().optional() })
  .strict();

const DEPENDENCY = z
  .object({
    item: z.string().min(1),
    evidenceStatus: EVIDENCE.optional(),
    note: z.string().optional(),
  })
  .strict();

/** The strict schema the model's block must satisfy. `.strict()` everywhere so
 * unknown fields are REJECTED, not silently accepted. */
export const RoadmapStructuredOutputSchema = z
  .object({
    schemaVersion: z.string().min(1),
    executiveConclusion: z.string().min(1),
    sponsorDecision: z.string().min(1),
    /** The model's CLAIM of the lifecycle state — cross-checked, never trusted. */
    lifecycleStateRef: z.enum(
      ROADMAP_LIFECYCLE_STATES as unknown as [string, ...string[]],
    ),
    /** Outcome achieved per horizon. Every horizon used by a cell must appear here. */
    horizonOutcomes: z.record(z.string(), z.string().min(1)),
    cells: z.array(CELL).min(1),
    decisionGates: z.array(GATE),
    valueMilestones: z.array(MILESTONE),
    criticalDependencies: z.array(DEPENDENCY),
    risks: z.array(z.string()),
    caveats: z.array(z.string()),
    appendix: z.array(z.string()),
    /** The model's cited authoritative sources — recorded in provenance. */
    sourceLineageRefs: z.array(z.string()),
  })
  .strict();

export type RoadmapStructuredOutput = z.infer<
  typeof RoadmapStructuredOutputSchema
>;

/** The instruction appended to BOTH pipelines' roadmap prompts. Both pipelines
 * emit the SAME schema so one validator + one extractor serve both. */
export function roadmapStructuredOutputInstruction(): string {
  return [
    "",
    "STRUCTURED OUTPUT (MANDATORY, IN ADDITION TO THE NARRATIVE):",
    `After the narrative, emit exactly ONE machine-readable block delimited by ${ROADMAP_SO_OPEN} and ${ROADMAP_SO_CLOSE}, containing a single JSON object and nothing else.`,
    "Do NOT wrap it in a ```json fence. Do NOT emit more than one such block.",
    "The JSON MUST conform to this shape (unknown fields are rejected):",
    "{",
    `  "schemaVersion": "${ROADMAP_STRUCTURED_OUTPUT_VERSION}",`,
    '  "executiveConclusion": "the message-led sequencing thesis (a conclusion, not the label \\"Execution Roadmap\\")",',
    '  "sponsorDecision": "the specific decision the sponsor is asked to make now",',
    '  "lifecycleStateRef": "one of: entry_approved | generation_eligible | review_draft | exit_approved_final",',
    '  "horizonOutcomes": { "Mobilize": "outcome achieved", "Establish Foundation": "outcome achieved" },',
    '  "cells": [ { "workstream": "Data", "horizon": "Establish Foundation", "outcome": "...", "dependency": "...", "decisionOrGate": "...", "ownerRole": "...", "timing": "...", "successMeasure": "...", "evidenceStatus": "recommended|illustrative|client_decision_required|evidence_required|approved" } ],',
    '  "decisionGates": [ { "name": "...", "betweenHorizons": "Mobilize \\u2192 Establish Foundation", "criteria": "..." } ],',
    '  "valueMilestones": [ { "name": "...", "horizon": "..." } ],',
    '  "criticalDependencies": [ { "item": "...", "evidenceStatus": "evidence_required", "note": "..." } ],',
    '  "risks": ["..."], "caveats": ["..."], "appendix": ["detailed content for the DOCX appendix"],',
    '  "sourceLineageRefs": ["accepted P3 architecture", "signed charter"]',
    "}",
    'RULES: every horizon named in a cell MUST have a horizonOutcomes entry. Use "evidence_required" whenever a claim is not backed by authoritative approved evidence. Do NOT mark an item "approved" unless it is genuinely governed-approved. The structured block MUST agree with the narrative (same horizons, gates, milestones, lifecycle).',
  ].join("\n");
}

export type RoadmapStructuredParseResult =
  | { ok: true; output: RoadmapStructuredOutput; input: RoadmapStructuredInput }
  | { ok: false; code: "roadmap_structured_output_invalid"; reason: string };

/** Extract the single delimited block from model text. Returns null if absent. */
function extractBlock(modelText: string): string | null {
  const start = modelText.indexOf(ROADMAP_SO_OPEN);
  if (start === -1) return null;
  const from = start + ROADMAP_SO_OPEN.length;
  const end = modelText.indexOf(ROADMAP_SO_CLOSE, from);
  if (end === -1) return null;
  return modelText.slice(from, end).trim();
}

/** Convert the validated model block into the extractor's RoadmapStructuredInput.
 * Explicit critical dependencies are represented as synthetic cells so the
 * extractor surfaces them as dependencies without inventing anything. */
function toStructuredInput(o: RoadmapStructuredOutput): RoadmapStructuredInput {
  const dependencyCells = o.criticalDependencies.map((d) => ({
    workstream: "Critical dependency",
    horizon: d.note?.split("·")[1]?.trim() || o.cells[0]?.horizon || "Mobilize",
    outcome: d.item,
    dependency: d.item,
    evidenceStatus: d.evidenceStatus,
  }));
  return {
    executiveConclusion: o.executiveConclusion,
    sponsorDecision: o.sponsorDecision,
    horizonOutcomes: o.horizonOutcomes,
    cells: [...o.cells, ...dependencyCells],
    decisionGates: o.decisionGates,
    valueMilestones: o.valueMilestones,
    risks: o.risks,
    caveats: o.caveats,
    appendix: o.appendix,
  };
}

/** Parse + strictly validate the structured block. FAILS HONESTLY: absent,
 * malformed, unknown-field, or incomplete → `roadmap_structured_output_invalid`
 * with NO input. Never infers from prose. */
export function parseRoadmapStructuredBlock(
  modelText: string,
): RoadmapStructuredParseResult {
  const block = extractBlock(modelText);
  if (block === null) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Structured block not found (expected ${ROADMAP_SO_OPEN} … ${ROADMAP_SO_CLOSE}).`,
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(block);
  } catch (e) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Structured block is not valid JSON: ${(e as Error).message}`,
    };
  }
  const parsed = RoadmapStructuredOutputSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Structured block failed schema validation: ${first ? `${first.path.join(".")}: ${first.message}` : "unknown"}.`,
    };
  }
  // Completeness beyond field presence: every horizon used by a cell needs an outcome.
  const missingOutcome = parsed.data.cells
    .map((c) => c.horizon)
    .find((h) => !parsed.data.horizonOutcomes[h]?.trim());
  if (missingOutcome) {
    return {
      ok: false,
      code: "roadmap_structured_output_invalid",
      reason: `Horizon "${missingOutcome}" is used by a cell but has no horizonOutcomes entry (missing outcome is blocked, not defaulted).`,
    };
  }
  return {
    ok: true,
    output: parsed.data,
    input: toStructuredInput(parsed.data),
  };
}

export function isRoadmapLifecycleState(v: string): v is RoadmapLifecycleState {
  return (ROADMAP_LIFECYCLE_STATES as readonly string[]).includes(v);
}
