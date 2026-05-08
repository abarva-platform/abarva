// Source · d16 Scorecard payload binder
//
// Pulls runtime context from the substrate + the upstream artifact
// bodies (d12 vendor shortlist + d17 weight log when authored), and
// produces a typed payload the renderer consumes.
//
// Strategy:
//   1. Vendors — parse vendor names from d12 shortlist body. Each
//      bulleted line is one vendor; truncate at the first em-dash so
//      "Acme — preferred" → "Acme". When d12 isn't authored, fall back
//      to placeholder vendor labels (Vendor A / B / C).
//   2. Criteria + weights — parse d17 weight log when present (looks
//      for "**Criterion:** label · weight: 25%" patterns and table
//      rows). When d17 isn't authored, fall back to a 6-criterion
//      archetype-aware default summing to 100.
//   3. Score guidance — defaults are a standard 1-5 procurement
//      rubric; tenant-level overrides can land later.
//
// Like other binders, this errs on the side of producing SOME content
// rather than blocking the download.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import type {
  ScorecardCriterion,
  ScorecardPayload,
  ScoreGuidanceRow,
} from '../renderers/scorecard';

const DEFAULT_PLACEHOLDER_VENDOR_COUNT = 3;

/** Build the payload from event substrate. */
export function buildScorecardPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): ScorecardPayload {
  const d12 = ctx.artifactStates.find((a) => a.artifactCode === 'd12_vendor_shortlist');
  const d17 = ctx.artifactStates.find((a) => a.artifactCode === 'd17_weight_log');

  const vendors = d12?.body
    ? extractVendorsFromShortlist(d12.body)
    : defaultVendors();
  const criteria = d17?.body
    ? parseCriteriaFromWeightLog(d17.body) ?? defaultCriteriaForArchetype(ctx.event.archetype)
    : defaultCriteriaForArchetype(ctx.event.archetype);

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    roundLabel: undefined,
    criteria,
    vendors,
    scoreGuidance: defaultScoreGuidance(),
  };
}

// ── Vendor extraction ──────────────────────────────────────────────────────

function extractVendorsFromShortlist(md: string): string[] {
  const out: string[] = [];
  for (const line of md.split('\n')) {
    const trimmed = line.trim();
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet || !bullet[1]) continue;
    const head = bullet[1].split(/—|–|-{2}|:|\(/)[0]?.trim() ?? '';
    if (head.length === 0 || head.length > 60) continue;
    if (/disqualified|excluded|removed/i.test(bullet[1])) continue;
    out.push(head);
  }
  return out.length > 0 ? out : defaultVendors();
}

function defaultVendors(): string[] {
  return Array.from({ length: DEFAULT_PLACEHOLDER_VENDOR_COUNT }).map(
    (_, i) => `Vendor ${String.fromCharCode(65 + i)}`,
  );
}

// ── Criteria parsing ───────────────────────────────────────────────────────

function parseCriteriaFromWeightLog(md: string): ScorecardCriterion[] | null {
  const out: ScorecardCriterion[] = [];
  // Pattern A: markdown table | Label | Weight (%) | Description |
  for (const line of md.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    if (cells.length < 2) continue;
    if (/^---/.test(cells[0] ?? '')) continue;
    if (/^(criterion|label|name)$/i.test(cells[0] ?? '')) continue;
    const [label, weightCell, description] = cells;
    if (!label || !weightCell) continue;
    const w = weightCell.match(/(\d+(?:\.\d+)?)/);
    if (!w || !w[1]) continue;
    out.push({
      id: `C-${stableShortHash(label)}`,
      label,
      weightPercent: Math.round(parseFloat(w[1])),
      description: description ?? '',
    });
  }
  if (out.length > 0 && weightsLookValid(out)) return out;
  // Pattern B: inline "**Label**: weight 25%" — best effort
  const inlineRe = /\*\*([^*]+)\*\*\s*[:—-]\s*weight\s*(\d+)%/gi;
  let match: RegExpExecArray | null;
  const inlineOut: ScorecardCriterion[] = [];
  while ((match = inlineRe.exec(md)) !== null) {
    inlineOut.push({
      id: `C-${stableShortHash(match[1]!)}`,
      label: match[1]!.trim(),
      weightPercent: parseInt(match[2]!, 10),
      description: '',
    });
  }
  if (inlineOut.length > 0 && weightsLookValid(inlineOut)) return inlineOut;
  return null;
}

function weightsLookValid(criteria: ScorecardCriterion[]): boolean {
  if (criteria.length === 0) return false;
  const sum = criteria.reduce((acc, c) => acc + c.weightPercent, 0);
  // Allow 1-point rounding tolerance because of integer percent rounding.
  return Math.abs(sum - 100) <= 1;
}

function stableShortHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) & 0xfff_fff;
  }
  return hash.toString(16).slice(0, 5).toUpperCase();
}

// ── Defaults ───────────────────────────────────────────────────────────────

