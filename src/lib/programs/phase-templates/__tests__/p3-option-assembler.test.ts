import {
  assembleP3SolutionOptions,
  buildP3DesignInputsPackFromSignals,
  containsLegacyStaticP3Labels,
  p2SourceEvidenceTitle,
} from '../p3-option-assembler';
import type { P3DesignInputsPack } from '../types';

function meridianAgentAssistPack(overrides: Partial<P3DesignInputsPack> = {}): P3DesignInputsPack {
  return {
    moveId: 'move-meridian',
    businessOutcome:
      'Improve member service with lower avoidable handle time, repeat contacts, transfers, and after-call work.',
    currentProcessFindings: [
      'Agents navigate CRM, claims, benefits, prior authorization, policy, and knowledge sources during calls.',
    ],
    painPointsAndRootCauses: [
      'Fragmented system navigation and inconsistent knowledge access slow member answers.',
    ],
    currentSystems: ['CRM, claims, benefits, prior authorization, call transcripts, and knowledge base.'],
    currentDataPlatformState: [
      'Lakehouse and semantic layer must prove trusted source access before production scale.',
    ],
    dataReadiness: ['Data foundation and source quality are not fully proven yet.'],
    organizationChangeReadiness: ['Supervisor adoption and agent training plan still need validation.'],
    controlRequirements: ['PHI, privacy, audit, and human approval guardrails are required.'],
    humanDecisionBoundaries: ['Clinical decisions and appeal disposition remain human-owned.'],
    timeToValueExpectations: ['Leadership wants a 90-day proof before broader scale.'],
    budgetFundingPosture: ['Capacity and funding envelope must be confirmed.'],
    selectedSolutionBuildingBlocks: [
      'data_readiness',
      'knowledge_retrieval_copilot',
      'ai_assisted_decision_support',
      'human_in_loop_agent',
      'controls_governance_risk',
    ],
    evidenceBackedConstraints: ['PHI controls and source lineage must be visible.'],
    unresolvedQuestions: ['Data foundation readiness', 'CRM and claims source access'],
    assumptions: ['Agent assist remains human-gated.'],
    notReadyConditions: ['Enterprise platform-first path is not ready until source access is proven.'],
    currentWorkflowWithPainPoints: [
      'Member-service calls require agents to search multiple policy and claims systems.',
    ],
    requiredFieldContract: ['Call intent', 'claim status', 'benefit eligibility', 'policy source'],
    humanApprovalCheckpoints: ['Agent accepts or rejects recommendation', 'Supervisor reviews exceptions'],
    controlBoundaries: ['PHI controls', 'audit trail', 'no autonomous clinical decisions'],
    towerMetricCandidates: ['Handle time', 'first-call resolution', 'repeat contact', 'transfer rate'],
    openQuestionsForSolutionDesign: ['Which sources are production-ready?', 'Which approvals are required?'],
    ...overrides,
  };
}

function legalContractPack(): P3DesignInputsPack {
  return {
    moveId: 'move-legal',
    businessOutcome: 'Reduce legal intake cycle time and obligation leakage.',
    currentProcessFindings: ['Manual contract triage and unclear obligation ownership.'],
    painPointsAndRootCauses: ['No routing rules and missing approval thresholds.'],
    currentSystems: ['CLM and intake mailbox.'],
    currentDataPlatformState: ['Contract metadata and obligation fields need source-of-record confirmation.'],
    dataReadiness: ['Document access exists, but field completeness is inconsistent.'],
    organizationChangeReadiness: ['Attorney review model is available.'],
    controlRequirements: ['Privilege fence and attorney approval are mandatory.'],
    humanDecisionBoundaries: ['Attorney approves non-standard terms.'],
    selectedSolutionBuildingBlocks: [
      'ai_assisted_decision_support',
      'workflow_automation',
      'controls_governance_risk',
      'human_in_loop_agent',
    ],
    evidenceBackedConstraints: ['No autonomous legal approval.'],
    unresolvedQuestions: ['Approval thresholds', 'System of record'],
    assumptions: ['CLM remains the initial system of engagement.'],
    notReadyConditions: ['Autonomous review is not allowed.'],
    currentWorkflowWithPainPoints: ['Manual triage', 'Obligations unowned'],
    requiredFieldContract: ['Contract type', 'counterparty', 'renewal date', 'obligation owner'],
    humanApprovalCheckpoints: ['Attorney confirms extracted obligations'],
    controlBoundaries: ['Privilege fence', 'approval matrix', 'audit trail'],
    towerMetricCandidates: ['Cycle time', 'intake completeness', 'aged queue'],
    openQuestionsForSolutionDesign: ['Data owner', 'approval thresholds'],
  };
}

