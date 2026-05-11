import { createHash } from 'node:crypto';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  type EnterpriseContextCsvRow,
  type EnterpriseContextIngestionPlan,
  type ParsedEnterpriseContextDataset,
} from './ingestion/meridian-loader';

export type MeridianRefreshSnapshotKey = 'week-0' | 'week-1' | 'month-1';

export interface MeridianRefreshScenario {
  scenarioKey: string;
  snapshotKey: MeridianRefreshSnapshotKey;
  title: string;
  domain: string;
  recordType: string;
  sourceRecordId: string;
  changeType:
    | 'new'
    | 'changed'
    | 'closed'
    | 'stale'
    | 'canonicalized'
    | 'worsened';
  owner: string;
  stewardshipSignal: string;
}

export interface MeridianRefreshDiff {
  newRecords: number;
  changedRecords: number;
  removedRecords: number;
  newFacts: number;
  changedFacts: number;
  supersededFacts: number;
  newRelationships: number;
  changedRelationships: number;
  removedRelationships: number;
  newQualityIssues: number;
  resolvedQualityIssues: number;
  stewardshipTasksCreated: number;
  activeRecords: number;
}

export interface MeridianRefreshSnapshot {
  snapshotKey: MeridianRefreshSnapshotKey;
  label: string;
  asOfDate: string;
  tables: Record<string, EnterpriseContextCsvRow[]>;
  planSummary: EnterpriseContextIngestionPlan['summary'];
  diffFromPrevious: MeridianRefreshDiff;
  scenarios: MeridianRefreshScenario[];
  datasetHash: string;
}

export interface MeridianRefreshSimulation {
  tenantKey: string;
  generatedAt: string;
  snapshots: MeridianRefreshSnapshot[];
  report: {
    totalScenarios: number;
    refreshCadence: 'weekly-and-monthly';
    preservesHistory: true;
    duplicateStrategy: 'stable-id-upsert';
    snapshots: Array<{
      snapshotKey: MeridianRefreshSnapshotKey;
      label: string;
      activeRecords: number;
      changedRecords: number;
      newRecords: number;
      supersededFacts: number;
      stewardshipTasksCreated: number;
    }>;
  };
}

const GENERATED_AT = '2026-05-11T00:00:00.000Z';

export function buildMeridianRefreshSimulation(
  parsed: ParsedEnterpriseContextDataset,
): MeridianRefreshSimulation {
  const week0Tables = cloneTables(parsed.tables);
  const week1Result = applyWeek1Refresh(week0Tables);
  const month1Result = applyMonth1Refresh(week1Result.tables);

  const snapshotsInput = [
    {
      snapshotKey: 'week-0' as const,
      label: 'Week 0 baseline',
      asOfDate: '2026-05-01',
      tables: week0Tables,
      scenarios: [] as MeridianRefreshScenario[],
    },
    {
      snapshotKey: 'week-1' as const,
      label: 'Week 1 operational refresh',
      asOfDate: '2026-05-08',
      tables: week1Result.tables,
      scenarios: week1Result.scenarios,
    },
    {
      snapshotKey: 'month-1' as const,
      label: 'Month 1 operating refresh',
      asOfDate: '2026-06-01',
      tables: month1Result.tables,
      scenarios: month1Result.scenarios,
    },
  ];

  const snapshots: MeridianRefreshSnapshot[] = [];
  let previousPlan: EnterpriseContextIngestionPlan | null = null;
  for (const input of snapshotsInput) {
    const snapshotParsed = withTables(parsed, input.tables, input.asOfDate);
    const plan = buildMeridianEnterpriseContextIngestionPlan(snapshotParsed);
    const diff = previousPlan
      ? diffPlans(previousPlan, plan, input.scenarios.length)
      : emptyDiff(plan.summary.records);
    snapshots.push({
      snapshotKey: input.snapshotKey,
      label: input.label,
      asOfDate: input.asOfDate,
      tables: input.tables,
      planSummary: plan.summary,
      diffFromPrevious: diff,
      scenarios: input.scenarios,
      datasetHash: hashJson(input.tables),
    });
    previousPlan = plan;
  }

  return {
    tenantKey: parsed.manifest.tenantKey,
    generatedAt: GENERATED_AT,
    snapshots,
    report: {
      totalScenarios: snapshots.reduce((sum, snapshot) => sum + snapshot.scenarios.length, 0),
      refreshCadence: 'weekly-and-monthly',
      preservesHistory: true,
      duplicateStrategy: 'stable-id-upsert',
      snapshots: snapshots.map((snapshot) => ({
        snapshotKey: snapshot.snapshotKey,
        label: snapshot.label,
        activeRecords: snapshot.diffFromPrevious.activeRecords,
        changedRecords: snapshot.diffFromPrevious.changedRecords,
        newRecords: snapshot.diffFromPrevious.newRecords,
        supersededFacts: snapshot.diffFromPrevious.supersededFacts,
        stewardshipTasksCreated: snapshot.diffFromPrevious.stewardshipTasksCreated,
      })),
    },
  };
}

