/**
 * Runtime validation for consumption envelopes and fixtures. These schemas are
 * the enforcement point for the contract tests:
 *   - fixtures validate against the shared contract;
 *   - unknown availability states fail;
 *   - missing baseline/version fields fail;
 *   - candidate data cannot be labeled as published;
 *   - withheld evidence content cannot leak.
 *
 * We use zod so a single validator guards both fixtures (build time) and the
 * real HTTP responses (runtime), guaranteeing the two providers are truly
 * interchangeable.
 */

import { z } from "zod";
import {
  AUTHORITY_STATES,
  AVAILABILITY_STATES,
  FRESHNESS_STATES,
} from "./states";
import { PROJECTION_NAMES } from "./core";

export const authorityStateSchema = z.enum(AUTHORITY_STATES);
export const availabilityStateSchema = z.enum(AVAILABILITY_STATES);
export const freshnessStateSchema = z.enum(FRESHNESS_STATES);
export const projectionNameSchema = z.enum(PROJECTION_NAMES);

export const consumptionWarningSchema = z.object({
  code: z.enum([
    "newer_baseline_available",
    "partial_domain",
    "cube_unavailable",
    "models_disabled",
    "last_known_good",
    "conflict_detected",
    "evidence_withheld",
    "not_measured",
    "not_loaded",
  ]),
  message: z.string().min(1),
  scope: z.string().optional(),
});

/**
 * The envelope metadata schema — strict so unknown/misspelled states fail and
 * required baseline/version fields cannot be omitted. `.strict()` rejects any
 * extra top-level key, catching drift and accidental leakage of raw columns.
 */
export const envelopeMetaSchema = z
  .object({
    tenantKey: z.string().min(1),
    knowledgeBaselineRef: z.string().min(1),
    domainPublicationVersions: z.record(z.string(), z.string()),
    projectionName: projectionNameSchema,
    projectionContractVersion: z.string().min(1),
    asOf: z.string().min(1),
    contentHash: z.string().min(1),
    authorityState: authorityStateSchema,
    availabilityState: availabilityStateSchema,
    freshnessState: freshnessStateSchema,
    evidenceRefs: z.array(z.string()),
    knownGapRefs: z.array(z.string()),
    warnings: z.array(consumptionWarningSchema),
  })
  .strict();

/** Validate an envelope's metadata (data payload validated separately per mode). */
export function makeEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return envelopeMetaSchema.extend({ data: dataSchema }).strict();
}

export type EnvelopeMetaInput = z.input<typeof envelopeMetaSchema>;

/**
 * Guard against the two most dangerous content-safety violations:
 *   1. Candidate content presented as published.
 *   2. Withheld/restricted evidence content leaking into a displayable field.
 * Returns a list of human-readable violations (empty = safe).
 */
export function findContentSafetyViolations(env: {
  authorityState: string;
  availabilityState: string;
  data: unknown;
}): string[] {
  const violations: string[] = [];

  // A candidate must never be marked accepted/published at the envelope level.
  if (
    env.availabilityState === "candidate" &&
    (env.authorityState === "published" || env.authorityState === "accepted")
  ) {
    violations.push(
      "candidate availability cannot carry accepted/published authority",
    );
  }

  // Withheld payloads must not carry displayable text content.
  if (env.availabilityState === "withheld") {
    const serialized = JSON.stringify(env.data ?? null);
    // A withheld envelope should expose reasons/refs, never quote/snippet/body text.
    const leakyKeys = ['"quote"', '"snippet"', '"body"', '"value"'];
    for (const key of leakyKeys) {
      if (serialized.includes(key)) {
        const match = new RegExp(`${key}\\s*:\\s*"([^"]+)"`).exec(serialized);
        if (match && match[1] && match[1].length > 0) {
          violations.push(`withheld envelope leaks content in ${key}`);
        }
      }
    }
  }

  return violations;
}
