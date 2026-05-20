// Source · lifecycle narrative body builders (pure module).
//
// Split out from lifecycle-substrate.ts so unit tests can import the
// body builders without transitively pulling in the context broker
// (which has @azure/* peer deps that fail to resolve in jest under
// some workspace configurations). The substrate loader stays in
// lifecycle-substrate.ts; this module is pure deterministic markdown
// composition.

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';

// ── Substrate view shapes (artifact-facing, duplicated from
//    lifecycle-substrate.ts as types — kept structurally identical
//    so the substrate module can hand its loaded values straight to
//    the body builders without an adapter step). ────────────────────────────

export interface ContractCoverage {
  vendor: string;
  scope: string | null;
  annualSpendUsd: number | null;
  renewalDate: string | null;
  category: string | null;
  status: string | null;
}

export interface LandscapeApp {
  name: string;
  function: string | null;
  hosting: string | null;
  tier: string | null;
  status: string | null;
}

export interface FinancialLine {
  category: string | null;
  amountUsd: number | null;
  notes: string | null;
}

export interface ComplianceObligation {
  framework: string | null;
  requirement: string | null;
  status: string | null;
}

export interface DemandSubstrate {
  contracts: ReadonlyArray<ContractCoverage>;
  landscape: ReadonlyArray<LandscapeApp>;
  financials: ReadonlyArray<FinancialLine>;
}

export interface RiskSubstrate {
  contracts: ReadonlyArray<ContractCoverage>;
  compliance: ReadonlyArray<ComplianceObligation>;
}

export const SEED_GAP_LINE = '— Not recorded — seed gap';

// ── Helpers ────────────────────────────────────────────────────────────────

export function fmtUsd(n: number | null): string {
  if (n == null) return SEED_GAP_LINE;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export function fmtMissing(value: string | null): string {
  return value && value.trim().length > 0 ? value : SEED_GAP_LINE;
}

function namesShareToken(a: string | null, b: string): boolean {
  if (!a) return false;
  const toks = (s: string) =>
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3);
  const aTok = new Set(toks(a));
  for (const t of toks(b)) if (aTok.has(t)) return true;
  return false;
}

// ── Demand Challenge body ──────────────────────────────────────────────────