function applyWeek1Refresh(tables: Record<string, EnterpriseContextCsvRow[]>) {
  const next = cloneTables(tables);
  const scenarios: MeridianRefreshScenario[] = [];

  updateRow(next.cmdb_applications_services, 'ci_id', 'CI-APP-SERVICENOW', (row) => {
    row.application_owner = 'Enterprise Service Management Office';
    row.technical_owner = 'IT Service Management Platform Team';
    row.support_group = 'Enterprise Service Management';
    row.last_validated_date = '2026-05-08';
    row.source_record_id = 'CI-APP-SERVICENOW-W1';
  });
  scenarios.push(scenario('week-1', 'owner-change', 'ServiceNow ownership changed after CIO operations review.', 'CMDB', 'cmdb_applications_services', 'CI-APP-SERVICENOW', 'changed', 'Enterprise Service Management Office', 'Confirm decision rights and update application stewardship.'));

  updateRow(next.renewal_calendar, 'renewal_id', 'REN-GENESYS-2027', (row) => {
    row.renewal_date = '2027-04-30';
    row.notice_date = '2026-10-15';
    row.renewal_risk = 'Critical';
    row.status = 'Sourcing required';
    row.last_validated_date = '2026-05-08';
  });
  scenarios.push(scenario('week-1', 'renewal-date-change', 'Genesys renewal moved earlier and now requires sourcing action.', 'Contracts', 'renewal_calendar', 'REN-GENESYS-2027', 'changed', 'IT Sourcing', 'Create Source event or attach to existing contact center sourcing path.'));

  appendIncidents(next.incidents, 'W1', 8, '2026-05-08');
  scenarios.push(scenario('week-1', 'new-incidents', 'Eight new contact-center and integration incidents arrived from ITSM export.', 'Incidents', 'incidents', 'INC-RF-W1-*', 'new', 'Integration Operations', 'Review incident trend before approving dependent moves.'));

  updateRow(next.problems, 'problem_id', 'PRB0001800', (row) => {
    row.closed_at = '2026-05-07';
    row.status = 'Closed';
    row.known_error = 'false';
    row.workaround_available = 'true';
    row.last_validated_date = '2026-05-08';
  });
  scenarios.push(scenario('week-1', 'closed-problem', 'First open integration problem closed with workaround validated.', 'Problems', 'problems', 'PRB0001800', 'closed', 'Integration Operations', 'Supersede open blocker signal and keep closure evidence.'));

  updateRow(next.cmdb_applications_services, 'ci_id', 'CI-SVC-CONTACT-CENTER', (row) => {
    row.support_group = 'Digital Contact Center Platform';
    row.technical_owner = 'Contact Center Platform Engineering';
    row.last_validated_date = '2026-05-08';
  });
  scenarios.push(scenario('week-1', 'support-group-change', 'Contact center service support group changed to platform engineering.', 'CMDB', 'cmdb_applications_services', 'CI-SVC-CONTACT-CENTER', 'changed', 'Contact Center Platform Engineering', 'Revalidate incident routing and sourcing owner.'));

  const policy = cloneRow(next.policies_procedures.find((row) => row.policy_id === 'POL-004'));
  if (policy) {
    policy.policy_id = 'POL-004-V2';
    policy.policy_name = 'Third-Party Risk Review for AI-Enabled Contact Center';
    policy.version = 'v2.0';
    policy.effective_date = '2026-05-08';
    policy.next_review_date = '2026-11-08';
    policy.source_record_id = 'POL-4-v2';
    policy.last_validated_date = '2026-05-08';
    policy.notes_gaps = 'Supersedes POL-004 for AI-enabled contact-center sourcing.';
    next.policies_procedures.push(policy);
  }
  scenarios.push(scenario('week-1', 'new-policy-version', 'New third-party risk version added for AI-enabled contact center work.', 'Policies', 'policies_procedures', 'POL-004-V2', 'new', 'AI Governance Council', 'Require policy citation in Source artifacts and Move gate reviews.'));

  return { tables: next, scenarios };
}

