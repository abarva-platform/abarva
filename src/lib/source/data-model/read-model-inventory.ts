// ─────────────────────────────────────────────────────────────────────────────
// Source read-model build contract (item D-031).
//
// This module answers one question: may a proposed L4 read model be built?
// Until D-031 it answered that question by checking that each of the 13
// contract fields held a NON-EMPTY STRING, which is not a contract — it is a
// spelling check. Measured on `origin/main` 1526110e7 before this change, a
// declaration reading
//
//     tenantFence:          "none — any tenant may read any row"
//     oppositeTenantQuery:  "returns the other tenant's rows"
//     staleBehavior:        "serve stale silently"
//     owner:                "TBD"
//
// returned `{ metadataComplete: true, missing: [] }`: the gate certified as
// build-ready a read model declaring the exact OPPOSITE of the invariants
// D-031 asks for ("fails closed ... denies opposite-tenant keys"). A gate a
// string literal satisfies is the failure mode this backlog was opened
// against, so the policy-bearing fields are now validated by VALUE.
//
// What this module does NOT do, said plainly because the distinction is the
// whole point: it governs DECLARATIONS, not running queries. Every model below
// is `state: "proposed"`, so there is no deployed read model to interrogate at
// runtime — no live query to starve of fresh rows, no opposite-tenant key to
// push through a real fence. Contract tests that drive a read model and prove
// it fails closed are still owed, and they become writable the first time a
// model leaves `proposed`. Completeness here proves a declaration is coherent
// and fail-closed as WRITTEN; it proves nothing about behaviour.
// ─────────────────────────────────────────────────────────────────────────────

export type SourceReadModelContractField =
  | "canonicalInputs"
  | "keys"
  | "asOf"
  | "reconciliationEquation"
  | "denominator"
  | "tenantFence"
  | "oppositeTenantQuery"
  | "freshnessSla"
  | "owner"
  | "projectionTrigger"
  | "staleBehavior"
  | "fieldAuthority"
  | "buildJob";

/**
 * The stale behaviours a read model may declare. Both are fail-closed in the
 * sense D-031 requires: `block` refuses to answer past the freshness SLA,
 * `label_stale` answers but marks the answer stale so no reader can mistake it
 * for current. Anything else — including prose that happens to contain the
 * word "stale" — is rejected, because "serve stale silently" is a sentence too
 * and the old presence check accepted it.
 */
export const SOURCE_READ_MODEL_STALE_BEHAVIORS = ["block", "label_stale"] as const;
export type SourceReadModelStaleBehavior =
  (typeof SOURCE_READ_MODEL_STALE_BEHAVIORS)[number];

/** The tenant column every Source read model is keyed and fenced by. */
export const SOURCE_READ_MODEL_TENANT_KEY = "tenant_key";

export interface SourceReadModelDefinition {
  id: string;
  state: "proposed";
  grain: string;
  consumingSurface: string;
  canonicalInputs?: readonly string[];
  keys?: readonly string[];
  asOf?: string;
  reconciliationEquation?: string;
  denominator?: string;
  tenantFence?: string;
  oppositeTenantQuery?: string;
  freshnessSla?: string;
  owner?: string;
  projectionTrigger?: string;
  staleBehavior?: string;
  fieldAuthority?: string;
  buildJob?: string;
}

// These are proposed grains and consumers, not deployed read models or approved build contracts.
export const SOURCE_READ_MODEL_INVENTORY: readonly SourceReadModelDefinition[] = [
  { id: "event_queue_v1", grain: "tenant + event", consumingSurface: "Requests and active Events", state: "proposed" },
  { id: "event_gate_v1", grain: "event + applicable stage", consumingSurface: "Progress and next action", state: "proposed" },
  { id: "event_artifact_index_v1", grain: "event + artifact version", consumingSurface: "Files explorer", state: "proposed" },
  { id: "supplier_readiness_v1", grain: "event + supplier legal entity", consumingSurface: "Supplier readiness", state: "proposed" },
  { id: "response_coverage_v1", grain: "event + package version + supplier + question family", consumingSurface: "Response coverage", state: "proposed" },
  { id: "evaluation_compare_v1", grain: "event + supplier + frozen criterion", consumingSurface: "Evaluation comparison", state: "proposed" },
  { id: "pricing_compare_v1", grain: "event + supplier + scenario/period", consumingSurface: "Pricing comparison", state: "proposed" },
  { id: "bafo_movement_v1", grain: "event + supplier + round + comparison basis", consumingSurface: "BAFO movement", state: "proposed" },
  { id: "decision_packet_v1", grain: "event + frozen packet version", consumingSurface: "Executive decision", state: "proposed" },
  { id: "transition_readiness_v1", grain: "event + milestone", consumingSurface: "Transition readiness", state: "proposed" },
  { id: "event_value_v1", grain: "event + opportunity + reporting period", consumingSurface: "Value lifecycle", state: "proposed" },
  { id: "industry_context_v1", grain: "archetype + metric + observation/version", consumingSurface: "Industry context", state: "proposed" },
  { id: "ava_event_context_v1", grain: "tenant + event + accepted snapshot", consumingSurface: "aVa event context", state: "proposed" },
];

const requiredFields: readonly SourceReadModelContractField[] = [
  "canonicalInputs", "keys", "asOf", "reconciliationEquation", "denominator",
  "tenantFence", "oppositeTenantQuery", "freshnessSla", "owner",
  "projectionTrigger", "staleBehavior", "fieldAuthority", "buildJob",
];

/**
 * Values that look like a declaration and are an absence. The presence check
 * this replaces accepted every one of them, so `owner: "TBD"` and
 * `buildJob: "none"` counted toward build readiness.
 */
