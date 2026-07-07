// The value-waterfall / value-bridge HONESTY RULES, factored into one place so
// every renderer (the original ValueWaterfall card and the Recharts
// ValueBridgeInsight) obeys the identical doctrine. These are the executable
// honesty contract:
//   • a band with insufficient evidence renders "needs evidence", NEVER a $0;
//   • the roll-up total sums ONLY quantified bands (insufficient ones inflate
//     nothing);
//   • protected / risk-adjusted value is stated but never folded into a savings
//     headline (the caller decides placement; the doctrine footer says so);
//   • ranges, never a bare point.

import type { ValueUnit } from '@/lib/source/archetypes/types';
import type { ValueWaterfallBandView } from '../view-model';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

/** Format one amount in its unit (compact USD by default). */
export function fmtWaterfallAmount(value: number, unit: ValueUnit = 'usd'): string {
  switch (unit) {
    case 'usd':
    case 'usd_per_year':
      return USD_COMPACT.format(value);
    case 'pct':
      return `${value}%`;
    case 'fte':
      return `${value} FTE`;
    case 'months':
      return `${value} mo`;
    case 'count':
    case 'ratio':
    default:
      return String(value);
  }
}

/** Format a low–high range; collapses to a single figure when low === high. */
export function fmtWaterfallUsdRange(
  low: number,
  high: number,
  unit: ValueUnit = 'usd',
): string {
  if (low === high) return fmtWaterfallAmount(low, unit);
  return `${fmtWaterfallAmount(low, unit)}–${fmtWaterfallAmount(high, unit)}`;
}

/**
 * Sum ONLY the quantified bands to a defensible low/high range. Insufficient
 * bands contribute nothing — never their inert $0 as a real figure.
 */
export function quantifiedTotal(
  bands: readonly ValueWaterfallBandView[],
): { low: number; high: number; count: number } {
  const quantified = bands.filter((b) => b.state === 'quantified');
  return {
    low: quantified.reduce((s, b) => s + b.amountLow, 0),
    high: quantified.reduce((s, b) => s + b.amountHigh, 0),
    count: quantified.length,
  };
}

/** The doctrine footer shown under every waterfall/bridge. */
export const WATERFALL_DOCTRINE_FOOTER =
  'Every band is a classified movement, not a headline discount — the first bid is the ' +
  'vendor’s opening position, not the baseline. Ranges carry confidence; a band without ' +
  'evidence shows “needs evidence,” never a guessed number. Protected and risk-adjusted ' +
  'value are stated apart, never folded into a savings total.';