function applyMonth1Refresh(tables: Record<string, EnterpriseContextCsvRow[]>) {
  const next = cloneTables(tables);
  const scenarios: MeridianRefreshScenario[] = [];

  updateRow(next.initiative_portfolio, 'initiative_id', 'INIT-001', (row) => {
    row.dependent_ci_ids = appendPipe(row.dependent_ci_ids, 'CI-SVC-CONTACT-CENTER');
    row.dependent_contract_ids = appendPipe(row.dependent_contract_ids, 'CON-GENESYS-2026');
    row.policy_constraints = appendPipe(row.policy_constraints, 'POL-004-V2');
    row.last_validated_date = '2026-06-01';
  });
  scenarios.push(scenario('month-1', 'new-initiative-dependency', 'Initiative dependency now includes contact center service, Genesys contract, and updated AI sourcing policy.', 'Initiatives', 'initiative_portfolio', 'INIT-001', 'changed', 'Enterprise PMO', 'Alert Moves and Tower that this initiative now shares sourcing dependencies.'));

  updateRow(next.cmdb_applications_services, 'ci_id', 'CI-INT-MIRTH', (row) => {
    row.last_validated_date = '2025-08-01';
    row.confidence = '0.73';
    row.evidence_usable = 'false';
    row.notes_gaps = 'CMDB ownership attestation is stale; integration dependency map requires steward review.';
  });
  scenarios.push(scenario('month-1', 'stale-cmdb-record', 'Mirth integration CI became stale and no longer evidence-usable.', 'CMDB', 'cmdb_applications_services', 'CI-INT-MIRTH', 'stale', 'Integration Operations', 'Open stewardship task before using this CI as cited evidence.'));

  updateRow(next.vendors_contract_inventory, 'contract_id', 'CON-AZURE-2026', (row) => {
    row.vendor_name = 'Microsoft Azure (canonicalized from MSFT Azure)';
    row.relationship_owner = 'Cloud Platform Services';
    row.last_validated_date = '2026-06-01';
    row.notes_gaps = 'Vendor alias canonicalized during refresh; preserve prior source label in evidence.';
  });
  scenarios.push(scenario('month-1', 'vendor-alias-canonicalization', 'MSFT Azure alias canonicalized to Microsoft Azure.', 'Vendors', 'vendors_contract_inventory', 'CON-AZURE-2026', 'canonicalized', 'Cloud Platform Services', 'Confirm alias map before contract/spend rollups.'));

  updateRow(next.spend_baseline, 'spend_id', 'SPEND-2026-01-EPIC', (row) => {
    row.actual_spend_usd = String(Number(row.actual_spend_usd) + 185000);
    row.run_rate_usd = String(Number(row.run_rate_usd) + 2220000);
    row.last_validated_date = '2026-06-01';
  });
  scenarios.push(scenario('month-1', 'spend-baseline-update', 'Oracle financials posted updated monthly spend baseline.', 'Spend', 'spend_baseline', 'SPEND-2026-01-EPIC', 'changed', 'Finance Systems', 'Refresh sourcing value-at-stake assumptions.'));

  updateRow(next.slas, 'sla_id', 'SLA-001', (row) => {
    row.breach_count_90d = String(Number(row.breach_count_90d) + 6);
    row.trending_status = 'Worsening';
    row.last_validated_date = '2026-06-01';
  });
  scenarios.push(scenario('month-1', 'sla-breach-worsened', 'SLA breach trend worsened for a tier-one service.', 'SLAs', 'slas', 'SLA-001', 'worsened', 'Service Reliability Office', 'Escalate operational risk before dependent sourcing or Move approval.'));

  return { tables: next, scenarios };
}

