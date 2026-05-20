// Source · dx7 Renewal Decision payload binder.
//
// Builds the candidate verdict list from vendor_contracts records, the
// telemetry signal list from operating_telemetry, and the locked
// decision-trigger rubric. Posture is recommended honestly: when the
// substrate is empty we return "undetermined" not "renew_as_is".

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  RenewalCandidate,
  RenewalDecisionPayload,
  RenewalDecisionTrigger,
  RenewalPosture,
  RenewalTelemetrySignal,
} from '../renderers/renewal-decision';
import {
  loadRenewalSubstrate,
  type ContractCoverage,
  type TelemetrySignal,
} from './lifecycle-substrate';

export async function buildRenewalDecisionPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<RenewalDecisionPayload> {
  const substrate = await loadRenewalSubstrate(ctx).catch(() => null);
  const contracts = substrate?.contracts ?? [];
  const telemetry = substrate?.telemetry ?? [];

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    candidates: contracts.map((c, i) => buildCandidate(c, i, telemetry)),
    signals: telemetry.map(toSignal),
    triggers: lockedTriggers(),
  };
}

function buildCandidate(
  c: ContractCoverage,
  i: number,
  telemetry: ReadonlyArray<TelemetrySignal>,
): RenewalCandidate {
  const daysUntilRenewal = calcDaysUntil(c.renewalDate);
  const posture = recommendPosture(c, daysUntilRenewal, telemetry);
  const rationale = recommendRationale(c, posture, daysUntilRenewal, telemetry);
  const alternative = recommendAlternative(c);
  return {
    id: `R-${(i + 1).toString().padStart(3, '0')}`,
    vendor: c.vendor,
    scope: c.scope ?? '— Not recorded — seed gap',
    annualSpendUsd: c.annualSpendUsd ?? 0,
    renewalDate: c.renewalDate ?? '— Not recorded — seed gap',
    daysUntilRenewal,
    posture,
    rationale,
    topAlternative: alternative,
    finalDecision: '',
  };
}

function calcDaysUntil(renewalDate: string | null): number {
  if (!renewalDate) return 0;
  // Best-effort ISO date parse. Non-ISO strings → 0.
  const t = Date.parse(renewalDate);
  if (Number.isNaN(t)) return 0;
  const now = Date.now();
  return Math.round((t - now) / (1000 * 60 * 60 * 24));
}

function recommendPosture(
  c: ContractCoverage,
  daysUntil: number,
  telemetry: ReadonlyArray<TelemetrySignal>,
): RenewalPosture {
  // Honest defaults: any missing critical signal → undetermined.
  if (!c.annualSpendUsd && !c.renewalDate) return 'undetermined';
  // Adverse telemetry on this vendor → push toward rebid/exit.
  const adverse = telemetry.some((s) =>
    (s.surface ?? '').toLowerCase().includes(c.vendor.toLowerCase()) &&
    /low|poor|degraded|outage|incident|miss/i.test(s.value ?? ''),
  );
  if (adverse) {
    if ((c.annualSpendUsd ?? 0) > 1_000_000) return 'rebid';
    return 'renegotiate';
  }
  // Spend > $5M with no adverse signal → renegotiate (always pursue
  // leverage on six-figure or larger contracts; never silently renew).
  if ((c.annualSpendUsd ?? 0) > 5_000_000) return 'renegotiate';
  // Otherwise default to renew_as_is when imminent + small + healthy.
  if (daysUntil > 0 && daysUntil < 90 && (c.annualSpendUsd ?? 0) < 250_000) {
    return 'renew_as_is';
  }
  return 'renegotiate';
}

function recommendRationale(
  c: ContractCoverage,
  posture: RenewalPosture,
  daysUntil: number,
  telemetry: ReadonlyArray<TelemetrySignal>,
): string {
  const spendLabel = c.annualSpendUsd ? `$${c.annualSpendUsd.toLocaleString()} annual` : 'spend not recorded';
  switch (posture) {
    case 'renegotiate':
      return `Pursue leverage: ${spendLabel}; methodology §3 Stage 7 — never silently auto-renew a material contract. Use AbarVa benchmark + competitive tension. Adverse telemetry signals: ${telemetry.length === 0 ? 'none recorded' : 'see Telemetry sheet'}.`;
    case 'rebid':
      return `Open the market: ${spendLabel}. Telemetry shows quality/availability concerns; vendor has lost the benefit of the doubt on a renewal.`;
    case 'exit':
      return `Wind down: ${spendLabel}. Coverage overlap or fundamental misfit. Transition plan must precede contract end.`;
    case 'consolidate':
      return `Roll into a larger framework agreement to capture volume leverage. ${spendLabel}.`;
    case 'renew_as_is':
      return `Renew without modification: ${spendLabel}, healthy telemetry, ${daysUntil > 0 ? `renewal in ${daysUntil} days` : 'renewal date not recorded'}.`;
    case 'undetermined':
      return `Substrate gap: insufficient data (spend + renewal + telemetry) to recommend a posture. Load vendor_contracts and operating_telemetry first.`;
  }
}

function recommendAlternative(c: ContractCoverage): string {
  // Placeholder: a future binder can cross-reference d12 shortlist /
  // industry_context. For now we mark the gap honestly.
  return c.category ? `${c.category} category — see dx2 market scan` : '— Not recorded — seed gap';
}

function toSignal(t: TelemetrySignal): RenewalTelemetrySignal {
  // Map a substrate telemetry record into the artifact-facing signal.
  const value = (t.value ?? '').toLowerCase();
  let impact = '—';
  if (/low|poor|degraded|outage|incident|miss/i.test(value)) {
    impact = 'Pushes posture toward rebid / exit.';
  } else if (/high|exceed|outperform/i.test(value)) {
    impact = 'Supports renew_as_is.';
  } else {
    impact = 'Neutral — informational only.';
  }
  return {
    metric: t.metric ?? '— Not recorded — seed gap',
    value: t.value ?? '—',
    source: t.surface ?? 'operating_telemetry',
    impact,
  };
}

function lockedTriggers(): RenewalDecisionTrigger[] {
  return [
    {
      trigger: 'Vendor introduces a new term that materially raises buyer risk',
      ifTrue: 'Flip from renew_as_is → renegotiate. Document the term and the redline.',
    },
    {
      trigger: 'A credible alternative emerges in the dx2 market scan',
      ifTrue: 'Flip renegotiate → rebid when the alternative\'s capability matrix meets the must-have row set.',
    },
    {
      trigger: 'Operating telemetry shows availability or quality miss for 2+ consecutive periods',
      ifTrue: 'Flip renew_as_is → rebid; vendor has lost the benefit of the doubt.',
    },
    {
      trigger: 'A consolidation candidate exists in the contract portfolio',
      ifTrue: 'Flip renegotiate → consolidate when total framework spend > combined standalone spend.',
    },
    {
      trigger: 'Build / partner option becomes cheaper at scale',
      ifTrue: 'Flip rebid → exit (do not source) with a sponsor-signed cost-of-not-doing rationale.',
    },
    {
      trigger: 'Auto-renewal window opens with no explicit posture on file',
      ifTrue: 'Block auto-renewal pending posture decision (methodology §3 Stage 7 — the auto-renewal trap).',
    },
  ];
}
