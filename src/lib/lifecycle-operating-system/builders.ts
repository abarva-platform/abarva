import type { PhasePack } from '@/lib/programs/phase-packs/types';
import type { StagePack } from '@/lib/source/stage-packs/types';
import { getFailureModeControl } from './failure-modes';
import type {
  EvidenceRequirement,
  FailureModeId,
  LifecycleCompletionContract,
  LifecycleStepContract,
  TemplateBinding,
} from './types';

const PROGRAM_FAILURES: Record<number, FailureModeId[]> = {
  0: ['phantom_sponsor', 'value_baseline_missing', 'solution_before_problem'],
  1: ['solution_before_problem', 'evidence_free_progress', 'data_readiness_blindspot'],
  2: ['value_baseline_missing', 'unclear_decision_rights', 'governance_and_risk_late'],
  3: ['integration_unknowns', 'data_readiness_blindspot', 'governance_and_risk_late'],
  4: ['integration_unknowns', 'evidence_free_progress', 'adoption_afterthought'],
  5: ['adoption_afterthought', 'value_baseline_missing', 'unclear_decision_rights'],
  6: ['value_baseline_missing', 'governance_and_risk_late', 'evidence_free_progress'],
};

const SOURCE_FAILURES: Record<number, FailureModeId[]> = {
  0: ['solution_before_problem', 'phantom_sponsor', 'commercial_or_vendor_opacity'],
  1: ['solution_before_problem', 'commercial_or_vendor_opacity', 'evidence_free_progress'],
  2: ['unclear_decision_rights', 'commercial_or_vendor_opacity', 'evidence_free_progress'],
  3: ['evidence_free_progress', 'commercial_or_vendor_opacity', 'governance_and_risk_late'],
  4: ['evidence_free_progress', 'solution_before_problem', 'governance_and_risk_late'],
  5: ['commercial_or_vendor_opacity', 'unclear_decision_rights', 'evidence_free_progress'],
  6: ['governance_and_risk_late', 'commercial_or_vendor_opacity', 'integration_unknowns'],
  7: ['adoption_afterthought', 'value_baseline_missing', 'integration_unknowns'],
};

export function buildProgramLifecycleContract(pack: PhasePack): LifecycleCompletionContract {
  const failures = PROGRAM_FAILURES[pack.phase] ?? ['evidence_free_progress'];
  const gateEvidenceIds = pack.definitionOfDone.map((item) => item.id);

  return {
    id: `programs:P${pack.phase}`,
    surface: 'programs',
    unitKind: 'phase',
    unitNumber: pack.phase,
    label: pack.label,
    outcome: pack.outcome,
    universalDefinitionOfDone: pack.definitionOfDone,
    parameterizedElements: programParameterizedElements(pack.phase),
    steps: buildCommonSteps({
      prefix: `programs-p${pack.phase}`,
      label: pack.label,
      failures,
      gateEvidenceIds,
      nextOutputs: pack.dependencies.producesForNext,
      discoveryWords: ['program brief', 'baseline request', 'stakeholder map'],
      workshopTemplate: {
        id: 'wstpl:framing:use_case_prioritization',
        title: 'Phase working session agenda',
        kind: 'workshop_pack',
        whenToUse: 'Use when the phase needs stakeholder alignment or decision capture before Nexus can evaluate the gate.',
      },
    }),
    approval: {
      authority: 'Steward sign-off with sponsor accountability',
      decision: `Approve exit from ${pack.label} or record blocker/waiver rationale.`,
      approvalArtifact: 'Gate approval packet with criteria, evidence, risks, and next-phase carry-forward.',
      blockerPolicy: 'Hard evidence gaps block advancement unless an explicit Steward waiver is recorded.',
    },
    nextPhasePrimer: {
      readinessQuestion: 'What must be true on day one of the next phase for the team not to restart this work?',
      requiredCarryForward: pack.dependencies.producesForNext,
      suggestedFirstMove: `Open the next phase by restating what ${pack.label} produced, what is still uncertain, and which failure modes remain active.`,
    },
    failureModeControls: failures.map(getFailureModeControl),
  };
}

