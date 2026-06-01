import {
  getPilotPrivateDataPlaneRows,
  getPilotPrivateDataPlaneRunbook,
} from '@/lib/admin/pilot-private-data-plane-runbook';

describe('pilot private data-plane runbook authority', () => {
  const runbook = getPilotPrivateDataPlaneRunbook();

  it('covers the governed T353-T356 mini-wave rows', () => {
    expect(getPilotPrivateDataPlaneRows()).toEqual(['T353', 'T354', 'T355', 'T356']);
  });

  it('defines the required Azure provisioning layers', () => {
    expect(runbook.provisioning.map((item) => item.layer)).toEqual([
      'subscription',
      'network',
      'storage',
      'database',
      'queue',
      'identity',
      'secrets',
      'observability',
      'retrieval',
      'runtime',
    ]);

    for (const item of runbook.provisioning) {
      expect(item.existingAuthorityPath).toMatch(/^(infra|docs)\//);
      expect(item.validation.length).toBeGreaterThan(20);
    }
  });

  it('locks SSO/SCIM role mapping to least-privilege roles', () => {
    expect(runbook.ssoRoleMappings.map((item) => item.role)).toEqual([
      'tenant_admin',
      'data_uploader',
      'data_reviewer',
      'load_approver',
      'auditor',
    ]);

    const uploader = runbook.ssoRoleMappings.find((item) => item.role === 'data_uploader');
    expect(uploader?.allowedActions).toContain('upload files');
    expect(uploader?.deniedActions).toContain('approve commits');

    const auditor = runbook.ssoRoleMappings.find((item) => item.role === 'auditor');
    expect(auditor?.allowedActions).toContain('export audit pack');
    expect(auditor?.deniedActions).toContain('upload files');
  });

  it('defines an ordered private-data rehearsal from SSO to output smoke', () => {
    expect(runbook.rehearsalStages.map((stage) => stage.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(runbook.rehearsalStages[0].stage).toBe('SSO sign-in and tenant resolution');
    expect(runbook.rehearsalStages.at(-1)?.stage).toBe('Source/Moves/Tower output smoke');

    for (const stage of runbook.rehearsalStages) {
      expect(stage.entryCriteria.length).toBeGreaterThan(20);
      expect(stage.exitEvidence.length).toBeGreaterThan(20);
    }
  });

  it('makes processing service choices explicit', () => {
    const decisions = new Map(runbook.processingServices.map((item) => [item.service, item.decision]));

    expect(decisions.get('Azure Blob Storage + Event Grid')).toBe('approved_for_pilot');
    expect(decisions.get('Azure Service Bus')).toBe('approved_for_pilot');
    expect(decisions.get('Azure Container Apps jobs')).toBe('approved_for_pilot');
    expect(decisions.get('Azure Functions')).toBe('approved_when_customer_requires');
    expect(decisions.get('Azure Document Intelligence')).toBe('deferred_until_day_two');
    expect(decisions.get('Azure AI Search')).toBe('approved_for_pilot');
  });
});
