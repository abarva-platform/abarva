export type PilotFinalBacklogRowId = 'T365' | 'T366' | 'T367' | 'T368';

export type PilotQaClientKey = 'apexretail' | 'meridian' | 'skyharbor';

export type PilotAlertSeverity = 'info' | 'warn' | 'critical';

export type PilotAlertMetric =
  | 'queue_failure_count'
  | 'parse_failure_rate_percent'
  | 'retry_storm_count'
  | 'long_running_job_minutes'
  | 'azure_daily_spend_usd';

export type PilotIsolationAction =
  | 'view'
  | 'upload'
  | 'approve'
  | 'commit'
  | 'export';

export type PilotLegalPackItemKey =
  | 'dpa'
  | 'baa'
  | 'prohibited_data'
  | 'retention'
  | 'offboarding'
  | 'no_training'
  | 'subprocessors';

export type PilotSmokeSurface =
  | 'sso'
  | 'setup'
  | 'api'
  | 'data_plane'
  | 'intelligence'
  | 'moves'
  | 'source'
  | 'tower'
  | 'audit_export';

export interface PilotAlertRule {
  metric: PilotAlertMetric;
  severity: PilotAlertSeverity;
  threshold: number;
  window: string;
  owner: string;
  evidence: string;
}

export interface PilotObservedMetric {
  metric: PilotAlertMetric;
  value: number;
}

export interface PilotAlertDecision {
  metric: PilotAlertMetric;
  triggered: boolean;
  severity: PilotAlertSeverity;
  message: string;
}

export interface PilotIsolationProbe {
  id: string;
  activeClient: PilotQaClientKey;
  requestedClient: PilotQaClientKey;
  action: PilotIsolationAction;
  expectedStatus: 403;
  evidence: string;
}

export interface PilotLegalPackItem {
  key: PilotLegalPackItemKey;
  title: string;
  requiredBeforeLiveFiles: boolean;
  owner: string;
  evidence: string;
}

export interface PilotSmokeStep {
  sequence: number;
  surface: PilotSmokeSurface;
  clientScope: readonly PilotQaClientKey[];
  assertion: string;
  evidence: string;
}

export const PILOT_FINAL_BACKLOG_ROWS: readonly PilotFinalBacklogRowId[] = [
  'T365',
  'T366',
  'T367',
  'T368',
];

export const PILOT_QA_CLIENTS: readonly PilotQaClientKey[] = [
  'apexretail',
  'meridian',
  'skyharbor',
];

export const PILOT_ALERT_RULES: readonly PilotAlertRule[] = [
  {
    metric: 'queue_failure_count',
    severity: 'critical',
    threshold: 1,
    window: '15 minutes',
    owner: 'Steward',
    evidence: 'Service Bus DLQ count and ingestion worker structured logs',
  },
  {
    metric: 'parse_failure_rate_percent',
    severity: 'warn',
    threshold: 5,
    window: '1 hour',
    owner: 'Data reviewer',
    evidence: 'pilot_ingestion_upload_runs.validation_summary',
  },
  {
    metric: 'retry_storm_count',
    severity: 'critical',
    threshold: 10,
    window: '15 minutes',
    owner: 'Steward',
    evidence: 'queue retry telemetry grouped by tenant and run key',
  },
  {
    metric: 'long_running_job_minutes',
    severity: 'warn',
    threshold: 20,
    window: 'per job',
    owner: 'AbarVa engineering',
    evidence: 'Container Apps job run duration and request telemetry',
  },
  {
    metric: 'azure_daily_spend_usd',
    severity: 'warn',
    threshold: 250,
    window: '24 hours',
    owner: 'AbarVa operations',
    evidence: 'Azure Cost Management daily spend grouped by pilot lane tags',
  },
];

export const PILOT_LEGAL_PACK: readonly PilotLegalPackItem[] = [
  {
    key: 'dpa',
    title: 'Data Processing Addendum',
    requiredBeforeLiveFiles: true,
    owner: 'AbarVa legal',
    evidence: 'signed DPA or customer-approved pilot order form attachment',
  },
  {
    key: 'baa',
    title: 'Business Associate Agreement decision',
    requiredBeforeLiveFiles: true,
    owner: 'AbarVa legal and customer privacy office',
    evidence: 'BAA signed for PHI-bearing pilots or written no-PHI attestation',
  },
  {
    key: 'prohibited_data',
    title: 'Prohibited data policy',
    requiredBeforeLiveFiles: true,
    owner: 'Tenant admin',
    evidence: 'upload attestation version captured on every upload run',
  },
  {
    key: 'retention',
    title: 'Retention and deletion schedule',
    requiredBeforeLiveFiles: true,
    owner: 'Tenant admin and AbarVa operations',
    evidence: 'policy version bound to file manifests, commits, and exports',
  },
  {
    key: 'offboarding',
    title: 'Pilot offboarding plan',
    requiredBeforeLiveFiles: true,
    owner: 'AbarVa customer lead',
    evidence: 'offboarding export, deletion, and customer receipt procedure',
  },
  {
    key: 'no_training',
    title: 'No model training commitment',
    requiredBeforeLiveFiles: true,
    owner: 'AbarVa legal',
    evidence: 'contract language or provider policy confirming no training on customer data',
  },
  {
    key: 'subprocessors',
    title: 'Subprocessor disclosure',
    requiredBeforeLiveFiles: true,
    owner: 'AbarVa legal',
    evidence: 'customer-visible list covering hosting, email, model, and observability providers',
  },
];