export function buildDemandChallengeBody(
  ctx: SourceGenerationContext,
  substrate: DemandSubstrate | null,
): string {
  const c = substrate?.contracts ?? [];
  const l = substrate?.landscape ?? [];
  const f = substrate?.financials ?? [];
  const totalAnnualSpend = c.reduce((s, x) => s + (x.annualSpendUsd ?? 0), 0);
  const overlapCandidates = c
    .slice()
    .sort((a, b) => (b.annualSpendUsd ?? 0) - (a.annualSpendUsd ?? 0))
    .slice(0, 5);

  const noSubstrate = c.length === 0 && l.length === 0 && f.length === 0;
  const overlapHits = overlapCandidates.filter((x) =>
    namesShareToken(x.scope ?? x.vendor, ctx.event.name),
  );
  // The verdict union below also includes 'DO_NOTHING' so a future
  // heuristic can emit it; today the deterministic scaffold only
  // chooses among the three below.
  type Verdict = 'PROCEED' | 'RENEGOTIATE_EXISTING' | 'DO_NOTHING' | 'GAP_BLOCKED';
  let verdict: Verdict;
  if (noSubstrate) verdict = 'GAP_BLOCKED' as Verdict;
  else if (overlapHits.length >= 1) verdict = 'RENEGOTIATE_EXISTING' as Verdict;
  else verdict = 'PROCEED' as Verdict;

  const lines: string[] = [];
  lines.push(`# Demand Challenge — ${ctx.event.name}`, '');
  lines.push(`> Stage 0 of the IT sourcing lifecycle. Before any solicitation, this artifact tests whether to source at all. Verdict, then reasoning.`, '');

  lines.push('## Verdict', '');
  switch (verdict) {
    case 'GAP_BLOCKED':
      lines.push(
        '**Recommendation: DO NOT PROCEED yet — substrate gap blocks the challenge.**',
        '',
        'No vendor contract, IT landscape, or IT financial records are recorded for this tenant. Stage 0 cannot honestly answer "do we already own coverage?" without them. Load Setup data (vendor_contracts, it_landscape, it_financials) first.',
        '',
      );
      break;
    case 'RENEGOTIATE_EXISTING':
      lines.push(
        '**Recommendation: RENEGOTIATE the existing contract before issuing a new event.**',
        '',
        `Existing contracts in the portfolio appear to cover material parts of this scope (${overlapHits.map((x) => x.vendor).join(', ')}). A new RFP risks duplicating spend; a renegotiation lane is the higher-EV move.`,
        '',
      );
      break;
    case 'PROCEED':
      lines.push(
        '**Recommendation: PROCEED to Stage 1 with caveats below.**',
        '',
        'No overlap candidate clearly covers this scope. The remaining stage-0 questions (process vs tool, build vs buy vs partner, cost-of-not-doing) must still be answered before solicitation.',
        '',
      );
      break;
    case 'DO_NOTHING':
      lines.push(
        '**Recommendation: DO NOTHING — the cost-of-inaction is below threshold.**',
        '',
        'The substrate evidence does not justify a new sourcing event. Document the reasoning and revisit if signals change.',
        '',
      );
      break;
  }

  lines.push('## 1. Outcome metric', '');
  lines.push(
    `_What business outcome defines success?_  ${fmtMissing(ctx.event.scopeDescription)}`,
    '',
    '_Owner attests the outcome metric is measurable, time-bound, and not a tool feature in disguise._',
    '',
  );

  lines.push('## 2. Existing coverage cross-check', '');
  if (c.length === 0) {
    lines.push(
      `${SEED_GAP_LINE} (no vendor_contracts records loaded for ${ctx.tenantName}). The cross-check cannot honestly be performed until contracts are seeded.`,
      '',
    );
  } else {
    lines.push(
      `Total recorded annual vendor spend: **${fmtUsd(totalAnnualSpend)}** across ${c.length} contract${c.length === 1 ? '' : 's'}.`,
      '',
      'Top coverage candidates ranked by annual spend:',
      '',
      '| Vendor | Scope on file | Annual spend | Renewal | Status |',
      '| --- | --- | --- | --- | --- |',
    );
    for (const row of overlapCandidates) {
      lines.push(
        `| ${row.vendor} | ${fmtMissing(row.scope)} | ${fmtUsd(row.annualSpendUsd)} | ${fmtMissing(row.renewalDate)} | ${fmtMissing(row.status)} |`,
      );
    }
    lines.push('');
  }

  lines.push('## 3. Shelfware + overlap call-outs', '');
  if (overlapHits.length > 0) {
    for (const hit of overlapHits) {
      lines.push(
        `- **${hit.vendor}** — scope overlaps with this event (recorded scope: ${fmtMissing(hit.scope)}). Confirm utilization and contract terms before issuing new solicitation.`,
      );
    }
  } else if (c.length === 0) {
    lines.push(`- ${SEED_GAP_LINE}: cannot evaluate overlap without contract data.`);
  } else {
    lines.push('- No direct overlap candidate identified by name. Continue to Stage 1.');
  }
  lines.push('');

  lines.push('## 4. Build vs buy vs partner — first pass', '');
  lines.push(
    '- **Build** — defensible internal advantage? Engineering capacity?',
    '- **Buy** — mature commodity market? Pricing benchmarks available (Stage 2)?',
    '- **Partner** — SI-led delivery vs direct? Multi-vendor split?',
    '',
    `_${verdict === 'GAP_BLOCKED' ? 'Substrate gap blocks an evidence-grounded recommendation.' : 'Provide rationale per option before selecting one in Stage 1.'}_`,
    '',
  );

  lines.push('## 5. Is the real gap a TOOL gap or a PROCESS gap?', '');
  lines.push(
    'Tools do not fix process. Buyer attests this is a tool gap with a named owner that survives a one-week pause if the tool slipped.',
    '',
    `Owner: ${fmtMissing(ctx.event.owner)}.`,
    '',
  );

  lines.push('## 6. Cost of NOT sourcing', '');
  const evUsd = ctx.event.estimatedValueUsd;
  lines.push(
    `- Stated value-at-stake: ${fmtUsd(evUsd)}`,
    `- IT financial baseline rows recorded: ${f.length} ${f.length === 0 ? `(${SEED_GAP_LINE})` : ''}`,
    f.length > 0
      ? `- Top IT financial line: ${f[0]?.category ?? SEED_GAP_LINE} = ${fmtUsd(f[0]?.amountUsd ?? null)}`
      : '',
    '',
    '_"Do nothing" is a real option whenever the named cost-of-inaction is non-material vs the recorded baseline._',
    '',
  );

  lines.push('## 7. Named traps avoided', '');
  lines.push(
    '- Reactive order-taking (a stakeholder named a vendor before this challenge ran).',
    '- Tool sourced for a process gap.',
    '- Renewal opportunity missed — existing contract not surveyed.',
    '- 20–40% shelfware/redundant spend on the books ignored (methodology §3 Stage 0).',
    '',
  );

  lines.push('---', '', `_Drafted by AbarVa Sentinel · grounded in tenant substrate. Empty rows that read "${SEED_GAP_LINE}" indicate the relevant Setup data is not yet recorded; the verdict above does not invent figures._`);

  return lines.join('\n');
}

