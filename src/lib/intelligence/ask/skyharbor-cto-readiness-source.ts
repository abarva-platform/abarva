import {
  buildSkyHarborCtoReadinessPacket,
  type ClaimMaturityEntry,
  type SkyHarborCtoReadinessPacket,
} from '@/lib/intelligence/skyharbor-cto-readiness';
import type { AskSource } from './types';

const SKYHARBOR_KEYS = new Set([
  'skyharbor',
  'skyharbor-air',
  'skyharbor-air-group',
  'skyharbor air',
  'skyharbor air group',
]);

const CTO_READINESS_TERMS = [
  /\birops\b/i,
  /\birregular\s+ops\b/i,
  /\bdisruption\b/i,
  /\brecovery\b/i,
  /\bcrew\b/i,
  /\bpnr\b/i,
  /\bpassenger\s+re-?accommodation\b/i,
  /\bagentic\b/i,
  /\bautonomous\b/i,
  /\bcto\b/i,
  /\bai\s+(?:readiness|investment|investments|scale|portfolio|initiative|initiatives)\b/i,
  /\bmodel[-\s]?risk\b/i,
  /\bdata\s+(?:readiness|freshness|lineage|certification|certified)\b/i,
  /\bboard[-\s]?grade\b/i,
  /\bboard[-\s]?ready\b/i,
  /\bboard\s+decision\b/i,
  /\bboard\s+guidance\b/i,
  /\bevidence\s+gaps?\b/i,
  /\bbefore\s+(?:a\s+)?board\b/i,
];

function normalizeTenantKey(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isSkyHarborTenantKey(value: string | null | undefined): boolean {
  const normalized = normalizeTenantKey(value);
  return SKYHARBOR_KEYS.has(normalized) || normalized.includes('skyharbor');
}

export function isSkyHarborCtoReadinessQuestion(query: string): boolean {
  const normalized = String(query ?? '').trim();
  if (!normalized) return false;
  return CTO_READINESS_TERMS.some((term) => term.test(normalized));
}

function listValues(rows: Array<Record<string, string>>, key: string, limit: number): string {
  return rows
    .map((row) => row[key])
    .filter(Boolean)
    .slice(0, limit)
    .join('; ');
}

function formatClaimMaturity(claims: ClaimMaturityEntry[]): string {
  return claims
    .map((claim) => `- ${claim.statement} Confidence: ${claim.confidence}. Signoff required: ${claim.signoffRequired ? 'yes' : 'no'}. Basis: ${claim.basis}`)
    .join('\n');
}

export function formatSkyHarborCtoReadinessSourceDetail(packet: SkyHarborCtoReadinessPacket): string {
  return [
    'SkyHarbor airline CTO readiness context for IROPS, disruption recovery, and agentic AI scaling.',
    '',
    `Recommended decision posture: ${packet.decision.replace(/_/g, ' ')}.`,
    `Value mechanism: ${packet.valueMechanism}`,
    '',
    'Known SkyHarbor context:',
    `- IROPS-critical systems: ${listValues(packet.systems, 'system_name', 8)}.`,
    `- Critical data assets and integrations: ${listValues(packet.dataAssets, 'data_asset_name', 10)}.`,
    `- AI initiatives: ${listValues(packet.aiInitiatives, 'use_case', 8)}.`,
    `- Modernization programs: ${listValues(packet.programs, 'record_name', 8)}.`,
    `- Open risks and controls: ${listValues(packet.risksControls, 'risk_or_control', 8)}.`,
    '',
    'Board decision readiness spine:',
    '- Finance baseline: disruption-cost baseline and realized-value proof are required before board-grade value claims.',
    '- Data certification: crew legality, PNR/reservation events, flight status, operational event store, and recovery history need owner-signed freshness and lineage.',
    '- Control evidence: model-risk tiering, human-in-loop workflow, override logs, and accountable control owners must be explicit.',
    '- Vendor/system linkage: critical platform support, SLAs, and integration dependencies must be tied to the IROPS operating path.',
    '- Adoption/value proof: usage, decision latency, override rate, and realized operational value need measured evidence.',
    '',
    'Missing evidence to make claims board-grade:',
    packet.missingEvidenceChecklist.map((item) => `- ${item}`).join('\n'),
    '',
    'Planning assumptions allowed only when clearly labeled:',
    packet.planningAssumptions.map((item) => `- ${item}`).join('\n'),
    '',
    'Claim maturity:',
    formatClaimMaturity(packet.claimMaturity),
  ].join('\n');
}

export function buildSkyHarborCtoReadinessSource(query: string, tenantKeys: Array<string | null | undefined>): AskSource | null {
  if (!tenantKeys.some(isSkyHarborTenantKey)) return null;
  if (!isSkyHarborCtoReadinessQuestion(query)) return null;
  const packet = buildSkyHarborCtoReadinessPacket();
  return {
    type: 'TENANT',
    id: 'skyharbor-cto-readiness',
    name: 'SkyHarbor CTO IROPS readiness context',
    detail: formatSkyHarborCtoReadinessSourceDetail(packet),
    confidence: 0.92,
  };
}

export function buildSkyHarborCtoReadinessPromptAddendum(query: string, tenantKeys: Array<string | null | undefined>): string {
  if (!tenantKeys.some(isSkyHarborTenantKey) || !isSkyHarborCtoReadinessQuestion(query)) return '';
  return [
    'SKYHARBOR CTO DEMO MODE:',
    'For SkyHarbor airline IROPS, disruption recovery, AI investment, autonomous recovery, data-readiness, and board-grade questions, act as a senior airline CTO advisor.',
    'The user-visible advisor identity is aVa. Do not mention Sentinel or other legacy agent names.',
    'Lead with a direct point of view. Make the distinction between known SkyHarbor context, planning assumptions, industry context, and client-signoff-required claims in natural executive language.',
    'Do not claim exact ROI or board-grade value unless Finance-approved value is provided. If precision is missing, ask for values or permission to use planning assumptions.',
    'When useful, author right-canvas tabs using the marker grammar. Prefer these labels: Decision, Visual, Evidence, Assumptions. The Visual tab may use a Markdown table for a readiness matrix, value/readiness quadrant, roadmap, or evidence checklist.',
  ].join('\n');
}
