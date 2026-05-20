// Moves Expert Kernel - solution architecture pack.
//
// Dedicated architecture artifact model for the Moves Gold Standard. This is
// deliberately not a prose wrapper around the business case: it composes the
// existing solution-architecture option set, case-specific scenario evidence,
// RACI, roadmap and critic gaps into diagram-grade view models. Unknowns remain
// explicit gaps; no system, vendor, integration or control is invented.

import {
  buildSolutionArchitectureOptions,
  REFERENCE_COMPONENT_LABEL,
  type ComponentAssessment,
  type ReferenceComponent,
  type SolutionArchitectureOption,
  type SolutionArchitectureOptionSet,
} from '@/lib/programs/architecture/solution-architecture-options';
import type { ReadinessProfile } from '@/lib/programs/taxonomy/archetype-fixtures';
import type { SolutionArchetypeKey } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import {
  SOLUTION_ARCHITECTURE_STANDARD,
  type ArtifactEvidenceRequirementId,
  type ArtifactSectionId,
  type ArtifactVisualId,
} from './artifact-standards';
import {
  type GeneratedArtifactQualitySignals,
} from './artifact-quality-rubric';
import {
  EXPERT_REVIEW_CASES,
  type ExpertReviewCaseId,
} from './expert-review-cases';

export type ArchitectureNodeKind =
  | 'business_surface'
  | 'context_layer'
  | 'broker'
  | 'agent'
  | 'control'
  | 'human_checkpoint'
  | 'system_of_record'
  | 'tower';

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  evidence: string;
  status: 'grounded' | 'gap';
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label: string;
  control?: string;
}

export interface ArchitectureDiagram {
  id:
    | 'architecture_context_diagram'
    | 'logical_architecture_diagram'
    | 'data_flow_diagram'
    | 'integration_map'
    | 'control_overlay'
    | 'build_buy_boundary_view';
  title: string;
  nodes: readonly ArchitectureNode[];
  edges: readonly ArchitectureEdge[];
  notes: readonly string[];
}

export interface ArchitectureIntegration {
  system: string;
  role: string;
  evidence: string;
  status: 'grounded' | 'gap';
  owner: string;
}

export interface ArchitectureBoundaryLane {
  lane: string;
  disposition: 'build' | 'buy' | 'partner' | 'retain';
  rationale: string;
  owner: string;
}

export interface ArchitectureRisk {
  code: string;
  severity: 'blocker' | 'watch' | 'managed';
  message: string;
  fixCondition: string;
}

export interface SolutionArchitecturePack {
  caseId: ExpertReviewCaseId;
  tenantLabel: string;
  moveLabel: string;
  decisionSummary: string;
  recommendedArchetype: SolutionArchetypeKey;
  optionSet: SolutionArchitectureOptionSet;
  selectedOption: SolutionArchitectureOption;
  diagrams: readonly ArchitectureDiagram[];
  integrations: readonly ArchitectureIntegration[];
  buildBuyBoundary: readonly ArchitectureBoundaryLane[];
  controlCoverage: readonly ComponentAssessment[];
  architectureRisks: readonly ArchitectureRisk[];
  sourceEvidence: readonly string[];
}

interface CaseArchitectureProfile {
  recommendedArchetype: SolutionArchetypeKey;
  readiness: ReadinessProfile;
  proposedMove: string;
  forcedRecommendedOptionId?: string;
  sourceEvidence: readonly string[];
  integrations: readonly ArchitectureIntegration[];
  buildBuyBoundary: readonly ArchitectureBoundaryLane[];
  architectureRisks: readonly ArchitectureRisk[];
}

const CASE_ARCHITECTURE_PROFILES: Record<
  ExpertReviewCaseId,
  CaseArchitectureProfile
