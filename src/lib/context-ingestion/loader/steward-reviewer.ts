// Admin Loader — live Steward Claude reviewer (the open-ended-checks half).
//
// Produces a concrete `StewardAgentReviewer` for the open-ended (non-deterministic)
// validation of a mapping proposal. The reviewer asks Claude — acting as "Steward"
// — to inspect the proposed dimension, field mappings, and sample rows (plus any
// optional parsed document text) and surface judgement-call findings the
// deterministic checks in `steward-validation.ts` cannot: internal conflicts,
// realism issues, implied gaps, duplicates, and orphans.
//
// The model is INJECTED via the `StewardModel` seam so tests never touch a live
// model. Production wraps the audited Anthropic egress path via
// `auditedStewardModel`, mirroring `auditedMappingModel` in mapping-proposal.ts.
//
// The agent must NEVER block the pipeline by throwing: every failure mode
// (model error, unparseable output, invalid items) fails OPEN to an empty
// findings array. The deterministic checks still run regardless.

import {
  type MappingProposal,
  type StewardFinding,
  type StewardFindingKind,
  type StewardSeverity,
} from "@/lib/context-ingestion/loader/contract";
import { type StewardAgentReviewer } from "@/lib/context-ingestion/loader/steward-validation";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";

/** Anthropic model used for the open-ended Steward review. */
const STEWARD_MODEL = "claude-sonnet-4-6";

/**
 * Injectable model seam. `review` receives the fully-built prompt and returns
 * the model's raw JSON string. Tests pass a stub; production wraps the audited
 * Anthropic client via `auditedStewardModel`.
 */
export interface StewardModel {
  review(prompt: string): Promise<string>;
}

/** Allowed finding kinds — anything else from the model is dropped. */
const ALLOWED_KINDS: ReadonlySet<StewardFindingKind> =
  new Set<StewardFindingKind>([
    "conflict",
    "realism",
    "implied_gap",
    "schema",
    "duplicate",
    "orphan",
  ]);

/** Allowed severities — anything else from the model is dropped. */
const ALLOWED_SEVERITIES: ReadonlySet<StewardSeverity> =
  new Set<StewardSeverity>(["info", "warn", "block"]);

/** Truncate long blobs so the prompt stays bounded. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…[truncated ${value.length - max} chars]`;
}

/** A compact, prompt-friendly view of the field mappings. */
function formatFieldMappings(proposal: MappingProposal): string {
  if (proposal.fieldMappings.length === 0) return "(none proposed)";
  return proposal.fieldMappings
    .map(
      (fm) =>
        `- "${fm.sourceColumn}" → ${fm.canonicalField} (confidence ${fm.confidence.toFixed(2)}${fm.citation ? `, ${fm.citation}` : ""})`,
    )
    .join("\n");
}

/**
 * Compose the strict prompt sent to the model. Instructs Claude to act as
 * "Steward" and return ONLY a JSON array of findings. Bounded: sample rows and
 * optional document text are truncated.
 */
export function buildStewardPrompt(args: {
  proposal: MappingProposal;
  parsedText?: string;
}): string {
  const { proposal, parsedText } = args;

  const sampleRowsBlock = truncate(
    JSON.stringify(proposal.sampleRows ?? [], null, 0),
    4000,
  );

  const documentBlock = parsedText
    ? [
        "",
        `Optional extracted document text:`,
        truncate(parsedText, 6000),
      ].join("\n")
    : "";

  return [
    `You are "Steward", AbarVa's careful reviewer of how an uploaded file was mapped to the canonical context schema for tenant "${proposal.source.tenantKey}".`,
    `Preserved source file: ${proposal.source.filename} (objectKey: ${proposal.source.objectKey}).`,
    "",
    `Proposed dimension: ${proposal.dimension} (confidence ${proposal.dimensionConfidence.toFixed(2)}).`,
    `Proposed field mappings:`,
    formatFieldMappings(proposal),
    "",
    `Sample rows: ${sampleRowsBlock}`,
    documentBlock,
    "",
    `Inspect the proposed dimension, the field mappings, and the sample rows (and the document text if present). Surface only judgement-call problems a simple rule would miss:`,
    `- conflict: internally inconsistent data (e.g. two different people both titled CFO).`,
    `- realism: implausible numbers or values (e.g. a $1 annual IT budget, a 9,000% target).`,
    `- implied_gap: a field clearly missing for this kind of content (e.g. KPI rows with no owner, leadership rows with no reporting line).`,
    `- duplicate: the same real-world entity appearing more than once.`,
    `- orphan: a reference that points at something not present in this upload.`,
    "",
    `Be conservative. Only report something you are confident about. If nothing is wrong, return an empty array.`,
    `Each "message" must be plain language a business reviewer can act on — no jargon, no field codes.`,
    `Severity is one of: "info" (FYI), "warn" (should be checked), "block" (must be resolved before committing).`,
    `Use "rowRef" (e.g. "row 3") when a finding is about a specific row, and "suggestedAction" to say what to do.`,
    "",
    `Respond with ONLY a JSON array, no prose, no code fences, exactly this shape:`,
    `[`,
    `  { "kind": "conflict|realism|implied_gap|schema|duplicate|orphan", "severity": "info|warn|block", "message": "<plain language>", "rowRef": "<optional>", "suggestedAction": "<optional>" }`,
    `]`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

/** Extract the first balanced JSON array from a possibly-noisy model string. */
function extractJsonArray(raw: string): string | null {
  const trimmed = raw.trim();
  // Strip a leading/trailing code fence if present.
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = fenceStripped.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < fenceStripped.length; i += 1) {
    const ch = fenceStripped[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return fenceStripped.slice(start, i + 1);
      }
    }
  }
  return null;
}