export function buildSourceLifecycleContract(pack: StagePack): LifecycleCompletionContract {
  const failures = SOURCE_FAILURES[pack.stage] ?? ['commercial_or_vendor_opacity'];
  const gateEvidenceIds = pack.definitionOfDone.map((item) => item.id);

  return {
    id: `source:S${pack.stage}`,
    surface: 'source',
    unitKind: 'stage',
    unitNumber: pack.stage,
    label: pack.label,
    outcome: pack.outcome,
    universalDefinitionOfDone: pack.definitionOfDone,
    parameterizedElements: sourceParameterizedElements(pack.stage),
    steps: buildCommonSteps({
      prefix: `source-s${pack.stage}`,
      label: pack.label,
      failures,
      gateEvidenceIds,
      nextOutputs: pack.dependencies.producesForNext,
      discoveryWords: ['sourcing brief', 'vendor evidence', 'commercial decision record'],
      workshopTemplate: {
        id: `source-stage-${pack.stage}:workshop-pack`,
        title: `${pack.label} operator workshop pack`,
        kind: 'workshop_pack',
        whenToUse: 'Use when the sourcing stage needs a room, evaluation panel, negotiation plan, or approval meeting before Sentinel can clear the gate.',
      },
    }),
    approval: {
      authority: 'Sourcing lead plus named business sponsor',
      decision: `Approve exit from ${pack.label} or hold the event with visible commercial/evidence gaps.`,
      approvalArtifact: 'Sourcing gate packet with vendor posture, evidence coverage, exceptions, and next-stage readiness.',
      blockerPolicy: 'Hard commercial, evidence, or approval gaps block advancement unless an explicit waiver is recorded.',
    },
    nextPhasePrimer: {
      readinessQuestion: 'What must the next sourcing stage inherit so the event does not re-open settled decisions?',
      requiredCarryForward: pack.dependencies.producesForNext,
      suggestedFirstMove: `Open the next sourcing stage by naming carried-forward decisions, unresolved vendor risks, and evidence that remains missing after ${pack.label}.`,
    },
    failureModeControls: failures.map(getFailureModeControl),
  };
}

function buildCommonSteps(input: {
  prefix: string;
  label: string;
  failures: FailureModeId[];
  gateEvidenceIds: string[];
  nextOutputs: string[];
  discoveryWords: [string, string, string];
  workshopTemplate: TemplateBinding;
}): LifecycleStepContract[] {
  const [briefName, evidenceName, decisionName] = input.discoveryWords;
  return [
    {
      id: `${input.prefix}:intent-and-scope`,
      title: 'Confirm intent and scope boundary',
      intent: `Turn ${input.label} from narrative into a bounded work plan with a named owner, decision, and success condition.`,
      complexity: 'simple',
      agentWorkMode: 'coach',
      humanWorkRequired: ['Confirm owner', 'Confirm decision needed', 'Name what is out of scope'],
      templates: [template(`${input.prefix}:brief-template`, `${input.label} brief`, 'memo', `Use to capture the ${briefName} before work expands.`)],
      evidenceRequired: [evidence(`${input.prefix}:brief-evidence`, `${input.label} brief`, `Upload or link the ${briefName} with owner, scope, and decision requested.`, input.gateEvidenceIds)],
      gateImpact: 'hard_blocker',
      failureModesPrevented: input.failures.slice(0, 2),
      producesForNext: [`Bounded ${input.label} workplan`],
    },
    {
      id: `${input.prefix}:workshop-or-analysis`,
      title: 'Run the needed human work',
      intent: 'Classify whether this can be answered in chat or needs a workshop, meeting, review, or offline analysis, then prepare the user to do that work.',
      complexity: 'complex',
      agentWorkMode: 'facilitate_workshop',
      humanWorkRequired: ['Run workshop or review session', 'Capture attendees and dissent', 'Record decisions and open questions'],
      templates: [input.workshopTemplate, template(`${input.prefix}:data-request`, `${input.label} data request`, 'data_request', `Use when ${evidenceName} must be uploaded after the session.`)],
      evidenceRequired: [evidence(`${input.prefix}:session-output`, `${input.label} session output`, `Upload notes, decisions, data extracts, scorecards, or artifacts produced by the ${input.label} session.`, input.gateEvidenceIds)],
      gateImpact: 'soft_signal',
      failureModesPrevented: input.failures,
      producesForNext: [`Captured ${input.label} session output`, 'Open questions and dissent list'],
    },
    {
      id: `${input.prefix}:gate-and-next`,
      title: 'Approve gate and prepare the next phase',
      intent: 'Evaluate hard and soft criteria, create the approval packet, and prime the next phase before the current one closes.',
      complexity: 'complex',
      agentWorkMode: 'evaluate_gate',
      humanWorkRequired: ['Review gate packet', 'Approve, block, or waive', 'Confirm carry-forward owner'],
      templates: [template(`${input.prefix}:approval-packet`, `${input.label} gate approval packet`, 'approval_packet', `Use when ${decisionName} is ready for sign-off.`)],
      evidenceRequired: [evidence(`${input.prefix}:approval-record`, `${input.label} approval record`, 'Upload or link approval, blocker, waiver, or decision record before changing state.', input.gateEvidenceIds)],
      gateImpact: 'hard_blocker',
      failureModesPrevented: input.failures.slice(1),
      producesForNext: input.nextOutputs.length > 0 ? input.nextOutputs : [`Next-phase primer from ${input.label}`],
    },
  ];
}