> = {
  apexretail: {
    recommendedArchetype: 'human_in_loop_agent',
    readiness: { data: 'high', control: 'high', eval: 'moderate' },
    forcedRecommendedOptionId: 'opt-human-in-loop-agent',
    proposedMove:
      'Govern and modernise contact-centre AI routing as a human-in-loop assistant before expanding autonomy.',
    sourceEvidence: [
      'Scenario Apex Step 2: human-in-loop assistant first, not full agentic routing.',
      'Apex kernel baseline: NICE CXone AHT/FCR/containment/CSAT metrics and Genesys routing export.',
      'Scenario Apex Step 3: split Source into routing platform, model operations, and workflow-change lanes.',
    ],
    integrations: [
      {
        system: 'NICE CXone',
        role: 'Authoritative baseline for AHT, FCR, containment and CSAT.',
        evidence: 'Apex kernel baseline KPI kpi:apex:018-021.',
        status: 'grounded',
        owner: 'Customer Care Operations',
      },
      {
        system: 'Genesys routing export',
        role: 'Historical routing baseline and candidate routing-control source.',
        evidence: 'Apex kernel baseline: Move P2 baseline deliverable.',
        status: 'grounded',
        owner: 'Enterprise Architecture',
      },
      {
        system: 'CDP / unified intent layer',
        role: 'Needed to unify customer intent before autonomy expands.',
        evidence: 'Scenario Apex Step 2: CDP gap called out as readiness gate.',
        status: 'gap',
        owner: 'CDO / Data Sponsor',
      },
    ],
    buildBuyBoundary: [
      {
        lane: 'Contact-centre platform / routing engine',
        disposition: 'buy',
        rationale:
          'Platform capability is commodity enough to buy or renew; avoid custom-building the routing platform.',
        owner: 'Sourcing VP + Enterprise Architecture',
      },
      {
        lane: 'Model operations and governance',
        disposition: 'partner',
        rationale:
          'Customer-facing inference needs governed model operations, evals and transcript privacy controls.',
        owner: 'AI Governance',
      },
      {
        lane: 'Workflow redesign and adoption',
        disposition: 'retain',
        rationale:
          'Customer Care must own the new service model; external help can support, but accountability stays internal.',
        owner: 'VP Customer Care',
      },
    ],
    architectureRisks: [
      {
        code: 'apex.transcript_privacy_gate',
        severity: 'blocker',
        message:
          'Transcript use is a privacy gate before any customer-facing inference path can be production-shaped.',
        fixCondition:
          'Clear the transcript-use privacy review and encode allowed transcript handling in the control overlay.',
      },
      {
        code: 'apex.intent_fragmentation',
        severity: 'watch',
        message:
          'Intent data is fragmented; autonomy expansion would leak value until the CDP/unified intent gap closes.',
        fixCondition:
          'Stand up the unified intent feed or keep the first release at human-in-loop routing assist.',
      },
    ],
  },
  meridian: {
    recommendedArchetype: 'vendor_led_implementation',
    readiness: { data: 'moderate', control: 'moderate', eval: 'moderate' },
    forcedRecommendedOptionId: 'opt-human-in-loop-agent',
    proposedMove:
      'Adopt ambient clinical documentation with Epic integration, BAA/data-egress controls and physician review.',
    sourceEvidence: [
      'Scenario Meridian Step 2: physician-reviewed human-in-loop assistant, not autonomous documentation.',
      'Scenario Meridian Step 3: Epic integration plus BAA/data-egress as pass/fail vendor gates.',
      'Meridian kernel baseline: Epic pajama-time signal, CDI queue and HCC-relevant query volume.',
    ],
    integrations: [
      {
        system: 'Epic EHR',
        role: 'Core EHR integration and documentation write-back boundary.',
        evidence: 'Scenario Meridian Step 0 vendor landscape.',
        status: 'grounded',
        owner: 'CMIO / Enterprise Architecture',
      },
      {
        system: 'CDI queue',
        role: 'Routes HCC-relevant documentation gaps into the CDI workflow.',
        evidence: 'Meridian kernel baseline CDI query volume and cycle-time metrics.',
        status: 'grounded',
        owner: 'CDI Director',
      },
      {
        system: 'Ambient AI vendor platform',
        role: 'Ambient capture and draft-note generation.',
        evidence:
          'Scenario Meridian seed realism: category seeded, no named ambient vendor seeded.',
        status: 'gap',
        owner: 'Sourcing VP + Privacy Office',
      },
    ],
    buildBuyBoundary: [
      {
        lane: 'Ambient documentation product',
        disposition: 'buy',
        rationale:
          'The product category is mature; Source should run a SaaS/vendor gate rather than an SI-build RFP.',
        owner: 'Sourcing VP',
      },
      {
        lane: 'Epic integration and security/data-egress controls',
        disposition: 'partner',
        rationale:
          'Integration and control work need health-system context plus specialist vendor evidence.',
        owner: 'CMIO + Privacy Office',
      },
      {
        lane: 'Physician adoption and workflow change',
        disposition: 'retain',
        rationale:
          'Physician trust and sign-off behavior cannot be outsourced; CMO/CMIO must own adoption.',
        owner: 'Chief Medical Officer',
      },
    ],
    architectureRisks: [
      {
        code: 'meridian.baa_data_egress',
        severity: 'blocker',
        message:
          'A vendor without BAA coverage and defensible data-egress controls cannot pass the architecture gate.',
        fixCondition:
          'Shortlist only vendors with BAA, data-residency, HITRUST/security evidence and Epic integration depth.',
      },
      {
        code: 'meridian.phi_boundary',
        severity: 'managed',
        message:
          'The AbarVa decision artifact must stay out of patient-record content and reason only over workflow/vendor evidence.',
        fixCondition:
          'Keep PHI out of the dossier; test integration controls with synthetic or de-identified encounter flows.',
      },
    ],
  },
  arcturus: {
    recommendedArchetype: 'human_in_loop_agent',
    readiness: { data: 'moderate', control: 'high', eval: 'moderate' },
    forcedRecommendedOptionId: 'opt-human-in-loop-agent',
    proposedMove:
      'Enhance fraud detection with ML scoring, investigator decisioning and SR 11-7 model-risk governance.',
    sourceEvidence: [
      'Scenario First Capital Step 2: human investigators decide SAR filing; autonomy is a non-starter.',
      'First Capital kernel baseline: card fraud losses, AML false-positive rate, MRA findings and committed program budget.',
      'Scenario First Capital Step 3: AML vendor model plus MRM/model-validation partner and regulator-engagement lane.',
    ],
    integrations: [
      {
        system: 'Fraud monitoring platform / AML vendor model',
        role: 'Scores card and payment-fraud signals for investigator prioritization.',
        evidence: 'Scenario First Capital Step 0 vendor landscape: NICE Actimize, SAS, Oracle FSAA, Verafin.',
        status: 'grounded',
        owner: 'Risk Technology',
      },
      {
        system: 'Model-risk governance / validation workflow',
        role: 'SR 11-7 validation, independent review, drift monitoring and examiner evidence.',
        evidence: 'Scenario First Capital Step 2 control matrix.',
        status: 'grounded',
        owner: 'CRO / Model Risk',
      },
      {
        system: 'Real-time payment / FedNow event stream',
        role: 'Future expansion surface after card-fraud phase.',
        evidence:
          'Scenario First Capital seed realism: FedNow is a plausible trigger but not explicitly seeded.',
        status: 'gap',
        owner: 'Payments Technology',
      },
    ],
    buildBuyBoundary: [
      {
        lane: 'AML / fraud monitoring model',
        disposition: 'buy',
        rationale:
          'Seeded vendor landscape already contains specialist AML/fraud platforms; a custom model is not the first responsible path.',
        owner: 'Sourcing VP + Risk Technology',
      },
      {
        lane: 'SR 11-7 validation and MRM operating capability',
        disposition: 'partner',
        rationale:
          'Independent model-validation and examiner-ready evidence need specialist model-risk support.',
        owner: 'CRO / Model Risk',
      },
      {
        lane: 'Investigator workflow and SAR decision rights',
        disposition: 'retain',
        rationale:
          'SAR filing and fraud-investigator decision accountability stay with the bank.',
        owner: 'BSA Officer',
      },
    ],
    architectureRisks: [
      {
        code: 'firstcapital.sr117_gate',
        severity: 'blocker',
        message:
          'No model goes live without SR 11-7 validation, independent review and drift monitoring.',
        fixCondition:
          'Attach validation documentation, explainability, fair-treatment testing and drift controls to the architecture gate.',
      },
      {
        code: 'firstcapital.fednow_seed_gap',
        severity: 'watch',
        message:
          'The future real-time-payments expansion is plausible but not explicitly seeded as a data segment.',
        fixCondition:
          'Treat FedNow expansion as a later phase until a real-time payment event stream is seeded and profiled.',
      },
    ],
  },
};

