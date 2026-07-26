import "server-only";

// PR12B — the DEDICATED golden-bar structured-output pass.
//
// The defect PR12 fixes: piggybacking a sentinel JSON block on the long HTML
// narrative did not reliably produce a governed contract (the model omitted or
// truncated it under the HTML framing + token budget). This module runs a
// SEPARATE, focused model call that returns ONLY the structured roadmap JSON —
// built from the authoritative SolutionContext, not by parsing the rendered
// HTML. It is small and fast (one focused call), so it does not push the request
// toward the proxy timeout the way the HTML narrative does.
//
// It FAILS HONESTLY with explicit codes and records the model-response hash for
// every attempt. One controlled retry is permitted only for malformed /
// schema-invalid output; both attempts are recorded.

import { createHash } from "crypto";
import {
  RoadmapStructuredOutputSchema,
  structuredOutputToInput,
  ROADMAP_STRUCTURED_OUTPUT_VERSION,
  type RoadmapStructuredOutput,
} from "./roadmap-structured-output";
import type { RoadmapStructuredInput } from "./roadmap-contract-extractor";
import { EXECUTIVE_ROADMAP_REFERENCE } from "./shared/reference-library/executive-roadmap-reference";
import type { SolutionContext } from "@/lib/programs/solution-context";

export type RoadmapStructuredPassFailureCode =
  | "structured_output_missing"
  | "structured_output_malformed"
  | "structured_output_schema_invalid";

export type RoadmapStructuredPassParse =
  | { ok: true; output: RoadmapStructuredOutput; input: RoadmapStructuredInput }
  | { ok: false; code: RoadmapStructuredPassFailureCode; detail: string };

/** Strip a single leading/trailing ```json fence if the model added one despite
 * being told not to. Never tries to "find" JSON inside prose — the whole
 * response must be the JSON object. */
function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (m ? m[1] : t).trim();
}

/** Parse + strictly validate a structured-pass response. The ENTIRE response
 * must be the JSON object — no prose, no HTML. */
export function parseRoadmapStructuredJson(
  text: string,
): RoadmapStructuredPassParse {
  const body = stripFence(text ?? "");
  if (!body) {
    return {
      ok: false,
      code: "structured_output_missing",
      detail: "The structured pass returned no content.",
    };
  }
  if (!body.startsWith("{")) {
    // Prose / HTML / commentary leaked in — treat as malformed, not schema.
    return {
      ok: false,
      code: "structured_output_malformed",
      detail: "The structured pass response was not a bare JSON object.",
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch (e) {
    return {
      ok: false,
      code: "structured_output_malformed",
      detail: `Structured pass JSON parse failed: ${(e as Error).message}`,
    };
  }
  const parsed = RoadmapStructuredOutputSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: "structured_output_schema_invalid",
      detail: first
        ? `${first.path.join(".")}: ${first.message}`
        : "schema validation failed",
    };
  }
  // Completeness beyond presence: every horizon used by a cell needs an outcome.
  const missing = parsed.data.cells
    .map((c) => c.horizon)
    .find((h) => !parsed.data.horizonOutcomes[h]?.trim());
  if (missing) {
    return {
      ok: false,
      code: "structured_output_schema_invalid",
      detail: `Horizon "${missing}" is used by a cell but has no horizonOutcomes entry.`,
    };
  }
  return {
    ok: true,
    output: parsed.data,
    input: structuredOutputToInput(parsed.data),
  };
}

function line(label: string, value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v ? `- ${label}: ${v}` : null;
}

/** Build the JSON-only structured-pass prompt from the AUTHORITATIVE context.
 * It never asks for HTML/prose/markdown/SVG and never references the rendered
 * narrative document — it uses the governed SolutionContext directly. */