describe('P3 dynamic option assembler', () => {
  it('generates Meridian Agent Assist options from P2 inputs, not the global static three-card fallback', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-meridian',
      moveName: 'Meridian Member Experience AI Assist',
      archetype: 'Contact Center Agent Assist',
      industryCode: 'healthcare_provider',
      designInputs: meridianAgentAssistPack(),
      readiness: {
        coverageScore: 62,
        hardGaps: ['Data foundation readiness'],
        softGaps: ['Agent adoption plan'],
      },
      evidenceNeedPackets: [
        { evidenceSlot: 'CRM and claims source access', status: 'missing', priority: 'required' },
      ],
    });

    expect(optionSet.useCasePattern).toBe('member_service_agent_assist');
    expect(optionSet.options.map((option) => option.label)).toEqual([
      'Stabilize member-service workflow first',
      'Governed agent-assist layer on current systems',
      'Broader member-service orchestration platform',
      'Enterprise member-experience platform first',
    ]);
    expect(containsLegacyStaticP3Labels(optionSet)).toBe(false);
    expect(optionSet.usedGlobalStaticFallback).toBe(false);
  });

  it('does not hand a member-service Move the operations option set over one incidental word', () => {
    // Observed: a contact-centre agent-assist Move was shown the generic
    // operations options. Its evidence mentions a review "SLA" and a
    // "disruption" risk — terms the operations pattern tested first, as bare
    // substrings, and returned on the first hit.
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-member',
      moveName: 'Synthetic Agent Assist',
      archetype: null,
      designInputs: meridianAgentAssistPack({
        evidenceBackedConstraints: [
          'Some knowledge articles are older than the review SLA.',
          'A premature build risks operational disruption at the agent station.',
        ],
      }),
    });

    expect(optionSet.useCasePattern).toBe('member_service_agent_assist');
    expect(optionSet.options[1].label).toBe('Governed agent-assist layer on current systems');
  });

  it('takes the use-case pattern from a declared archetype, by id or by name, whatever the prose says', () => {
    for (const archetype of ['CONTACT_CENTER_AGENT_ASSIST', 'Contact Center Agent Assist']) {
      const optionSet = assembleP3SolutionOptions({
        moveId: 'move-declared',
        moveName: 'Airport baggage disruption recovery',
        archetype,
        designInputs: legalContractPack(),
      });
      expect(optionSet.useCasePattern).toBe('member_service_agent_assist');
    }
  });

  it('matches pattern vocabulary as whole words, not as fragments of other words', () => {
    const pack = legalContractPack();
    const blank = Object.fromEntries(
      Object.entries(pack).map(([key, value]) => [key, Array.isArray(value) ? [] : value]),
    ) as unknown as P3DesignInputsPack;
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-fragments',
      // "sla" in translate, "bag" in cabbage, "station" in workstation,
      // "gl" in single, "phi" in graphics, "close" in disclosed.
      moveName: 'Translate cabbage workstation single graphics disclosed',
      archetype: null,
      designInputs: { ...blank, moveId: 'move-fragments', businessOutcome: '' },
    });
    expect(optionSet.useCasePattern).toBe('generic_bounded_solution');
  });

  it('names a P2 source by its document title, not its internal key', () => {
    expect(p2SourceEvidenceTitle('discovery_report')).toBe('Discovery & Diagnosis Report');
    expect(p2SourceEvidenceTitle('some_unregistered_key')).toBe('some unregistered key');
  });

  it('produces materially different P3 options for a legal contract intake Move', () => {
    const meridian = assembleP3SolutionOptions({
      moveId: 'move-meridian',
      moveName: 'Meridian Member Experience AI Assist',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack(),
    });
    const legal = assembleP3SolutionOptions({
      moveId: 'move-legal',
      moveName: 'Legal Contract Intake',
      archetype: 'Legal Contract Intake',
      designInputs: legalContractPack(),
    });

    expect(legal.useCasePattern).toBe('legal_contract_intake');
    expect(legal.options.map((option) => option.label)).toContain(
      'CLM-embedded assisted triage and obligation extraction',
    );
    expect(legal.options.map((option) => option.label)).not.toEqual(
      meridian.options.map((option) => option.label),
    );
  });

  it('keeps airline disruption recovery options operational when vendor and SLA evidence are present', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-airline',
      moveName: 'Baggage Disruption Recovery Control Tower',
      archetype: 'Airline Disruption Recovery',
      industryCode: 'airline',
      designInputs: meridianAgentAssistPack({
        businessOutcome:
          'Reduce baggage disruption recovery time while improving customer communication and station accountability.',
        currentProcessFindings: [
          'Baggage service, airport stations, customer care, and vendor handlers coordinate recovery through fragmented queues.',
        ],
        currentSystems: [
          'Bag scan events, baggage case system, customer contact logs, vendor handler SLA files, and station operations reports.',
        ],
        controlRequirements: [
          'Human approval remains required for customer compensation, vendor escalation, and operational recovery commitments.',
        ],
        selectedSolutionBuildingBlocks: [
          'data_readiness',
          'workflow_automation',
          'human_in_loop_agent',
          'analytics_intelligence_layer',
          'controls_governance_risk',
        ],
      }),
      evidenceNeedPackets: [
        {
          evidenceSlot: 'vendor handler SLA baseline',
          status: 'covered',
          priority: 'required',
        },
        {
          evidenceSlot: 'vendor contract spend extract',
          status: 'covered',
          priority: 'required',
        },
      ],
    });

    expect(optionSet.useCasePattern).toBe('operations_resilience');
    expect(optionSet.options.map((option) => option.label)).toEqual([
      'Operational playbook and metric discipline',
      'Governed operational intelligence layer',
      'Workflow orchestration across operations',
      'Enterprise operating platform first',
    ]);
    expect(optionSet.options.map((option) => option.label)).not.toContain(
      'CLM-embedded assisted triage and obligation extraction',
    );
  });

  it('keeps the governed minimum-foundation path as the top candidate without overclaiming confidence', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-meridian',
      moveName: 'Agent Assist 90-day proof',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack(),
      readiness: {
        coverageScore: 55,
        hardGaps: ['Data foundation readiness', 'CRM and claims source access'],
        softGaps: [],
      },
      evidenceNeedPackets: [
        { evidenceSlot: 'Data foundation readiness', status: 'missing', priority: 'required' },
      ],
    });

    expect(optionSet.recommendedOptionId).toBeNull();
    expect(optionSet.recommendationConfidence).toBe('low');
    expect([...optionSet.options].sort((a, b) => b.totalScore - a.totalScore)[0]?.id).toBe('B');
    const enterpriseFirst = optionSet.options.find((option) => option.id === 'D');
    expect(enterpriseFirst?.recommended).toBe(false);
    expect(enterpriseFirst?.notRecommendedYetReasons.join(' ')).toMatch(/Data foundation/i);
    expect(enterpriseFirst?.notRecommendedYetReasons.join(' ')).toMatch(/Time-to-value/i);
  });

  it('lowers broad automation when PHI and human approval constraints are present', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-meridian',
      moveName: 'Member service agent assist with PHI controls',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack({
        controlRequirements: ['PHI, audit, privacy, and human approval controls are required.'],
        humanDecisionBoundaries: ['Clinical and appeals decisions must remain human-owned.'],
      }),
      readiness: { coverageScore: 70, hardGaps: ['PHI access control evidence'], softGaps: [] },
    });

    const governedAssist = optionSet.options.find((option) => option.id === 'B');
    const enterpriseFirst = optionSet.options.find((option) => option.id === 'D');
    expect(governedAssist?.scores.controls_fit).toBeGreaterThan(
      enterpriseFirst?.scores.controls_fit ?? 0,
    );
    expect(enterpriseFirst?.notRecommendedYetReasons.join(' ')).toMatch(/PHI|control/i);
  });

  it('does not introduce unsupported dollars or percentage claims into options', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-meridian',
      moveName: 'Member service agent assist',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack({
        businessOutcome: 'Improve member experience and agent productivity.',
        towerMetricCandidates: ['Handle time', 'repeat contact', 'transfer rate'],
      }),
    });

    const generated = JSON.stringify(optionSet);
    expect(generated).not.toMatch(/\$/);
    expect(generated).not.toMatch(/\b\d+%/);
    expect(generated).not.toMatch(/40 percent|40%/i);
  });

  it('caps confidence when evidence readiness has not been measured', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-synthetic',
      moveName: 'Contact center decision support',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack({
        unresolvedQuestions: [],
        notReadyConditions: [],
        openQuestionsForSolutionDesign: [],
      }),
    });

    expect(optionSet.recommendedOptionId).toBeNull();
    expect(optionSet.recommendationConfidence).toBe('low');
    expect(optionSet.options.every((option) => option.confidence !== 'high')).toBe(true);
  });

  it('caps option confidence when even one material evidence gap remains open', () => {
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-synthetic',
      moveName: 'Contact center decision support',
      archetype: 'Contact Center Agent Assist',
      designInputs: meridianAgentAssistPack({
        unresolvedQuestions: [],
        notReadyConditions: [],
        openQuestionsForSolutionDesign: [],
      }),
      readiness: {
        coverageScore: 100,
        hardGaps: ['Production interface validation pending'],
        softGaps: [],
      },
    });

    expect(optionSet.missingEvidence).toContain('Production interface validation pending');
    expect(optionSet.recommendationConfidence).toBe('low');
    expect(optionSet.options.every((option) => option.confidence !== 'high')).toBe(true);
  });

  it('builds a P3 design inputs pack from approved phase signals', () => {
    const pack = buildP3DesignInputsPackFromSignals({
      moveId: 'move-meridian',
      moveName: 'Meridian Member Experience AI Assist',
      archetype: 'Contact Center Agent Assist',
      charter: {
        scaffold: {
          problem_statement: 'Agents navigate CRM, claims, benefits, and policy sources.',
          scope_boundary: 'In: claims, eligibility, benefits, CRM history. Out: clinical decisions.',
          evidence_family: 'Member-service metrics, call transcripts, CRM history, claims samples.',
          value_hypothesis: 'Improve member experience and reduce avoidable rework.',
          foundation_readiness: 'Trusted data access, PHI controls, source freshness, and lineage.',
        },
      },
      priorPhaseContent: [
        {
          key: 'systems',
          heading: 'Systems',
          snippet: 'CRM, claims, prior authorization, and knowledge base are in scope.',
        },
      ],
      evidenceNeedPackets: [
        { evidenceSlot: 'Claims source access', status: 'missing', priority: 'required' },
      ],
      readiness: { coverageScore: 60, hardGaps: ['Data foundation readiness'], softGaps: [] },
    });

    expect(pack.businessOutcome).toMatch(/member experience/i);
    expect(pack.currentSystems?.join(' ')).toMatch(/CRM|claims/i);
    expect(pack.dataReadiness?.join(' ')).toMatch(/PHI|Data foundation/i);
    expect(pack.openQuestionsForSolutionDesign).toContain('Claims source access');
  });

  it('carries prior-phase validation limits into P3 gaps and option evidence', () => {
    const pack = buildP3DesignInputsPackFromSignals({
      moveId: 'move-synthetic',
      moveName: 'Contact center decision support',
      archetype: 'Contact Center Agent Assist',
      priorPhaseContent: [
        {
          key: 'readiness_gaps',
          heading: 'Systems: production interfaces remain unvalidated',
          snippet: 'Most production interfaces are not validated; only a mock contract test passed.',
          sourceDeliverableTypeKey: 'discovery_report',
        },
        {
          key: 'open_inputs',
          heading: 'Open Inputs Required',
          snippet: 'Reconcile baseline definitions and obtain owner-approved access evidence.',
          sourceDeliverableTypeKey: 'discovery_report',
        },
      ],
    });

    expect(pack.notReadyConditions).toContain(
      'P2 Discovery & Diagnosis Report: Systems: production interfaces remain unvalidated',
    );
    expect(pack.unresolvedQuestions).toContain(
      'P2 Discovery & Diagnosis Report: Open Inputs Required',
    );
    expect(pack.evidenceBackedConstraints?.join(' ')).toMatch(/mock contract test passed/i);
  });

  it('downgrades confidence when the approved P2 evidence records unresolved readiness', () => {
    const pack = buildP3DesignInputsPackFromSignals({
      moveId: 'move-synthetic',
      moveName: 'Contact center decision support',
      archetype: 'Contact Center Agent Assist',
      priorPhaseContent: [
        {
          key: 'readiness_gaps',
          heading: 'Systems: production interfaces remain unvalidated',
          snippet: 'Production connectivity is not validated; source-owner approval is pending.',
          sourceDeliverableTypeKey: 'discovery_report',
        },
      ],
    });
    const optionSet = assembleP3SolutionOptions({
      moveId: 'move-synthetic',
      moveName: 'Contact center decision support',
      archetype: 'Contact Center Agent Assist',
      designInputs: pack,
      readiness: { coverageScore: 100, hardGaps: [], softGaps: [] },
    });

    expect(optionSet.missingEvidence).toContain(
      'P2 Discovery & Diagnosis Report: Systems: production interfaces remain unvalidated',
    );
    expect(optionSet.sourceEvidenceLabels).toContain('discovery_report');
    expect(optionSet.recommendationConfidence).toBe('low');
    expect(optionSet.recommendedOptionId).toBeNull();
    expect(optionSet.options.every((option) => option.confidence !== 'high')).toBe(true);
  });
});
