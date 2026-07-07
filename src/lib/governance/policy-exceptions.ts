// =============================================================================
// Context & Corpus Governance — policy exceptions (PR-4, pure core)
// -----------------------------------------------------------------------------
// Every governance exception is time-boxed and auditable. An exception lets a
// specific object/scope bypass a specific gate UNTIL an explicit expiry — never
// forever, never silently. CI (validate:context-corpus) reads
// docs/governance/policy-exceptions.json and fails the build on an expired,
// malformed, non-canonical, or duplicate exception. This module is the pure,
// DB-free validator the CI script calls.
// =============================================================================

import { z } from "zod";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { CORPUS_GLOBAL_SCOPE } from "./context-corpus-policy";

/** Gates an exception may waive. Keep aligned with evaluateGovernedObject. */
export const EXCEPTABLE_RULES = [
  "agent_ready_without_cite_render",
  "agent_ready_without_retrievability",
  "missing_source_basis",
  "missing_confidence",
  "sensitive_in_shared_corpus",
  "tenant_missing_tenant_id",
] as const;
export type ExceptableRule = (typeof EXCEPTABLE_RULES)[number];

/** "all" = every canonical tenant + corpus_global (a broad, costly waiver). */
const EXCEPTION_SCOPE_VALUES = [
  "all",
  CORPUS_GLOBAL_SCOPE,
  ...CANONICAL_TENANT_KEYS,
] as const;

export const PolicyExceptionSchema = z.object({
  id: z.string().min(1),
  rule: z.enum(EXCEPTABLE_RULES),
  scope: z.enum(EXCEPTION_SCOPE_VALUES as unknown as [string, ...string[]]),
  /** Optional narrowing to a single object. */
  object_table: z.string().min(1).nullable().optional(),
  object_id: z.string().min(1).nullable().optional(),
  reason: z.string().min(8),
  granted_by: z.string().min(1),
  granted_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "granted_at must be YYYY-MM-DD"),
  expires_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expires_at must be YYYY-MM-DD"),
});
export type PolicyException = z.infer<typeof PolicyExceptionSchema>;

export const PolicyExceptionsFileSchema = z.object({
  policy_version: z.string().min(1),
  exceptions: z.array(PolicyExceptionSchema),
});

export interface ExceptionsValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
  active: number;
  expired: number;
}

/**
 * Validate the exceptions file as of `today` (YYYY-MM-DD). Fails (ok:false) on:
 * malformed file, expired exception, expiry-before-grant, or duplicate id.
 * Warns on a broad ("all"/corpus_global) waiver and on a long (>90d) window.
 */
export function validateExceptions(
  raw: unknown,
  today: string,
): ExceptionsValidation {
  const parsed = PolicyExceptionsFileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
      warnings: [],
      active: 0,
      expired: 0,
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  let active = 0;
  let expired = 0;

  for (const e of parsed.data.exceptions) {
    if (seen.has(e.id)) errors.push(`duplicate exception id "${e.id}"`);
    seen.add(e.id);

    if (e.expires_at < e.granted_at) {
      errors.push(`exception "${e.id}" expires before it was granted`);
    }
    if (e.expires_at < today) {
      errors.push(
        `exception "${e.id}" expired on ${e.expires_at} (today ${today}) — remove it or re-grant with a future expiry`,
      );
      expired += 1;
    } else {
      active += 1;
    }

    if (e.scope === "all" || e.scope === CORPUS_GLOBAL_SCOPE) {
      warnings.push(
        `exception "${e.id}" has broad scope "${e.scope}" — prefer the narrowest scope (a single tenant/object)`,
      );
    }
    if (daysBetween(e.granted_at, e.expires_at) > 90) {
      warnings.push(
        `exception "${e.id}" window exceeds 90 days — long-lived waivers defeat the gate`,
      );
    }
  }

  return { ok: errors.length === 0, errors, warnings, active, expired };
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.round((db - da) / 86_400_000);
}
