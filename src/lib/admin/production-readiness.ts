import { readFileSync } from 'fs';
import { join } from 'path';

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

export const PRODUCTION_READINESS_SEGMENTS = [
  {
    id: 'product_experience',
    name: 'Product Experience',
    description: 'User-facing and operator-facing product surfaces.',
    componentIds: [
      'programs',
      'program_workshop_mode',
      'deliverables_artifacts',
      'intelligence',
      'ai_control_tower',
      'admin_setup',
      'source',
    ],
  },
  {
    id: 'data_and_evidence',
    name: 'Data and Evidence',
    description: 'Evidence fabric, ingestion, and governance foundations.',
    componentIds: ['data_evidence_knowledge_fabric', 'ingestion_parsing', 'audit_governance'],
  },
  {
    id: 'runtime_and_intelligence',
    name: 'Runtime and Intelligence',
    description: 'Runtime, gateway, and solution intelligence capabilities.',
    componentIds: ['solution_intelligence', 'agent_runtime', 'model_gateway'],
  },
  {
    id: 'validation_and_deployment',
    name: 'Validation and Deployment',
    description: 'QA gates, release health, and production deployment readiness.',
    componentIds: ['validation_qa', 'production_deployment'],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  componentIds: ReadonlyArray<ProductionReadinessComponentId>;
}>;

export type ProductionReadinessSegmentId = (typeof PRODUCTION_READINESS_SEGMENTS)[number]['id'];

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

export interface ProductMaturityIndicator {
  id: string;
  label: string;
  percentLow: number;
  percentHigh: number;
  interpretation: string;
}

export interface ProductMaturityArea {
  id: string;
  area: string;
  completed: string;
  pending: string;
  percentLow: number;
  percentHigh: number;
  relatedComponentIds: ReadonlyArray<ProductionReadinessComponentId>;
}

export interface ProductMaturitySnapshot {
  source: string;
  indicators: ReadonlyArray<ProductMaturityIndicator>;
  areas: ReadonlyArray<ProductMaturityArea>;
}

export interface ProductionReadinessManifest {
  schemaVersion: number;
  lastUpdated: string;
  updatedBy: string;
  source: string;
  overallStatus: ProductionReadinessStatus;
  overallReadinessPercent: number;
  maturitySnapshot: ProductMaturitySnapshot;
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

export interface ProductionReadinessComponentProgress {
  componentId: ProductionReadinessComponentId;
  componentName: string;
  ownerAgent: string;
  segmentId: ProductionReadinessSegmentId;
  segmentName: string;
  status: ProductionReadinessStatus;
  started: boolean;
  percentComplete: number;
  percentPending: number;
  blockerCount: number;
  criticalBlockerCount: number;
  highestBlockerSeverity: ProductionReadinessBlockerSeverity | null;
  productionRiskLevel: ProductionReadinessRiskLevel | ProductionReadinessStatus;
  nextAction: string;
}

export interface ProductionReadinessSegmentSummary {
  id: ProductionReadinessSegmentId;
  name: string;
  description: string;
  totalComponents: number;
  startedCount: number;
  notStartedCount: number;
  percentComplete: number;
  percentPending: number;
  scaffoldedOrBetterCount: number;
  codeCompleteOrBetterCount: number;
  testReadyCount: number;
  fullFlowReadyCount: number;
  pilotReadyCount: number;
  productionReadyCount: number;
  blockerCount: number;
  criticalBlockerCount: number;
  nextAction: string;
  components: ReadonlyArray<ProductionReadinessComponentProgress>;
}

export interface ProductionReadinessView {
  schemaVersion: number;
  lastUpdated: string;
  updatedBy: string;
  source: string;
  overallStatus: ProductionReadinessStatus;
  stewardBrief: ProductionReadinessStewardBrief;
  overallReadinessPercent: number;
  maturitySnapshot: ProductMaturitySnapshot;
  summary: ProductionReadinessSummary;
  components: ReadonlyArray<ProductionReadinessComponent>;
  componentProgress: ReadonlyArray<ProductionReadinessComponentProgress>;
  segments: ReadonlyArray<ProductionReadinessSegmentSummary>;
  recommendedActions: ReadonlyArray<ProductionReadinessRecommendedAction>;
  lowestReadinessComponents: ReadonlyArray<ProductionReadinessComponent>;
}

export type ProductionReadinessRefreshMode = 'api_polling';
export type ProductionReadinessLiveCiStatus = 'unavailable' | 'configured' | 'error';

export interface ProductionReadinessRefreshMetadata {
  generatedAt: string;
  source: 'production_readiness_manifest';
  refreshMode: ProductionReadinessRefreshMode;
  liveCiStatus: ProductionReadinessLiveCiStatus;
  note: string;
}

export interface ProductionReadinessApiResponse extends ProductionReadinessRefreshMetadata {
  manifest: ProductionReadinessManifest;
  view: ProductionReadinessView;
}

const STATUS_SCORE: Record<ProductionReadinessStatus, number> = {
  not_started: 5,
  scaffolded: 15,
  code_complete: 30,
  tested: 40,
  full_flow_ready: 60,
  pilot_ready: 80,
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

const PRODUCTION_READINESS_MANIFEST_PATH = join(process.cwd(), 'docs/build/production-readiness.json');

export function loadProductionReadinessManifest(): ProductionReadinessManifest {
  return JSON.parse(readFileSync(PRODUCTION_READINESS_MANIFEST_PATH, 'utf8')) as ProductionReadinessManifest;
}

export function buildProductionReadinessView(
  manifestInput: ProductionReadinessManifest = loadProductionReadinessManifest(),
): ProductionReadinessView {
  const loadedManifest = manifestInput;
  const components = loadedManifest.components;
  const summary = summarizeProductionReadiness(components);
  const componentProgress = getProductionReadinessComponentProgress(components);
  const segments = getProductionReadinessSegments(components);

  return {
    schemaVersion: loadedManifest.schemaVersion,
    lastUpdated: loadedManifest.lastUpdated,
    updatedBy: loadedManifest.updatedBy,
    source: loadedManifest.source,
    overallStatus: loadedManifest.overallStatus,
    stewardBrief: loadedManifest.stewardBrief,
    overallReadinessPercent: computeOverallReadinessPercent(components),
    maturitySnapshot: loadedManifest.maturitySnapshot,
    summary,
    components,
    componentProgress,
    segments,
    recommendedActions: getProductionReadinessNextActions(components),
    lowestReadinessComponents: getLowestReadinessComponents(components),
  };
}

export function getProductionReadinessRefreshMetadata(
  generatedAt: string,
): ProductionReadinessRefreshMetadata {
  return {
    generatedAt,
    source: 'production_readiness_manifest',
    refreshMode: 'api_polling',
    liveCiStatus: 'unavailable',
    note:
      'V1 refresh reads the production-readiness manifest through an internal no-store API. GitHub checks, Vercel deployments, route smoke, persona crawler, and observability ingestion are not configured yet.',
  };
}

export function buildProductionReadinessApiResponse(generatedAt: string): ProductionReadinessApiResponse {
  const manifest = loadProductionReadinessManifest();
  return {
    ...getProductionReadinessRefreshMetadata(generatedAt),
    manifest,
    view: buildProductionReadinessView(manifest),
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

export function getProductionReadinessComponentProgress(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ReadonlyArray<ProductionReadinessComponentProgress> {
  return components.map((component) => {
    const segment = getSegmentDefinitionForComponent(component.id);
    const percentComplete = STATUS_SCORE[component.status];
    const highestBlockerSeverity = getHighestBlockerSeverity(component.blockers);

    return {
      componentId: component.id,
      componentName: component.name,
      ownerAgent: component.ownerAgent,
      segmentId: segment.id,
      segmentName: segment.name,
      status: component.status,
      started: component.status !== 'not_started',
      percentComplete,
      percentPending: 100 - percentComplete,
      blockerCount: component.blockers.length,
      criticalBlockerCount: component.blockers.filter((blocker) => blocker.severity === 'critical').length,
      highestBlockerSeverity,
      productionRiskLevel: component.productionRiskLevel ?? component.dimensions.production_risk,
      nextAction: component.nextAction,
    };
  });
}

export function getProductionReadinessSegments(
  components: ReadonlyArray<ProductionReadinessComponent>,
): ReadonlyArray<ProductionReadinessSegmentSummary> {
  const componentProgress = getProductionReadinessComponentProgress(components);

  return PRODUCTION_READINESS_SEGMENTS.map((segment) => {
    const segmentComponents = componentProgress.filter((component) => component.segmentId === segment.id);
    const percentComplete = computeProgressAverage(segmentComponents);

    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      totalComponents: segmentComponents.length,
      startedCount: segmentComponents.filter((component) => component.started).length,
      notStartedCount: segmentComponents.filter((component) => !component.started).length,
      percentComplete,
      percentPending: 100 - percentComplete,
      scaffoldedOrBetterCount: countProgressAtLeast(segmentComponents, 'scaffolded'),
      codeCompleteOrBetterCount: countProgressAtLeast(segmentComponents, 'code_complete'),
      testReadyCount: countProgressAtLeast(segmentComponents, 'tested'),
      fullFlowReadyCount: countProgressAtLeast(segmentComponents, 'full_flow_ready'),
      pilotReadyCount: countProgressAtLeast(segmentComponents, 'pilot_ready'),
      productionReadyCount: segmentComponents.filter((component) => component.status === 'production_ready').length,
      blockerCount: segmentComponents.reduce((sum, component) => sum + component.blockerCount, 0),
      criticalBlockerCount: segmentComponents.reduce((sum, component) => sum + component.criticalBlockerCount, 0),
      nextAction: getSegmentNextAction(segmentComponents),
      components: segmentComponents,
    };
  });
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

export function computeOverallReadinessPercent(components: ReadonlyArray<ProductionReadinessComponent>): number {
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

function countProgressAtLeast(
  components: ReadonlyArray<ProductionReadinessComponentProgress>,
  status: ProductionReadinessStatus,
): number {
  return components.filter((component) => STATUS_ORDER[component.status] >= STATUS_ORDER[status]).length;
}

function computeProgressAverage(components: ReadonlyArray<ProductionReadinessComponentProgress>): number {
  if (components.length === 0) return 0;
  const totalScore = components.reduce((sum, component) => sum + component.percentComplete, 0);
  return Math.round(totalScore / components.length);
}

function getSegmentDefinitionForComponent(componentId: ProductionReadinessComponentId) {
  const segment = PRODUCTION_READINESS_SEGMENTS.find((item) =>
    (item.componentIds as ReadonlyArray<ProductionReadinessComponentId>).includes(componentId),
  );
  if (!segment) {
    throw new Error(`Production readiness component is not assigned to a segment: ${componentId}`);
  }
  return segment;
}

function getSegmentNextAction(components: ReadonlyArray<ProductionReadinessComponentProgress>): string {
  const sorted = [...components].sort((a, b) => {
    const severityDelta = severityRank(a.highestBlockerSeverity) - severityRank(b.highestBlockerSeverity);
    if (severityDelta !== 0) return severityDelta;

    const scoreDelta = a.percentComplete - b.percentComplete;
    if (scoreDelta !== 0) return scoreDelta;

    return a.componentName.localeCompare(b.componentName);
  });

  return sorted[0]?.nextAction ?? 'No readiness action recorded.';
}

function getHighestBlockerSeverity(
  blockers: ReadonlyArray<ProductionReadinessBlocker>,
): ProductionReadinessBlockerSeverity | null {
  return (
    [...blockers].sort((a, b) => BLOCKER_SEVERITY_ORDER[a.severity] - BLOCKER_SEVERITY_ORDER[b.severity])[0]
      ?.severity ?? null
  );
}

function severityRank(severity: ProductionReadinessBlockerSeverity | null): number {
  return severity === null ? 99 : BLOCKER_SEVERITY_ORDER[severity];
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
