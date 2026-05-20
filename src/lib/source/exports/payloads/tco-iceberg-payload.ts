// Source · dx4 TCO Iceberg payload binder.
//
// Binds an iceberg layer set from substrate signals + a deterministic
// methodology §5 baseline. Year-1 amounts are seeded from the event's
// estimatedValueUsd when present (anchor against value-at-stake);
// when absent, all amounts are zero and the artifact renders with
// "Not recorded — seed gap" honesty rather than invented numbers.
//
// The locked methodology §5 definitions ship with every export.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  IcebergDefinition,
  IcebergLayer,
  TcoIcebergPayload,
} from '../renderers/tco-iceberg';

export function buildTcoIcebergPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): TcoIcebergPayload {
  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    currency: 'USD',
    layers: defaultLayers(ctx),
    definitions: methodologyDefinitions(),
  };
}

function defaultLayers(ctx: SourceGenerationContext): IcebergLayer[] {
  const valueAtStake = ctx.event.estimatedValueUsd ?? 0;
  // Anchor: if value-at-stake is recorded, treat as the rough Y1
  // visible (vendor-quoted) cost and scale the iceberg layers as
  // %-of-visible shares per methodology §5 (vendor quote = 20-35% of
  // true cost). When value-at-stake is 0, everything is 0 and the
  // artifact renders honest zero rows.
  const visibleY1 = valueAtStake > 0 ? valueAtStake : 0;
  // Methodology §5 — typical iceberg ratios.
  const layer = (
    id: string,
    label: string,
    visibility: IcebergLayer['visibility'],
    driver: string,
    y1Fraction: number,
    confidence: IcebergLayer['confidence'],
    sensitivityLow: number,
    sensitivityHigh: number,
  ): IcebergLayer => {
    const y1 = Math.round(visibleY1 * y1Fraction);
    // Year 2/3 escalator 4% (placeholder; mirrors d19 default).
    const y2 = Math.round(y1 * 1.04);
    const y3 = Math.round(y1 * 1.04 * 1.04);
    return {
      id,
      label,
      visibility,
      driver,
      year1Usd: y1,
      year2Usd: y2,
      year3Usd: y3,
      confidence,
      sensitivityLowUsd: Math.round(y1 * sensitivityLow),
      sensitivityHighUsd: Math.round(y1 * sensitivityHigh),
    };
  };

  return [
    layer('L-LICENSE', 'License / subscription', 'visible', 'Vendor quote (anchored to event value-at-stake).', 1.0, 'high', 0.95, 1.05),
    layer('L-IMPL', 'Implementation & configuration', 'hidden', 'SI fees + internal effort to stand up.', 0.4, 'medium', 0.25, 0.6),
    layer('L-INTEGRATION', 'Integration', 'hidden', 'Connectors to existing it_landscape (per d04 inventory).', 0.25, 'medium', 0.15, 0.45),
    layer('L-DATA', 'Data migration & cleanup', 'hidden', 'State of customer data; ETL + reconciliation effort.', 0.15, 'low', 0.05, 0.4),
    layer('L-CHANGE', 'Change management & training', 'hidden', 'Org size, adoption difficulty; comms + training.', 0.12, 'medium', 0.06, 0.25),
    layer('L-OPS', 'Ongoing operations & support', 'hidden', 'Run-rate FTE, support tier (per d21 assumption set).', 0.18, 'medium', 0.1, 0.3),
    layer('L-CONSUMPTION', 'Consumption / scaling cost', 'hidden', 'Token / usage-based pricing (AI); volume escalation.', 0.1, 'low', 0.0, 0.4),
    layer('L-EXIT', 'Exit & transition', 'hidden', 'Data export, re-platform, dual-run at contract end.', 0.08, 'low', 0.03, 0.2),
  ];
}

function methodologyDefinitions(): IcebergDefinition[] {
  return [
    {
      layerLabel: 'License / subscription',
      rubric: 'The vendor quote. Typically 20–35% of true 3-year TCO. Visible by definition.',
    },
    {
      layerLabel: 'Implementation & configuration',
      rubric:
        'SI fees + internal effort. Hidden in the vendor quote. Scales with scope size and integration complexity.',
    },
    {
      layerLabel: 'Integration',
      rubric:
        'Connectors to existing it_landscape. Hidden. Materially driven by the number of upstream + downstream systems.',
    },
    {
      layerLabel: 'Data migration & cleanup',
      rubric:
        'Hidden. Sized by data-quality state of the customer; cleanup almost always exceeds initial estimate.',
    },
    {
      layerLabel: 'Change management & training',
      rubric:
        'Hidden. Driven by org size and adoption difficulty; cut here directly degrades realized value.',
    },
    {
      layerLabel: 'Ongoing operations & support',
      rubric:
        'Hidden. Run-rate FTE + support tier. Confirm against the d21 locked assumption set.',
    },
    {
      layerLabel: 'Consumption / scaling cost',
      rubric:
        'Hidden — and the largest TCO risk for AI offerings. Methodology §6 requires a hard cap + 80% alerting.',
    },
    {
      layerLabel: 'Exit & transition',
      rubric:
        'Hidden. Re-platforming + dual-run at contract end. Frequently zero in vendor proposals; never zero in reality.',
    },
  ];
}