// ── Sourcing Approach body ──────────────────────────────────────────────────

export function buildSourcingApproachBody(
  ctx: SourceGenerationContext,
  substrate: DemandSubstrate | null,
): string {
  const c = substrate?.contracts ?? [];
  const archetype = ctx.event.archetype ?? null;
  const rigor = ctx.event.rigor ?? null;
  const isAiCategory = /\bai\b|copilot|llm|model|gen\b/i.test(ctx.event.name);
  const isInfrastructure = /cloud|infrastructure|platform/i.test(archetype ?? '');
  const isAms = /ams|managed/i.test(archetype ?? '');

  let solicitationLane: 'RFI' | 'RFP' | 'RFQ' | 'direct_award';
  let commercialModel:
    | 'fixed'
    | 'time_and_materials'
    | 'outcome'
    | 'consumption_capped';
  const vendorPosture: 'single_vendor' | 'multi_vendor' | 'undetermined' =
    c.length >= 1 ? 'multi_vendor' : 'undetermined';

  if (rigor === 'strategic' || rigor === 'enhanced') {
    solicitationLane = 'RFP';
  } else if (c.length === 0) {
    solicitationLane = 'RFI';
  } else {
    solicitationLane = 'RFP';
  }
  if (isAiCategory) {
    commercialModel = 'consumption_capped';
  } else if (isInfrastructure) {
    commercialModel = 'consumption_capped';
  } else if (isAms) {
    commercialModel = 'outcome';
  } else {
    commercialModel = 'fixed';
  }

  const lines: string[] = [];
  lines.push(`# Sourcing Approach — ${ctx.event.name}`, '');
  lines.push(
    `> Stage 1 of the IT sourcing lifecycle. With Stage 0 (Demand Challenge) cleared, this artifact picks the solicitation lane, the commercial model, the vendor posture, and the SI lane — with the rationale named so an expert reviewer can challenge.`,
    '',
  );

  lines.push('## Recommendation', '');
  lines.push(
    `- **Solicitation:** ${describeSolicitationLane(solicitationLane)}`,
    `- **Commercial model:** ${describeCommercialModel(commercialModel)}`,
    `- **Vendor posture:** ${describeVendorPosture(vendorPosture)}`,
    `- **SI lane:** ${describeSiLane(archetype)}`,
    '',
  );

  lines.push('## 1. Solicitation lane rationale', '');
  lines.push(
    `Selected: **${solicitationLane}**. ${rigorRationale(rigor)}`,
    '',
    `Substrate signal: ${c.length} vendor_contracts row${c.length === 1 ? '' : 's'} on file for this tenant${c.length === 0 ? ` (${SEED_GAP_LINE})` : ''}.`,
    '',
  );

  lines.push('## 2. Commercial model rationale', '');
  lines.push(
    `Selected: **${commercialModel}**.`,
    '',
    commercialModelRationale(commercialModel),
    '',
  );

  lines.push('## 3. Vendor posture', '');
  lines.push(
    `Selected: **${vendorPosture}**.`,
    '',
    vendorPostureRationale(vendorPosture),
    '',
  );

  lines.push('## 4. SI / delivery lane', '');
  lines.push(
    describeSiLane(archetype),
    '',
    `Tenant archetype: ${fmtMissing(archetype)}.`,
    '',
  );

  lines.push('## 5. Named traps avoided', '');
  lines.push(
    '- Defaulting to an RFP when an RFI is the right discovery lane.',
    '- Accepting consumption pricing without a cap or predictability clause (methodology §6).',
    '- Sole-source by default — without competitive tension the vendor wins the negotiation before it starts.',
    '- SI lane assumed identical to vendor lane — they are separate commercial decisions.',
    '',
  );

  lines.push('---', '', `_Drafted by AbarVa Sentinel. Grounded in event metadata + tenant substrate; "${SEED_GAP_LINE}" lines mark where Setup data needs to be loaded before Stage 1 can lock._`);

  return lines.join('\n');
}

