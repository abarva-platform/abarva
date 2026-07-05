import { z } from "zod";

import {
  APPROVED_CXO_CANVAS_TYPES,
  LEGACY_CXO_CANVAS_TYPE_ALIASES,
  type CxoCanvasFallback,
  type CxoCanvasPayload,
  type CxoCanvasProofBoundary,
  type CxoCanvasType,
} from "./canvasTypes";

const approvedCanvasTypes = new Set<string>(APPROVED_CXO_CANVAS_TYPES);

export const INTERNAL_MARKER_RE =
  /<<<TAB:|>>>|\bgrounding\s*:|\bprompt\s+trace\b|\braw\s+claude\b|\bmodel\s+routing\b|\bsystem\s+prompt\b|\brouteType\b/i;

const INTERNAL_MARKER_PATTERNS = [
  /<<<TAB:[^\n>]*(?:>>>|$)/gi,
  />>>/g,
  /\bgrounding\s*:\s*[\w-]+/gi,
  /\bprompt\s+trace\b/gi,
  /\braw\s+claude\s+output\b/gi,
  /\braw\s+claude\b/gi,
  /\bmodel\s+routing\s+syntax\b/gi,
  /\bmodel\s+routing\b/gi,
  /\bsystem\s+prompt\b/gi,
  /\brouteType\b/gi,
];

const cleanText = z
  .string()
  .transform((value) => sanitizeCanvasText(value))
  .pipe(z.string().min(1));

const optionalCleanText = z
  .string()
  .optional()
  .transform((value) => (value ? sanitizeCanvasText(value) : undefined))
  .pipe(z.string().min(1).optional());

const boundedScore = z.coerce.number().finite().min(0).max(10).optional();

const cxoCanvasItemSchema = z
  .object({
    label: cleanText,
    value: boundedScore,
    readiness: boundedScore,
    risk: boundedScore,
    allocation: boundedScore,
    impact: boundedScore,
    confidence: boundedScore,
    action: optionalCleanText,
    owner: optionalCleanText,
    gate: optionalCleanText,
    status: optionalCleanText,
    dependency: optionalCleanText,
    valueUnlocked: optionalCleanText,
    note: optionalCleanText,
  })
  .strip();

const cxoCanvasLaneSchema = z
  .object({
    label: cleanText,
    items: z.array(cxoCanvasItemSchema).min(1),
    summary: optionalCleanText,
  })
  .strip();

const cxoCanvasMetricSchema = z
  .object({
    label: cleanText,
    value: z.union([cleanText, z.number().finite()]),
    tone: z.enum(["neutral", "positive", "warning", "danger"]).optional(),
    note: optionalCleanText,
  })
  .strip();

const cxoCanvasGateSchema = z
  .object({
    label: cleanText,
    owner: optionalCleanText,
    dependency: optionalCleanText,
    valueUnlocked: optionalCleanText,
    status: optionalCleanText,
    note: optionalCleanText,
  })
  .strip();

const cxoCanvasSignalSchema = z
  .object({
    label: cleanText,
    state: z.enum(["measured", "benchmark", "expected_uncaptured", "none"]),
    value: optionalCleanText,
    context: optionalCleanText,
    provenance: z
      .enum(["enterprise-evidence", "industry-context", "inference"])
      .default("inference"),
    whyItMatters: cleanText,
    loadHint: optionalCleanText,
  })
  .strip()
  .transform((value) => {
    // Honesty guard: strip any value off a non-measured tile so a fabricated
    // number can never render as a measured tenant fact.
    if (value.state !== "measured" && value.state !== "benchmark") {
      return { ...value, value: undefined };
    }
    return value;
  });

const cxoCanvasProofBoundarySchema = z
  .object({
    known: z.array(cleanText).optional(),
    assumed: z.array(cleanText).optional(),
    missing: z.array(cleanText).optional(),
    decisionRequired: optionalCleanText,
  })
  .strip()
  .transform((value) => {
    const proofBoundary: CxoCanvasProofBoundary = {};
    if (value.known?.length) proofBoundary.known = value.known;
    if (value.assumed?.length) proofBoundary.assumed = value.assumed;
    if (value.missing?.length) proofBoundary.missing = value.missing;
    if (value.decisionRequired) {
      proofBoundary.decisionRequired = value.decisionRequired;
    }
    return Object.keys(proofBoundary).length ? proofBoundary : undefined;
  });

const cxoCanvasPayloadSchema = z
  .object({
    canvasType: z.string().transform((value, ctx) => {
      const normalized = normalizeCxoCanvasType(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: `Unsupported CXO canvas type: ${value}`,
        });
        return z.NEVER;
      }
      return normalized;
    }),
    title: cleanText.default("Executive recommendation canvas"),
    summary: optionalCleanText,
    items: z.array(cxoCanvasItemSchema).optional(),
    lanes: z.array(cxoCanvasLaneSchema).optional(),
    metrics: z.array(cxoCanvasMetricSchema).optional(),
    signals: z.array(cxoCanvasSignalSchema).optional(),
    gates: z.array(cxoCanvasGateSchema).optional(),
    proofBoundary: cxoCanvasProofBoundarySchema.optional(),
    decisionRequired: optionalCleanText,
    sourceNotes: z.array(cleanText).optional(),
    confidence: boundedScore,
  })
  .strip()
  .transform((value) => {
    const payload: CxoCanvasPayload = {
      canvasType: value.canvasType,
      title: value.title,
    };
    if (value.summary) payload.summary = value.summary;
    if (value.items?.length) payload.items = value.items;
    if (value.lanes?.length) payload.lanes = value.lanes;
    if (value.metrics?.length) payload.metrics = value.metrics;
    if (value.signals?.length) payload.signals = value.signals;
    if (value.gates?.length) payload.gates = value.gates;
    if (value.proofBoundary) payload.proofBoundary = value.proofBoundary;
    if (value.decisionRequired)
      payload.decisionRequired = value.decisionRequired;
    if (value.sourceNotes?.length) payload.sourceNotes = value.sourceNotes;
    if (typeof value.confidence === "number")
      payload.confidence = value.confidence;
    return payload;
  });

