/**
 * agent-readiness-composer — Block payloads for the redesigned
 * Agent Readiness panel (Setup Redesign Package PR C).
 *
 *   5.1 State header (per-agent quick reads)
 *   5.2 Capability constellation matrix (page hero)
 *   5.3 Per-agent next-action (admin-actionable vs engineering-tracked)
 *
 * Catalog references:
 *   §5.1 + §9 — agent-segment dependency map
 *   §5.2 + §10 — segment-capability rule table
 *   §5.3 — admin-actionable derivation + static engineering list
 */

import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';
import {
  agentLevelFromReadiness,
  depthFromHealth,
  readinessPercent,
  unlocksCopy,
  type AgentLevel,
  type CapabilityDepthState,
  type CapabilityVerb,
  type HealthState,
} from '@/lib/admin/setup-vocab';

export type AgentId = 'nexus' | 'sentinel' | 'steward' | 'atlas';

export interface AgentStateMetric {
  id: AgentId;
  label: string;
  level: AgentLevel;
  /** Plain-language summary, e.g. "Decision-grade on citation discipline". */
  summary: string;
}

export interface MatrixRow {
  segmentId: string;
  segmentName: string;
  familyNumber: number;
  cells: Record<CapabilityVerb, MatrixCell>;
}

export interface MatrixCell {
  /** 'deep' / 'partial' / 'thin' / 'empty' or 'not-applicable' for verbs that don't relate to the segment. */
  state: CapabilityDepthState | 'not-applicable';
  /** Tooltip / popover copy on hover/click. */
  guidance: string;
}

export interface AdminActionableItem {
  id: string;
  agentId: AgentId;
  agentLabel: string;
  /** "can't do <capability>" */
  capabilityGap: string;
  /** Plain-language data needed, e.g. "Active Portfolio loaded". */
  needs: string;
  href: string;
  severity: 'high' | 'medium' | 'low';
}

export interface EngineeringTrackedItem {
  id: string;
  /** Platform capability description. */
  capability: string;
  /** Wave reference. */
  wave: string;
}

export interface AgentReadinessBlocks {
  state: AgentStateMetric[];
  matrix: MatrixRow[];
  adminActionable: AdminActionableItem[];
  engineeringTracked: EngineeringTrackedItem[];
}

const AGENT_LABELS: Record<AgentId, string> = {
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  steward: 'Steward',
  atlas: 'Atlas',
};

// Per catalog §9 agent-segment-dependency map.
const AGENT_PRIMARY_FAMILIES: Record<AgentId, number[]> = {
  steward: [1, 9, 12],
  sentinel: [7, 11, 13],
  nexus: [6, 8, 10, 14],
  atlas: [3, 4, 5],
};

const AGENT_PROFILE: Record<AgentId, string> = {
  steward: 'citation discipline + governance gating',
  sentinel: 'sourcing + vendor + market context reasoning',
  nexus: 'program lifecycle + cross-program synthesis',
  atlas: 'system reasoning + financial modeling',
};

// Per catalog §10 — which capability verbs each segment family contributes to.
// "all" means every loaded segment contributes to that capability.
const VERB_RELEVANT_FAMILIES: Record<CapabilityVerb, 'all' | number[]> = {
  'cite-evidence': 'all',
  'model-run-rate': [4, 5, 10],
  'detect-risk': [1, 9, 10, 11, 12, 13],
  'synthesize-cross-program': [6, 8, 14],
  'advance-lifecycle': [6, 7, 8, 10],
  'audit-govern': [1, 9, 12],
};

const SEGMENT_NAME_BY_FAMILY: Record<number, string> = {
  1: 'Enterprise profile',
  2: 'Org structure',
  3: 'IT system landscape',
  4: 'IT financials',
  5: 'KPI dictionary',
  6: 'Program inventory',
  7: 'Sourcing artifacts',
  8: 'Program deliverables',
  9: 'Evidence ledger',
  10: 'Operating telemetry',
  11: 'Vendor and contract',
  12: 'Compliance and regulatory',
  13: 'Industry context',
  14: 'Cross-program signals',
};