const PLACEHOLDERS = new Set([
  "tbd", "tba", "todo", "n/a", "na", "none", "no", "nil", "null", "unknown",
  "unspecified", "pending", "?", "-", "--", "tbc", "later", "somewhere",
]);

function isPlaceholder(value: string): boolean {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[.!\s]+$/g, "");
  return normalized.length === 0 || PLACEHOLDERS.has(normalized);
}

/** A snake_case column/field token, which is how this repo names read-model fields. */
const FIELD_TOKEN = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/;

/** `1 hour`, `15 minutes`, `24h`, `30 m`, `7 days` — a bound something can exceed. */
const DURATION = /\b\d+(?:\.\d+)?\s*(?:m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)\b/;

/** A statement that an opposite-tenant read yields nothing. */
const DENIAL = /\b(zero rows|no rows|none returned|empty(?: result| set)?|denied|denies|deny|rejected|refused|403|forbidden)\b/;

export interface SourceReadModelContractViolation {
  field: SourceReadModelContractField;
  reason: string;
}

/**
 * The value rules, one per policy-bearing field. Each returns `null` when the
 * declared value satisfies the contract and a reason when it does not. Fields
 * absent from this map are checked for presence and placeholders only — there
 * is no honest way to validate a person's name.
 */
const valueRules: Partial<
  Record<SourceReadModelContractField, (value: string) => string | null>
> = {
  staleBehavior: (value) =>
    (SOURCE_READ_MODEL_STALE_BEHAVIORS as readonly string[]).includes(
      value.trim().toLowerCase(),
    )
      ? null
      : `must be one of ${SOURCE_READ_MODEL_STALE_BEHAVIORS.join(", ")} so the model fails closed past its freshness SLA; got ${JSON.stringify(value)}`,
  tenantFence: (value) =>
    value.toLowerCase().includes(SOURCE_READ_MODEL_TENANT_KEY)
      ? null
      : `must name the ${SOURCE_READ_MODEL_TENANT_KEY} column the fence is applied to; got ${JSON.stringify(value)}`,
  oppositeTenantQuery: (value) =>
    DENIAL.test(value.toLowerCase())
      ? null
      : `must state that an opposite-tenant read returns nothing (e.g. "zero rows"); got ${JSON.stringify(value)}`,
  asOf: (value) =>
    FIELD_TOKEN.test(value.toLowerCase())
      ? null
      : `must name the as-of field the model preserves; got ${JSON.stringify(value)}`,
  freshnessSla: (value) =>
    DURATION.test(value.toLowerCase())
      ? null
      : `must state a duration a read can exceed (e.g. "1 hour"); got ${JSON.stringify(value)}`,
};

function keysViolation(keys: readonly string[]): string | null {
  return keys.some(
    (key) => key.trim().toLowerCase() === SOURCE_READ_MODEL_TENANT_KEY,
  )
    ? null
    : `must include ${SOURCE_READ_MODEL_TENANT_KEY}, or the grain is not tenant-scoped and an opposite-tenant row cannot be excluded by key; got ${JSON.stringify(keys)}`;
}

function declaredValues(
  definition: SourceReadModelDefinition,
  field: SourceReadModelContractField,
): string[] | null {
  const value = definition[field];
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((entry) => entry.trim().length > 0)
      ? [...value]
      : null;
  }
  return typeof value === "string" && value.trim().length > 0 ? [value] : null;
}

export interface SourceReadModelContractAssessment {
  metadataComplete: boolean;
  missing: SourceReadModelContractField[];
  /**
   * Fields that are present and do not satisfy the contract. Separate from
   * `missing` on purpose: "you did not say" and "what you said is not
   * fail-closed" are different defects and the second one used to pass.
   */
  invalid: SourceReadModelContractViolation[];
}

export function assessSourceReadModelContract(
  definition: SourceReadModelDefinition,
): SourceReadModelContractAssessment {
  const missing: SourceReadModelContractField[] = [];
  const invalid: SourceReadModelContractViolation[] = [];

  for (const field of requiredFields) {
    const values = declaredValues(definition, field);
    if (values === null) {
      missing.push(field);
      continue;
    }
    const placeholder = values.find((value) => isPlaceholder(value));
    if (placeholder !== undefined) {
      invalid.push({
        field,
        reason: `${JSON.stringify(placeholder)} is a placeholder, not a declaration`,
      });
      continue;
    }
    if (field === "keys") {
      const reason = keysViolation(values);
      if (reason) invalid.push({ field, reason });
      continue;
    }
    const rule = valueRules[field];
    if (!rule) continue;
    const reason = rule(values.join(" "));
    if (reason) invalid.push({ field, reason });
  }

  return {
    metadataComplete: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * How far a declaration has got.
 *
 * `partial` is the state worth naming: a model that declares some of its
 * contract reads as documented and is not, and it is the only state this
 * inventory should never sit in. Asserting that over the live inventory is a
 * check that cannot invert — it holds while every model declares nothing, it
 * holds once a model declares everything validly, and it fails in between.
 * The case it replaced asserted `event_queue_v1` was INCOMPLETE, which would
 * have gone red the day somebody completed it.
 */
export type SourceReadModelDeclarationState =
  | "undeclared"
  | "partial"
  | "contracted";

export function classifySourceReadModelDeclaration(
  definition: SourceReadModelDefinition,
): SourceReadModelContractAssessment & {
  state: SourceReadModelDeclarationState;
  declaredFieldCount: number;
} {
  const assessment = assessSourceReadModelContract(definition);
  const declaredFieldCount = requiredFields.length - assessment.missing.length;
  const state: SourceReadModelDeclarationState = assessment.metadataComplete
    ? "contracted"
    : declaredFieldCount === 0
      ? "undeclared"
      : "partial";
  return { ...assessment, state, declaredFieldCount };
}
