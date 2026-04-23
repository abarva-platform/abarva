import type { DeliverableRenderTier, SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

export type CrossLinkClass =
  | 'breadcrumb'
  | 'previous_next'
  | 'phase_summary'
  | 'program_overview'
  | 'related_deliverable'
  | 'source_pattern'
  | 'cross_program_analogue'
  | 'evidence';

export interface DeliverableRouteLink {
  className: CrossLinkClass;
  label: string;
  title: string;
  href: string;
  description?: string;
}

export interface DeliverableKpi {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'teal' | 'amber' | 'red';
}

export interface DeliverableSection {
  id: string;
  label: string;
  title: string;
  body: string;
  bullets?: string[];
}

export interface DeliverableTable {
  columns: string[];
  rows: string[][];
  highlightedRows?: number[];
}

export interface DeliverableDecision {
  date: string;
  summary: string;
  detail: string;
}

export interface DeliverableRisk {
  level: 'High' | 'Medium' | 'Low';
  title: string;
  mitigation: string;
}

export interface DeliverableEvidenceRef {
  id: string;
  label: string;
  href: string;
  kind: string;
}

export interface StubTriggerCondition {
  state: 'complete' | 'in_progress' | 'not_yet';
  title: string;
  detail: string;
}

export interface DeliverableRenderModel {
  tenant: {
    key: string;
    slug: string;
    name: string;
  };
  program: {
    code: string;
    slug: string;
    name: string;
    archetypeCode: string;
    currentPhaseSpec: SpecPhaseNumber;
    currentAppPhase: number;
    patternSlug: string | null;
    routePath: string;
    roleInDemo: string;
  };
  phase: {
    spec: SpecPhaseNumber;
    app: number;
    name: string;
    gateCriterion: string;
  };
  deliverable: {
    code: string;
    slug: string;
    routeSegment: string;
    typeKey: string;
    title: string;
    status: string;
    tier: DeliverableRenderTier;
    lifecycleState: 'completed_or_current' | 'scheduled';
    requirement: 'required' | 'optional' | 'additional';
    qualityScore?: number;
    activationCriteria?: string;
    generatedAt?: string;
    version?: number;
  };
  summary: string;
  kpis: DeliverableKpi[];
  sections: DeliverableSection[];
  table: DeliverableTable;
  decisions: DeliverableDecision[];
  risks: DeliverableRisk[];
  evidence: DeliverableEvidenceRef[];
  crossLinks: DeliverableRouteLink[];
  triggerConditions: StubTriggerCondition[];
  prerequisites: DeliverableRouteLink[];
  structurePreview: string[];
  provenance: {
    seedSpecVersion: string;
    contentState: 'seeded_detail' | 'seeded_outline' | 'scheduled_stub' | 'live_generated';
    disclaimer: string;
  };
}

export function deliverableToneColor(tone: DeliverableKpi['tone']): string {
  if (tone === 'teal') return 'var(--del-teal)';
  if (tone === 'amber') return 'var(--del-amber)';
  if (tone === 'red') return 'var(--del-red)';
  return 'var(--del-ink)';
}