function describeSolicitationLane(l: 'RFI' | 'RFP' | 'RFQ' | 'direct_award'): string {
  switch (l) {
    case 'RFI':
      return 'RFI — market discovery first; convert to RFP only if 2+ credible candidates surface.';
    case 'RFP':
      return 'RFP — full solicitation; scoring rubric locked at d05 / d16 before responses arrive.';
    case 'RFQ':
      return 'RFQ — scope is fully known and the only variable is price.';
    case 'direct_award':
      return 'Direct award — only with documented sole-source justification.';
  }
}

function describeCommercialModel(
  m: 'fixed' | 'time_and_materials' | 'outcome' | 'consumption_capped',
): string {
  switch (m) {
    case 'fixed':
      return 'Fixed-price — scope locked, vendor carries delivery risk.';
    case 'time_and_materials':
      return 'T&M with not-to-exceed cap + phase gate.';
    case 'outcome':
      return 'Outcome-based — vendor paid against named availability / quality outcomes.';
    case 'consumption_capped':
      return 'Consumption with hard cap, 80% alerting, predictable ceiling.';
  }
}

function describeVendorPosture(
  p: 'single_vendor' | 'multi_vendor' | 'undetermined',
): string {
  switch (p) {
    case 'single_vendor':
      return 'Single-vendor — sole-source justification required.';
    case 'multi_vendor':
      return 'Multi-vendor — split delivery risk, preserve renewal tension.';
    case 'undetermined':
      return `Undetermined — ${SEED_GAP_LINE}.`;
  }
}

function describeSiLane(archetype: string | null): string {
  const a = (archetype ?? '').toLowerCase();
  if (a.includes('ams') || a.includes('managed')) {
    return 'SI: hybrid (onshore lead + offshore depth). Define KT, shift coverage, and exit RTO in d05.';
  }
  if (a.includes('cloud') || a.includes('infrastructure')) {
    return 'SI: hyperscaler-aligned partner with named landing-zone reference. Cap discovery + design at fixed price; build phase consumption-capped.';
  }
  return 'SI: confirm whether buyer-side delivery exists in-house, or whether an SI lane is mandatory. Document either way.';
}