export const PILOT_SMOKE_STEPS: readonly PilotSmokeStep[] = [
  {
    sequence: 1,
    surface: 'sso',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'user signs in and resolves exactly one active client',
    evidence: 'browser session, resolved client key, and no cross-client names in first viewport',
  },
  {
    sequence: 2,
    surface: 'setup',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'Setup Data Load Center shows active-client workflow, readiness table, and work queue',
    evidence: 'screenshot and DOM text check for active client only',
  },
  {
    sequence: 3,
    surface: 'api',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'upload, approval, commit, and audit-export routes reject mismatched client requests',
    evidence: '403 responses for cross-client probes',
  },
  {
    sequence: 4,
    surface: 'data_plane',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'synthetic file lands, scans clean, validates, approves, and commits through the pilot ledger',
    evidence: 'upload run, file manifest, approval decision, load commit, and commit items',
  },
  {
    sequence: 5,
    surface: 'intelligence',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'Intelligence answers cite only the committed active-client evidence',
    evidence: 'answer trace with tenant key and evidence locator',
  },
  {
    sequence: 6,
    surface: 'moves',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'Moves recommendations reflect loaded dimensions and disclose missing dimensions',
    evidence: 'screen capture and trace bundle',
  },
  {
    sequence: 7,
    surface: 'source',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'Source output uses active-client vendor/context evidence only',
    evidence: 'vendor/context citation check',
  },
  {
    sequence: 8,
    surface: 'tower',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'Tower shows committed load effects without fallback-only counters',
    evidence: 'Tower panel screenshot and data-mode trace',
  },
  {
    sequence: 9,
    surface: 'audit_export',
    clientScope: PILOT_QA_CLIENTS,
    assertion: 'audit export includes upload, scan, quarantine, clarification, approval, commit, and rollback history',
    evidence: 'audit export manifest hash and table coverage list',
  },
];

export function evaluatePilotAlerts(
  observed: readonly PilotObservedMetric[],
): readonly PilotAlertDecision[] {
  return observed.map((row) => {
    const rule = PILOT_ALERT_RULES.find((candidate) => candidate.metric === row.metric);
    if (!rule) {
      return {
        metric: row.metric,
        triggered: false,
        severity: 'info',
        message: 'no alert rule configured for metric',
      };
    }

    const triggered = row.value >= rule.threshold;
    return {
      metric: row.metric,
      triggered,
      severity: triggered ? rule.severity : 'info',
      message: triggered
        ? `${row.metric} breached ${rule.threshold} in ${rule.window}`
        : `${row.metric} is below ${rule.threshold} in ${rule.window}`,
    };
  });
}

export function buildPilotIsolationProbes(
  clients: readonly PilotQaClientKey[] = PILOT_QA_CLIENTS,
): readonly PilotIsolationProbe[] {
  const actions: readonly PilotIsolationAction[] = ['view', 'upload', 'approve', 'commit', 'export'];
  const probes: PilotIsolationProbe[] = [];

  for (const activeClient of clients) {
    for (const requestedClient of clients) {
      if (activeClient === requestedClient) continue;
      for (const action of actions) {
        probes.push({
          id: `${activeClient}-cannot-${action}-${requestedClient}`,
          activeClient,
          requestedClient,
          action,
          expectedStatus: 403,
          evidence: 'route response, structured tenant guard log, and absence of requested-client data in response body',
        });
      }
    }
  }

  return probes;
}

export function evaluatePilotLegalPackReadiness(
  completedKeys: readonly PilotLegalPackItemKey[],
): { ready: boolean; missing: readonly PilotLegalPackItemKey[] } {
  const completed = new Set(completedKeys);
  const missing = PILOT_LEGAL_PACK
    .filter((item) => item.requiredBeforeLiveFiles && !completed.has(item.key))
    .map((item) => item.key);

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function getPilotSmokeStepsForClient(
  client: PilotQaClientKey,
): readonly PilotSmokeStep[] {
  return PILOT_SMOKE_STEPS.filter((step) => step.clientScope.includes(client));
}
