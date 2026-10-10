/**
 * P4 `value_plan` as a structured value model.
 *
 * The capture value stays a string (the same `value_plan` key). A structured
 * value is JSON with an explicit `kind: "value_model"` and `version: 1`
 * wrapping a value-engine case; anything else — today's free text, or JSON
 * that does not declare that kind — is LEGACY TEXT and parses to null, so it
 * keeps rendering and completing exactly as before.
 *
 * A value that declares the kind but fails the schema is `invalid`, never
 * read as legacy text: a broken model must not complete the section by
 * falling back to "any non-empty text".
 *
 * Pure, no I/O.
 */
import { z } from "zod";
import { evaluateValueCase } from "@/lib/programs/value-engine";
import type {
  ValueCase,
  ValueCaseResult,
  ValueInputResolver,
} from "@/lib/programs/value-engine/types";

export const VALUE_MODEL_KIND = "value_model";
export const VALUE_MODEL_VERSION = 1;

export interface ValueModelCapture {
  kind: typeof VALUE_MODEL_KIND;
  version: typeof VALUE_MODEL_VERSION;
  case: ValueCase;
  /** Funding choice is explicit; the estimate prices both paths. */
  deliveryModel?: "internal" | "vendor";
}

const rangeSchema = z.strictObject({ low: z.number(), high: z.number() });

const inputRefSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("literal"),
    value: z.number(),
    source: z.string().trim().min(1),
    range: rangeSchema.optional(),
  }),
  z.strictObject({
    kind: z.literal("evidence"),
    evidenceId: z.string().trim().min(1),
    value: z.number(),
    unit: z.string().trim().min(1),
    asOf: z.string().trim().min(1),
    range: rangeSchema.optional(),
  }),
  z.strictObject({
    kind: z.literal("register"),
    registerId: z.string().trim().min(1),
    range: rangeSchema.optional(),
  }),
  z.strictObject({
    kind: z.literal("rom"),
    snapshotId: z.string().trim().min(1),
    range: rangeSchema.optional(),
  }),
]);

const termSchema = z.union([
  z.strictObject({
    role: z.literal("driver_delta"),
    label: z.string().optional(),
  }),
  z.strictObject({
    role: z.enum(["base", "unit_value", "margin", "refill_share", "share"]),
    label: z.string().trim().min(1),
    ref: inputRefSchema,
  }),
]);

const leverSchema = z.strictObject({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  conversion: z.enum([
    "cost_reduction",
    "volume_added",
    "revenue",
    "risk_avoided",
    "non_cash",
  ]),
  driver: z.strictObject({
    name: z.string().trim().min(1),
    unit: z.string().trim().min(1),
    direction: z.enum(["decrease", "increase"]),
    baseline: inputRefSchema,
    target: inputRefSchema,
    deltaBounds: z
      .strictObject({ min: z.number(), max: z.number() })
      .optional(),
  }),
  terms: z.array(termSchema).min(1),
  overlapGroup: z.string().trim().min(1).optional(),
  overlapPrimary: z.boolean().optional(),
  attribution: inputRefSchema,
  probability: inputRefSchema,
  timing: z.strictObject({
    startMonth: z.number(),
    rampMonths: z.number(),
    paymentLagMonths: z.number(),
    phaseDown: z
      .array(z.strictObject({ fromMonth: z.number(), factor: z.number() }))
      .optional(),
  }),
  releasePath: z
    .strictObject({
      kind: z.enum(["role_released", "contract_released"]),
      releasedCost: inputRefSchema,
    })
    .optional(),
  metricUnit: z.string().trim().min(1).optional(),
});

const valueCaseSchema = z.strictObject({
  levers: z.array(leverSchema),
  horizonYears: z.number(),
  discountRate: inputRefSchema,
  cost: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("estimate"),
      baseCents: z.number(),
      lowCents: z.number().optional(),
      highCents: z.number().optional(),
    }),
    z.strictObject({
      kind: z.literal("rom"),
      snapshotId: z.string().trim().min(1),
    }),
  ]),
  includeRiskAvoidedInCash: z.boolean().optional(),
});

const valueModelSchema = z.strictObject({
  kind: z.literal(VALUE_MODEL_KIND),
  version: z.literal(VALUE_MODEL_VERSION),
  case: valueCaseSchema,
  deliveryModel: z.enum(["internal", "vendor"]).optional(),
});

export type ValueModelRead =
  | { kind: "legacy_text" }
  | { kind: "invalid"; issues: string[] }
  | { kind: "model"; model: ValueModelCapture };

/** Classify a captured `value_plan` string. */
export function readValueModel(value: string): ValueModelRead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { kind: "legacy_text" };
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as { kind?: unknown }).kind !== VALUE_MODEL_KIND
  ) {
    return { kind: "legacy_text" };
  }
  const result = valueModelSchema.safeParse(parsed);
  if (!result.success) {
    return {
      kind: "invalid",
      issues: result.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }
  // The schema mirrors ValueCase; the assignment is checked by the compiler.
  const model: ValueModelCapture = result.data;
  return { kind: "model", model };
}

/** The structured model, or null for legacy free text and invalid models. */
export function parseValueModel(value: string): ValueModelCapture | null {
  const read = readValueModel(value);
  return read.kind === "model" ? read.model : null;
}

export function serializeValueModel(model: ValueModelCapture): string {
  return JSON.stringify(model);
}

export interface ValueModelCaptureEvaluation {
  read: ValueModelRead;
  /** Null for legacy text and invalid models. */
  result: ValueCaseResult | null;
  /**
   * Legacy text: true (free text completes as it always has). Invalid: false.
   * Model: the engine's `readyForApproval` — every input resolved, every rule met.
   */
  complete: boolean;
}

export function evaluateValueModelCapture(
  value: string,
  options: { resolver?: ValueInputResolver } = {},
): ValueModelCaptureEvaluation {
  const read = readValueModel(value);
  if (read.kind === "legacy_text")
    return { read, result: null, complete: true };
  if (read.kind === "invalid") return { read, result: null, complete: false };
  const result = evaluateValueCase(read.model.case, options);
  return { read, result, complete: result.readyForApproval };
}