function rigorRationale(rigor: string | null): string {
  if (rigor === 'strategic') {
    return 'Event rigor is strategic — full RFP with scorecard, weight log, and decision brief is required.';
  }
  if (rigor === 'enhanced') {
    return 'Event rigor is enhanced — RFP with scorecard. RFI can be skipped only if 2+ credible vendors are already known.';
  }
  if (rigor === 'standard') {
    return 'Event rigor is standard — RFI is the lowest-friction discovery lane. Convert to RFP only on credible vendor signal.';
  }
  return `Event rigor not recorded (${SEED_GAP_LINE}). Default to RFI until rigor is set.`;
}

function commercialModelRationale(
  m: 'fixed' | 'time_and_materials' | 'outcome' | 'consumption_capped',
): string {
  switch (m) {
    case 'consumption_capped':
      return '_Consumption pricing without a ceiling is the AI-frontier trap (methodology §6). Require a hard monthly cap, alerting at 80%, and a predictable annualized ceiling in the RFP._';
    case 'outcome':
      return '_Outcome-based for AMS scope ties vendor incentive to availability/quality, not to FTE billings. Define the outcome metric in the d05 scope memo before issuing._';
    case 'time_and_materials':
      return '_T&M is the right answer only when scope is genuinely ambiguous. Cap T&M with a not-to-exceed and a phase gate._';
    case 'fixed':
      return '_Fixed-price keeps the vendor on the hook for delivery scope. Use only when scope is materially locked at d05._';
  }
}

function vendorPostureRationale(
  p: 'single_vendor' | 'multi_vendor' | 'undetermined',
): string {
  switch (p) {
    case 'single_vendor':
      return '_Sole-source only with sponsor-signed justification on file. Concentration risk is a Stage 6 follow-up._';
    case 'multi_vendor':
      return '_Multi-vendor splits delivery risk and preserves competitive tension at renewal. Confirm integration overhead is acceptable._';
    case 'undetermined':
      return `_${SEED_GAP_LINE} — confirm posture before issuing solicitation._`;
  }
}

// ── Vendor Risk Pack body ──────────────────────────────────────────────────