function defaultCriteriaForArchetype(
  archetype: string | null,
): ScorecardCriterion[] {
  const family = (archetype ?? '').toLowerCase();
  // Cloud / infrastructure tilts toward technical fit + transition risk.
  if (family.includes('cloud') || family.includes('infrastructure')) {
    return [
      {
        id: 'C-FUNCTIONAL',
        label: 'Functional fit',
        weightPercent: 15,
        description:
          'Coverage of in-scope applications and platform services as defined by d04 inventory and d05 scope memo.',
      },
      {
        id: 'C-TECHNICAL',
        label: 'Technical fit',
        weightPercent: 25,
        description:
          'Migration approach, target-state architecture, hybrid connectivity, security posture appropriate to the risk profile.',
      },
      {
        id: 'C-OPERATING',
        label: 'Operating model',
        weightPercent: 15,
        description:
          'Run-state operating model — incident management, release governance, change control, FTE blend.',
      },
      {
        id: 'C-PRICING',
        label: 'Pricing & TCO',
        weightPercent: 25,
        description:
          'Normalized 3-year TCO from d19 against the locked assumption set; transition + egress economics.',
      },
      {
        id: 'C-RISK',
        label: 'Risk profile',
        weightPercent: 10,
        description:
          'Open traps from d20, security findings, references, financial stability of the vendor.',
      },
      {
        id: 'C-STRATEGIC',
        label: 'Strategic alignment',
        weightPercent: 10,
        description:
          'Roadmap alignment, partnership posture, ESG / supplier-diversity commitments, value-engineering ideas.',
      },
    ];
  }
  // AMS / managed-services tilts toward operating model + stability.
  if (family.includes('ams') || family.includes('managed')) {
    return [
      {
        id: 'C-FUNCTIONAL',
        label: 'Service-catalog fit',
        weightPercent: 20,
        description: 'Coverage and depth of the service catalog per d04 application tier.',
      },
      {
        id: 'C-OPERATING',
        label: 'Operating model',
        weightPercent: 30,
        description: 'Shift coverage, escalation path, SRE / automation tooling, FTE blend.',
      },
      {
        id: 'C-PRICING',
        label: 'Pricing & TCO',
        weightPercent: 25,
        description: 'Normalized 3-year TCO from d19 + transition uplift.',
      },
      {
        id: 'C-RISK',
        label: 'Risk profile',
        weightPercent: 15,
        description: 'Open traps from d20, security posture, references, financial stability.',
      },
      {
        id: 'C-STRATEGIC',
        label: 'Strategic alignment',
        weightPercent: 10,
        description: 'Innovation roadmap and partnership posture.',
      },
    ];
  }
  // Generic fallback (data, enterprise SW, custom).
  return [
    {
      id: 'C-FUNCTIONAL',
      label: 'Functional fit',
      weightPercent: 25,
      description:
        'Coverage of the requirements catalog (mandatory + optional response items from d11).',
    },
    {
      id: 'C-TECHNICAL',
      label: 'Technical fit',
      weightPercent: 20,
      description: 'Architecture, integration, and security posture appropriate to the scope.',
    },
    {
      id: 'C-OPERATING',
      label: 'Delivery model',
      weightPercent: 15,
      description: 'Implementation methodology, governance, FTE blend.',
    },
    {
      id: 'C-PRICING',
      label: 'Pricing & TCO',
      weightPercent: 25,
      description: 'Normalized 3-year TCO from d19 against the locked assumption set.',
    },
    {
      id: 'C-RISK',
      label: 'Risk profile',
      weightPercent: 10,
      description: 'Open traps from d20, security findings, references, financial stability.',
    },
    {
      id: 'C-STRATEGIC',
      label: 'Strategic alignment',
      weightPercent: 5,
      description: 'Roadmap alignment, value-engineering ideas, ESG commitments.',
    },
  ];
}

function defaultScoreGuidance(): ScoreGuidanceRow[] {
  return [
    {
      score: 1,
      label: 'Does not meet',
      rubric:
        'Material gap against the requirement; would require significant remediation before contract signature. Disqualifying for any criterion weighted ≥ 25%.',
    },
    {
      score: 2,
      label: 'Partially meets',
      rubric:
        'Addresses the requirement but with notable carve-outs, exceptions, or undocumented assumptions. Procurement must accept caveats explicitly.',
    },
    {
      score: 3,
      label: 'Meets',
      rubric:
        'Fully meets the requirement as written. No material exceptions; pricing reflects the locked assumption set without modification.',
    },
    {
      score: 4,
      label: 'Exceeds',
      rubric:
        'Demonstrably exceeds the requirement (better SLA, deeper coverage, lower transition risk) without commensurate cost increase.',
    },
    {
      score: 5,
      label: 'Best in class',
      rubric:
        'Materially differentiated from peers in this submission set; references confirm the differentiation; suitable as a benchmark for future events.',
    },
  ];
}