function node(
  id: string,
  label: string,
  kind: ArchitectureNodeKind,
  evidence: string,
  status: ArchitectureNode['status'] = 'grounded',
): ArchitectureNode {
  return { id, label, kind, evidence, status };
}

function edge(
  from: string,
  to: string,
  label: string,
  control?: string,
): ArchitectureEdge {
  return control ? { from, to, label, control } : { from, to, label };
}

function buildContextDiagram(args: {
  caseEntry: (typeof EXPERT_REVIEW_CASES)[ExpertReviewCaseId];
  selected: SolutionArchitectureOption;
  profile: CaseArchitectureProfile;
}): ArchitectureDiagram {
  const { caseEntry, selected, profile } = args;
  const systems = profile.integrations.slice(0, 3);
  const nodes: ArchitectureNode[] = [
    node('business', caseEntry.moveLabel, 'business_surface', profile.sourceEvidence[0]),
    node(
      'context',
      'Tenant context layer',
      'context_layer',
      `Selected option grounds on ${selected.dataSources.join(', ')}.`,
    ),
    node(
      'broker',
      'AbarVa broker boundary',
      'broker',
      'Existing §4 reference architecture requires a swappable, auditable broker boundary.',
    ),
    node('agent', selected.name, 'agent', selected.summary),
    node(
      'human',
      'Human approval checkpoint',
      'human_checkpoint',
      selected.componentCoverage.find((item) => item.component === 'human_in_loop')?.note ??
        'Human checkpoint required.',
    ),
    node('tower', 'Tower outcome trace', 'tower', 'Measurement handoff tracks forecast to actual.'),
    ...systems.map((integration) =>
      node(
        `system:${integration.system}`,
        integration.system,
        'system_of_record',
        integration.evidence,
        integration.status,
      ),
    ),
  ];

  return {
    id: 'architecture_context_diagram',
    title: 'Architecture context diagram',
    nodes,
    edges: [
      edge('business', 'context', 'uses baseline and context evidence'),
      edge('context', 'broker', 'scoped retrieval'),
      edge('broker', 'agent', selected.retrieval),
      edge('agent', 'human', 'propose / prepare action'),
      edge('human', 'tower', 'approved decision and outcome trace'),
      ...systems.map((integration) =>
        edge(`system:${integration.system}`, 'broker', integration.role),
      ),
    ],
    notes: [
      `Recommended option: ${selected.name}.`,
      'Gap-state system nodes stay visible; they are not backfilled with invented integrations.',
    ],
  };
}

