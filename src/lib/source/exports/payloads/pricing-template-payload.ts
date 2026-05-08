// Source · d19a Pricing Template payload binder
//
// Pulls runtime context from the substrate + the upstream artifact
// bodies (d05 scope memo, d21 assumption set when present), and
// produces a typed payload the renderer consumes.
//
// Two parsing layers:
//   1. Assumption-set parser — best-effort extraction of key/value
//      rows from the d21 markdown body (looks for "**Key:** Value"
//      patterns + table rows). Falls back to a sensible default set
//      when d21 hasn't been authored yet.
//   2. Scope-line-item extractor — parses §1 / In scope of d05 to
//      surface candidate line items. When d05 is sparse, falls back
//      to a small default item list keyed off the event archetype.
//
// Both layers err on the side of producing SOME content rather than
// blocking the download. The renderer warns vendors via the cover-
// sheet instructions when assumptions came from the default set.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  PricingAssumption,
  PricingLineItem,
  PricingTemplatePayload,
} from '../renderers/pricing-template';

const DEFAULT_TCO_YEARS = 3;
const DEFAULT_ESCALATOR = 0.04; // 4% — typical assumption-set default
const DEFAULT_QUANTITY = 1;

/** Build the payload from event substrate. */
export function buildPricingTemplatePayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): PricingTemplatePayload {
  const d05 = ctx.artifactStates.find((a) => a.artifactCode === 'd05_scope_memo');
  const d21 = ctx.artifactStates.find((a) => a.artifactCode === 'd21_assumption_set');

  const assumptions = d21?.body
    ? parseAssumptionsFromMarkdown(d21.body)
    : defaultAssumptions(ctx);
  const lineItems = d05?.body
    ? extractLineItemsFromScopeMemo(d05.body)
    : defaultLineItemsForArchetype(ctx.event.archetype);

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    assumptions,
    lineItems,
    tcoYears: DEFAULT_TCO_YEARS,
    escalator: extractEscalator(assumptions) ?? DEFAULT_ESCALATOR,
  };
}

// ── Assumption parsing ─────────────────────────────────────────────────────

function parseAssumptionsFromMarkdown(md: string): PricingAssumption[] {
  const out: PricingAssumption[] = [];
  // Pattern: **Key:** value · rationale
  const inlineRe = /\*\*([^*]+):\*\*\s+([^\n·]+?)(?:\s*·\s*(.+))?$/gm;
  let match: RegExpExecArray | null;
  while ((match = inlineRe.exec(md)) !== null) {
    out.push({
      key: match[1]!.trim(),
      value: match[2]!.trim(),
      rationale: match[3]?.trim(),
    });
  }
  // Pattern: | Key | Value | Rationale | (markdown table rows; skip headers)
  for (const line of md.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length < 2) continue;
    if (/^---/.test(cells[0] ?? '')) continue;
    if (/^(key|assumption|name)$/i.test(cells[0] ?? '')) continue;
    const [key, value, rationale] = cells;
    if (!key || !value) continue;
    out.push({ key, value, rationale });
  }
  return out.length > 0 ? out : defaultAssumptionsBare();
}

function defaultAssumptions(ctx: SourceGenerationContext): PricingAssumption[] {
  const base = defaultAssumptionsBare();
  const value = ctx.event.estimatedValueUsd;
  if (value && value > 0) {
    base.push({
      key: 'Indicative annual envelope',
      value: `$${value.toLocaleString()}`,
      rationale: 'From event intake; vendors should price independently.',
    });
  }
  return base;
}

function defaultAssumptionsBare(): PricingAssumption[] {
  return [
    {
      key: 'Term horizon',
      value: '3 years (firm)',
      rationale: 'TCO summary computed against a 3-year term.',
    },
    {
      key: 'Annual escalator',
      value: '4.0%',
      rationale: 'Applied to Year 2 + Year 3 in the TCO summary.',
    },
    {
      key: 'FTE blended rate',
      value: '$185 / hour',
      rationale: 'Used to normalize FTE-month line items across vendors.',
    },
    {
      key: 'Currency',
      value: 'USD',
      rationale: 'All vendor pricing must be quoted in USD.',
    },
    {
      key: 'Support coverage',
      value: '24×7×365 for tier-1 incidents',
      rationale: 'Tier-1 = clinical impact (Epic CIS / MyChart / Cloverleaf).',
    },
    {
      key: 'SLA tier expectation',
      value: 'Tier-1 99.9% uptime; tier-2 99.5%',
      rationale: 'Maps to the response-checklist SLA section.',
    },
    {
      key: 'Pricing model',
      value: 'Fixed-fee with documented true-ups',
      rationale: 'T&M and fully consumption-based models require Pricing Notes entry.',
    },
    {
      key: 'Travel & expenses',
      value: 'All-inclusive — no T&E pass-through',
      rationale: 'Vendor proposing T&E pass-through must flag in Pricing Notes.',
    },
  ];
}

function extractEscalator(assumptions: PricingAssumption[]): number | null {
  const row = assumptions.find((a) => /escalator/i.test(a.key));
  if (!row) return null;
  const m = row.value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m || !m[1]) return null;
  return parseFloat(m[1]) / 100;
}

// ── Line-item extraction ───────────────────────────────────────────────────