const SEGMENT_KEY_BY_FAMILY: Record<number, string> = {
  1: 'enterprise_profile',
  2: 'org_structure',
  3: 'it_landscape',
  4: 'it_financials',
  5: 'kpi_dictionary',
  6: 'program_inventory',
  7: 'sourcing_artifacts',
  8: 'program_deliverables',
  9: 'evidence_ledger',
  10: 'operating_telemetry',
  11: 'vendor_contracts',
  12: 'compliance',
  13: 'industry_context',
  14: 'cross_program_signals',
};

// Static list per spec §3 for engineering-tracked work.
const STATIC_ENGINEERING_TRACKED: EngineeringTrackedItem[] = [
  {
    id: 'live-access-mutation',
    capability: 'Live access mutation pipeline (invite / revoke users)',
    wave: 'Wave 27',
  },
  {
    id: 'confidence-scoring',
    capability: 'Confidence scoring on live evidence',
    wave: 'Wave 27',
  },
  {
    id: 'pressure-cards-live',
    capability: 'Pressure cards driven by live data instead of fixtures',
    wave: 'Wave 28',
  },
  {
    id: 'audit-event-store',
    capability: 'Audit event store for tenant-admin actions',
    wave: 'Wave 27',
  },
];

const CAPABILITY_VERB_LABEL: Record<CapabilityVerb, string> = {
  'cite-evidence': 'Cite evidence',
  'model-run-rate': 'Model run-rate',
  'detect-risk': 'Detect risk',
  'synthesize-cross-program': 'Synthesize cross-program',
  'advance-lifecycle': 'Advance lifecycle',
  'audit-govern': 'Audit / govern',
};

export const CAPABILITY_VERBS_ORDERED: ReadonlyArray<CapabilityVerb> = [
  'cite-evidence',
  'model-run-rate',
  'detect-risk',
  'synthesize-cross-program',
  'advance-lifecycle',
  'audit-govern',
];

export function capabilityVerbLabel(verb: CapabilityVerb): string {
  return CAPABILITY_VERB_LABEL[verb];
}

function buildAgentState(
  segments: InventorySegmentRollup[],
): AgentStateMetric[] {
  const byFamily = new Map<number, InventorySegmentRollup>();
  for (const s of segments) byFamily.set(s.familyNumber, s);

  const result: AgentStateMetric[] = [];
  for (const id of ['nexus', 'sentinel', 'steward', 'atlas'] as AgentId[]) {
    const families = AGENT_PRIMARY_FAMILIES[id];
    const relevant = families
      .map((f) => byFamily.get(f))
      .filter((s): s is InventorySegmentRollup => Boolean(s));
    const pct = relevant.length === 0
      ? 0
      : readinessPercent(
          // Pad to 14-equivalent so the existing helper math works:
          relevant,
        ) * (14 / families.length);
    const level = relevant.length === 0
      ? 'blank'
      : agentLevelFromReadiness(Math.min(100, Math.round(pct)));
    let summary: string;
    if (level === 'decision-grade') summary = `Decision-grade on ${AGENT_PROFILE[id]}`;
    else if (level === 'partial') summary = `Partial on ${AGENT_PROFILE[id]}`;
    else if (level === 'thin') summary = `Thin on ${AGENT_PROFILE[id]}`;
    else summary = `${AGENT_PROFILE[id]} not yet active`;
    result.push({ id, label: AGENT_LABELS[id], level, summary });
  }
  return result;
}