function isAllowedKind(value: unknown): value is StewardFindingKind {
  return (
    typeof value === "string" && ALLOWED_KINDS.has(value as StewardFindingKind)
  );
}

function isAllowedSeverity(value: unknown): value is StewardSeverity {
  return (
    typeof value === "string" &&
    ALLOWED_SEVERITIES.has(value as StewardSeverity)
  );
}

/**
 * Robustly extract the JSON array of findings from a raw model string. Handles
 * code fences and surrounding prose, validates each item against the allowed
 * kind/severity unions, drops invalid items, and stamps `source: 'agent'`.
 *
 * Fails OPEN: on any parse failure (or non-array payload) returns `[]`. The
 * agent must never block the pipeline by throwing.
 */
export function parseStewardFindings(raw: string): StewardFinding[] {
  const json = extractJsonArray(raw);
  if (!json) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const findings: StewardFinding[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;

    if (!isAllowedKind(item.kind)) continue;
    if (!isAllowedSeverity(item.severity)) continue;
    if (typeof item.message !== "string" || item.message.trim() === "")
      continue;

    const rowRef =
      typeof item.rowRef === "string" && item.rowRef.trim()
        ? item.rowRef
        : undefined;
    const suggestedAction =
      typeof item.suggestedAction === "string" && item.suggestedAction.trim()
        ? item.suggestedAction
        : undefined;

    findings.push({
      kind: item.kind,
      severity: item.severity,
      message: item.message,
      ...(rowRef ? { rowRef } : {}),
      ...(suggestedAction ? { suggestedAction } : {}),
      source: "agent",
    });
  }

  return findings;
}

/**
 * Wrap an injected `StewardModel` into a concrete `StewardAgentReviewer`.
 *
 * Builds the prompt, calls the model, and parses the findings. A thrown model
 * error (or any other failure) yields `[]` — the agent never blocks the
 * pipeline; the deterministic checks still run.
 */
export function makeStewardReviewer(model: StewardModel): StewardAgentReviewer {
  return async (
    proposal: MappingProposal,
    parsedText?: string,
  ): Promise<StewardFinding[]> => {
    try {
      const raw = await model.review(
        buildStewardPrompt({ proposal, parsedText }),
      );
      return parseStewardFindings(raw);
    } catch {
      // Fail open — the agent never blocks the pipeline by throwing.
      return [];
    }
  };
}

/**
 * Production StewardModel backed by the audited Anthropic egress path.
 * Anthropic-only (claude-sonnet-4-6). Each `review` call is independently
 * audited via `getAuditedAnthropicClient`, mirroring `auditedMappingModel`.
 */
export function auditedStewardModel(args: {
  tenantId: string;
  userId?: string;
}): StewardModel {
  return {
    async review(prompt: string): Promise<string> {
      const { client } = await getAuditedAnthropicClient({
        tenantId: args.tenantId,
        userId: args.userId,
        workflow: "admin-loader-steward-review",
        model: STEWARD_MODEL,
        prompt,
        dataClass: "confidential",
        metadata: { stage: "steward-review" },
      });

      const message = await client.messages.create({
        model: STEWARD_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      return message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("")
        .trim();
    },
  };
}

/** Production reviewer: the audited model wrapped into a `StewardAgentReviewer`. */
export function auditedStewardReviewer(args: {
  tenantId: string;
  userId?: string;
}): StewardAgentReviewer {
  return makeStewardReviewer(auditedStewardModel(args));
}