export type CxoCanvasSchemaResult =
  | { ok: true; payload: CxoCanvasPayload; warnings: string[] }
  | { ok: false; fallback: CxoCanvasFallback; warnings: string[] };

export function normalizeCxoCanvasType(value: unknown): CxoCanvasType | null {
  if (typeof value !== "string") return null;
  if (approvedCanvasTypes.has(value)) return value as CxoCanvasType;
  return (
    LEGACY_CXO_CANVAS_TYPE_ALIASES[
      value as keyof typeof LEGACY_CXO_CANVAS_TYPE_ALIASES
    ] ?? null
  );
}

export function isApprovedCxoCanvasType(
  value: unknown,
): value is CxoCanvasType {
  return typeof value === "string" && approvedCanvasTypes.has(value);
}

export function sanitizeCanvasText(value: string): string {
  let next = value;
  for (const pattern of INTERNAL_MARKER_PATTERNS) {
    next = next.replace(pattern, " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

export function parseCxoCanvasJson(rawPayload: string): unknown {
  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    const repairedPayload =
      escapeControlCharactersInsideJsonStrings(rawPayload);
    if (repairedPayload === rawPayload) throw error;
    return JSON.parse(repairedPayload);
  }
}

export function coerceCxoCanvasPayload(input: unknown): CxoCanvasSchemaResult {
  const normalizedInput = normalizeLegacyShape(input);
  const parsed = cxoCanvasPayloadSchema.safeParse(normalizedInput);
  if (parsed.success) {
    return {
      ok: true,
      payload: parsed.data,
      warnings: [],
    };
  }

  return {
    ok: false,
    fallback: buildSafeFallbackCanvas(input),
    warnings: parsed.error.issues.map((issue) => issue.message),
  };
}

export function buildSafeFallbackCanvas(input: unknown): CxoCanvasFallback {
  if (!isRecord(input)) return {};
  const title = optionalString(input.title);
  const summary =
    optionalString(input.summary) ??
    optionalString(input.recommendation) ??
    optionalString(input.answer);
  const decisionRequired =
    optionalString(input.decisionRequired) ??
    (isRecord(input.proofBoundary)
      ? optionalString(input.proofBoundary.decisionRequired)
      : undefined);
  const proofBoundary = isRecord(input.proofBoundary)
    ? safeProofBoundary(input.proofBoundary)
    : undefined;
  return {
    ...(title ? { title } : {}),
    ...(summary ? { summary } : {}),
    ...(decisionRequired ? { decisionRequired } : {}),
    ...(proofBoundary ? { proofBoundary } : {}),
  };
}

function normalizeLegacyShape(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const next: Record<string, unknown> = { ...input };
  if (!next.lanes && Array.isArray(next.columns)) {
    next.lanes = next.columns;
  }
  if (!next.decisionRequired && isRecord(next.proofBoundary)) {
    next.decisionRequired = next.proofBoundary.decisionRequired;
  }
  return next;
}

function safeProofBoundary(
  value: Record<string, unknown>,
): CxoCanvasProofBoundary | undefined {
  const proofBoundary: CxoCanvasProofBoundary = {};
  const known = stringArray(value.known);
  const assumed = stringArray(value.assumed);
  const missing = stringArray(value.missing);
  const decisionRequired = optionalString(value.decisionRequired);
  if (known.length) proofBoundary.known = known;
  if (assumed.length) proofBoundary.assumed = assumed;
  if (missing.length) proofBoundary.missing = missing;
  if (decisionRequired) proofBoundary.decisionRequired = decisionRequired;
  return Object.keys(proofBoundary).length ? proofBoundary : undefined;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = sanitizeCanvasText(value);
  return text || undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => optionalString(item))
    .filter((item): item is string => Boolean(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function escapeControlCharactersInsideJsonStrings(rawPayload: string): string {
  let repaired = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < rawPayload.length; index += 1) {
    const char = rawPayload[index] ?? "";
    if (escaped) {
      repaired += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      repaired += char;
      escaped = inString;
      continue;
    }
    if (char === '"') {
      repaired += char;
      inString = !inString;
      continue;
    }
    if (inString) {
      if (char === "\n") {
        repaired += "\\n";
        continue;
      }
      if (char === "\r") {
        repaired += "\\r";
        continue;
      }
      if (char === "\t") {
        repaired += "\\t";
        continue;
      }
    }
    repaired += char;
  }
  return repaired;
}
