// Source · d19c Pricing Comparison payload binder
//
// Two responsibilities:
//   1. When the upload-back path (Slice 2c.2) lands, this binder will
//      read real vendor submissions from the substrate. Until then, it
//      synthesizes 3 plausible vendor submissions so the comparison
//      renderer can be exercised end-to-end on prod (DEMO MODE).
//   2. Pulls the locked d19a template payload (line items + assumption
//      set + escalator) so the comparison's locked columns match what
//      vendors received. Reuses buildPricingTemplatePayloadFromContext
//      to avoid duplicating the d05 / d21 binding logic.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type { PricingComparisonPayload, VendorPricingSubmission } from '../renderers/pricing-comparison';
import { buildPricingTemplatePayloadFromContext } from './pricing-template-payload';
import { listActiveSubmissionsForEvent } from '@/lib/source/pricing-submissions/dao';
import type { VendorPricingSubmissionRow } from '@/lib/source/pricing-submissions/types';

/**
 * Build the comparison payload. As of Slice 2c.2 the binder reads real
 * vendor submissions from the substrate when any exist, and falls back
 * to synthesizing 3 demo vendors when none have been uploaded yet.
 */
export async function buildPricingComparisonPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<PricingComparisonPayload> {
  // Reuse the d19a template binder so locked rows match exactly.
  const template = buildPricingTemplatePayloadFromContext(ctx, generatedAt);

  // Slice 2c.2: pull real submissions if any exist; fall back to synthetic.
  const realRows = await listActiveSubmissionsForEvent(ctx.event.id);
  let submissions: VendorPricingSubmission[];
  let demoMode: boolean;
  if (realRows.length > 0) {
    submissions = realRows.map(submissionRowToRendererSubmission);
    demoMode = false;
  } else {
    submissions = synthesizeDemoSubmissions(template.lineItems, generatedAt);
    demoMode = true;
  }

  return {
    tenantName: template.tenantName,
    eventCode: template.eventCode,
    eventName: template.eventName,
    generatedAt,
    lineItems: template.lineItems,
    assumptions: template.assumptions,
    escalator: template.escalator,
    tcoYears: template.tcoYears,
    submissions,
    demoMode,
  };
}

/** Map the substrate row shape onto the renderer's submission shape. */
function submissionRowToRendererSubmission(
  row: VendorPricingSubmissionRow,
): VendorPricingSubmission {
  return {
    vendorName: row.vendorName,
    submittedAt: row.submittedAt,
    unitPricesById: row.unitPricesById,
    vendorNotesById: row.vendorNotesById,
    pricingNotes: row.pricingNotes,
    assumptionDeviations: row.assumptionDeviations,
  };
}

/**
 * Generate three plausible vendor submissions:
 *  - Vendor Acme: tightest spread, accepts assumption set as-is
 *  - Vendor Beta: ~12% cheaper on operating-model lines, ~8% pricier
 *    on platform; flags 1 medium-severity deviation
 *  - Vendor Gamma: 18-22% pricier overall; flags 2 high-severity
 *    deviations against the locked term + escalator
 *
 * The base unit prices are rough order-of-magnitude estimates keyed off
 * each line's unit type (FTE-month / incident-call / unit-month / etc).
 * They produce realistic-looking comparison output without trying to be
 * accurate for any real-world archetype.
 */
