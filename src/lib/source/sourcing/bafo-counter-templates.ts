import type { VendorInferenceEconomics } from '@/lib/source/vendor-inference-economics';

export interface BafoProjectedCallVolume {
  month: string;
  callsPerMonth: number;
}

export interface BafoPricingTierLockInput {
  vendorId: string;
  vendorName: string;
  inferenceEconomics: VendorInferenceEconomics | null;
  projectedCallRamp: BafoProjectedCallVolume[];
  generatedAt: string;
}

export interface BafoCounterClause {
  clauseKey: 'pricingTierLock';
  title: string;
  clauseText: string;
  trigger: string;
  peerProvenance: ['Peer A', 'Peer B'];
  priority: 'high' | 'medium' | 'low';
  vendorId: string;
  vendorName: string;
  breachThresholdCallsPerMonth: number;
  projectedBreachMonth: string;
}

function parseMonthStart(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    + (end.getUTCMonth() - start.getUTCMonth());
}

function addMonths(start: Date, months: number): Date {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
}

function formatMonth(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function buildPricingTierLockClause(
  input: BafoPricingTierLockInput,
): BafoCounterClause | null {
  const generatedAt = parseMonthStart(input.generatedAt);
  if (!generatedAt || !input.inferenceEconomics || input.inferenceEconomics.pricingTierLadder.length === 0) {
    return null;
  }

  const ramp = input.projectedCallRamp
    .map((entry) => ({ ...entry, date: parseMonthStart(entry.month) }))
    .filter((entry): entry is BafoProjectedCallVolume & { date: Date } => entry.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const tier of input.inferenceEconomics.pricingTierLadder) {
    const breach = ramp.find((entry) =>
      entry.callsPerMonth >= tier.thresholdCallsPerMonth
      && monthsBetween(generatedAt, entry.date) >= 0
      && monthsBetween(generatedAt, entry.date) <= 24);
    if (!breach) continue;

    const lockUntil = input.inferenceEconomics.volumeLockExpiresOn
      ?? formatMonth(addMonths(generatedAt, 24));
    return {
      clauseKey: 'pricingTierLock',
      title: 'Pricing-tier lock',
      clauseText:
        `Vendor commits to current per-call pricing tier until ${lockUntil} `
        + `or ${tier.thresholdCallsPerMonth} calls per month, whichever occurs first; `
        + "pricing tier breach requires 90 days' notice and 30-day re-negotiation window.",
      trigger:
        `${input.vendorName} is projected to cross ${tier.thresholdCallsPerMonth} calls per month `
        + `in ${breach.month}.`,
      peerProvenance: ['Peer A', 'Peer B'],
      priority: 'high',
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      breachThresholdCallsPerMonth: tier.thresholdCallsPerMonth,
      projectedBreachMonth: breach.month,
    };
  }

  return null;
}