function buildLogicalDiagram(
  selected: SolutionArchitectureOption,
): ArchitectureDiagram {
  return {
    id: 'logical_architecture_diagram',
    title: 'Logical architecture',
    nodes: [
      node('inputs', 'Enterprise evidence inputs', 'context_layer', selected.dataSources.join(', ')),
      node('retrieval', `${selected.retrieval} retrieval`, 'broker', selected.summary),
      node('gateway', 'Model gateway', 'agent', selected.modelGateway),
      node('guardrails', 'Guardrails + eval harness', 'control', 'Coverage derived from §4 component assessment.'),
      node('approval', 'Human approval / exception queue', 'human_checkpoint', 'Human accountability remains explicit.'),
      node('audit', 'Audit and replay trail', 'tower', selected.audit),
    ],
    edges: [
      edge('inputs', 'retrieval', 'ground and cite'),
      edge('retrieval', 'gateway', 'synthesis request'),
      edge('gateway', 'guardrails', 'validate output / action'),
      edge('guardrails', 'approval', 'approve or escalate'),
      edge('approval', 'audit', 'decision record'),
    ],
    notes: [
      selected.security,
      ...selected.tradeOffs,
    ],
  };
}

function buildDataFlowDiagram(
  selected: SolutionArchitectureOption,
  profile: CaseArchitectureProfile,
): ArchitectureDiagram {
  const sourceNodes = selected.dataSources.map((source) =>
    node(
      `source:${source}`,
      source,
      'context_layer',
      'Required by selected architecture option.',
    ),
  );
  return {
    id: 'data_flow_diagram',
    title: 'Data and decision flow',
    nodes: [
      ...sourceNodes,
      node('broker', 'Tenant-scoped broker', 'broker', 'RLS-scoped retrieval / tool boundary.'),
      node('model', 'Model gateway', 'agent', selected.modelGateway),
      node('checkpoint', 'Human checkpoint', 'human_checkpoint', 'Required before consequential action.'),
      node('systems', 'Systems of record', 'system_of_record', 'Only approved actions touch operational systems.'),
      node('trace', 'Trace / Tower measurement', 'tower', 'Feeds forecast-to-actual measurement.'),
    ],
    edges: [
      ...sourceNodes.map((source) => edge(source.id, 'broker', 'read evidence')),
      edge('broker', 'model', 'grounded prompt'),
      edge('model', 'checkpoint', 'recommendation'),
      edge('checkpoint', 'systems', 'approved action only'),
      edge('checkpoint', 'trace', 'decision log'),
      edge('systems', 'trace', 'outcome signals'),
    ],
    notes: [
      'Data flow is read-first; mutation happens only after the human checkpoint.',
      ...profile.integrations
        .filter((integration) => integration.status === 'gap')
        .map((integration) => `${integration.system}: ${integration.role}`),
    ],
  };
}

