import {
  buildPilotIsolationProbes,
  evaluatePilotAlerts,
  evaluatePilotLegalPackReadiness,
  getPilotSmokeStepsForClient,
  PILOT_ALERT_RULES,
  PILOT_FINAL_BACKLOG_ROWS,
  PILOT_LEGAL_PACK,
  PILOT_QA_CLIENTS,
  PILOT_SMOKE_STEPS,
} from '@/lib/admin/pilot-observability-isolation-smoke';

describe('pilot observability, isolation, legal, and smoke contract', () => {
  it('covers T365-T368 explicitly', () => {
    expect(PILOT_FINAL_BACKLOG_ROWS).toEqual(['T365', 'T366', 'T367', 'T368']);
  });

  it('defines alert rules for queue, parse, retry, long-job, and spend guardrails', () => {
    expect(PILOT_ALERT_RULES.map((rule) => rule.metric)).toEqual([
      'queue_failure_count',
      'parse_failure_rate_percent',
      'retry_storm_count',
      'long_running_job_minutes',
      'azure_daily_spend_usd',
    ]);
    expect(PILOT_ALERT_RULES.every((rule) => rule.owner.length > 0 && rule.evidence.length > 0)).toBe(true);
  });

  it('evaluates observed metrics against configured thresholds', () => {
    expect(
      evaluatePilotAlerts([
        { metric: 'queue_failure_count', value: 1 },
        { metric: 'azure_daily_spend_usd', value: 42 },
      ]),
    ).toEqual([
      {
        metric: 'queue_failure_count',
        triggered: true,
        severity: 'critical',
        message: 'queue_failure_count breached 1 in 15 minutes',
      },
      {
        metric: 'azure_daily_spend_usd',
        triggered: false,
        severity: 'info',
        message: 'azure_daily_spend_usd is below 250 in 24 hours',
      },
    ]);
  });

  it('builds full cross-client isolation probes for the 3 pilot clients and 5 actions', () => {
    const probes = buildPilotIsolationProbes();

    expect(PILOT_QA_CLIENTS).toEqual(['apexretail', 'meridian', 'skyharbor']);
    expect(probes).toHaveLength(30);
    expect(probes.every((probe) => probe.activeClient !== probe.requestedClient)).toBe(true);
    expect(probes.every((probe) => probe.expectedStatus === 403)).toBe(true);
    expect(probes.map((probe) => probe.action)).toEqual(
      expect.arrayContaining(['view', 'upload', 'approve', 'commit', 'export']),
    );
  });

  it('requires the full legal and data-use pack before live client files', () => {
    expect(PILOT_LEGAL_PACK.map((item) => item.key)).toEqual([
      'dpa',
      'baa',
      'prohibited_data',
      'retention',
      'offboarding',
      'no_training',
      'subprocessors',
    ]);

    expect(evaluatePilotLegalPackReadiness(['dpa', 'prohibited_data'])).toEqual({
      ready: false,
      missing: ['baa', 'retention', 'offboarding', 'no_training', 'subprocessors'],
    });

    expect(
      evaluatePilotLegalPackReadiness([
        'dpa',
        'baa',
        'prohibited_data',
        'retention',
        'offboarding',
        'no_training',
        'subprocessors',
      ]),
    ).toEqual({ ready: true, missing: [] });
  });

  it('defines the end-to-end smoke from SSO through audit export for every pilot client', () => {
    expect(PILOT_SMOKE_STEPS.map((step) => step.surface)).toEqual([
      'sso',
      'setup',
      'api',
      'data_plane',
      'intelligence',
      'moves',
      'source',
      'tower',
      'audit_export',
    ]);

    for (const client of PILOT_QA_CLIENTS) {
      expect(getPilotSmokeStepsForClient(client)).toHaveLength(PILOT_SMOKE_STEPS.length);
    }
  });
});