function cellForSegmentVerb(
  state: HealthState,
  verb: CapabilityVerb,
  familyNumber: number,
  segmentName: string,
): MatrixCell {
  const relevant = VERB_RELEVANT_FAMILIES[verb];
  const isRelevant = relevant === 'all' || relevant.includes(familyNumber);
  if (!isRelevant) {
    return {
      state: 'not-applicable',
      guidance: `${capabilityVerbLabel(verb)} doesn't apply to ${segmentName}.`,
    };
  }
  const depth = depthFromHealth(state);
  const guidance =
    depth === 'deep'
      ? `${capabilityVerbLabel(verb)} on ${segmentName} is decision-grade — every claim resolves to evidence.`
      : depth === 'partial'
        ? `${capabilityVerbLabel(verb)} on ${segmentName} is partial. Promote to decision-grade by reviewing evidence and closing open gaps.`
        : depth === 'thin'
          ? `${capabilityVerbLabel(verb)} on ${segmentName} is thin. ${unlocksCopy(familyNumber, segmentName)}`
          : `${segmentName} is empty. Loading it would unlock ${capabilityVerbLabel(verb).toLowerCase()} on this segment.`;
  return { state: depth, guidance };
}

function buildMatrix(segments: InventorySegmentRollup[]): MatrixRow[] {
  const byFamily = new Map<number, InventorySegmentRollup>();
  for (const s of segments) byFamily.set(s.familyNumber, s);

  const rows: MatrixRow[] = [];
  for (let f = 1; f <= 14; f += 1) {
    const seg = byFamily.get(f);
    const segmentName = SEGMENT_NAME_BY_FAMILY[f] ?? `Segment ${f}`;
    const segmentId = SEGMENT_KEY_BY_FAMILY[f] ?? `seg_${f}`;
    const state: HealthState = (seg?.healthState as HealthState | undefined) ?? 'not_started';
    const cells = {} as Record<CapabilityVerb, MatrixCell>;
    for (const verb of CAPABILITY_VERBS_ORDERED) {
      cells[verb] = cellForSegmentVerb(state, verb, f, segmentName);
    }
    rows.push({ segmentId, segmentName, familyNumber: f, cells });
  }
  return rows;
}

function buildAdminActionable(
  segments: InventorySegmentRollup[],
): AdminActionableItem[] {
  const byFamily = new Map<number, InventorySegmentRollup>();
  for (const s of segments) byFamily.set(s.familyNumber, s);

  const items: AdminActionableItem[] = [];
  for (const id of ['nexus', 'sentinel', 'steward', 'atlas'] as AgentId[]) {
    const families = AGENT_PRIMARY_FAMILIES[id];
    // Find the highest-impact unmet segment for this agent.
    const unmet = families
      .map((f) => byFamily.get(f))
      .filter((s): s is InventorySegmentRollup => {
        if (!s) return true; // missing → unmet
        const st = s.healthState as HealthState;
        return st !== 'complete' && st !== 'partial';
      });
    if (unmet.length === 0) continue;

    const need = unmet[0]!;
    const familyNumber = need?.familyNumber
      ?? families.find((f) => !byFamily.has(f))
      ?? families[0];
    const segmentName = need?.segmentName ?? SEGMENT_NAME_BY_FAMILY[familyNumber] ?? 'this segment';

    const capabilityGap = ({
      nexus: 'gate-readiness assessment across active programs',
      sentinel: 'BAFO-grade sourcing decisions',
      steward: 'compliance gating with citation discipline',
      atlas: 'authoritative system reasoning + run-rate modeling',
    } as Record<AgentId, string>)[id];

    items.push({
      id: `admin-actionable-${id}`,
      agentId: id,
      agentLabel: AGENT_LABELS[id],
      capabilityGap,
      needs: `${segmentName} loaded`,
      href: '/admin/data-trust',
      severity: id === 'steward' || id === 'nexus' ? 'high' : 'medium',
    });
  }
  return items;
}

export function composeAgentReadinessBlocks(
  segments: InventorySegmentRollup[],
): AgentReadinessBlocks {
  return {
    state: buildAgentState(segments),
    matrix: buildMatrix(segments),
    adminActionable: buildAdminActionable(segments),
    engineeringTracked: STATIC_ENGINEERING_TRACKED,
  };
}
