/**
 * Shared identity-key helpers for the PR3 governed-load pipeline.
 *
 * `rateCardLineIdentityKey` intentionally mirrors the private
 * `lineIdentityKey` function in `../rate-card-repository.ts` column-for-
 * column (role_or_band_ref, level, provider_ref, location_ref, rate_basis,
 * unit, valid_from) — the same key the `uq_pricing_rate_card_lines_identity`
 * database index enforces. It is re-declared here (rather than exported from
 * `rate-card-repository.ts`) because this pipeline needs it BEFORE a
 * `NewRateCardLineInput` exists — during CSV-row semantic validation and
 * diff-preview, ahead of `createRateCardVersion` ever being called. Keep
 * this in sync with `rate-card-repository.ts` and
 * `pricing_rate_card_lines`'s unique index if either changes.
 */
import { coalesceKeyPart } from "../versioning";

export interface RateCardLineIdentity {
  roleOrBandRef: string;
  level?: string | null;
  providerRef?: string | null;
  locationRef?: string | null;
  rateBasis: string;
  unit: string;
  validFrom: string;
}

export function rateCardLineIdentityKey(line: RateCardLineIdentity): string {
  return [
    line.roleOrBandRef,
    coalesceKeyPart(line.level ?? null, "__any_level__"),
    coalesceKeyPart(line.providerRef ?? null, "__any_provider__"),
    coalesceKeyPart(line.locationRef ?? null, "__any_location__"),
    line.rateBasis,
    line.unit,
    line.validFrom,
  ].join("::");
}

/**
 * Mirrors `pricing_client_profile_values`'s
 * `uq_pricing_client_profile_values_key` — UNIQUE (tenant_key,
 * profile_version, assumption_key). The pipeline only ever diffs/dedupes
 * within one tenant + one in-progress upload (not-yet-versioned), so the key
 * used at parse/diff time is just the assumption_key itself; tenant_key and
 * profile_version are constant for a single upload and applied by the caller.
 */
export function clientProfileAssumptionKey(assumptionKey: string): string {
  return assumptionKey.trim();
}
