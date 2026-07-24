/**
 * Nexus Pricing Engine — PR3 governed pricing projection (brief §6.1/6.7).
 *
 * Produces ONLY the safe summary fields a future consumer is allowed to see:
 * approved rate-card identity + effective period, coverage percentage,
 * unresolved-gap count, approved client-profile version, and the
 * model/taxonomy/rate-card version numbers. Explicitly NOT the full rate
 * lines — `pricing_rate_card_lines` rows never leave this function.
 *
 * IMPORTANT — this is NOT wired into `buildValidatedAgentContextBundle`,
 * `agent-context-broker.ts`, or any agent/Claude-facing context path in this
 * PR. Per PRICING_ENGINE_CURRENT_STATE.md §14 and the AGENTS.md "Tower
 * numbers remain deterministic" rule, this is the shape that would
 * EVENTUALLY feed a governed context/agent bundle in a future PR (PR6's
 * business-case context output, brief §9.7) — but PR3 has no consumer for
 * it yet. Building the eventual bridge into the context-corpus governance
 * layer is explicitly out of scope here; see the direction decision in
 * PRICING_ENGINE_CURRENT_STATE.md §14 for why rate cards / pricing profiles
 * do not route through `template-registry.ts` /
 * `buildValidatedAgentContextBundle` at all — they are deterministic
 * Postgres-owned numbers, not enterprise-context facts.
 */
import { getCurrentRateCard } from "../rate-card-repository";
import { CLIENT_ENTERPRISE_RATE_CARD_CODE } from "./constants";
import { buildRateCardCoverageReport } from "./coverage-report";
import { getCurrentClientProfile } from "./client-profile-repository";
import { getCurrentModelVersion, loadRateCardReferenceSnapshot } from "./reference-lookup";
import type { GovernedPricingProjection } from "./types";

export interface BuildGovernedPricingProjectionOptions {
  cardCode?: string;
}

export async function buildGovernedPricingProjection(
  tenantKey: string,
  options: BuildGovernedPricingProjectionOptions = {},
): Promise<GovernedPricingProjection> {
  const cardCode = options.cardCode ?? CLIENT_ENTERPRISE_RATE_CARD_CODE;

  const [rateCard, coverage, clientProfile, modelVersion, refs] = await Promise.all([
    getCurrentRateCard("client", tenantKey, cardCode),
    buildRateCardCoverageReport(tenantKey, { cardCode }),
    getCurrentClientProfile(tenantKey),
    getCurrentModelVersion(),
    loadRateCardReferenceSnapshot(),
  ]);

  return {
    tenantKey,
    rateCard: rateCard
      ? {
          cardCode: rateCard.card_code,
          version: rateCard.version,
          status: rateCard.status,
          effectiveFrom: rateCard.effective_from,
          effectiveTo: rateCard.effective_to,
        }
      : null,
    coveragePct: coverage.coveragePct,
    unresolvedGapCount: coverage.missing.count,
    clientProfile: clientProfile
      ? { version: clientProfile.profile_version, status: clientProfile.status }
      : null,
    modelVersion: modelVersion?.version ?? null,
    taxonomyVersion: refs.taxonomyVersion,
    generatedAt: new Date().toISOString(),
  };
}
