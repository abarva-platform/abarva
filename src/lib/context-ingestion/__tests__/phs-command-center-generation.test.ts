import type { PHSPhase0Manifest } from '../phs-phase0-manifest';
import { PHS_PHASE0_TEMPLATE_DEFINITIONS } from '../phs-phase0-templates';
import {
  buildPHSCommandCenterPrompt,
  generatePHSCommandCenterArtifact,
  type PHSOpenAIPreflightFn,
} from '../phs-command-center-generation';

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

const evidenceRefs = [
  {
    evidenceId: 'PHS-STARS-2026',
    title: 'Stars baseline',
    sourceType: 'public',
    summary: 'CMS Stars baseline for the PHS strategy demo.',
  },
];

const corpusPatternRefs = [
  {
    patternId: 'dom54-stars-measure-uplift',
    title: 'Stars measure uplift operating model',
    domain: 'stars_quality',
    summary: 'Stars uplift requires measure ownership, intervention routing, and evidence traceability.',
  },
];

describe('PHS command center generation harness', () => {
  it('does not call OpenAI when Phase 0 readiness blockers exist', async () => {
    const preflightFn = jest.fn() as jest.MockedFunction<PHSOpenAIPreflightFn>;

    const result = await generatePHSCommandCenterArtifact({
      tenantId: 'meridian-health',
      clientName: 'Meridian Health',
      audience: 'CEO, CFO, CDIO, plan COO, and clinical leadership',
      artifactId: 'artifact-strategy',
      artifactKind: 'ai-strategy-memo',
      phase: '2',
      readinessInput: {
        contextChunks: chunksForEveryPHSTemplate(),
        evidenceRows: [],
      },
      evidenceRefs,
      corpusPatternRefs,
      preflightFn,
    });

    if (result.status !== 'blocked') {
      throw new Error(`Expected blocked result, got ${result.status}`);
    }
    expect(result.openAiCalled).toBe(false);
    expect(result.blockers).toContain('No PHS evidence-register rows have been appended to the evidence ledger.');
    expect(preflightFn).not.toHaveBeenCalled();
  });

  it('does not call OpenAI without evidence and corpus references', async () => {
    const preflightFn = jest.fn() as jest.MockedFunction<PHSOpenAIPreflightFn>;

    const result = await generatePHSCommandCenterArtifact({
      tenantId: 'meridian-health',
      clientName: 'Meridian Health',
      audience: 'CEO, CFO, CDIO, plan COO, and clinical leadership',
      artifactId: 'artifact-strategy',
      artifactKind: 'ai-strategy-memo',
      phase: '2',
      readinessInput: {
        contextChunks: chunksForEveryPHSTemplate(),
        evidenceRows: [
          {
            artifactRef: 'PHS-STARS-2026',
            sourceRef: { template_id: 'phs-evidence-register' },
          },
        ],
        manifest: validManifest(),
      },
      evidenceRefs: [],
      corpusPatternRefs: [],
      preflightFn,
    });

    if (result.status !== 'blocked') {
      throw new Error(`Expected blocked result, got ${result.status}`);
    }
    expect(result.blockers).toEqual([
      'No evidence references were supplied for artifact generation.',
      'No corpus pattern references were supplied for artifact generation.',
    ]);
    expect(preflightFn).not.toHaveBeenCalled();
  });

  it('calls OpenAI only after readiness, evidence, and corpus gates pass', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: '1. Executive answer\nGrounded answer [PHS-STARS-2026] [dom54-stars-measure-uplift]',
      model: 'gpt-5.1',
      status: 'completed',
      usage: { input_tokens: 100, output_tokens: 40 },
    });
    const preflightFn = jest.fn().mockResolvedValue({
      ok: true,
      auditId: 'audit-openai-1',
      dataClass: 'confidential',
      client: { responses: { create } },
    }) as jest.MockedFunction<PHSOpenAIPreflightFn>;

    const result = await generatePHSCommandCenterArtifact({
      tenantId: 'meridian-health',
      userId: 'user-1',
      clientName: 'Meridian Health',
      audience: 'CEO, CFO, CDIO, plan COO, and clinical leadership',
      artifactId: 'artifact-strategy',
      artifactKind: 'ai-strategy-memo',
      phase: '2',
      readinessInput: {
        contextChunks: chunksForEveryPHSTemplate(),
        evidenceRows: [
          {
            artifactRef: 'PHS-STARS-2026',
            sourceRef: { template_id: 'phs-evidence-register' },
          },
        ],
        manifest: validManifest(),
      },
      evidenceRefs,
      corpusPatternRefs,
      preflightFn,
    });

    if (result.status !== 'generated') {
      throw new Error(`Expected generated result, got ${result.status}`);
    }
    expect(result.openAiCalled).toBe(true);
    expect(result.auditId).toBe('audit-openai-1');
    expect(result.evidenceIds).toEqual(['PHS-STARS-2026']);
    expect(result.corpusPatternIds).toEqual(['dom54-stars-measure-uplift']);
    expect(preflightFn).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'meridian-health',
      workflow: 'phs-command-center-artifact-generate',
      model: 'gpt-5.1',
      dataClass: 'confidential',
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5.1',
      store: false,
      metadata: expect.objectContaining({
        workflow: 'phs-command-center-artifact-generate',
        tenantId: 'meridian-health',
      }),
    }));
  });

  it('builds CXO-readable prompts that ban raw implementation language and require citations', () => {
    const prompt = buildPHSCommandCenterPrompt({
      tenantId: 'meridian-health',
      clientName: 'Meridian Health',
      artifactKind: 'databricks-target-architecture',
      phase: '3',
      audience: 'CDIO and architecture lead',
      stageReadiness: {
        templateCoverage: [],
        missingTemplateIds: [],
        evidenceLedgerRows: 1,
        loaderCoverageComplete: true,
        manifestValidation: null,
        readyForStageAdvance: true,
        blockers: [],
      },
      evidenceRefs,
      corpusPatternRefs,
      workloadRefs: [
        {
          workloadId: 'wrk-epic-analytics',
          workloadName: 'Epic analytics mart',
          domain: 'clinical_analytics',
          currentPlatform: 'Epic Clarity',
          modernizationDisposition: 'replatform',
          phiLevel: 'high',
        },
      ],
    });

    expect(prompt.systemPrompt).toContain('Every material claim must cite at least one supplied evidence ID');
    expect(prompt.systemPrompt).toContain('Do not expose database field names, raw JSON keys, or implementation jargon.');
    expect(prompt.systemPrompt).not.toMatch(/anthropic|claude/i);
    expect(prompt.userMessage).toContain('PHS-STARS-2026');
    expect(prompt.userMessage).toContain('dom54-stars-measure-uplift');
  });
});