function synthesizeDemoSubmissions(
  lineItems: PricingComparisonPayload['lineItems'],
  generatedAt: string,
): VendorPricingSubmission[] {
  const acme = synthesizeVendor('Acme Cloud Solutions', lineItems, {
    overall: 1.0,
    operatingModelMul: 1.0,
    platformMul: 1.0,
    seed: 17,
  });
  acme.submittedAt = '2026-06-12T16:14:00.000Z';
  acme.pricingNotes = 'No deviations. Pricing accepts the locked assumption set as written.';

  const beta = synthesizeVendor('Beta Sourcing Group', lineItems, {
    overall: 0.96,
    operatingModelMul: 0.88,
    platformMul: 1.08,
    seed: 31,
  });
  beta.submittedAt = '2026-06-13T09:32:00.000Z';
  beta.pricingNotes =
    'Term horizon — proposing a 5-year option (alternative pricing model in Sheet 5).';
  beta.assumptionDeviations = [
    {
      assumptionKey: 'Term horizon',
      proposedAlternative:
        '5-year firm with year-3 break clause; 9% discount on platform lines vs 3-year submission.',
      severity: 'medium',
    },
  ];

  const gamma = synthesizeVendor('Gamma Solutions Partners', lineItems, {
    overall: 1.20,
    operatingModelMul: 1.15,
    platformMul: 1.18,
    seed: 53,
  });
  gamma.submittedAt = '2026-06-14T14:01:00.000Z';
  gamma.pricingNotes =
    'Two assumption challenges: requesting T&E pass-through and a 6.5% escalator.';
  gamma.assumptionDeviations = [
    {
      assumptionKey: 'Annual escalator',
      proposedAlternative: '6.5% annual escalator (CPI + 200bps) — material to TCO at year 3.',
      severity: 'high',
    },
    {
      assumptionKey: 'Travel & expenses',
      proposedAlternative:
        'Allow T&E pass-through with capped quarterly review — industry-standard for our delivery model.',
      severity: 'high',
    },
  ];

  // Suppress unused-var lint: generatedAt is referenced via submittedAt
  // overrides above; keep it as a function arg so callers can pass an
  // override timestamp once the upload path lands.
  void generatedAt;

  return [acme, beta, gamma];
}

interface VendorSpread {
  /** Overall multiplier applied to base prices. */
  overall: number;
  /** Multiplier for "operating model" / "ops" lines. */
  operatingModelMul: number;
  /** Multiplier for "platform" lines. */
  platformMul: number;
  /** Deterministic seed for the per-line jitter. */
  seed: number;
}

function synthesizeVendor(
  vendorName: string,
  lineItems: PricingComparisonPayload['lineItems'],
  spread: VendorSpread,
): VendorPricingSubmission {
  const unitPricesById: Record<string, number> = {};
  let seed = spread.seed;
  for (const item of lineItems) {
    const base = baseUnitPriceForUnit(item.unit);
    const categoryMul = /operating|ops/i.test(item.category)
      ? spread.operatingModelMul
      : /platform/i.test(item.category)
        ? spread.platformMul
        : 1.0;
    // Cheap deterministic jitter in [0.92, 1.08].
    seed = (seed * 1103515245 + 12345) & 0x7fff_ffff;
    const jitter = 0.92 + ((seed >>> 8) % 1601) / 10000; // 0.92 .. 1.0801
    const unit = base * spread.overall * categoryMul * jitter;
    unitPricesById[item.id] = roundUnit(unit);
  }
  return {
    vendorName,
    submittedAt: '',
    unitPricesById,
    pricingNotes: '',
    assumptionDeviations: [],
  };
}

/** Reasonable order-of-magnitude unit prices keyed off the unit type. */
function baseUnitPriceForUnit(unit: string): number {
  const u = unit.toLowerCase();
  if (u.includes('fte-month')) return 28000;
  if (u.includes('incident-call')) return 90;
  if (u.includes('release-cycle')) return 18000;
  if (u.includes('event')) return 75000;
  if (u.includes('workload-month')) return 380;
  if (u.includes('tb-month')) return 60;
  if (u.includes('unit-month')) return 220;
  return 1500;
}

/** Round to a clean dollar amount for demo-mode legibility. */
function roundUnit(n: number): number {
  if (n < 100) return Math.round(n * 10) / 10; // tens of dollars: 1 decimal
  if (n < 10_000) return Math.round(n);
  return Math.round(n / 100) * 100; // round to nearest $100
}
