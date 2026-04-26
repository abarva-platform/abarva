import {
  PRODUCTION_READINESS_COMPONENT_IDS,
  PRODUCTION_READINESS_DIMENSIONS,
  PRODUCTION_READINESS_GATES,
  PRODUCTION_READINESS_GATE_STATUSES,
  PRODUCTION_READINESS_STATUSES,
  type ProductionReadinessBlockerSeverity,
  type ProductionReadinessComponent,
  type ProductionReadinessGateStatus,
  type ProductionReadinessManifest,
} from '@/lib/admin/production-readiness';

export type ProductionReadinessValidationSeverity = 'error' | 'warning' | 'info';

export interface ProductionReadinessValidationFinding {
  severity: ProductionReadinessValidationSeverity;
  rule: ProductionReadinessValidationRule;
  componentId?: string;
  message: string;
}

export interface ProductionReadinessValidationResult {
  passed: boolean;
  findings: ReadonlyArray<ProductionReadinessValidationFinding>;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export const PRODUCTION_READINESS_VALIDATION_RULES = [
  'manifest_parses',
  'all_required_components_exist',
  'all_statuses_valid',
  'all_dimensions_present',
  'all_testing_gates_present',
  'production_ready_requires_all_gates_pass',
  'pilot_ready_requires_route_smoke_or_persona_walk',
  'every_component_has_next_action',
  'every_blocker_has_severity_and_description',
  'no_live_monitoring_claim_unless_source_says_live',
  'overall_readiness_percent_within_planned_range',
  'maturity_snapshot_present',
] as const;

export type ProductionReadinessValidationRule = (typeof PRODUCTION_READINESS_VALIDATION_RULES)[number];

const VALID_BLOCKER_SEVERITIES: ReadonlyArray<ProductionReadinessBlockerSeverity> = [
  'low',
  'medium',
  'high',
  'critical',
];

const PASSING_GATE_STATUS: ProductionReadinessGateStatus = 'passing';
const NOT_STARTED_GATE_STATUS: ProductionReadinessGateStatus = 'not_started';

const LIVE_MONITORING_PHRASES = ['live monitoring', 'live observability', 'live dashboard'];

const LIVE_SOURCE_PATTERN = /live|ci/i;

export function validateProductionReadinessManifest(
  manifest: ProductionReadinessManifest,
): ProductionReadinessValidationResult {
  const findings: ProductionReadinessValidationFinding[] = [];

  if (!isStructuralManifest(manifest)) {
    findings.push({
      severity: 'error',
      rule: 'manifest_parses',
      message: 'Manifest input is not a structurally valid ProductionReadinessManifest object.',
    });
    return finalizeResult(findings);
  }

  validateRequiredComponentsRule(manifest, findings);
  validateMaturitySnapshotRule(manifest, findings);
  validateOverallReadinessPercentRule(manifest, findings);
  validateLiveMonitoringRule(manifest, findings);

  for (const component of manifest.components) {
    for (const finding of validateProductionReadinessComponent(component)) {
      findings.push(finding);
    }
  }

  return finalizeResult(findings);
}

export function validateProductionReadinessComponent(
  component: ProductionReadinessComponent,
): ReadonlyArray<ProductionReadinessValidationFinding> {
  const findings: ProductionReadinessValidationFinding[] = [];

  validateComponentStatusRule(component, findings);
  validateComponentDimensionsRule(component, findings);
  validateComponentTestingGatesRule(component, findings);
  validateProductionReadyRule(component, findings);
  validatePilotReadyRule(component, findings);
  validateNextActionRule(component, findings);
  validateBlockersRule(component, findings);

  return findings;
}

export function summarizeProductionReadinessValidation(
  result: ProductionReadinessValidationResult,
): string {
  const status = result.passed ? 'PASSED' : 'FAILED';
  const lines: string[] = [];
  lines.push(
    `Production readiness validation ${status}: ${result.errorCount} error(s), ${result.warningCount} warning(s), ${result.infoCount} info note(s).`,
  );
  if (result.findings.length === 0) {
    lines.push('No findings recorded.');
    return lines.join('\n');
  }
  for (const finding of result.findings) {
    const componentLabel = finding.componentId ? `[${finding.componentId}] ` : '';
    lines.push(
      `- ${finding.severity.toUpperCase()} (${finding.rule}): ${componentLabel}${finding.message}`,
    );
  }
  return lines.join('\n');
}

function validateRequiredComponentsRule(
  manifest: ProductionReadinessManifest,
  findings: ProductionReadinessValidationFinding[],
): void {
  const presentIds = new Set(manifest.components.map((component) => component.id));
  for (const requiredId of PRODUCTION_READINESS_COMPONENT_IDS) {
    if (!presentIds.has(requiredId)) {
      findings.push({
        severity: 'error',
        rule: 'all_required_components_exist',
        componentId: requiredId,
        message: `Required component "${requiredId}" is missing from manifest.components.`,
      });
    }
  }
}

function validateComponentStatusRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  const validStatuses: ReadonlyArray<string> = PRODUCTION_READINESS_STATUSES;
  if (!validStatuses.includes(component.status)) {
    findings.push({
      severity: 'error',
      rule: 'all_statuses_valid',
      componentId: component.id,
      message: `Component status "${component.status}" is not in the canonical readiness status enum.`,
    });
  }
  for (const dimension of PRODUCTION_READINESS_DIMENSIONS) {
    const value = component.dimensions?.[dimension];
    if (value !== undefined && !validStatuses.includes(value)) {
      findings.push({
        severity: 'error',
        rule: 'all_statuses_valid',
        componentId: component.id,
        message: `Dimension "${dimension}" has invalid status "${value}".`,
      });
    }
  }
  const validGateStatuses: ReadonlyArray<string> = PRODUCTION_READINESS_GATE_STATUSES;
  for (const gate of PRODUCTION_READINESS_GATES) {
    const gateValue = component.testingGates?.[gate];
    if (gateValue && !validGateStatuses.includes(gateValue.status)) {
      findings.push({
        severity: 'error',
        rule: 'all_statuses_valid',
        componentId: component.id,
        message: `Gate "${gate}" has invalid status "${gateValue.status}".`,
      });
    }
  }
}

function validateComponentDimensionsRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  const dimensions = component.dimensions ?? ({} as ProductionReadinessComponent['dimensions']);
  for (const dimension of PRODUCTION_READINESS_DIMENSIONS) {
    if (!(dimension in dimensions)) {
      findings.push({
        severity: 'error',
        rule: 'all_dimensions_present',
        componentId: component.id,
        message: `Component is missing required readiness dimension "${dimension}".`,
      });
    }
  }
}

function validateComponentTestingGatesRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  const gates = component.testingGates ?? ({} as ProductionReadinessComponent['testingGates']);
  for (const gate of PRODUCTION_READINESS_GATES) {
    if (!(gate in gates)) {
      findings.push({
        severity: 'error',
        rule: 'all_testing_gates_present',
        componentId: component.id,
        message: `Component is missing required testing gate "${gate}".`,
      });
    }
  }
}

function validateProductionReadyRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  if (component.status !== 'production_ready') return;
  for (const gate of PRODUCTION_READINESS_GATES) {
    const assessment = component.testingGates?.[gate];
    if (!assessment || assessment.status !== PASSING_GATE_STATUS) {
      findings.push({
        severity: 'error',
        rule: 'production_ready_requires_all_gates_pass',
        componentId: component.id,
        message: `Component is production_ready but gate "${gate}" is "${assessment?.status ?? 'missing'}" (must be "passing").`,
      });
    }
  }
}

function validatePilotReadyRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  if (component.status !== 'pilot_ready') return;
  const routeSmoke = component.testingGates?.route_smoke?.status;
  const personaWalk = component.testingGates?.live_persona_walk?.status;
  const routeSmokeOk = routeSmoke !== undefined && routeSmoke !== NOT_STARTED_GATE_STATUS;
  const personaWalkOk = personaWalk !== undefined && personaWalk !== NOT_STARTED_GATE_STATUS;
  if (!routeSmokeOk && !personaWalkOk) {
    findings.push({
      severity: 'error',
      rule: 'pilot_ready_requires_route_smoke_or_persona_walk',
      componentId: component.id,
      message: `Component is pilot_ready but neither route_smoke nor live_persona_walk has progressed past "not_started" (route_smoke="${routeSmoke ?? 'missing'}", live_persona_walk="${personaWalk ?? 'missing'}").`,
    });
  }
}

function validateNextActionRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  if (typeof component.nextAction !== 'string' || component.nextAction.trim().length === 0) {
    findings.push({
      severity: 'error',
      rule: 'every_component_has_next_action',
      componentId: component.id,
      message: 'Component is missing a non-empty nextAction.',
    });
  }
}

function validateBlockersRule(
  component: ProductionReadinessComponent,
  findings: ProductionReadinessValidationFinding[],
): void {
  const blockers = component.blockers ?? [];
  for (let index = 0; index < blockers.length; index += 1) {
    const blocker = blockers[index];
    const blockerLabel = blocker?.id ? `blocker "${blocker.id}"` : `blocker at index ${index}`;
    if (!blocker?.severity || !VALID_BLOCKER_SEVERITIES.includes(blocker.severity)) {
      findings.push({
        severity: 'error',
        rule: 'every_blocker_has_severity_and_description',
        componentId: component.id,
        message: `${blockerLabel} is missing a valid severity (got "${blocker?.severity ?? 'undefined'}").`,
      });
    }
    if (typeof blocker?.description !== 'string' || blocker.description.trim().length === 0) {
      findings.push({
        severity: 'error',
        rule: 'every_blocker_has_severity_and_description',
        componentId: component.id,
        message: `${blockerLabel} is missing a non-empty description.`,
      });
    }
  }
}