function diffPlans(
  previous: EnterpriseContextIngestionPlan,
  next: EnterpriseContextIngestionPlan,
  scenarioCount: number,
): MeridianRefreshDiff {
  const previousRecords = new Map(previous.records.map((record) => [record.canonicalRecordId, record]));
  const nextRecords = new Map(next.records.map((record) => [record.canonicalRecordId, record]));
  const previousFacts = new Map(previous.facts.map((fact) => [fact.factKey, fact]));
  const nextFacts = new Map(next.facts.map((fact) => [fact.factKey, fact]));
  const previousRelationships = new Map(previous.relationships.map((relationship) => [relationship.relationshipKey, relationship]));
  const nextRelationships = new Map(next.relationships.map((relationship) => [relationship.relationshipKey, relationship]));
  const previousIssues = new Set(previous.qualityIssues.map((issue) => issue.issueKey));
  const nextIssues = new Set(next.qualityIssues.map((issue) => issue.issueKey));

  const newRecords = countKeys(nextRecords, (key) => !previousRecords.has(key));
  const changedRecords = countKeys(nextRecords, (key, record) => previousRecords.get(key)?.payloadHash !== record.payloadHash && previousRecords.has(key));
  const removedRecords = countKeys(previousRecords, (key) => !nextRecords.has(key));
  const newFacts = countKeys(nextFacts, (key) => !previousFacts.has(key));
  const changedFacts = countKeys(nextFacts, (key, fact) => previousFacts.get(key)?.valueHash !== fact.valueHash && previousFacts.has(key));
  const newRelationships = countKeys(nextRelationships, (key) => !previousRelationships.has(key));
  const changedRelationships = countKeys(nextRelationships, (key, relationship) => (
    previousRelationships.has(key)
      && hashJson(previousRelationships.get(key)?.properties) !== hashJson(relationship.properties)
  ));
  const removedRelationships = countKeys(previousRelationships, (key) => !nextRelationships.has(key));
  const newQualityIssues = [...nextIssues].filter((key) => !previousIssues.has(key)).length;
  const resolvedQualityIssues = [...previousIssues].filter((key) => !nextIssues.has(key)).length;

  return {
    newRecords,
    changedRecords,
    removedRecords,
    newFacts,
    changedFacts,
    supersededFacts: changedFacts,
    newRelationships,
    changedRelationships,
    removedRelationships,
    newQualityIssues,
    resolvedQualityIssues,
    stewardshipTasksCreated: newQualityIssues + scenarioCount,
    activeRecords: next.summary.records,
  };
}

function emptyDiff(activeRecords: number): MeridianRefreshDiff {
  return {
    newRecords: 0,
    changedRecords: 0,
    removedRecords: 0,
    newFacts: 0,
    changedFacts: 0,
    supersededFacts: 0,
    newRelationships: 0,
    changedRelationships: 0,
    removedRelationships: 0,
    newQualityIssues: 0,
    resolvedQualityIssues: 0,
    stewardshipTasksCreated: 0,
    activeRecords,
  };
}