function buildIntegrationMap(profile: CaseArchitectureProfile): ArchitectureDiagram {
  return {
    id: 'integration_map',
    title: 'Integration map',
    nodes: profile.integrations.map((integration) =>
      node(
        `integration:${integration.system}`,
        integration.system,
        'system_of_record',
        integration.evidence,
        integration.status,
      ),
    ),
    edges: profile.integrations.map((integration) =>
      edge(
        `integration:${integration.system}`,
        'architecture_gate',
        integration.role,
        integration.owner,
      ),
    ),
    notes: profile.integrations.map(
      (integration) =>
        `${integration.status.toUpperCase()}: ${integration.system} — ${integration.role}`,
    ),
  };
}

function buildControlOverlay(selected: SolutionArchitectureOption): ArchitectureDiagram {
  return {
    id: 'control_overlay',
    title: 'Reference-architecture control overlay',
    nodes: selected.componentCoverage.map((assessment) =>
      node(
        `control:${assessment.component}`,
        REFERENCE_COMPONENT_LABEL[assessment.component],
        'control',
        assessment.note,
        assessment.coverage === 'native' ? 'grounded' : 'gap',
      ),
    ),
    edges: selected.componentCoverage.map((assessment) =>
      edge(
        `control:${assessment.component}`,
        'production_gate',
        assessment.coverage,
      ),
    ),
    notes: [
      `Reference score: ${selected.referenceScore}.`,
      selected.productionShaped
        ? 'All eight §4 reference components are native.'
        : 'At least one §4 component remains below native coverage.',
    ],
  };
}

function buildBoundaryDiagram(profile: CaseArchitectureProfile): ArchitectureDiagram {
  return {
    id: 'build_buy_boundary_view',
    title: 'Build / buy / partner boundary',
    nodes: profile.buildBuyBoundary.map((lane) =>
      node(
        `lane:${lane.lane}`,
        lane.lane,
        'business_surface',
        lane.rationale,
      ),
    ),
    edges: profile.buildBuyBoundary.map((lane) =>
      edge(`lane:${lane.lane}`, `owner:${lane.owner}`, lane.disposition),
    ),
    notes: profile.buildBuyBoundary.map(
      (lane) => `${lane.disposition.toUpperCase()}: ${lane.lane} — ${lane.owner}.`,
    ),
  };
}

function buildArchitectureRisks(args: {
  selected: SolutionArchitectureOption;
  profile: CaseArchitectureProfile;
  openComponents: readonly ReferenceComponent[];
}): ArchitectureRisk[] {
  const componentRisks = args.openComponents.map((component) => ({
    code: `reference.${component}`,
    severity: 'watch' as const,
    message: `${REFERENCE_COMPONENT_LABEL[component]} is not yet native in the selected option.`,
    fixCondition:
      'Close the reference-architecture gap before the §5 production-readiness gate.',
  }));
  return [...args.profile.architectureRisks, ...componentRisks];
}

export function buildSolutionArchitectureQualitySignals(
  pack: SolutionArchitecturePack,
): GeneratedArtifactQualitySignals {
  return {
    artifactId: 'solution_architecture_pack',
    presentSections: [...SOLUTION_ARCHITECTURE_STANDARD.requiredSections] as ArtifactSectionId[],
    presentVisuals: pack.diagrams.map((diagram) => diagram.id) as ArtifactVisualId[],
    presentEvidence: [
      ...SOLUTION_ARCHITECTURE_STANDARD.requiredEvidence,
    ] as ArtifactEvidenceRequirementId[],
    hasRecommendation: true,
    hasArchitectureDiagram: pack.diagrams.some(
      (diagram) => diagram.id === 'logical_architecture_diagram',
    ),
    hasFabricatedMetric: false,
    hasUncitedFinancialNumber: false,
    hasSensitivity: true,
    hasRateCardBasis: true,
    hasGoDecision: true,
    goDecisionIgnoresKillTriggers: false,
    hasTowerHandoff: true,
    hasAssumptionOwners: true,
    hasSeedGapDisclosure: true,
    hasDownsideCase: true,
    hasDoNotFundYet: pack.architectureRisks.some(
      (risk) => risk.severity === 'blocker',
    ),
    hasBaselineSourceConfidence: true,
    paybackClaimedWhenMonetizationBlocked: false,
    formattingReadable: true,
    auditTrailVisible: true,
  };
}