function validateLiveMonitoringRule(
  manifest: ProductionReadinessManifest,
  findings: ProductionReadinessValidationFinding[],
): void {
  const sourceText = typeof manifest.source === 'string' ? manifest.source : '';
  const sourceClaimsLive = LIVE_SOURCE_PATTERN.test(sourceText);
  const stringFields = collectManifestStringFields(manifest);
  for (const { path, value } of stringFields) {
    const lower = value.toLowerCase();
    for (const phrase of LIVE_MONITORING_PHRASES) {
      if (!lower.includes(phrase)) continue;
      if (sourceClaimsLive) continue;
      // Allow explicit negations like "no live monitoring" / "without live monitoring".
      if (containsExplicitNegation(lower, phrase)) continue;
      findings.push({
        severity: 'error',
        rule: 'no_live_monitoring_claim_unless_source_says_live',
        message: `Manifest field "${path}" claims "${phrase}" but manifest.source does not declare live or CI evidence.`,
      });
    }
  }
}

function validateOverallReadinessPercentRule(
  manifest: ProductionReadinessManifest,
  findings: ProductionReadinessValidationFinding[],
): void {
  const percent = manifest.overallReadinessPercent;
  if (typeof percent !== 'number' || Number.isNaN(percent)) {
    findings.push({
      severity: 'error',
      rule: 'overall_readiness_percent_within_planned_range',
      message: `Manifest overallReadinessPercent is not a finite number (got "${String(percent)}").`,
    });
    return;
  }
  const indicator = manifest.maturitySnapshot?.indicators?.find(
    (item) => item?.id === 'production_readiness',
  );
  if (!indicator) {
    findings.push({
      severity: 'error',
      rule: 'overall_readiness_percent_within_planned_range',
      message:
        'Manifest maturitySnapshot.indicators is missing a "production_readiness" indicator with planned percentLow/percentHigh range.',
    });
    return;
  }
  if (percent < indicator.percentLow || percent > indicator.percentHigh) {
    findings.push({
      severity: 'error',
      rule: 'overall_readiness_percent_within_planned_range',
      message: `Manifest overallReadinessPercent ${percent} is outside the planned range ${indicator.percentLow}-${indicator.percentHigh}.`,
    });
  }
}

function validateMaturitySnapshotRule(
  manifest: ProductionReadinessManifest,
  findings: ProductionReadinessValidationFinding[],
): void {
  const snapshot = manifest.maturitySnapshot;
  if (!snapshot || typeof snapshot !== 'object') {
    findings.push({
      severity: 'error',
      rule: 'maturity_snapshot_present',
      message: 'Manifest maturitySnapshot is missing.',
    });
    return;
  }
  if (!Array.isArray(snapshot.indicators) || snapshot.indicators.length === 0) {
    findings.push({
      severity: 'error',
      rule: 'maturity_snapshot_present',
      message: 'Manifest maturitySnapshot.indicators must be a non-empty array.',
    });
  }
  if (!Array.isArray(snapshot.areas) || snapshot.areas.length === 0) {
    findings.push({
      severity: 'error',
      rule: 'maturity_snapshot_present',
      message: 'Manifest maturitySnapshot.areas must be a non-empty array.',
    });
  }
}

function isStructuralManifest(manifest: unknown): manifest is ProductionReadinessManifest {
  if (!manifest || typeof manifest !== 'object') return false;
  const candidate = manifest as Partial<ProductionReadinessManifest>;
  return (
    Array.isArray(candidate.components) &&
    typeof candidate.schemaVersion === 'number' &&
    typeof candidate.lastUpdated === 'string' &&
    typeof candidate.source === 'string'
  );
}

function collectManifestStringFields(
  manifest: ProductionReadinessManifest,
): ReadonlyArray<{ path: string; value: string }> {
  const collected: Array<{ path: string; value: string }> = [];
  walk(manifest as unknown, '', collected);
  return collected;
}

function walk(value: unknown, path: string, out: Array<{ path: string; value: string }>): void {
  if (typeof value === 'string') {
    out.push({ path: path || '<root>', value });
    return;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      walk(value[index], `${path}[${index}]`, out);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      walk(child, path ? `${path}.${key}` : key, out);
    }
  }
}

function containsExplicitNegation(text: string, phrase: string): boolean {
  const negations = ['no ', 'not ', 'without ', 'never ', "don't ", 'do not '];
  for (const negation of negations) {
    const needle = `${negation}${phrase}`;
    if (text.includes(needle)) return true;
  }
  return false;
}

function finalizeResult(
  findings: ReadonlyArray<ProductionReadinessValidationFinding>,
): ProductionReadinessValidationResult {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const finding of findings) {
    if (finding.severity === 'error') errorCount += 1;
    else if (finding.severity === 'warning') warningCount += 1;
    else infoCount += 1;
  }
  return {
    passed: errorCount === 0,
    findings,
    errorCount,
    warningCount,
    infoCount,
  };
}
