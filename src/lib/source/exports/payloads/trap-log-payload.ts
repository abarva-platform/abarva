// Source · d20 Pricing Trap Log payload binder
//
// Pulls runtime context from the substrate. Today's strategy:
//   1. If the d20 body has been authored by the user/agent, parse trap
//      rows from it (markdown table or list)
//   2. Otherwise, synthesize a starter set of traps tailored to the
//      event archetype — Sentinel-style baseline that the buyer
//      reviews + extends
//
// The starter set is intentionally archetype-specific because the
// trap categories that matter are very different by sourcing family
// (Cloud → egress, lock-in, transition; AMS → SLA carve-outs; SaaS →
// data-residency, sub-processor list, ToS clauses).

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  TrapLogPayload,
  TrapLogRow,
  TrapSeverityDefinition,
} from '../renderers/trap-log';

export function buildTrapLogPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): TrapLogPayload {
  const d20 = ctx.artifactStates.find((a) => a.artifactCode === 'd20_trap_log');
  const rows = d20?.body
    ? parseTrapsFromMarkdown(d20.body)
    : defaultTrapsForArchetype(ctx.event.archetype);

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    severityDefinitions: defaultSeverityDefinitions(),
    rows,
  };
}

function defaultSeverityDefinitions(): TrapSeverityDefinition[] {
  return [
    {
      severity: 'P0',
      label: 'Deal-shaping',
      rubric:
        'Materially changes TCO or risk posture by ≥ 15% if accepted. Cannot be left unresolved at sponsor sign-off — every P0 must have a documented resolution before d24 (decision brief).',
    },
    {
      severity: 'P1',
      label: 'Material',
      rubric:
        'Adjusts TCO or risk by 3-15%, or introduces a meaningful operational/security obligation. Should be addressed via BAFO question or vendor clarification before contract signature.',
    },
    {
      severity: 'P2',
      label: 'Noted',
      rubric:
        'Surfaced for transparency but does not require a vendor response. Recorded so the panel has visibility; resolution may be "Accepted as written" without further action.',
    },
  ];
}

function parseTrapsFromMarkdown(md: string): TrapLogRow[] {
  // Look for markdown-table rows: | T-ID | P0 | Category | Description | ... |
  const out: TrapLogRow[] = [];
  let counter = 1;
  for (const line of md.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 4) continue;
    if (/^---/.test(cells[0] ?? '')) continue;
    if (/^(trap|id|severity)/i.test(cells[0] ?? '')) continue;
    const idCell = cells[0] ?? '';
    if (!/^T[-_]/i.test(idCell)) continue;
    const sev = ((cells[1] ?? '').toUpperCase().match(/P[012]/)?.[0] as
      | 'P0'
      | 'P1'
      | 'P2'
      | undefined) ?? 'P2';
    out.push({
      id: idCell,
      severity: sev,
      category: cells[2] ?? '',
      description: cells[3] ?? '',
      surfacedFor: cells[4] ?? 'all',
      surfacedBy: cells[5] ?? 'Sentinel',
    });
    counter += 1;
  }
  return out.length > 0 ? out : defaultTrapsForArchetype(null);
}

function defaultTrapsForArchetype(archetype: string | null): TrapLogRow[] {
  const family = (archetype ?? '').toLowerCase();
  if (family.includes('cloud') || family.includes('infrastructure')) {
    return [
      {
        id: 'T-EGRESS-01',
        severity: 'P0',
        category: 'Egress',
        description:
          'Egress charges at steady state will exceed the d21 assumption-set $0.05/GB ceiling. Vendor proposed pricing assumes $0.09/GB after migration cutover.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-LOCKIN-01',
        severity: 'P0',
        category: 'Lock-in',
        description:
          'Vendor proprietary services (e.g. their PaaS-managed integration tier) are part of the proposed scope but require >12-month exit lead time with material data-extraction cost.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-TRANS-01',
        severity: 'P1',
        category: 'Transition',
        description:
          'Cutover plan assumes a 4-day weekend window for tier-1 systems; the d05 scope memo locks at 16h max for Epic CIS / MyChart.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-SLA-01',
        severity: 'P1',
        category: 'SLA carve-out',
        description:
          'Vendor SLA excludes "scheduled maintenance" windows totaling > 8h/month. Net effective uptime is below the d21 99.9% tier-1 target.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-FX-01',
        severity: 'P2',
        category: 'FX exposure',
        description:
          'Pricing locked in USD; any operations team in non-USD regions exposed to FX swings. Assumption set defaults to all-USD; vendor may offer hedging.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-AUDIT-01',
        severity: 'P2',
        category: 'Audit access',
        description:
          'Vendor audit-rights clause caps third-party auditor access to 2 days/year at vendor expense. Buyer compliance team typically expects 5 days + vendor reimbursement.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
    ];
  }
  if (family.includes('ams') || family.includes('managed')) {
    return [
      {
        id: 'T-SHIFT-01',
        severity: 'P0',
        category: 'Shift coverage',
        description:
          '24×7 SLA assumes follow-the-sun coverage but vendor staffing plan shows < 2 FTE in the Asia window. P0 incidents in that window will breach response SLA.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
      {
        id: 'T-SCOPE-01',
        severity: 'P1',
        category: 'Scope boundary',
        description:
          'Vendor scope excludes "knowledge transfer at exit" — buyer will pay separately for runbook handover at contract end.',
        surfacedFor: 'all',
        surfacedBy: 'Sentinel',
      },
    ];
  }
  return [
    {
      id: 'T-DEFAULT-01',
      severity: 'P1',
      category: 'Scope boundary',
      description:
        'No archetype-specific traps defined — author the trap log directly via the canvas, or accept this default placeholder.',
      surfacedFor: 'all',
      surfacedBy: 'Sentinel',
    },
  ];
}
