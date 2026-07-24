/**
 * Nexus Pricing Engine — PR3 governed-load rate-card diff preview.
 *
 * Pure function: given a tenant's CURRENT `pricing_rate_card_lines` rows and
 * a freshly parsed+validated upload, compute added/changed/unchanged/removed
 * lines keyed by PR2's rate-card-line idempotency key
 * (`rateCardLineIdentityKey`). This is the "preview differences" step the
 * PR3 brief requires to run before any commit — no I/O in this file, so it
 * is fully unit-testable with hand-built fixtures.
 */
import { rateCardLineIdentityKey } from "./identity-keys";
import type { NewRateCardLineInput } from "../rate-card-repository";
import type { PricingRateCardLineRow } from "../types";
import type { DiffLineSummary, RateCardDiff } from "./types";

/**
 * A DB row always carries the snake_case `role_or_band_ref` column;
 * `NewRateCardLineInput` never does. This single discriminant is far more
 * robust than checking `"field" in line` per optional field — an optional
 * camelCase field (e.g. `providerRef`) may legitimately be absent from a
 * `NewRateCardLineInput` object literal that never set it, which would make
 * a per-field `in` check misidentify the shape for THAT field alone and
 * silently fall through to reading the wrong (snake_case) key, producing a
 * spurious `undefined` that compares unequal to a DB row's real `null`.
 */
function isDbRow(
  line: NewRateCardLineInput | PricingRateCardLineRow,
): line is PricingRateCardLineRow {
  return "role_or_band_ref" in line;
}

function toSummary(line: NewRateCardLineInput | PricingRateCardLineRow): DiffLineSummary {
  const roleOrBandRef = isDbRow(line) ? line.role_or_band_ref : line.roleOrBandRef;
  const level = isDbRow(line) ? line.level : line.level ?? null;
  const providerRef = isDbRow(line) ? line.provider_ref : line.providerRef ?? null;
  const locationRef = isDbRow(line) ? line.location_ref : line.locationRef ?? null;
  const rateBasis = isDbRow(line) ? line.rate_basis : line.rateBasis;
  const unit = line.unit;
  const rateValue = isDbRow(line) ? Number(line.rate_value) : line.rateValue;
  const currency = isDbRow(line) ? line.currency : line.currency ?? "USD";
  const validFrom = isDbRow(line) ? line.valid_from : line.validFrom;
  const validTo = isDbRow(line) ? line.valid_to : line.validTo ?? null;

  return {
    identityKey: rateCardLineIdentityKey({
      roleOrBandRef,
      level,
      providerRef,
      locationRef,
      rateBasis,
      unit,
      validFrom,
    }),
    roleOrBandRef,
    level,
    providerRef,
    locationRef,
    rateBasis,
    unit,
    rateValue,
    currency,
    validFrom,
    validTo,
  };
}

/** Two lines are "changed" (not just re-keyed) if any priced/valid-to field differs. */
function linesDiffer(before: DiffLineSummary, after: DiffLineSummary): boolean {
  return (
    before.rateValue !== after.rateValue ||
    before.currency !== after.currency ||
    before.validTo !== after.validTo
  );
}

export function computeRateCardDiff(
  currentLines: readonly PricingRateCardLineRow[],
  incomingLines: readonly NewRateCardLineInput[],
): RateCardDiff {
  const currentByKey = new Map<string, DiffLineSummary>();
  for (const line of currentLines) {
    const summary = toSummary(line);
    currentByKey.set(summary.identityKey, summary);
  }

  const incomingByKey = new Map<string, DiffLineSummary>();
  for (const line of incomingLines) {
    const summary = toSummary(line);
    incomingByKey.set(summary.identityKey, summary);
  }

  const added: DiffLineSummary[] = [];
  const changed: { before: DiffLineSummary; after: DiffLineSummary }[] = [];
  const unchanged: DiffLineSummary[] = [];

  for (const [key, after] of incomingByKey) {
    const before = currentByKey.get(key);
    if (!before) {
      added.push(after);
    } else if (linesDiffer(before, after)) {
      changed.push({ before, after });
    } else {
      unchanged.push(after);
    }
  }

  const removed: DiffLineSummary[] = [];
  for (const [key, before] of currentByKey) {
    if (!incomingByKey.has(key)) removed.push(before);
  }

  const sortByKey = (a: { identityKey: string }, b: { identityKey: string }) =>
    a.identityKey < b.identityKey ? -1 : a.identityKey > b.identityKey ? 1 : 0;

  return {
    added: added.sort(sortByKey),
    changed: changed.sort((a, b) => sortByKey(a.after, b.after)),
    unchanged: unchanged.sort(sortByKey),
    removed: removed.sort(sortByKey),
  };
}
