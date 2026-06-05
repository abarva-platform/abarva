import {
  validatePHSPhase0Manifest,
  type PHSPhase0Manifest,
} from '../phs-phase0-manifest';

const validManifest: PHSPhase0Manifest = {
  manifestId: 'phs-phase0-v1',
  tenantKey: 'meridian-health',
  clientName: 'Meridian Health',
  generatedAt: '2026-06-05T12:00:00.000Z',
  evidenceItems: [
    {
      citationKey: 'PHS-PUBLIC-001',
      title: 'PHS public profile',
      sourceType: 'public',
      owner: 'Data steward',
      evidenceDate: '2026-06-05',
      sensitivity: 'public',
      confidence: 'high',
      summary: 'Public payer-provider profile evidence.',
      usableBySurface: ['admin', 'moves', 'tower'],
    },
  ],
  uploadedArtifacts: [
    {
      artifactId: 'art-evidence-register',
      displayName: 'Evidence Register',
      artifactType: 'evidence_register',
      phase: 'setup',
      owner: 'Data steward',
      storagePath: 'context/meridian/phs/evidence-register.csv',
      parseStatus: 'parsed',
      approvalStatus: 'approved',
      sensitivity: 'internal',
      sourceEvidenceIds: ['PHS-PUBLIC-001'],
    },
  ],
  workloadRecords: [
    {
      workloadId: 'wrk-care-gap',
      workloadName: 'Care Gap Analytics',
      domain: 'population_health',
      currentPlatform: 'legacy warehouse',
      dataSources: ['Epic Clarity', 'claims'],
      phiLevel: 'high',
      owner: 'VP Data Products',
      businessCriticality: 'high',
      modernizationDisposition: 'modernize_on_databricks',
      effortSize: 'large',
      risk: 'medium',
    },
  ],
  rateCardRows: [
    {
      rateCardId: 'rate-data-eng-senior',
      role: 'Senior data engineer',
      internalOrExternal: 'external',
      location: 'US',
      hourlyRateUsd: 185,
      utilizationAssumption: 0.82,
      source: 'approved-rate-card',
      effectiveDate: '2026-06-05',
    },
  ],
  gateCriteria: [
    {
      gateId: 'gate-evidence-register-approved',
      phase: 'setup',
      criterion: 'Evidence register approved',
      blockerLevel: 'P0',
      requiredEvidence: ['PHS-PUBLIC-001'],
      owner: 'Data steward',
      status: 'met',
      waiverAllowed: false,
    },
  ],
  approvalRecords: [
    {
      approvalId: 'approval-evidence-register',
      artifactId: 'art-evidence-register',
      approverName: 'Morgan Lee',
      role: 'Data steward',
      decision: 'approved',
      note: 'Approved for synthetic demo use.',
      timestamp: '2026-06-05T12:30:00.000Z',
      conditions: [],
    },
  ],
};

describe('PHS phase 0 manifest validation', () => {
  it('marks a complete loader-backed manifest ready for stage advance', () => {
    const result = validatePHSPhase0Manifest(validManifest);

    expect(result.valid).toBe(true);
    expect(result.readyForStageAdvance).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(result.counts).toMatchObject({
      evidence_item: 1,
      uploaded_artifact: 1,
      workload_record: 1,
      rate_card_row: 1,
      gate_criterion: 1,
      approval_record: 1,
    });
  });

  it('blocks stage advance when evidence, artifact parsing, gates, and approvals are incomplete', () => {
    const result = validatePHSPhase0Manifest({
      ...validManifest,
      evidenceItems: [],
      uploadedArtifacts: [
        {
          ...validManifest.uploadedArtifacts[0],
          parseStatus: 'pending',
          sourceEvidenceIds: ['missing-evidence'],
        },
      ],
      gateCriteria: [
        {
          ...validManifest.gateCriteria[0],
          status: 'blocked',
          requiredEvidence: ['missing-evidence'],
        },
      ],
      approvalRecords: [
        {
          ...validManifest.approvalRecords[0],
          approverName: '',
          artifactId: 'missing-artifact',
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.readyForStageAdvance).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        objectType: 'evidence_item',
        message: expect.stringContaining('At least one evidence_item'),
      }),
      expect.objectContaining({
        objectType: 'uploaded_artifact',
        field: 'parseStatus',
      }),
      expect.objectContaining({
        objectType: 'gate_criterion',
        field: 'status',
      }),
      expect.objectContaining({
        objectType: 'approval_record',
        field: 'approverName',
      }),
    ]));
  });
});
