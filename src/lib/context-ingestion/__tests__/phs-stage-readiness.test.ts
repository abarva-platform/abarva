import type { PHSPhase0Manifest } from '../phs-phase0-manifest';
import { PHS_PHASE0_TEMPLATE_DEFINITIONS } from '../phs-phase0-templates';
import { evaluatePHSStageReadiness } from '../phs-stage-readiness';

function chunksForEveryPHSTemplate() {
  return PHS_PHASE0_TEMPLATE_DEFINITIONS.map((template) => ({
    chunkMetadata: { template_id: template.id },
    provenance: { template_id: template.id },
  }));
}

function validManifest(): PHSPhase0Manifest {
  return {
    manifestId: 'phs-phase0-001',
    tenantKey: 'meridian-health',
    clientName: 'Meridian Health',
    generatedAt: '2026-06-05T12:00:00.000Z',
    evidenceItems: [
      {
        citationKey: 'PHS-STARS-2026',
        title: 'Stars baseline',
        sourceType: 'public',
        owner: 'Data steward',
        evidenceDate: '2026-06-05',
        sensitivity: 'public',
        confidence: 'high',
        summary: 'CMS Stars baseline for the PHS strategy demo.',
        usableBySurface: ['moves', 'admin'],
      },
    ],
    uploadedArtifacts: [
      {
        artifactId: 'artifact-stars-baseline',
        displayName: 'Stars baseline extract',
        artifactType: 'market_research',
        phase: '0',
        owner: 'Program steward',
        storagePath: 'azure://context/phs/stars.csv',
        parseStatus: 'parsed',
        approvalStatus: 'approved',
        sensitivity: 'public',
        sourceEvidenceIds: ['PHS-STARS-2026'],
      },
    ],
    workloadRecords: [
      {
        workloadId: 'wrk-epic-analytics',
        workloadName: 'Epic analytics mart',
        domain: 'clinical_analytics',
        currentPlatform: 'Epic Clarity',
        dataSources: ['Epic Clarity'],
        phiLevel: 'high',
        owner: 'CDAO',
        businessCriticality: 'tier_1',
        modernizationDisposition: 'replatform',
        effortSize: 'large',
        risk: 'medium',
      },
    ],
    rateCardRows: [
      {
        rateCardId: 'rate-data-engineer',
        role: 'Data engineer',
        internalOrExternal: 'internal',
        location: 'US',
        hourlyRateUsd: 125,
        utilizationAssumption: 0.8,
        source: 'approved PHS setup rate card',
        effectiveDate: '2026-06-05',
      },
    ],
    gateCriteria: [
      {
        gateId: 'gate-setup-evidence',
        phase: '0',
        criterion: 'Evidence register loaded and cited.',
        blockerLevel: 'P0',
        requiredEvidence: ['PHS-STARS-2026'],
        owner: 'Program steward',
        status: 'met',
        waiverAllowed: false,
      },
    ],
    approvalRecords: [
      {
        approvalId: 'approval-stars-baseline',
        artifactId: 'artifact-stars-baseline',
        approverName: 'Anita Krishnamurthy',
        role: 'CDIO',
        decision: 'approved',
        note: 'Approved for synthetic PHS strategy demo use.',
        timestamp: '2026-06-05T12:30:00.000Z',
        conditions: ['No PHI in demo artifacts'],
      },
    ],
  };
}

describe('PHS stage readiness', () => {
  it('does not treat parsed PHS templates as stage-ready without ledger evidence and manifest validation', () => {
    const readiness = evaluatePHSStageReadiness({
      contextChunks: chunksForEveryPHSTemplate(),
      evidenceRows: [],
    });

    expect(readiness.loaderCoverageComplete).toBe(true);
    expect(readiness.readyForStageAdvance).toBe(false);
    expect(readiness.blockers).toEqual([
      'No PHS evidence-register rows have been appended to the evidence ledger.',
      'No validated PHS Phase 0 manifest is available.',
    ]);
  });

  it('marks PHS stage advance ready only when templates, ledger rows, and manifest validation all pass', () => {
    const readiness = evaluatePHSStageReadiness({
      contextChunks: chunksForEveryPHSTemplate(),
      evidenceRows: [
        {
          artifactRef: 'PHS-STARS-2026',
          sourceRef: { template_id: 'phs-evidence-register' },
        },
      ],
      manifest: validManifest(),
    });

    expect(readiness.missingTemplateIds).toEqual([]);
    expect(readiness.evidenceLedgerRows).toBe(1);
    expect(readiness.manifestValidation?.readyForStageAdvance).toBe(true);
    expect(readiness.readyForStageAdvance).toBe(true);
    expect(readiness.blockers).toEqual([]);
  });
});