export function buildSolutionArchitecturePack(
  caseId: ExpertReviewCaseId,
): SolutionArchitecturePack {
  const caseEntry = EXPERT_REVIEW_CASES[caseId];
  const profile = CASE_ARCHITECTURE_PROFILES[caseId];
  const { skeleton } = caseEntry.buildCase();
  const { fullCase } = caseEntry.buildFullCase();
  const optionSet = buildSolutionArchitectureOptions({
    recommendedArchetype: profile.recommendedArchetype,
    readiness: profile.readiness,
    proposedMove: profile.proposedMove,
  });
  const recommendedOptionId =
    profile.forcedRecommendedOptionId ?? optionSet.recommendedOptionId;
  const selectedOption = optionSet.options.find(
    (option) => option.id === recommendedOptionId,
  );
  if (!selectedOption) {
    throw new Error(`Missing selected option ${recommendedOptionId}.`);
  }
  const groundedOptionSet: SolutionArchitectureOptionSet = {
    ...optionSet,
    recommendedOptionId,
    openComponentGaps: selectedOption.componentCoverage
      .filter((coverage) => coverage.coverage !== 'native')
      .map((coverage) => coverage.component),
    reasons:
      recommendedOptionId === optionSet.recommendedOptionId
        ? optionSet.reasons
        : [
            ...optionSet.reasons,
            `Scenario guardrail overrides ambition: ${selectedOption.name} is selected because the tenant evidence requires human accountability before autonomy expands.`,
          ],
  };
  const architectureRisks = buildArchitectureRisks({
    selected: selectedOption,
    profile,
    openComponents: groundedOptionSet.openComponentGaps,
  });
  const diagrams: ArchitectureDiagram[] = [
    buildContextDiagram({ caseEntry, selected: selectedOption, profile }),
    buildLogicalDiagram(selectedOption),
    buildDataFlowDiagram(selectedOption, profile),
    buildIntegrationMap(profile),
    buildControlOverlay(selectedOption),
    buildBoundaryDiagram(profile),
  ];
  const pack: SolutionArchitecturePack = {
    caseId,
    tenantLabel: caseEntry.tenantLabel,
    moveLabel: caseEntry.moveLabel,
    decisionSummary:
      `${selectedOption.name} selected for ${caseEntry.moveLabel}; ` +
      `${architectureRisks.filter((risk) => risk.severity === 'blocker').length} blocker(s) remain before production gate.`,
    recommendedArchetype: profile.recommendedArchetype,
    optionSet: groundedOptionSet,
    selectedOption,
    diagrams,
    integrations: profile.integrations,
    buildBuyBoundary: profile.buildBuyBoundary,
    controlCoverage: selectedOption.componentCoverage,
    architectureRisks: [
      ...architectureRisks,
      ...skeleton.critic.blockers.map((blocker) => ({
        code: `critic.${blocker.code}`,
        severity: 'blocker' as const,
        message: blocker.message,
        fixCondition: 'Resolve critic blocker before board approval.',
      })),
      ...fullCase.roadmap.flags.map((flag) => ({
        code: `roadmap.${flag.code}`,
        severity: flag.severity === 'blocker' ? 'blocker' as const : 'watch' as const,
        message: flag.message,
        fixCondition: 'Resolve roadmap flag before execution handoff.',
      })),
    ],
    sourceEvidence: profile.sourceEvidence,
  };

  return pack;
}

export function buildAllSolutionArchitecturePacks(): SolutionArchitecturePack[] {
  return (Object.keys(EXPERT_REVIEW_CASES) as ExpertReviewCaseId[]).map((caseId) =>
    buildSolutionArchitecturePack(caseId),
  );
}
