/**
 * Builds ConsumptionEnvelopes for the fixture provider, applying scenario
 * effects to governance metadata + warnings. Central so every fixture envelope
 * is guaranteed to carry the full required metadata set.
 */

import type {
  AuthorityState,
  AvailabilityState,
  ConsumptionEnvelope,
  ConsumptionWarning,
  FreshnessState,
  ProjectionName,
} from "../consumption-contracts";
import { PROJECTION_CONTRACT_VERSION } from "../consumption-contracts";
import type { FixturePack, FixtureScenario } from "../fixtures";
import { SCENARIO_EFFECTS } from "../fixtures";
import { contentHash } from "./content-hash";

/** Fixed as-of for deterministic fixtures/tests. */
export const FIXTURE_AS_OF_BASE = "2026-07-27T00:00:00.000Z";

function backdate(iso: string, days: number): string {
  const ms = Date.parse(iso) - days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

export interface BuildEnvelopeArgs<T> {
  pack: FixturePack;
  projectionName: ProjectionName;
  data: T;
  scenario: FixtureScenario;
  authorityState?: AuthorityState;
  availabilityState?: AvailabilityState;
  freshnessState?: FreshnessState;
  evidenceRefs?: string[];
  knownGapRefs?: string[];
  extraWarnings?: ConsumptionWarning[];
}

export function buildEnvelope<T>({
  pack,
  projectionName,
  data,
  scenario,
  authorityState = "published",
  availabilityState = "available",
  freshnessState = "fresh",
  evidenceRefs = [],
  knownGapRefs = [],
  extraWarnings = [],
}: BuildEnvelopeArgs<T>): ConsumptionEnvelope<T> {
  const effect = SCENARIO_EFFECTS[scenario];
  const asOf = effect.backdateDays
    ? backdate(FIXTURE_AS_OF_BASE, effect.backdateDays)
    : FIXTURE_AS_OF_BASE;

  const finalAvailability = effect.availabilityState ?? availabilityState;
  const finalAuthority = effect.authorityState ?? authorityState;
  const finalFreshness = effect.freshnessState ?? freshnessState;

  const warnings = [...effect.warnings, ...extraWarnings];

  return {
    tenantKey: pack.meta.tenantKey,
    knowledgeBaselineRef: pack.meta.knowledgeBaselineRef,
    domainPublicationVersions: pack.meta.domainPublicationVersions,
    projectionName,
    projectionContractVersion: PROJECTION_CONTRACT_VERSION,
    asOf,
    contentHash: contentHash({ projectionName, data, scenario }),
    authorityState: finalAuthority,
    availabilityState: finalAvailability,
    freshnessState: finalFreshness,
    data,
    evidenceRefs,
    knownGapRefs,
    warnings,
  };
}
