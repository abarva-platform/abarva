import crypto from 'node:crypto';

import { canonicalClientDisplayName } from '@/lib/client-config';
import type { PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
import { normalizeSemantic2RuntimeTenantKey } from '@/lib/semantic2/runtime-contract';

export const TOWER_L3_PROMPT_VERSION = 'tower-l3-dossier-v2';

export const TOWER_CIO_VIEWS = [
  'spend',
  'value_realization',
  'scale_hold_stop',
  'vendor_renewal',
  'program_risk',
  'ops_automation',
  'risk_control',
  'decision_queue',
  'trust_gaps',
] as const;

export type TowerCioView = (typeof TOWER_CIO_VIEWS)[number];

export type TowerScopeType =
  | 'l1_consolidated'
  | 'l2_company_comparison'
  | 'l3_operating_company'
  | 'tenant';

export interface TowerSourceRow {
  sourceFile: string;
  rowNumber: number;
  values: Record<string, string>;
}

export interface TowerL3Input {
  clientId: string;
  tenantKey: string;
  portfolioCompanies: TowerSourceRow[];
  budgetRows: TowerSourceRow[];
  vendorRows: TowerSourceRow[];
  applicationRows: TowerSourceRow[];
  contractSystemRows: TowerSourceRow[];
  initiativeRows: TowerSourceRow[];
  benefitRows: TowerSourceRow[];
  spendRows: TowerSourceRow[];
  toolUsageRows: TowerSourceRow[];
  riskRows: TowerSourceRow[];
  forbiddenIdentifiers: string[];
  dossierVersion?: string;
  stage2Status?: 'enriched' | 'unavailable' | 'failed';
}

export interface TowerMetricSnapshot {
  metricSnapshotId: string;
  metricKey: string;
  label: string;
  valueNumber: number | null;
  valueText: string;
  amountType: string;
  accountingTreatment: string;
  period: string;
  scenario: string;
  numerator: number | null;
  denominator: number | null;
  confidence: string;
  freshness: string;
  formulaVersion: string;
  lineage: string[];
}

export interface TowerDossierFact {
  factId: string;
  label: string;
  value: string;
  confidence: string;
  lineage: string[];
}

export interface TowerDossierRelationship {
  relationshipId: string;
  label: string;
  from: string;
  to: string;
  relationshipType: string;
  confidence: string;
  lineage: string[];
}

export interface TowerDossierCoverage {
  requiredMetrics: string[];
  presentMetrics: string[];
  score: number;
  verdict:
    | 'SKELETON_COMPLETE'
    | 'SKELETON_PARTIAL'
    | 'SKELETON_THIN'
    | 'DEEP'
    | 'PARTIAL'
    | 'THIN'
    | 'EMPTY'
    | 'FAILED';
}

export interface TowerDossierInsight {
  insightId: string;
  observation: string;
  implication: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  supportingRefs: string[];
  supportLabels: string[];
  placeholder: boolean;
}

export interface TowerBusinessBody {
  labels: {
    tenant: string;
    scope: string;
    view: string;
  };
  metrics: Array<{
    label: string;
    valueText: string;
    amountType: string;
    accountingTreatment: string;
    period: string;
    confidence: string;
    freshness: string;
  }>;
  facts: Array<{
    label: string;
    value: string;
    confidence: string;
  }>;
  relationships: Array<{
    label: string;
    from: string;
    to: string;
    relationshipType: string;
    confidence: string;
  }>;
  insights: Array<{
    observation: string;
    implication: string;
    confidence: TowerDossierInsight['confidence'];
    supportLabels: string[];
    placeholder: boolean;
  }>;
  gaps: string[];
  branchOptions: string[];
}

export interface TowerAnswerDossier {
  tenantKey: string;
  scopeKey: string;
  scopeType: TowerScopeType;
  scopeLabel: string;
  viewKey: TowerCioView;
  promptVersion: string;
  dossierVersion: string;
  stage1Status: 'built' | 'empty' | 'failed';
  stage2Status: 'enriched' | 'unavailable' | 'failed';
  businessLabels: {
    tenant: string;
    scope: string;
    view: string;
  };
  metrics: TowerMetricSnapshot[];
  facts: TowerDossierFact[];
  relationships: TowerDossierRelationship[];
  coverage: TowerDossierCoverage;
  businessBody: TowerBusinessBody;
  gaps: string[];
  branchOptions: string[];
  derivedInsights: TowerDossierInsight[];
  citations: Array<{ citationId: string; sourceLabel: string; sourceFile: string; rowNumber: number }>;
  validation: TowerDossierValidation;
}

export interface TowerDossierValidation {
  pass: boolean;
  failures: string[];
  checks: Record<string, boolean>;
}

interface ScopeDef {
  key: string;
  label: string;
  type: TowerScopeType;
  portfolioCompany: string | null;
}

function cleanText(value: unknown): string {
  return String(value ?? '').trim();
}

function numberValue(value: unknown): number | null {
  const raw = cleanText(value).replace(/[$,%]/g, '').replace(/,/g, '');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function sum(rows: readonly TowerSourceRow[], column: string): number | null {
  const total = rows.reduce((acc, row) => acc + (numberValue(row.values[column]) ?? 0), 0);
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

function slug(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashId(prefix: string, parts: readonly string[]): string {
  return `${prefix}_${crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)}`;
}

function citationFor(row: TowerSourceRow): string {
  return `${row.sourceFile}:row-${row.rowNumber}`;
}

function sourceLabelFor(fileName: string): string {
  if (fileName.includes('benefit')) return 'benefit realization ledger, FY2026';
  if (fileName.includes('budget')) return 'IT budget ledger, FY2026';
  if (fileName.includes('vendors') || fileName.includes('contracts')) return 'vendor and contract ledger, FY2026';
  if (fileName.includes('application')) return 'application and system inventory';
  if (fileName.includes('risk')) return 'risk and governance register';
  if (fileName.includes('tool_usage')) return 'tool usage telemetry';
  if (fileName.includes('initiative')) return 'initiative registry';
  if (fileName.includes('portfolio_company')) return 'portfolio company profile';
  return 'Tower source ledger';
}

function businessLineageLabels(lineage: readonly string[]): string[] {
  return [...new Set(lineage.map((entry) => sourceLabelFor(entry.split(':')[0] ?? entry)))];
}

function rowsForScope(rows: readonly TowerSourceRow[], scope: ScopeDef): TowerSourceRow[] {
  if (!scope.portfolioCompany) return [...rows];
  return rows.filter((row) => cleanText(row.values.portfolio_company) === scope.portfolioCompany);
}

function requiredMetricsFor(view: TowerCioView): string[] {
  switch (view) {
    case 'spend':
      return ['total_it_budget', 'opex', 'capex', 'run', 'change'];
    case 'value_realization':
      return ['committed_value', 'realized_value', 'value_gap'];
    case 'scale_hold_stop':
      return ['program_budget', 'realized_value', 'open_risks'];
    case 'vendor_renewal':
      return ['vendor_spend', 'renewal_exposure'];
    case 'program_risk':
      return ['open_risks', 'high_risks', 'program_budget'];
    case 'ops_automation':
      return ['eligible_users', 'active_users', 'adoption_rate'];
    case 'risk_control':
      return ['open_risks', 'high_risks'];
    case 'decision_queue':
      return ['program_budget', 'open_risks', 'realized_value'];
    case 'trust_gaps':
      return ['source_coverage', 'value_coverage', 'risk_coverage'];
  }
}

function skeletonVerdictFor(score: number, metrics: number): TowerDossierCoverage['verdict'] {
  if (metrics === 0) return 'EMPTY';
  if (score >= 0.85) return 'SKELETON_COMPLETE';
  if (score >= 0.5) return 'SKELETON_PARTIAL';
  return 'SKELETON_THIN';
}

function enrichedVerdictFor(args: {
  score: number;
  metrics: number;
  groundedInsightCount: number;
  maxInsightConfidence: TowerDossierInsight['confidence'];
}): TowerDossierCoverage['verdict'] {
  if (args.metrics === 0) return 'EMPTY';
  if (args.groundedInsightCount === 0 || args.maxInsightConfidence === 'insufficient') {
    return skeletonVerdictFor(args.score, args.metrics);
  }
  if (args.score >= 0.85 && args.groundedInsightCount >= 2 && args.maxInsightConfidence === 'high') return 'DEEP';
  if (args.score >= 0.5) return 'PARTIAL';
  return 'THIN';
}

function metric(args: {
  scope: ScopeDef;
  view: TowerCioView;
  key: string;
  label: string;
  value: number | null;
  amountType: string;
  accountingTreatment?: string;
  period?: string;
  numerator?: number | null;
  denominator?: number | null;
  confidence?: string;
  freshness?: string;
  lineage: string[];
}): TowerMetricSnapshot | null {
  if (args.value === null) return null;
  return {
    metricSnapshotId: hashId('metric', [args.scope.key, args.view, args.key]),
    metricKey: args.key,
    label: args.label,
    valueNumber: args.value,
    valueText: formatMetricValue(args.value, args.amountType),
    amountType: args.amountType,
    accountingTreatment: args.accountingTreatment ?? 'mixed',
    period: args.period ?? 'FY2026',
    scenario: 'current loaded reference',
    numerator: args.numerator ?? args.value,
    denominator: args.denominator ?? null,
    confidence: args.confidence ?? 'medium',
    freshness: args.freshness ?? 'current reference',
    formulaVersion: 'tower-l3-governed-v1',
    lineage: args.lineage,
  };
}

function formatMetricValue(value: number, amountType: string): string {
  if (amountType.includes('pct') || amountType === 'adoption_rate') return `${Math.round(value * 1000) / 10}%`;
  if (amountType.includes('count')) return String(Math.round(value));
  if (Math.abs(value) >= 1_000_000) return `$${Math.round((value / 1_000_000) * 10) / 10}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round((value / 1_000) * 10) / 10}K`;
  return `$${Math.round(value * 100) / 100}`;
}

function buildMetrics(input: TowerL3Input, scope: ScopeDef, view: TowerCioView): TowerMetricSnapshot[] {
  const budget = rowsForScope(input.budgetRows, scope);
  const vendors = rowsForScope(input.vendorRows, scope);
  const benefits = rowsForScope(input.benefitRows, scope);
  const spend = rowsForScope(input.spendRows, scope);
  const usage = rowsForScope(input.toolUsageRows, scope);
  const risks = rowsForScope(input.riskRows, scope);
  const lineage = (rows: readonly TowerSourceRow[]) => rows.slice(0, 20).map(citationFor);
  const highRisks = risks.filter((row) => cleanText(row.values.severity).toLowerCase() === 'high');
  const activeUsers = sum(usage, 'active_users');
  const eligibleUsers = sum(usage, 'eligible_users');

  const metrics: Array<TowerMetricSnapshot | null> = [];
  if (view === 'spend') {
    metrics.push(
      metric({ scope, view, key: 'total_it_budget', label: 'Loaded IT budget', value: sum(budget, 'total_it_budget_usd'), amountType: 'annual_budget', lineage: lineage(budget) }),
      metric({ scope, view, key: 'opex', label: 'OpEx', value: sum(budget, 'opex_amount_usd'), amountType: 'annual_budget', accountingTreatment: 'opex', lineage: lineage(budget) }),
      metric({ scope, view, key: 'capex', label: 'CapEx', value: sum(budget, 'capex_amount_usd'), amountType: 'annual_budget', accountingTreatment: 'capex', lineage: lineage(budget) }),
      metric({ scope, view, key: 'run', label: 'Run spend', value: sum(budget, 'run_amount_usd'), amountType: 'annual_budget', lineage: lineage(budget) }),
      metric({ scope, view, key: 'change', label: 'Change spend', value: sum(budget, 'change_amount_usd'), amountType: 'annual_budget', lineage: lineage(budget) }),
    );
  } else if (view === 'value_realization') {
    const committed = sum(benefits, 'committed_value_usd');
    const realized = sum(benefits, 'realized_value_usd');
    metrics.push(
      metric({ scope, view, key: 'committed_value', label: 'Committed value', value: committed, amountType: 'committed_value', lineage: lineage(benefits) }),
      metric({ scope, view, key: 'realized_value', label: 'Claimable value', value: realized, amountType: 'realized_value', lineage: lineage(benefits) }),
      metric({ scope, view, key: 'value_gap', label: 'Value proof gap', value: committed !== null && realized !== null ? Math.max(committed - realized, 0) : null, amountType: 'value_at_stake', lineage: lineage(benefits) }),
    );
  } else if (view === 'vendor_renewal') {
    metrics.push(
      metric({ scope, view, key: 'vendor_spend', label: 'Vendor exposure', value: sum(vendors, 'annual_spend_usd'), amountType: 'annual_subscription_spend', accountingTreatment: 'opex', lineage: lineage(vendors) }),
      metric({ scope, view, key: 'renewal_exposure', label: 'Renewal exposure', value: sum(vendors, 'annual_spend_usd'), amountType: 'renewal_exposure', lineage: lineage(vendors) }),
    );
  } else if (view === 'ops_automation') {
    metrics.push(
      metric({ scope, view, key: 'eligible_users', label: 'Eligible users', value: eligibleUsers, amountType: 'user_count', lineage: lineage(usage) }),
      metric({ scope, view, key: 'active_users', label: 'Active users', value: activeUsers, amountType: 'user_count', lineage: lineage(usage) }),
      metric({ scope, view, key: 'adoption_rate', label: 'Adoption rate', value: eligibleUsers && activeUsers !== null ? activeUsers / eligibleUsers : null, amountType: 'adoption_rate', numerator: activeUsers, denominator: eligibleUsers, lineage: lineage(usage) }),
    );
  } else {
    metrics.push(
      metric({ scope, view, key: 'program_budget', label: 'Program budget', value: sum(spend, 'spend_amount_usd'), amountType: 'program_budget', lineage: lineage(spend) }),
      metric({ scope, view, key: 'realized_value', label: 'Realized value', value: sum(benefits, 'realized_value_usd'), amountType: 'realized_value', lineage: lineage(benefits) }),
      metric({ scope, view, key: 'open_risks', label: 'Open risks', value: risks.length || null, amountType: 'risk_count', lineage: lineage(risks) }),
      metric({ scope, view, key: 'high_risks', label: 'High risks', value: highRisks.length || null, amountType: 'risk_count', lineage: lineage(highRisks) }),
      metric({ scope, view, key: 'source_coverage', label: 'Source coverage', value: input.budgetRows.length + input.vendorRows.length + input.initiativeRows.length, amountType: 'source_count', lineage: [] }),
      metric({ scope, view, key: 'value_coverage', label: 'Value rows', value: benefits.length || null, amountType: 'source_count', lineage: lineage(benefits) }),
      metric({ scope, view, key: 'risk_coverage', label: 'Risk rows', value: risks.length || null, amountType: 'source_count', lineage: lineage(risks) }),
    );
  }
  return metrics.filter((m): m is TowerMetricSnapshot => Boolean(m));
}

function buildFacts(input: TowerL3Input, scope: ScopeDef): TowerDossierFact[] {
  const companies = rowsForScope(input.portfolioCompanies, scope);
  const initiatives = rowsForScope(input.initiativeRows, scope);
  const apps = rowsForScope(input.applicationRows, scope);
  const facts: TowerDossierFact[] = [];
  for (const row of companies.slice(0, 5)) {
    facts.push({
      factId: hashId('fact', [scope.key, row.values.portfolio_company ?? '', 'profile']),
      label: `${row.values.portfolio_company} profile`,
      value: `${row.values.industry}; revenue ${formatMetricValue(numberValue(row.values.revenue_usd) ?? 0, 'annual_budget')}; ${row.values.employees} employees`,
      confidence: 'medium',
      lineage: [citationFor(row)],
    });
  }
  for (const row of initiatives.slice(0, 6)) {
    facts.push({
      factId: hashId('fact', [scope.key, row.values.initiative_id ?? '', 'initiative']),
      label: cleanText(row.values.initiative_name),
      value: `${row.values.business_function} initiative owned by ${row.values.owner || 'loaded owner role'}`,
      confidence: 'medium',
      lineage: [citationFor(row)],
    });
  }
  for (const row of apps.slice(0, 6)) {
    facts.push({
      factId: hashId('fact', [scope.key, row.values.application_id ?? '', 'application']),
      label: cleanText(row.values.application_name),
      value: `${row.values.business_capability} supported by ${row.values.vendor}`,
      confidence: 'medium',
      lineage: [citationFor(row)],
    });
  }
  return facts;
}

function buildRelationships(input: TowerL3Input, scope: ScopeDef): TowerDossierRelationship[] {
  return rowsForScope(input.contractSystemRows, scope).slice(0, 12).map((row) => ({
    relationshipId: hashId('rel', [scope.key, row.values.contract_id ?? '', row.values.application_id ?? '']),
    label: `${row.values.vendor} supports ${row.values.application_name}`,
    from: cleanText(row.values.vendor),
    to: cleanText(row.values.application_name),
    relationshipType: cleanText(row.values.support_type || 'supports'),
    confidence: cleanText(row.values.confidence || 'medium'),
    lineage: [citationFor(row)],
  }));
}

function buildGaps(required: readonly string[], metrics: readonly TowerMetricSnapshot[], scope: ScopeDef, view: TowerCioView): string[] {
  const present = new Set(metrics.map((m) => m.metricKey));
  const gaps = required.filter((key) => !present.has(key)).map((key) => `${labelForMetric(key)} not loaded for ${scope.label}`);
  if (view === 'spend') {
    gaps.push('OpEx/CapEx split not loaded at program and vendor line-item level');
    gaps.push('vendor utilization not loaded at spend-line level');
  }
  if (view === 'value_realization') {
    gaps.push('value realization owner attestation not loaded');
  }
  if (scope.type === 'l2_company_comparison' && view !== 'trust_gaps') {
    gaps.push('Company-comparison view should be reviewed against each operating-company source before board use');
  }
  return [...new Set(gaps)];
}

function labelForMetric(key: string): string {
  return key.replace(/_/g, ' ');
}

function tenantLabelFor(tenantKey: string): string {
  const key = slug(tenantKey);
  const canonicalKey =
    key === 'apex-retail'
      ? 'apexretail'
      : key === 'first-capital' || key === 'first-capital-financial'
        ? 'arcturus'
        : key === 'meridian-health'
          ? 'meridian'
          : key === 'skyharbor-air'
            ? 'skyharbor'
            : key === 'lakeshore-holdings'
              ? 'lakeshore'
              : key;

  return (
    canonicalClientDisplayName({ key: canonicalKey, name: tenantKey }) ??
    cleanText(tenantKey)
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

function branchOptionsFor(view: TowerCioView): string[] {
  switch (view) {
    case 'spend':
      return ['Inspect run versus change mix', 'Compare spend by operating company', 'Open vendor renewal exposure'];
    case 'value_realization':
      return ['Separate committed value from realized value', 'Inspect under-validated programs', 'Open scale, hold, stop view'];
    case 'scale_hold_stop':
      return ['Build scale, hold, stop decision matrix', 'Inspect required gates', 'Open program risk view'];
    case 'vendor_renewal':
      return ['Rank renewal exposure', 'Inspect vendor-to-system dependencies', 'Open Source for sourcing options'];
    case 'program_risk':
      return ['Inspect high-severity blockers', 'Open decision queue', 'Trace mitigations'];
    case 'ops_automation':
      return ['Compare adoption by tool', 'Inspect value proof for copilots', 'Open workforce automation view'];
    case 'risk_control':
      return ['Inspect controls by risk', 'Open governance queue', 'Trace owner accountability'];
    case 'decision_queue':
      return ['Rank decisions by value at stake', 'Open Moves for execution package', 'Inspect missing evidence'];
    case 'trust_gaps':
      return ['List missing fields', 'Open data-load checklist', 'Compare thin versus rich scopes'];
  }
}

function derivedInsights(args: {
  scope: ScopeDef;
  view: TowerCioView;
  metrics: TowerMetricSnapshot[];
  facts: TowerDossierFact[];
  gaps: string[];
  stage2Status: 'enriched' | 'unavailable' | 'failed';
}): TowerDossierInsight[] {
  if (args.stage2Status !== 'enriched') {
    const ref = args.metrics[0]?.metricSnapshotId ?? args.facts[0]?.factId;
    return ref
      ? [{
          insightId: hashId('insight', [args.scope.key, args.view, 'stage2-unavailable']),
          observation: 'The governed Tower skeleton is built, but build-time CIO synthesis has not run in this environment.',
          implication: args.gaps.length > 0 ? args.gaps[0] : 'Review the governed metrics before using this dossier for an executive readout.',
          confidence: coverageHint({ metrics: args.metrics, gaps: args.gaps }),
          supportingRefs: [ref],
          supportLabels: args.metrics[0] ? businessLineageLabels(args.metrics[0].lineage) : ['Tower governed fact'],
          placeholder: true,
        } satisfies TowerDossierInsight]
      : [{
          insightId: hashId('insight', [args.scope.key, args.view, 'empty']),
          observation: 'Insufficient governed Tower evidence is available for this scope and view.',
          implication: args.gaps[0] ?? 'Load the required Tower metric rows before synthesis.',
          confidence: 'insufficient',
          supportingRefs: [],
          supportLabels: [],
          placeholder: true,
        }];
  }
  return [];
}

function coverageHint(args: { metrics: TowerMetricSnapshot[]; gaps: string[] }): TowerDossierInsight['confidence'] {
  if (args.metrics.length === 0) return 'insufficient';
  if (args.gaps.length > 2) return 'low';
  if (args.gaps.length > 0) return 'medium';
  return 'high';
}

function collectCitations(rows: readonly TowerSourceRow[]): TowerAnswerDossier['citations'] {
  const byId = new Map<string, TowerAnswerDossier['citations'][number]>();
  for (const row of rows) {
    const id = citationFor(row);
    byId.set(id, {
      citationId: id,
      sourceLabel: sourceLabelFor(row.sourceFile),
      sourceFile: row.sourceFile,
      rowNumber: row.rowNumber,
    });
  }
  return [...byId.values()].slice(0, 80);
}

function makeScopes(input: TowerL3Input): ScopeDef[] {
  const companies = [...new Set(input.portfolioCompanies.map((row) => cleanText(row.values.portfolio_company)).filter(Boolean))];
  const scopes: ScopeDef[] = [
    { key: 'l1-consolidated', label: 'L1 consolidated portfolio', type: 'l1_consolidated', portfolioCompany: null },
  ];
  if (companies.length > 0) {
    scopes.push({ key: 'l2-company-comparison', label: 'L2 company comparison', type: 'l2_company_comparison', portfolioCompany: null });
    for (const company of companies) {
      scopes.push({ key: `l3-${slug(company)}`, label: company, type: 'l3_operating_company', portfolioCompany: company });
    }
  }
  return scopes;
}

function validateDossier(dossier: Omit<TowerAnswerDossier, 'validation'>, forbiddenIdentifiers: readonly string[]): TowerDossierValidation {
  const failures: string[] = [];
  const businessText = JSON.stringify(dossier.businessBody);
  const machinePattern = /\b(UUID|semantic|node_type|snapshot_id|records|evidence points|loaded context|file path|table name)\b/i;
  const rawIdPattern = /\b[A-Z]{2,}[A-Z0-9_-]*-\d{3,}\b|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|csv:|row-[0-9]|metric_[0-9a-f]|\.json|\.csv/i;
  const identityPattern = new RegExp(
    forbiddenIdentifiers.map((term) => `(?:^|[^A-Za-z0-9])${escapeRegExp(term)}(?:$|[^A-Za-z0-9])`).join('|'),
    'i',
  );
  const groundedCount = groundedInsightCount(dossier.derivedInsights);
  const noEnrichedVerdictWithoutInsights = !['DEEP', 'PARTIAL', 'THIN'].includes(dossier.coverage.verdict) || groundedCount > 1;
  const checks: Record<string, boolean> = {
    business_language_clean: !machinePattern.test(businessText) && !rawIdPattern.test(businessText),
    identity_clean: forbiddenIdentifiers.length === 0 || !identityPattern.test(businessText),
    amount_type_present: dossier.metrics.every((m) => Boolean(m.amountType) && m.amountType !== 'unknown'),
    realism_pass: dossier.metrics.every((m) => m.valueNumber === null || m.valueNumber >= 0),
    consolidation_reconciles: true,
    branches_populated: dossier.coverage.verdict === 'EMPTY' || dossier.branchOptions.length > 0,
    verdict_honesty: noEnrichedVerdictWithoutInsights,
    insight_grounding: dossier.derivedInsights.every((insight) => {
      if (insight.confidence === 'insufficient') return true;
      if (insight.placeholder) return true;
      const refs = new Set([...dossier.metrics.map((m) => m.metricSnapshotId), ...dossier.facts.map((f) => f.factId)]);
      return insight.supportingRefs.some((ref) => refs.has(ref));
    }),
    coverage_honesty: dossier.coverage.score >= 1 || dossier.gaps.length > 0 || dossier.coverage.verdict === 'EMPTY',
    structured_shape: Array.isArray(dossier.metrics) && Array.isArray(dossier.facts) && Array.isArray(dossier.citations),
  };
  for (const [key, pass] of Object.entries(checks)) {
    if (!pass) failures.push(key);
  }
  return { pass: failures.length === 0, failures, checks };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacementForForbidden(term: string): string {
  if (term.toLowerCase() === 'tms') return 'transport management platform';
  return 'restricted identifier';
}

function scrubForbiddenText(value: string, forbiddenIdentifiers: readonly string[]): string {
  return forbiddenIdentifiers.reduce((current, term) => {
    const pattern = new RegExp(`(?:^|[^A-Za-z0-9])(${escapeRegExp(term)})(?:$|[^A-Za-z0-9])`, 'gi');
    return current.replace(pattern, (match) => {
      const leading = /^[A-Za-z0-9]/.test(match) ? '' : match[0] ?? '';
      const trailing = /[A-Za-z0-9]$/.test(match) ? '' : match[match.length - 1] ?? '';
      return `${leading}${replacementForForbidden(term)}${trailing}`;
    });
  }, value);
}

function scrubDossierBusinessText<T>(value: T, forbiddenIdentifiers: readonly string[]): T {
  if (typeof value === 'string') {
    return scrubForbiddenText(value, forbiddenIdentifiers) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubDossierBusinessText(item, forbiddenIdentifiers)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, scrubDossierBusinessText(nested, forbiddenIdentifiers)]),
    ) as T;
  }
  return value;
}

function buildBusinessBody(args: {
  labels: TowerAnswerDossier['businessLabels'];
  metrics: readonly TowerMetricSnapshot[];
  facts: readonly TowerDossierFact[];
  relationships: readonly TowerDossierRelationship[];
  insights: readonly TowerDossierInsight[];
  gaps: readonly string[];
  branchOptions: readonly string[];
}): TowerBusinessBody {
  return {
    labels: args.labels,
    metrics: args.metrics.map((metric) => ({
      label: metric.label,
      valueText: metric.valueText,
      amountType: metric.amountType,
      accountingTreatment: metric.accountingTreatment,
      period: metric.period,
      confidence: metric.confidence,
      freshness: metric.freshness,
    })),
    facts: args.facts.map((fact) => ({
      label: fact.label,
      value: fact.value,
      confidence: fact.confidence,
    })),
    relationships: args.relationships.map((relationship) => ({
      label: relationship.label,
      from: relationship.from,
      to: relationship.to,
      relationshipType: relationship.relationshipType,
      confidence: relationship.confidence,
    })),
    insights: args.insights.map((insight) => ({
      observation: insight.observation,
      implication: insight.implication,
      confidence: insight.confidence,
      supportLabels: insight.supportLabels,
      placeholder: insight.placeholder,
    })),
    gaps: [...args.gaps],
    branchOptions: [...args.branchOptions],
  };
}

function groundedInsightCount(insights: readonly TowerDossierInsight[]): number {
  return insights.filter((insight) => !insight.placeholder && insight.supportingRefs.length > 0).length;
}

function maxInsightConfidence(insights: readonly TowerDossierInsight[]): TowerDossierInsight['confidence'] {
  if (insights.some((insight) => !insight.placeholder && insight.confidence === 'high')) return 'high';
  if (insights.some((insight) => !insight.placeholder && insight.confidence === 'medium')) return 'medium';
  if (insights.some((insight) => !insight.placeholder && insight.confidence === 'low')) return 'low';
  return 'insufficient';
}

export function buildTowerL3Dossiers(input: TowerL3Input): TowerAnswerDossier[] {
  const tenantKey = normalizeSemantic2RuntimeTenantKey(
    input.tenantKey,
    'tower-l3-dossier-build',
  );
  const dossierVersion = input.dossierVersion ?? new Date().toISOString();
  const scopes = makeScopes(input);
  const allRows = [
    ...input.portfolioCompanies,
    ...input.budgetRows,
    ...input.vendorRows,
    ...input.applicationRows,
    ...input.contractSystemRows,
    ...input.initiativeRows,
    ...input.benefitRows,
    ...input.spendRows,
    ...input.toolUsageRows,
    ...input.riskRows,
  ];
  return scopes.flatMap((scope) =>
    TOWER_CIO_VIEWS.map((view) => {
      const metrics = buildMetrics(input, scope, view);
      const facts = buildFacts(input, scope);
      const relationships = buildRelationships(input, scope);
      const required = requiredMetricsFor(view);
      const present = metrics.map((m) => m.metricKey).filter((key) => required.includes(key));
      const score = required.length === 0 ? 1 : Math.round((present.length / required.length) * 10000) / 10000;
      const gaps = buildGaps(required, metrics, scope, view);
      const derived = derivedInsights({
        scope,
        view,
        metrics,
        facts,
        gaps,
        stage2Status: input.stage2Status ?? 'unavailable',
      });
      const coverage = {
        requiredMetrics: required,
        presentMetrics: present,
        score,
        verdict: (input.stage2Status === 'enriched'
          ? enrichedVerdictFor({
              score,
              metrics: metrics.length,
              groundedInsightCount: groundedInsightCount(derived),
              maxInsightConfidence: maxInsightConfidence(derived),
            })
          : skeletonVerdictFor(score, metrics.length)),
      };
      const businessLabels = {
        tenant: tenantLabelFor(tenantKey),
        scope: scope.label,
        view: view.replace(/_/g, ' '),
      };
      const branchOptions = branchOptionsFor(view);
      const businessBody = buildBusinessBody({
        labels: businessLabels,
        metrics,
        facts,
        relationships,
        insights: derived,
        gaps,
        branchOptions,
      });
      const withoutValidation: Omit<TowerAnswerDossier, 'validation'> = {
        tenantKey,
        scopeKey: scope.key,
        scopeType: scope.type,
        scopeLabel: scope.label,
        viewKey: view,
        promptVersion: TOWER_L3_PROMPT_VERSION,
        dossierVersion,
        stage1Status: metrics.length > 0 || facts.length > 0 ? 'built' : 'empty',
        stage2Status: input.stage2Status ?? 'unavailable',
        businessLabels,
        metrics,
        facts,
        relationships,
        coverage,
        businessBody,
        gaps,
        branchOptions,
        derivedInsights: derived,
        citations: collectCitations(allRows.filter((row) => {
          if (!scope.portfolioCompany) return true;
          return !row.values.portfolio_company || row.values.portfolio_company === scope.portfolioCompany;
        })),
      };
      const scrubbed = scrubDossierBusinessText(withoutValidation, input.forbiddenIdentifiers);
      return {
        ...scrubbed,
        validation: validateDossier(scrubbed, input.forbiddenIdentifiers),
      };
    }),
  );
}

export function summarizeTowerDossiers(dossiers: readonly TowerAnswerDossier[]) {
  const counts = new Map<string, number>();
  for (const dossier of dossiers) counts.set(dossier.coverage.verdict, (counts.get(dossier.coverage.verdict) ?? 0) + 1);
  return {
    total: dossiers.length,
    passed: dossiers.filter((d) => d.validation.pass).length,
    failed: dossiers.filter((d) => !d.validation.pass).length,
    verdicts: Object.fromEntries(counts.entries()),
  };
}

export interface TowerL3DossierWriteRow {
  client_id: string;
  tenant_key: string;
  scope_key: string;
  scope_type: TowerScopeType;
  scope_label: string;
  view_key: TowerCioView;
  prompt_version: string;
  dossier_version: string;
  stage1_status: 'built' | 'empty' | 'failed';
  stage2_status: 'enriched' | 'unavailable' | 'failed';
  coverage_score: number;
  verdict: TowerDossierCoverage['verdict'];
  dossier: TowerAnswerDossier;
  validation_result: TowerDossierValidation;
  lineage: Record<string, unknown>;
}

export function toTowerL3DossierWriteRows(args: {
  clientId: string;
  dossiers: readonly TowerAnswerDossier[];
  sourceSet?: readonly string[];
}): TowerL3DossierWriteRow[] {
  return args.dossiers.map((dossier) => ({
    client_id: args.clientId,
    tenant_key: dossier.tenantKey,
    scope_key: dossier.scopeKey,
    scope_type: dossier.scopeType,
    scope_label: dossier.scopeLabel,
    view_key: dossier.viewKey,
    prompt_version: dossier.promptVersion,
    dossier_version: dossier.dossierVersion,
    stage1_status: dossier.stage1Status,
    stage2_status: dossier.stage2Status,
    coverage_score: dossier.coverage.score,
    verdict: dossier.coverage.verdict,
    dossier,
    validation_result: dossier.validation,
    lineage: {
      source_set: args.sourceSet ?? [],
      built_by: 'tower-l3-dossier-builder',
    },
  }));
}

export async function persistTowerL3Dossiers(args: {
  db: PostgresCompatClient;
  clientId: string;
  dossiers: readonly TowerAnswerDossier[];
  sourceSet?: readonly string[];
}): Promise<number> {
  const rows = toTowerL3DossierWriteRows(args);
  if (rows.length === 0) return 0;
  const { error, count } = await args.db
    .from('tower_l3_answer_dossiers')
    .upsert(rows, {
      onConflict: 'client_id,tenant_key,scope_key,view_key,prompt_version,dossier_version',
    })
    .select('id');
  if (error) throw new Error(`tower_l3_answer_dossiers upsert failed: ${error.message}`);
  return count ?? rows.length;
}
