import productionReadinessManifestJson from '../../../docs/build/production-readiness.json';

export const PRODUCTION_READINESS_STATUSES = [
  'not_started',
  'scaffolded',
  'code_complete',
  'tested',
  'full_flow_ready',
  'pilot_ready',
  'production_ready',
  'blocked',
] as const;

export type ProductionReadinessStatus = (typeof PRODUCTION_READINESS_STATUSES)[number];

export const PRODUCTION_READINESS_DIMENSIONS = [
  'functionality',
  'data_readiness',
  'agent_readiness',
  'evidence_audit_readiness',
  'ui_ux_readiness',
  'tenant_isolation',
  'test_coverage',
  'build_deploy_health',
  'production_risk',
] as const;

export type ProductionReadinessDimension = (typeof PRODUCTION_READINESS_DIMENSIONS)[number];

export const PRODUCTION_READINESS_GATES = [
  'unit_tests',
  'integration_tests',
  'route_smoke',
  'live_persona_walk',
  'no_fabrication_check',
  'tenant_isolation_check',
  'vercel_build',
  'security_governance_review',
] as const;

export type ProductionReadinessGate = (typeof PRODUCTION_READINESS_GATES)[number];

export const PRODUCTION_READINESS_GATE_STATUSES = [
  'not_started',
  'partial',
  'passing',
  'blocked',
  'not_automated',
  'not_run',
] as const;

export type ProductionReadinessGateStatus = (typeof PRODUCTION_READINESS_GATE_STATUSES)[number];

export const PRODUCTION_READINESS_COMPONENT_IDS = [
  'programs',
  'program_workshop_mode',
  'deliverables_artifacts',
  'intelligence',
  'ai_control_tower',
  'admin_setup',
  'source',
  'data_evidence_knowledge_fabric',
  'solution_intelligence',
  'agent_runtime',
  'model_gateway',
  'ingestion_parsing',
  'audit_governance',
  'validation_qa',
  'production_deployment',
] as const;

export type ProductionReadinessComponentId = (typeof PRODUCTION_READINESS_COMPONENT_IDS)[number];

export type ProductionReadinessBlockerSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ProductionReadinessRiskLevel = 'low' | 'medium' | 'medium_high' | 'high' | 'critical';

export interface ProductionReadinessGateAssessment {
  status: ProductionReadinessGateStatus;
  evidence: string;
}

export interface ProductionReadinessBlocker {
  id: string;
  severity: ProductionReadinessBlockerSeverity;
  description: string;
  unblocks: ProductionReadinessStatus;
}

export interface ProductionReadinessComponent {
  id: ProductionReadinessComponentId;
  name: string;
  ownerAgent: string;
  status: ProductionReadinessStatus;
  maturity: string;
  productionRiskLevel?: ProductionReadinessRiskLevel;
  lastVerifiedCommit: string | null;
  dimensions: Record<ProductionReadinessDimension, ProductionReadinessStatus>;
  testingGates: Record<ProductionReadinessGate, ProductionReadinessGateAssessment>;
  blockers: ReadonlyArray<ProductionReadinessBlocker>;
  nextAction: string;
  notes: ReadonlyArray<string>;
}

export interface ProductionReadinessStewardBrief {
  title: string;
  summary: string;
  fullFlowTestingReadiness: ProductionReadinessStatus;
  pilotReadinessStatus: ProductionReadinessStatus;
  productionReadinessStatus: ProductionReadinessStatus;
  interpretationBasis: string;
  topBlockers: ReadonlyArray<string>;
}

export interface ProductionReadinessManifest {
  schemaVersion: number;
  lastUpdated: string;
  updatedBy: string;
  source: string;
  overallStatus: ProductionReadinessStatus;
  overallReadinessPercent: number;
  stewardBrief: ProductionReadinessStewardBrief;
  components: ReadonlyArray<ProductionReadinessComponent>;
}

export interface ProductionReadinessTopBlocker extends ProductionReadinessBlocker {
  componentId: ProductionReadinessComponentId;
  componentName: string;
  componentStatus: ProductionReadinessStatus;
}

export interface ProductionReadinessSummary {
  totalComponents: number;
  byStatus: Record<ProductionReadinessStatus, number>;
  gateStatusCounts: Record<ProductionReadinessGateStatus, number>;
  overallReadinessPercent: number;
  scaffoldedOrBetterCount: number;
  codeCompleteOrBetterCount: number;
  testReadyCount: number;
  fullFlowReadyCount: number;
  pilotReadyCount: number;
  productionReadyCount: number;
  blockedCount: number;
  topBlockers: ReadonlyArray<ProductionReadinessTopBlocker>;
}

export interface ProductionReadinessRecommendedAction {
  id: string;
  componentId: ProductionReadinessComponentId;
  componentName: string;
  label: string;
  reason: string;
  severity: ProductionReadinessBlockerSeverity;
  unblocks: ProductionReadinessStatus;
}

export interface ProductionReadinessView {
  schemaVersion: number;
  lastUpdated: string;
  updatedBy: string;
  source: string;
  overallStatus: ProductionReadinessStatus;
  stewardBrief: ProductionReadinessStewardBrief;
  overallReadinessPercent: number;
  summary: ProductionReadinessSummary;
  components: ReadonlyArray<ProductionReadinessComponent>;
  recommendedActions: ReadonlyArray<ProductionReadinessRecommendedAction>;
  lowestReadinessComponents: ReadonlyArray<ProductionReadinessComponent>;
}