function template(id: string, title: string, kind: TemplateBinding['kind'], whenToUse: string): TemplateBinding {
  return { id, title, kind, whenToUse };
}

function evidence(id: string, label: string, uploadExpectation: string, mapsToDefinitionOfDoneIds: string[]): EvidenceRequirement {
  return {
    id,
    label,
    uploadExpectation,
    acceptedForms: ['meeting_notes', 'decision_record', 'uploaded_file', 'linked_artifact'],
    mapsToDefinitionOfDoneIds,
  };
}

function programParameterizedElements(phase: number): string[] {
  const byPhase: Record<number, string[]> = {
    0: ['program pattern', 'sponsor candidate', 'value hypothesis', 'first cohort'],
    1: ['current-state evidence family', 'stakeholder map', 'baseline source', 'data readiness scope'],
    2: ['charter decisions', 'success metrics', 'investment thesis', 'risk posture'],
    3: ['solution architecture', 'integration map', 'control requirements', 'delivery slices'],
    4: ['build backlog', 'test plan', 'release evidence', 'adoption prep'],
    5: ['launch cohort', 'training plan', 'operating owner', 'value instrumentation'],
    6: ['run cadence', 'value readout', 'control monitoring', 'improvement backlog'],
  };
  return byPhase[phase] ?? ['program-specific parameters'];
}

function sourceParameterizedElements(stage: number): string[] {
  const byStage: Record<number, string[]> = {
    0: ['business owner', 'scope boundary', 'kill criterion', 'category'],
    1: ['vendor universe', 'market assumptions', 'RFI questions', 'practitioner input'],
    2: ['shortlist criteria', 'evaluation panel', 'mandatory requirements', 'challenger vendor'],
    3: ['RFP template', 'response rubric', 'Q&A discipline', 'commercial assumptions'],
    4: ['demo script', 'POC success criteria', 'red-team scenario', 'evidence capture plan'],
    5: ['walkaway alternative', 'BAFO calendar', 'pricing normalization', 'concession strategy'],
    6: ['contract clauses', 'risk exceptions', 'exit terms', 'signature authority'],
    7: ['onboarding plan', 'transition owner', 'dual-run window', 'lessons learned'],
  };
  return byStage[stage] ?? ['sourcing-specific parameters'];
}
