// Source · d19c Pricing Comparison payload binder
//
// Two responsibilities:
//   1. Read real vendor submissions from the substrate. When none have
//      been uploaded yet, the comparison renders an HONEST empty state —
//      "no submissions received yet" — never synthetic vendors. Inventing
//      "Acme / Beta / Gamma" submissions on a pilot artifact is an
//      overclaim; the buyer must see the true state of the solicitation.
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
 * Build the comparison payload. The binder reads real vendor submissions
 * from the substrate; when none exist it returns an empty submission set so
 * the comparison renders an honest "awaiting vendor submissions" state. No
 * synthetic vendors are ever fabricated.
 */
export async function buildPricingComparisonPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<PricingComparisonPayload> {
  // Reuse the d19a template binder so locked rows match exactly.
  const template = buildPricingTemplatePayloadFromContext(ctx, generatedAt);

  // Real submissions only — an empty result renders an honest empty state.
  const realRows = await listActiveSubmissionsForEvent(ctx.event.id);
  const submissions: VendorPricingSubmission[] = realRows.map(
    submissionRowToRendererSubmission,
  );

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
    // The comparison is never in synthetic "demo mode": when there are no
    // submissions the renderer shows the awaiting-submissions empty state.
    demoMode: false,
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