function appendIncidents(rows: EnterpriseContextCsvRow[], batchKey: string, count: number, validatedDate: string) {
  for (let index = 1; index <= count; index += 1) {
    rows.push({
      incident_id: `INC-RF-${batchKey}-${String(index).padStart(3, '0')}`,
      opened_at: `${validatedDate}T${String(8 + index).padStart(2, '0')}:15:00Z`,
      closed_at: index % 3 === 0 ? `${validatedDate}T${String(12 + index).padStart(2, '0')}:45:00Z` : '',
      ci_id: index % 2 === 0 ? 'CI-SVC-CONTACT-CENTER' : 'CI-INT-MIRTH',
      business_service: index % 2 === 0 ? 'Contact Center Operations' : 'Clinical Integration',
      priority: index <= 2 ? 'P1' : index <= 5 ? 'P2' : 'P3',
      severity: index <= 2 ? 'Critical' : 'Major',
      assignment_group: index % 2 === 0 ? 'Digital Contact Center Platform' : 'Integration Operations',
      short_description: `Refresh simulation incident ${batchKey}-${index}: integration latency or routing degradation without PHI.`,
      resolution_code: index % 3 === 0 ? 'Workaround applied' : '',
      breach_sla: index <= 4 ? 'true' : 'false',
      related_problem_id: index <= 3 ? 'PRB0001800' : '',
      source_system: 'ServiceNow',
      source_record_id: `INC-RF-${batchKey}-${String(index).padStart(3, '0')}`,
      source_owner: 'IT Service Management',
      last_validated_date: validatedDate,
      confidence: index <= 4 ? '0.84' : '0.81',
      evidence_usable: 'true',
      notes_gaps: '',
    });
  }
}

function scenario(
  snapshotKey: MeridianRefreshSnapshotKey,
  scenarioKey: string,
  title: string,
  domain: string,
  recordType: string,
  sourceRecordId: string,
  changeType: MeridianRefreshScenario['changeType'],
  owner: string,
  stewardshipSignal: string,
): MeridianRefreshScenario {
  return { snapshotKey, scenarioKey: `${snapshotKey}:${scenarioKey}`, title, domain, recordType, sourceRecordId, changeType, owner, stewardshipSignal };
}

function updateRow(
  rows: EnterpriseContextCsvRow[],
  key: string,
  value: string,
  updater: (row: EnterpriseContextCsvRow) => void,
) {
  const row = rows.find((candidate) => candidate[key] === value);
  if (!row) throw new Error(`Refresh simulator could not find ${key}=${value}`);
  updater(row);
}

function withTables(
  parsed: ParsedEnterpriseContextDataset,
  tables: Record<string, EnterpriseContextCsvRow[]>,
  asOfDate: string,
): ParsedEnterpriseContextDataset {
  return {
    ...parsed,
    manifest: {
      ...parsed.manifest,
      generatedAt: `${asOfDate}T00:00:00.000Z`,
      totalRows: Object.values(tables).reduce((sum, rows) => sum + rows.length, 0),
      datasets: parsed.manifest.datasets.map((dataset) => ({
        ...dataset,
        rows: tables[dataset.key]?.length ?? dataset.rows,
      })),
    },
    tables,
  };
}

function cloneTables(tables: Record<string, EnterpriseContextCsvRow[]>): Record<string, EnterpriseContextCsvRow[]> {
  return Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.map(cloneRow)]));
}

function cloneRow<T extends EnterpriseContextCsvRow | undefined>(row: T): T {
  return row ? ({ ...row } as T) : row;
}

function appendPipe(current: string | undefined, value: string): string {
  const parts = new Set((current ?? '').split('|').filter(Boolean));
  parts.add(value);
  return [...parts].join('|');
}

function countKeys<T>(map: Map<string, T>, predicate: (key: string, value: T) => boolean): number {
  let count = 0;
  for (const [key, value] of map.entries()) {
    if (predicate(key, value)) count += 1;
  }
  return count;
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