export function buildVendorRiskBody(
  ctx: SourceGenerationContext,
  substrate: RiskSubstrate | null,
): string {
  const c = substrate?.contracts ?? [];
  const obligations = substrate?.compliance ?? [];
  const totalSpend = c.reduce((s, x) => s + (x.annualSpendUsd ?? 0), 0);
  const topVendor =
    c.slice().sort((a, b) => (b.annualSpendUsd ?? 0) - (a.annualSpendUsd ?? 0))[0] ?? null;
  const concentrationPct =
    totalSpend > 0 && topVendor?.annualSpendUsd != null
      ? Math.round(((topVendor.annualSpendUsd ?? 0) / totalSpend) * 100)
      : null;

  const lines: string[] = [];
  lines.push(`# Vendor Risk Pack — ${ctx.event.name}`, '');
  lines.push(
    '> Stage 6 of the IT sourcing lifecycle. Risk lens before signature: security, financial viability, concentration, fourth-party (sub-processor), MRM. Grounded against compliance + vendor_contracts.',
    '',
  );

  let posture: 'PROCEED' | 'PROCEED_WITH_CONDITIONS' | 'HOLD';
  if (c.length === 0 && obligations.length === 0) posture = 'HOLD';
  else if ((concentrationPct ?? 0) >= 35) posture = 'PROCEED_WITH_CONDITIONS';
  else posture = 'PROCEED';

  lines.push('## Risk posture', '');
  switch (posture) {
    case 'HOLD':
      lines.push(
        '**Recommendation: HOLD — substrate is too thin to attest.**',
        '',
        `No vendor_contracts or compliance records on file for ${ctx.tenantName}. Cannot honestly assert "fourth-party risk is mapped" or "concentration is acceptable" without them.`,
        '',
      );
      break;
    case 'PROCEED_WITH_CONDITIONS':
      lines.push(
        '**Recommendation: PROCEED with named conditions.**',
        '',
        `Top vendor concentration is ${concentrationPct}% of recorded contract spend. Concentration risk requires a documented contingency before signature.`,
        '',
      );
      break;
    case 'PROCEED':
      lines.push(
        '**Recommendation: PROCEED with standard controls.**',
        '',
        'Vendor portfolio shows no single-vendor concentration above the 35% threshold. Continue with the security + financial viability checklists below.',
        '',
      );
      break;
  }

  lines.push('## 1. Security review', '');
  lines.push(
    '- SOC 2 Type II / ISO 27001 attestation current within 12 months.',
    '- Pen-test report executive summary within last 12 months.',
    '- Data-flow diagram covering all data classes the vendor will touch.',
    '- Sub-processor list with named providers and data-residency map.',
    '- Encryption in transit + at rest; KMS posture.',
    '- Identity (SSO + SCIM); break-glass admin path.',
    '',
    obligations.length === 0
      ? `Compliance substrate: ${SEED_GAP_LINE}.`
      : `Compliance frameworks on file (${obligations.length}):`,
    '',
  );
  if (obligations.length > 0) {
    lines.push('| Framework | Requirement | Status |', '| --- | --- | --- |');
    for (const o of obligations.slice(0, 8)) {
      lines.push(
        `| ${fmtMissing(o.framework)} | ${fmtMissing(o.requirement)} | ${fmtMissing(o.status)} |`,
      );
    }
    lines.push('');
  }

  lines.push('## 2. Financial viability', '');
  lines.push(
    '- Audited financial statements (last 2 FY) reviewed.',
    '- Revenue concentration: vendor reliant on a single customer >25%?',
    '- Runway / cash-burn for venture-backed vendors.',
    '- Going-concern opinion / qualifications.',
    '- M&A signals: open or rumored acquisition that could disrupt the contract.',
    '',
  );

  lines.push('## 3. Concentration risk (buyer side)', '');
  if (c.length === 0) {
    lines.push(`${SEED_GAP_LINE}: cannot evaluate buyer-side concentration without vendor_contracts.`, '');
  } else {
    lines.push(
      `Total annual recorded spend across portfolio: **${fmtUsd(totalSpend)}**.`,
      `Top vendor: **${topVendor?.vendor ?? SEED_GAP_LINE}** at ${fmtUsd(topVendor?.annualSpendUsd ?? null)} (${concentrationPct == null ? SEED_GAP_LINE : `${concentrationPct}%`} of portfolio).`,
      '',
      'Concentration threshold of concern: 25% (caution) / 35% (must mitigate).',
      '',
    );
  }

  lines.push('## 4. Fourth-party / sub-processor risk', '');
  lines.push(
    '- Sub-processor list disclosed in contract (clause checked at d25-equivalent / dx6a).',
    '- Sub-processor changes require notice + right to terminate without penalty.',
    '- Vendor reliance on Anthropic / OpenAI / hyperscaler is itself a concentration risk the buyer inherits (methodology §6).',
    '',
  );

  lines.push('## 5. MRM (Model Risk Management) screen — AI-bearing vendors only', '');
  lines.push(
    `Applies to this event: ${/ai|model|llm|copilot/i.test(ctx.event.name) ? 'YES — apply checklist below.' : 'No AI indicator in event name. Skip unless scope confirms otherwise.'}`,
    '',
    '- Model validation evidence at procurement time.',
    '- Continuous monitoring; drift alerts.',
    '- Human-in-loop boundary defined for the use case.',
    '- Eval rights / benchmark right / no gag clause.',
    '',
  );

  lines.push('## 6. Named traps avoided', '');
  lines.push(
    '- Concentration risk not measured because no portfolio view existed.',
    '- Sub-processor list not enumerated — buyer inherits dependencies invisibly.',
    '- AI model risk treated as a software vendor risk.',
    '- Security review = SOC 2 cover page; no actual control mapping.',
    '',
  );

  lines.push('---', '', `_Drafted by AbarVa Sentinel. Grounded in vendor_contracts + compliance substrate; lines reading "${SEED_GAP_LINE}" mark missing Setup data._`);
  return lines.join('\n');
}
