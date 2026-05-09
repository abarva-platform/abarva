// Source · d04 App Inventory payload binder
//
// Pulls runtime context from the substrate + the upstream artifact
// bodies (d05 scope memo when authored), and produces a typed payload
// the renderer consumes.
//
// Strategy:
//   1. Tier definitions — defaults are a sensible 3-tier rubric. Future
//      slice can read tier definitions from a tenant-level config when
//      one exists (Meridian's clinical tier-1 definition differs from
//      Apex's retail tier-1 definition).
//   2. Inventory rows — best-effort parse of d05 scope memo bullets.
//      Each "**Section**" heading becomes a hosting/category hint, each
//      bullet becomes one candidate row with tier=0 (unclassified). The
//      buyer reviews + tiers them after download. When d05 isn't
//      authored, falls back to a small archetype-keyed default.
//
// Like the d19 binder, this errs on the side of producing SOME content
// rather than blocking the download.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  AppInventoryPayload,
  AppInventoryRow,
  AppInventoryTierDefinition,
} from '../renderers/app-inventory';

/** Build the payload from event substrate. */
export function buildAppInventoryPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): AppInventoryPayload {
  const d05 = ctx.artifactStates.find((a) => a.artifactCode === 'd05_scope_memo');

  const rows = d05?.body
    ? extractInventoryRowsFromScopeMemo(d05.body)
    : defaultInventoryRowsForArchetype(ctx.event.archetype);

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    tierDefinitions: defaultTierDefinitions(),
    rows,
  };
}

// ── Tier definitions ───────────────────────────────────────────────────────

function defaultTierDefinitions(): AppInventoryTierDefinition[] {
  return [
    {
      tier: 1,
      label: 'Mission-critical',
      criterion:
        'Outage halts revenue-generating operations or directly impacts customers / patients / regulatory commitments. 24×7 support required.',
      recoveryObjective: 'RTO < 4h · RPO < 15m · 99.9% uptime',
      examples:
        'Clinical / patient-facing systems, payment processing, core banking, real-time integration middleware.',
    },
    {
      tier: 2,
      label: 'Important',
      criterion:
        'Outage degrades operations but does not stop them; revenue or productivity loss within hours. Business-hours support sufficient.',
      recoveryObjective: 'RTO < 24h · RPO < 4h · 99.5% uptime',
      examples:
        'Internal ITSM, knowledge bases, batch reporting, secondary integration paths.',
    },
    {
      tier: 3,
      label: 'Standard',
      criterion:
        'Outage causes inconvenience or back-office productivity loss; tolerable for days. Best-effort support.',
      recoveryObjective: 'RTO < 72h · RPO < 24h · 99% uptime',
      examples:
        'Internal collaboration tools, archive systems, low-volume utility scripts.',
    },
  ];
}

// ── Inventory row extraction ───────────────────────────────────────────────

function extractInventoryRowsFromScopeMemo(md: string): AppInventoryRow[] {
  const lines = md.split('\n');
  const rows: AppInventoryRow[] = [];
  let inInScope = false;
  let currentSection = 'In-scope';
  let counter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s/.test(trimmed)) {
      const isInScope = /\bin\s+scope\b/i.test(trimmed);
      const isOutOfScope = /\bout\s+of\s+scope\b|exclusions?/i.test(trimmed);
      if (isInScope) {
        inInScope = true;
        continue;
      }
      if (inInScope && (isOutOfScope || /^#{1,3}\s/.test(trimmed))) break;
    }
    if (!inInScope) continue;
    const sectionAnchor = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (sectionAnchor && sectionAnchor[1]) {
      currentSection = sectionAnchor[1].trim();
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet || !bullet[1]) continue;
    const description = bullet[1].trim();
    const name = extractAppName(description);
    if (!name) continue;
    rows.push({
      id: stableAppId(name, counter++),
      name,
      tier: inferTier(description),
      owner: '', // buyer fills
      techStack: extractTechStack(description),
      hostingToday: currentSection,
      annualWorkloadCount: extractWorkloadCount(description),
      inScope: true,
      notes: description,
    });
  }
  return rows.length > 0 ? rows : defaultInventoryRowsForArchetype(null);
}

