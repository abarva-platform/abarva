import {
  buildControlDataPlaneBoundaryContract,
  createEvidenceRequest,
  createEvidenceResponse,
} from '../../../lib/architecture/control-data-plane-boundary';

describe('control-data-plane-boundary', () => {
  const contract = buildControlDataPlaneBoundaryContract();

  // ------------------------------------------------------------------
  // Contract structure invariants
  // ------------------------------------------------------------------

  it('has at least 6 boundary rules', () => {
    expect(contract.rules.length).toBeGreaterThanOrEqual(6);
  });

  it('has at least 3 failure modes', () => {
    expect(contract.failureModes.length).toBeGreaterThanOrEqual(3);
  });

  it('deterministicOnly is true', () => {
    expect(contract.deterministicOnly).toBe(true);
  });

  it('noNetworkCalls is true', () => {
    expect(contract.noNetworkCalls).toBe(true);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(contract.generatedAt).toBe('2026-04-26');
  });

  it('contractVersion is present', () => {
    expect(typeof contract.contractVersion).toBe('string');
    expect(contract.contractVersion.length).toBeGreaterThan(0);
  });

  it('allowedEvidenceRequestTypes is non-empty', () => {
    expect(contract.allowedEvidenceRequestTypes.length).toBeGreaterThan(0);
  });

  it('degradedModeBehavior is a non-empty string', () => {
    expect(typeof contract.degradedModeBehavior).toBe('string');
    expect(contract.degradedModeBehavior.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // BoundaryRule invariants
  // ------------------------------------------------------------------

  it('all rules have rawDataBlocked defined as a boolean', () => {
    for (const rule of contract.rules) {
      expect(typeof rule.rawDataBlocked).toBe('boolean');
    }
  });

  it('rules for raw_dataset_content crossing data_to_control are blocked', () => {
    const rawDataRules = contract.rules.filter(
      (r) =>
        r.dataType === 'raw_dataset_content' &&
        r.direction === 'data_to_control',
    );
    expect(rawDataRules.length).toBeGreaterThanOrEqual(1);
    for (const rule of rawDataRules) {
      expect(rule.crossingPolicy).toBe('blocked');
    }
  });

  it('rules that block raw data have rawDataBlocked === true', () => {
    const blockedRules = contract.rules.filter(
      (r) => r.crossingPolicy === 'blocked',
    );
    for (const rule of blockedRules) {
      expect(rule.rawDataBlocked).toBe(true);
    }
  });

  it('user_pii crossing data_to_control is blocked', () => {
    const piiRules = contract.rules.filter(
      (r) => r.dataType === 'user_pii' && r.direction === 'data_to_control',
    );
    expect(piiRules.length).toBeGreaterThanOrEqual(1);
    for (const rule of piiRules) {
      expect(rule.crossingPolicy).toBe('blocked');
      expect(rule.rawDataBlocked).toBe(true);
    }
  });

  it('every rule has a non-empty rationale', () => {
    for (const rule of contract.rules) {
      expect(typeof rule.rationale).toBe('string');
      expect(rule.rationale.length).toBeGreaterThan(0);
    }
  });

  it('every failure mode has a non-empty trigger and behavior', () => {
    for (const fm of contract.failureModes) {
      expect(typeof fm.trigger).toBe('string');
      expect(fm.trigger.length).toBeGreaterThan(0);
      expect(typeof fm.behavior).toBe('string');
      expect(fm.behavior.length).toBeGreaterThan(0);
    }
  });

  // ------------------------------------------------------------------
  // EvidenceRequest invariants
  // ------------------------------------------------------------------

  it('createEvidenceRequest returns includesRawData === false', () => {
    const req = createEvidenceRequest('metric_summary');
    expect(req.includesRawData).toBe(false);
  });

  it('createEvidenceRequest returns includesMetadataOnly === true', () => {
    const req = createEvidenceRequest('dataset_summary');
    expect(req.includesMetadataOnly).toBe(true);
  });

  it('createEvidenceRequest returns auditEventRequired === true', () => {
    const req = createEvidenceRequest('artifact_metadata');
    expect(req.auditEventRequired).toBe(true);
  });

  it('createEvidenceRequest sets requestingPlane to control', () => {
    const req = createEvidenceRequest('model_policy');
    expect(req.requestingPlane).toBe('control');
  });

  it('createEvidenceRequest sets servingPlane to data', () => {
    const req = createEvidenceRequest('metric_summary');
    expect(req.servingPlane).toBe('data');
  });

  it('createEvidenceRequest works for all evidence types', () => {
    const types: Array<
      'metric_summary' | 'dataset_summary' | 'artifact_metadata' | 'model_policy'
    > = ['metric_summary', 'dataset_summary', 'artifact_metadata', 'model_policy'];
    for (const t of types) {
      const req = createEvidenceRequest(t);
      expect(req.evidenceType).toBe(t);
      expect(req.includesRawData).toBe(false);
      expect(req.includesMetadataOnly).toBe(true);
    }
  });

  // ------------------------------------------------------------------
  // EvidenceResponse invariants
  // ------------------------------------------------------------------

  it('createEvidenceResponse returns containsRawData === false', () => {
    const resp = createEvidenceResponse('req-001', 'success');
    expect(resp.containsRawData).toBe(false);
  });

  it('createEvidenceResponse preserves the requestId', () => {
    const resp = createEvidenceResponse('req-xyz', 'partial');
    expect(resp.requestId).toBe('req-xyz');
  });

  it('createEvidenceResponse preserves the status', () => {
    const statuses: Array<'success' | 'partial' | 'unavailable' | 'degraded'> =
      ['success', 'partial', 'unavailable', 'degraded'];
    for (const s of statuses) {
      const resp = createEvidenceResponse('req-test', s);
      expect(resp.status).toBe(s);
      expect(resp.containsRawData).toBe(false);
    }
  });

  it('createEvidenceResponse has a non-empty manifestReference', () => {
    const resp = createEvidenceResponse('req-002', 'success');
    expect(typeof resp.manifestReference).toBe('string');
    expect(resp.manifestReference.length).toBeGreaterThan(0);
  });

  it('createEvidenceResponse has a non-empty auditEventId', () => {
    const resp = createEvidenceResponse('req-003', 'success');
    expect(typeof resp.auditEventId).toBe('string');
    expect(resp.auditEventId.length).toBeGreaterThan(0);
  });
});