function extractLineItemsFromScopeMemo(md: string): PricingLineItem[] {
  // Strategy: find the first heading that mentions "in scope", collect
  // bullet lines until the next heading. Each bullet becomes one line
  // item. Bullets that look like sub-categories (no application) are
  // grouped under their nearest "**Section title**" anchor.
  const lines = md.split('\n');
  const items: PricingLineItem[] = [];
  let inInScope = false;
  let currentCategory = 'In-scope service';
  let lineCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s/.test(trimmed)) {
      const isInScope = /\bin\s+scope\b/i.test(trimmed);
      const isOutOfScope = /\bout\s+of\s+scope\b|exclusions?/i.test(trimmed);
      if (isInScope) {
        inInScope = true;
        continue;
      }
      if (inInScope && isOutOfScope) break;
      if (inInScope && /^#{1,3}\s/.test(trimmed)) break;
    }
    if (!inInScope) continue;
    const sectionAnchor = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (sectionAnchor && sectionAnchor[1]) {
      currentCategory = sectionAnchor[1].trim();
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet || !bullet[1]) continue;
    const description = bullet[1].trim();
    items.push({
      id: stableLineId(currentCategory, description, lineCounter++),
      category: currentCategory,
      description,
      unit: inferUnit(currentCategory, description),
      annualQuantity: inferQuantity(description),
    });
  }

  return items.length > 0 ? items : defaultLineItemsForArchetype(null);
}

function stableLineId(
  category: string,
  description: string,
  fallbackIndex: number,
): string {
  // 6-char content hash + index gives a deterministic-ish id without
  // pulling crypto into the renderer hot path.
  const text = `${category}::${description}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) & 0xfff_fff;
  }
  return `L${hash.toString(16).slice(0, 6).toUpperCase()}-${String(fallbackIndex).padStart(2, '0')}`;
}

function inferUnit(category: string, description: string): string {
  const c = category.toLowerCase();
  const d = description.toLowerCase();
  if (/incident|ticket|on-call|24\D{0,2}7/.test(d)) return 'incident-call';
  if (/release|patch|upgrade/.test(d)) return 'release-cycle';
  if (/dr\b|business\s+continuity|drill/.test(d)) return 'event';
  if (/cloverleaf|integration|middleware/.test(d)) return 'FTE-month';
  if (/identity|active\s+directory|azure\s+ad|federation/.test(d)) return 'FTE-month';
  if (/network|transit|vpn|dns/.test(d)) return 'FTE-month';
  if (/storage|compute/.test(d)) return 'unit-month';
  if (/workload/.test(d)) return 'workload-month';
  if (/operating model|ops\b/.test(c)) return 'FTE-month';
  if (/platform/.test(c)) return 'unit-month';
  return 'unit-month';
}

function inferQuantity(description: string): number {
  // Pull a plausible annual quantity. "280 production VMs" → 280×12 = 3360.
  const numericMatch = description.match(/(\d{2,5})/);
  const n = numericMatch ? parseInt(numericMatch[1]!, 10) : DEFAULT_QUANTITY;
  if (/month/.test(description)) return n;
  if (/workload|vm\b|server/.test(description.toLowerCase())) return n * 12;
  return Math.max(n, DEFAULT_QUANTITY);
}

// ── Defaults for events without scope authored ─────────────────────────────

function defaultLineItemsForArchetype(
  archetype: string | null,
): PricingLineItem[] {
  const family = (archetype ?? '').toLowerCase();
  if (family.includes('cloud') || family.includes('infrastructure')) {
    return [
      {
        id: 'L-CMP-01',
        category: 'Platform',
        description: 'Compute (workload-months across in-scope production VMs)',
        unit: 'workload-month',
        annualQuantity: 3360,
      },
      {
        id: 'L-STG-01',
        category: 'Platform',
        description: 'Storage (TB-months, mixed block + object)',
        unit: 'TB-month',
        annualQuantity: 28800,
      },
      {
        id: 'L-NET-01',
        category: 'Platform',
        description: 'Network — transit gateway, hybrid VPN, DNS',
        unit: 'FTE-month',
        annualQuantity: 24,
      },
      {
        id: 'L-IDP-01',
        category: 'Platform',
        description: 'Identity — AD + Azure AD federation',
        unit: 'FTE-month',
        annualQuantity: 12,
      },
      {
        id: 'L-OPS-01',
        category: 'Operating model',
        description: 'L2/L3 incident management 24×7',
        unit: 'incident-call',
        annualQuantity: 24000,
      },
      {
        id: 'L-OPS-02',
        category: 'Operating model',
        description: 'Release management for monthly platform upgrades',
        unit: 'release-cycle',
        annualQuantity: 12,
      },
      {
        id: 'L-OPS-03',
        category: 'Operating model',
        description: 'DR + business continuity (warm-standby region)',
        unit: 'event',
        annualQuantity: 4,
      },
    ];
  }
  if (family.includes('managed') || family.includes('ams')) {
    return [
      {
        id: 'L-INC-01',
        category: 'Operating model',
        description: 'L2/L3 incident management 24×7',
        unit: 'incident-call',
        annualQuantity: 18000,
      },
      {
        id: 'L-REL-01',
        category: 'Operating model',
        description: 'Monthly release / patch management',
        unit: 'release-cycle',
        annualQuantity: 12,
      },
      {
        id: 'L-DEV-01',
        category: 'Application',
        description: 'Minor enhancement bucket (FTE-months)',
        unit: 'FTE-month',
        annualQuantity: 96,
      },
    ];
  }
  return [
    {
      id: 'L-DEFAULT-01',
      category: 'Operating model',
      description: 'Steady-state operations bundle',
      unit: 'FTE-month',
      annualQuantity: 36,
    },
    {
      id: 'L-DEFAULT-02',
      category: 'Operating model',
      description: 'Discretionary enhancement bucket',
      unit: 'FTE-month',
      annualQuantity: 12,
    },
  ];
}