function extractAppName(description: string): string {
  // Strategies:
  // 1. "Epic CIS — clinical info system" → "Epic CIS"
  // 2. "MyChart — patient portal" → "MyChart"
  // 3. "ServiceNow ITSM (ticketing + CMDB)" → "ServiceNow ITSM"
  // 4. "In-house Java apps (~40)" → "In-house Java apps"
  const firstClause = description.split(/—|–|-{2}|:|\(/)[0]?.trim() ?? '';
  if (firstClause.length > 0 && firstClause.length < 60) return firstClause;
  return description.slice(0, 56).trim();
}

function stableAppId(name: string, counter: number): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xfff_fff;
  }
  return `A-${hash.toString(16).slice(0, 5).toUpperCase()}-${String(counter).padStart(2, '0')}`;
}

function inferTier(description: string): 1 | 2 | 3 | 0 {
  const d = description.toLowerCase();
  if (/tier[\s-]?1|tier[\s-]?one|mission[\s-]?critical|24\D{0,2}7/.test(d)) return 1;
  if (/tier[\s-]?2|tier[\s-]?two|important/.test(d)) return 2;
  if (/tier[\s-]?3|tier[\s-]?three|standard/.test(d)) return 3;
  return 0;
}

function extractTechStack(description: string): string {
  // Look for parenthesized clauses or "stack:" hints.
  const paren = description.match(/\(([^)]+)\)/);
  if (paren && paren[1]) return paren[1].trim();
  return '';
}

function extractWorkloadCount(description: string): number {
  const m = description.match(/(\d{2,5})\s*(VMs?|workloads?|incidents?|tickets?|users?|applications?|servers?)/i);
  if (m && m[1]) return parseInt(m[1], 10);
  return 0;
}

// ── Defaults for events without scope authored ─────────────────────────────

function defaultInventoryRowsForArchetype(
  archetype: string | null,
): AppInventoryRow[] {
  const family = (archetype ?? '').toLowerCase();
  if (family.includes('cloud') || family.includes('infrastructure')) {
    return [
      {
        id: 'A-PLATFORM-01',
        name: 'Compute platform',
        tier: 1,
        owner: '',
        techStack: 'Mixed VMs / containers',
        hostingToday: 'On-premises colo',
        annualWorkloadCount: 0,
        inScope: true,
        notes: 'Sized at scope-memo authoring; vendor confirms via discovery.',
      },
      {
        id: 'A-PLATFORM-02',
        name: 'Storage platform',
        tier: 1,
        owner: '',
        techStack: 'Block + object',
        hostingToday: 'On-premises colo',
        annualWorkloadCount: 0,
        inScope: true,
        notes: 'Migration target; egress pricing in d20 trap log.',
      },
      {
        id: 'A-PLATFORM-03',
        name: 'Identity / directory',
        tier: 1,
        owner: '',
        techStack: 'AD + cloud IdP',
        hostingToday: 'On-premises + SaaS',
        annualWorkloadCount: 0,
        inScope: true,
      },
    ];
  }
  if (family.includes('ams') || family.includes('managed')) {
    return [
      {
        id: 'A-AMS-01',
        name: 'Application portfolio',
        tier: 1,
        owner: '',
        techStack: 'Mixed',
        hostingToday: 'Existing AMS contract',
        annualWorkloadCount: 0,
        inScope: true,
      },
    ];
  }
  return [
    {
      id: 'A-DEFAULT-01',
      name: 'Application 1',
      tier: 0,
      owner: '',
      techStack: '',
      hostingToday: '',
      annualWorkloadCount: 0,
      inScope: true,
      notes: 'Replace with real applications; classify tier per Sheet 2.',
    },
  ];
}