export function buildRoadmapStructuredPassPrompt(
  ctx: SolutionContext,
  phase: number,
): { system: string; user: string } {
  const ref = EXECUTIVE_ROADMAP_REFERENCE;
  const system = [
    "You are a governed data function. Output ONLY a single JSON object and NOTHING else.",
    "No prose, no explanation, no HTML, no markdown, no code fences, no commentary before or after.",
    "The JSON must be the executive-roadmap structured contract described below. If you cannot fill a field from the provided context, use an honest evidence status — never invent client facts.",
  ].join(" ");

  const contextLines = [
    line("Use case", ctx.useCase ?? ctx.useCaseCandidate),
    line("Chosen option (accepted P3 direction)", ctx.chosenOption),
    line("Tradeoffs accepted", (ctx.tradeoffsAccepted ?? []).join("; ")),
    line("Target architecture summary", ctx.architecture),
    line("Known gaps", (ctx.gaps ?? []).join("; ")),
    line("Root causes", (ctx.rootCauses ?? []).join("; ")),
    line("Priority KPIs", (ctx.kpis ?? []).map((k) => k.name).join("; ")),
    line(
      "Governed decisions",
      ctx.decisions
        .slice(-6)
        .map((d) => `${d.decision}: ${d.rationale}`)
        .join(" | "),
    ),
  ].filter(Boolean);

  const user = [
    `Produce the executive roadmap structured contract for this Move (phase ${phase}).`,
    "",
    "AUTHORITATIVE CONTEXT (use ONLY this for client-specific facts; anything not grounded here is evidence_required, never approved):",
    contextLines.length
      ? contextLines.join("\n")
      : "- (no governed context fields captured)",
    "",
    `Horizons (use exactly these ${ref.maxHorizons}, in order): ${ref.horizons.join(", ")}.`,
    `Workstreams (use at most ${ref.maxWorkstreams} of): ${ref.workstreams.join(", ")}.`,
    "",
    "Emit exactly this JSON shape (no extra keys):",
    "{",
    `  "schemaVersion": "${ROADMAP_STRUCTURED_OUTPUT_VERSION}",`,
    '  "executiveConclusion": "the message-led sequencing thesis (a conclusion, not the label \\"Execution Roadmap\\"; at least 8 words)",',
    '  "sponsorDecision": "the specific decision the sponsor is asked to make now",',
    '  "lifecycleStateRef": "review_draft",',
    '  "horizonOutcomes": { "Mobilize": "outcome achieved", "Establish Foundation": "...", "Deliver Priority Outcomes": "...", "Scale and Optimize": "..." },',
    '  "cells": [ { "workstream": "Data", "horizon": "Establish Foundation", "outcome": "...", "dependency": "...", "decisionOrGate": "...", "ownerRole": "...", "timing": "...", "successMeasure": "...", "evidenceStatus": "recommended|illustrative|client_decision_required|evidence_required" } ],',
    '  "decisionGates": [ { "name": "...", "betweenHorizons": "Mobilize \\u2192 Establish Foundation", "criteria": "..." } ],',
    '  "valueMilestones": [ { "name": "...", "horizon": "..." } ],',
    '  "criticalDependencies": [ { "item": "...", "evidenceStatus": "evidence_required", "note": "..." } ],',
    '  "risks": ["..."], "caveats": ["..."], "appendix": ["detailed supporting content"],',
    '  "sourceLineageRefs": ["accepted P3 architecture", "signed charter"]',
    "}",
    "",
    'RULES: every horizon named in a cell MUST have a horizonOutcomes entry. Use "evidence_required" whenever a claim is not backed by authoritative approved evidence. Do NOT mark any item "approved". No calendar dates or sprint numbers. Output ONLY the JSON object.',
  ].join("\n");

  return { system, user };
}

export interface RoadmapStructuredPassAttempt {
  index: number;
  modelResponseHash: string;
  outcome: "success" | RoadmapStructuredPassFailureCode;
  detail?: string;
}

export type RoadmapStructuredPassResult =
  | {
      ok: true;
      output: RoadmapStructuredOutput;
      input: RoadmapStructuredInput;
      modelResponseHash: string;
      attempts: RoadmapStructuredPassAttempt[];
    }
  | {
      ok: false;
      code: RoadmapStructuredPassFailureCode;
      detail: string;
      modelResponseHash: string;
      attempts: RoadmapStructuredPassAttempt[];
    };

function sha(text: string): string {
  return createHash("sha256")
    .update(text ?? "")
    .digest("hex")
    .slice(0, 32);
}

/** Run the dedicated structured pass. `callModel` returns the raw model text.
 * One controlled retry is allowed ONLY for malformed / schema-invalid output. */
export async function runRoadmapStructuredPass(args: {
  ctx: SolutionContext;
  phase: number;
  callModel: (system: string, user: string) => Promise<string>;
  maxRetries?: number;
}): Promise<RoadmapStructuredPassResult> {
  const { ctx, phase, callModel } = args;
  const maxRetries = args.maxRetries ?? 1;
  const { system, user } = buildRoadmapStructuredPassPrompt(ctx, phase);
  const attempts: RoadmapStructuredPassAttempt[] = [];

  for (let i = 0; i <= maxRetries; i++) {
    let raw = "";
    try {
      raw = await callModel(system, user);
    } catch (e) {
      // A thrown model error is recorded as malformed for the attempt, and we
      // may retry — never swallowed.
      raw = "";
      attempts.push({
        index: i,
        modelResponseHash: sha(""),
        outcome: "structured_output_malformed",
        detail: `model call threw: ${(e as Error).message}`,
      });
      continue;
    }
    const hash = sha(raw);
    const parsed = parseRoadmapStructuredJson(raw);
    if (parsed.ok) {
      attempts.push({ index: i, modelResponseHash: hash, outcome: "success" });
      return {
        ok: true,
        output: parsed.output,
        input: parsed.input,
        modelResponseHash: hash,
        attempts,
      };
    }
    attempts.push({
      index: i,
      modelResponseHash: hash,
      outcome: parsed.code,
      detail: parsed.detail,
    });
    // Only retry on malformed / schema-invalid; "missing" retries too (empty).
    // (There is no other failure code from the parser.)
  }

  const last = attempts[attempts.length - 1];
  return {
    ok: false,
    code:
      (last?.outcome as RoadmapStructuredPassFailureCode) ??
      "structured_output_missing",
    detail: last?.detail ?? "structured pass failed",
    modelResponseHash: last?.modelResponseHash ?? sha(""),
    attempts,
  };
}