const STATUS_SCORE: Record<ProductionReadinessStatus, number> = {
  not_started: 0,
  scaffolded: 20,
  code_complete: 45,
  tested: 60,
  full_flow_ready: 75,
  pilot_ready: 88,
  production_ready: 100,
  blocked: 10,
};

const STATUS_ORDER: Record<ProductionReadinessStatus, number> = {
  not_started: 0,
  blocked: 1,
  scaffolded: 2,
  code_complete: 3,
  tested: 4,
  full_flow_ready: 5,
  pilot_ready: 6,
  production_ready: 7,
};

const BLOCKER_SEVERITY_ORDER: Record<ProductionReadinessBlockerSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const manifest = productionReadinessManifestJson as ProductionReadinessManifest;

export function loadProductionReadinessManifest(): ProductionReadinessManifest {
  return manifest;
}

export function buildProductionReadinessView(): ProductionReadinessView {
  const loadedManifest = loadProductionReadinessManifest();
  const components = loadedManifest.components;
  const summary = summarizeProductionReadiness(components);

  return {
    schemaVersion: loadedManifest.schemaVersion,
    lastUpdated: loadedManifest.lastUpdated,
    updatedBy: loadedManifest.updatedBy,
    source: loadedManifest.source,
    overallStatus: loadedManifest.overallStatus,
    stewardBrief: loadedManifest.stewardBrief,
    overallReadinessPercent: computeOverallReadinessPercent(components),
    summary,
    components,
    recommendedActions: getProductionReadinessNextActions(components),
    lowestReadinessComponents: getLowestReadinessComponents(components),
  };
}

export function summarizeProductionReadiness(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ProductionReadinessSummary {
  const byStatus = createStatusCounts();
  const gateStatusCounts = createGateStatusCounts();
  const topBlockers = collectTopBlockers(components);

  for (const component of components) {
    byStatus[component.status] += 1;

    for (const gate of PRODUCTION_READINESS_GATES) {
      gateStatusCounts[component.testingGates[gate].status] += 1;
    }
  }

  return {
    totalComponents: components.length,
    byStatus,
    gateStatusCounts,
    overallReadinessPercent: computeOverallReadinessPercent(components),
    scaffoldedOrBetterCount: countAtLeast(components, 'scaffolded'),
    codeCompleteOrBetterCount: countAtLeast(components, 'code_complete'),
    testReadyCount: countAtLeast(components, 'tested'),
    fullFlowReadyCount: countAtLeast(components, 'full_flow_ready'),
    pilotReadyCount: countAtLeast(components, 'pilot_ready'),
    productionReadyCount: byStatus.production_ready,
    blockedCount: byStatus.blocked,
    topBlockers,
  };
}

export function getProductionReadinessNextActions(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ReadonlyArray<ProductionReadinessRecommendedAction> {
  return collectTopBlockers(components)
    .map((blocker) => {
      const component = components.find((item) => item.id === blocker.componentId);
      return {
        id: `action:${blocker.id}`,
        componentId: blocker.componentId,
        componentName: blocker.componentName,
        label: component?.nextAction ?? blocker.description,
        reason: blocker.description,
        severity: blocker.severity,
        unblocks: blocker.unblocks,
      };
    })
    .slice(0, 8);
}

export function computeOverallReadinessPercent(
  components: ReadonlyArray<ProductionReadinessComponent>,
): number {
  if (components.length === 0) return 0;
  const totalScore = components.reduce((sum, component) => sum + STATUS_SCORE[component.status], 0);
  return Math.round(totalScore / components.length);
}

export function getLowestReadinessComponents(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ReadonlyArray<ProductionReadinessComponent> {
  return [...components]
    .sort((a, b) => {
      const scoreDelta = STATUS_SCORE[a.status] - STATUS_SCORE[b.status];
      if (scoreDelta !== 0) return scoreDelta;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 5);
}

function collectTopBlockers(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ReadonlyArray<ProductionReadinessTopBlocker> {
  return components
    .flatMap((component) =>
      component.blockers.map((blocker) => ({
        ...blocker,
        componentId: component.id,
        componentName: component.name,
        componentStatus: component.status,
      })),
    )
    .sort((a, b) => {
      const severityDelta = BLOCKER_SEVERITY_ORDER[a.severity] - BLOCKER_SEVERITY_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      const statusDelta = STATUS_ORDER[a.componentStatus] - STATUS_ORDER[b.componentStatus];
      if (statusDelta !== 0) return statusDelta;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 6);
}

function countAtLeast(
  components: ReadonlyArray<ProductionReadinessComponent>,
  status: ProductionReadinessStatus,
): number {
  return components.filter((component) => STATUS_ORDER[component.status] >= STATUS_ORDER[status]).length;
}

function createStatusCounts(): Record<ProductionReadinessStatus, number> {
  return {
    not_started: 0,
    scaffolded: 0,
    code_complete: 0,
    tested: 0,
    full_flow_ready: 0,
    pilot_ready: 0,
    production_ready: 0,
    blocked: 0,
  };
}

function createGateStatusCounts(): Record<ProductionReadinessGateStatus, number> {
  return {
    not_started: 0,
    partial: 0,
    passing: 0,
    blocked: 0,
    not_automated: 0,
    not_run: 0,
  };
}
