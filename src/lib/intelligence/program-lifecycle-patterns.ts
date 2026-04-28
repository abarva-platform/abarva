// src/lib/intelligence/program-lifecycle-patterns.ts
//
// Typed LifecyclePatternSeed definitions for the 6 ProgramPatternId values
// referenced by ProgramInstance.patternId. These mirror the structure of
// source-lifecycle-patterns.ts but are organised around the 7-phase program
// lifecycle (P0 Originate → P1 Discovery → P2 Synthesis → P3 Design →
// P4 Build → P5 Activate → P6 Operate) defined in PHASE_LABEL_MAP.
//
// Vocabulary uses program-management language: phase gates, OKRs, pilot
// success criteria, executive sponsor commitment, change adoption — not
// the procurement vocabulary (RFP, BAFO, NDA) used in the Source layer.

import type {
  LifecyclePatternSeed,
  LifecycleStage,
  GateCriterion,
  ExpectedArtifact,
  ContradictionTemplate,
  FailureMode,
} from './seed-types';

// ─── Shared 7-phase program lifecycle stages ─────────────────────────────────
// Identical phase identity across patterns; description text is reused so
// downstream consumers can rely on consistent stage IDs for cross-pattern
// joins. Pattern-specific intent is expressed in gateCriteria and artifacts.

const PROGRAM_STAGES: LifecycleStage[] = [
  {
    id: 'P0-Originate',
    label: 'P0 Originate',
    description:
      'Identify the strategic intent for the programme, secure executive sponsor commitment, and align on the value hypothesis. Stage ends when the business case is signed and the programme is funded for Discovery.',
    order: 0,
  },
  {
    id: 'P1-Discovery',
    label: 'P1 Discovery',
    description:
      'Investigate the current state, validate the problem space with stakeholders, and gather quantitative baselines. Produce the Discovery Report and stakeholder map. Stage ends when the problem is validated and the OKR baselines are agreed.',
    order: 1,
  },
  {
    id: 'P2-Synthesis',
    label: 'P2 Synthesis',
    description:
      'Synthesise Discovery findings into target-state options, evaluate trade-offs, and recommend a path forward. Architecture options are assessed and a preferred direction is selected. Stage ends with the Synthesis gate package approved by sponsor and architecture review.',
    order: 2,
  },
  {
    id: 'P3-Design',
    label: 'P3 Design',
    description:
      'Develop the detailed solution design, integration architecture, and pilot scope. Confirm vendor and tooling selections. Establish security, data, and operating-model designs. Stage ends with the Build gate package: detailed design signed off, pilot cohort named, success criteria locked.',
    order: 3,
  },
  {
    id: 'P4-Build',
    label: 'P4 Build',
    description:
      'Stand up the pilot environment, execute the pilot with the named cohort, and measure against pre-locked success criteria. Iterate on findings without expanding scope. Stage ends when the pilot meets or fails its success criteria and the Activate gate decision is taken.',
    order: 4,
  },
  {
    id: 'P5-Activate',
    label: 'P5 Activate',
    description:
      'Scale from pilot to broader population per the rollout plan. Execute change-management, training, and support readiness. Track adoption and value-realisation against OKRs. Stage ends when the rollout plan completes and the programme transitions to steady-state operation.',
    order: 5,
  },
  {
    id: 'P6-Operate',
    label: 'P6 Operate',
    description:
      'Run the capability in steady state under the agreed operating model. Continue measurement against OKRs, harvest improvement opportunities, and feed lessons learned into the portfolio. Programme governance closes when value-realisation is sustained and benefits are accepted by the business owner.',
    order: 6,
  },
];

// =============================================================================
// PAT-PRG-CDP-001 — Customer Data Platform program
// =============================================================================

const CDP_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-CDP-P0-01',
    description: 'Executive sponsor signed business case with named value hypothesis',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'The signed business case must name the sponsor, the customer-experience or revenue hypothesis, and the 3-year value envelope. A funding approval without an articulated value hypothesis is insufficient — it makes outcome measurement impossible at P5 and P6.',
  },
  {
    id: 'GATE-PRG-CDP-P1-01',
    description: 'Customer data fragmentation baseline measured across at least 5 source systems',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Discovery must produce a quantified record of duplicate identities, identifier overlap rates, and cross-channel resolution gaps. A qualitative description of fragmentation does not satisfy this gate; the baseline becomes the reference for Activate-stage value attribution.',
  },
  {
    id: 'GATE-PRG-CDP-P1-02',
    description: 'Stakeholder map covers marketing, digital, data, security, and a named business owner',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'A CDP without a named business owner outside of IT predicts adoption failure. The stakeholder map must show a non-IT owner accountable for use-case prioritisation and value realisation.',
  },
  {
    id: 'GATE-PRG-CDP-P2-01',
    description: 'Architecture options assessment with at least 3 alternatives evaluated',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'The Synthesis gate package must record managed-CDP, composable-CDP, and warehouse-native alternatives, with explicit treatment of identity-resolution responsibility and data-residency implications. A single-option recommendation does not satisfy this gate.',
  },
  {
    id: 'GATE-PRG-CDP-P2-02',
    description: 'Identity-graph approach decided and documented before personalization scope is locked',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Personalization without a stable identity graph produces non-deterministic results and erodes trust. The Synthesis package must declare the identity-graph design (deterministic, probabilistic, or hybrid) with vendor responsibility allocated.',
  },
  {
    id: 'GATE-PRG-CDP-P3-01',
    description: 'Pilot cohort named with consent posture and measurement plan',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'The pilot scope document must name the customer cohort, the consent basis under which they will be activated, and the measurement plan with pre/post comparison. A pilot without a measurement plan is a marketing experiment, not a programme pilot.',
  },
  {
    id: 'GATE-PRG-CDP-P3-02',
    description: 'Linked AMS or platform sourcing event resolved (vendor selected)',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'A CDP programme that depends on a sourcing outcome (managed-CDP vendor, AMS partner) cannot enter Build until the sourcing event has cleared its Selection or Award stage. Treat the source-event link as a hard schedule constraint, not a desirable feature.',
  },
  {
    id: 'GATE-PRG-CDP-P4-01',
    description: 'Pilot success criteria met or formally re-baselined',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'The Activate gate is the only point where pilot results are interpreted against pre-locked success criteria. If pilot misses criteria, the gate package must either record a kill decision or a sponsor-approved re-baseline with named scope changes.',
  },
  {
    id: 'GATE-PRG-CDP-P4-02',
    description: 'Security and privacy review complete with data-residency posture confirmed',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Pilot environments often run with relaxed posture; broad activation must not. The security review must confirm encryption, access boundaries, and data-residency posture against the live customer cohort, not the pilot subset.',
  },
  {
    id: 'GATE-PRG-CDP-P5-01',
    description: 'Adoption plan with named change-management resource active',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'A CDP with strong tooling but weak adoption plumbing under-realises value. The plan should name the marketing-ops lead, the training cadence, and the use-case backlog grooming process. Soft gate — programme may proceed with documented sponsor waiver if change resource is provisional.',
  },
  {
    id: 'GATE-PRG-CDP-P5-02',
    description: 'OKR measurement instrumentation live before broad activation',
    gateType: 'hard',
    stageId: 'P6-Operate',
    evaluationHint:
      'Without instrumentation, value-realisation is unknowable. The OKR dashboard must be live and observed for at least one full measurement window before transition to Operate.',
  },
];

const CDP_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-CDP-P0-01', label: 'Business Case', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Signed business case naming sponsor, value hypothesis, and 3-year value envelope.' },
  { id: 'ART-PRG-CDP-P0-02', label: 'Sponsor Commitment Letter', stageId: 'P0-Originate', requirement: 'recommended', gateType: 'soft', description: 'Letter or signed minutes recording sponsor commitment to programme cadence and decision rights.' },
  { id: 'ART-PRG-CDP-P1-01', label: 'Discovery Report', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Discovery findings, current-state pain points, fragmentation baseline measurements, and recommendations to Synthesis.' },
  { id: 'ART-PRG-CDP-P1-02', label: 'Stakeholder Map', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'RACI showing the business owner, marketing, digital, data, and security stakeholders by name.' },
  { id: 'ART-PRG-CDP-P1-03', label: 'OKR Baseline Worksheet', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Baseline measurements for the OKRs the programme intends to move (campaign performance, segment freshness, identity-resolution rate).' },
  { id: 'ART-PRG-CDP-P2-01', label: 'Architecture Options Assessment', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Evaluation of managed, composable, and warehouse-native CDP alternatives with trade-off analysis.' },
  { id: 'ART-PRG-CDP-P2-02', label: 'Identity Graph Design', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Documented identity-resolution approach (deterministic / probabilistic / hybrid) and the boundary of vendor responsibility.' },
  { id: 'ART-PRG-CDP-P2-03', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output presented to sponsor and architecture review.' },
  { id: 'ART-PRG-CDP-P3-01', label: 'Solution Architecture Document', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Detailed integration architecture, data layer scope, and operating-model design.' },
  { id: 'ART-PRG-CDP-P3-02', label: 'Pilot Cohort Definition', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Named pilot cohort, consent posture, and inclusion criteria.' },
  { id: 'ART-PRG-CDP-P3-03', label: 'Pilot Measurement Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Pre/post comparison design, success thresholds, and named measurement owner.' },
  { id: 'ART-PRG-CDP-P3-04', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Combined design and pilot package presented to sponsor for Build gate decision.' },
  { id: 'ART-PRG-CDP-P4-01', label: 'Pilot Results Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Pilot outcomes against pre-locked success criteria with named kill/scale recommendation.' },
  { id: 'ART-PRG-CDP-P4-02', label: 'Security & Privacy Sign-off', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Confirmation from security and privacy that production posture matches activation cohort risk.' },
  { id: 'ART-PRG-CDP-P5-01', label: 'Rollout Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Cohort-by-cohort scaling plan with named change-management owner.' },
  { id: 'ART-PRG-CDP-P5-02', label: 'Training & Enablement Pack', stageId: 'P5-Activate', requirement: 'recommended', gateType: 'soft', description: 'Marketing-ops training and use-case enablement assets.' },
  { id: 'ART-PRG-CDP-P5-03', label: 'OKR Dashboard (Live)', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Live OKR measurement instrumentation against pre-baselined metrics.' },
  { id: 'ART-PRG-CDP-P6-01', label: 'Operating Model Runbook', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Runbook describing steady-state ownership, escalation, and use-case backlog grooming.' },
  { id: 'ART-PRG-CDP-P6-02', label: 'Value Realisation Report (Q1)', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'First quarterly value-realisation report establishing the post-Activate trajectory.' },
];

const CDP_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-CDP-001',
    label: 'Vendor Identity-Resolution Claim vs Source-System Reality',
    severity: 'high',
    partyA: 'Vendor identity-graph claim',
    partyB: 'Measured fragmentation baseline',
    detectionHint:
      'Fires when a managed-CDP vendor claims out-of-the-box identity-resolution rates above 90% but the Discovery fragmentation baseline shows source-system identifier overlap below 60%. Keywords: "identity resolution", "match rate", "household", "deterministic", "probabilistic". The vendor claim is upstream of the data condition — it cannot be true without remediation in the source systems.',
    resolutionPath:
      'Require the vendor to state their assumed identifier coverage and what happens when it is below threshold. Add an identity-remediation track to the design before pilot. Re-state the resolution rate as a programme outcome rather than a vendor capability.',
  },
  {
    id: 'CON-PRG-CDP-002',
    label: 'Use-Case Backlog vs Activation Capacity',
    severity: 'medium',
    partyA: 'Marketing use-case backlog ambition',
    partyB: 'Activation runtime capacity',
    detectionHint:
      'Fires when the marketing use-case backlog exceeds the activation runtime capacity (segments per day, audience size limits, downstream channel rate limits). Keywords: "activation", "audience", "segment refresh", "channel rate limit". Without throttling, the CDP becomes a backlog generator rather than a value engine.',
    resolutionPath:
      'Score the backlog by value-density and runtime cost. Sequence high-value use-cases first; defer or decline low-density use-cases. Make the trade-off visible to the business owner.',
  },
  {
    id: 'CON-PRG-CDP-003',
    label: 'Pilot Scope vs Production Consent Posture',
    severity: 'high',
    partyA: 'Pilot consent assumption',
    partyB: 'Production privacy posture',
    detectionHint:
      'Fires when pilot operates under a relaxed consent regime (internal audience, sandbox cohort, simulated data) but the Activate plan does not document how production consent will be obtained. Keywords: "consent", "opt-in", "GDPR", "sandbox", "internal audience".',
    resolutionPath:
      'Require an explicit consent-uplift plan as part of the Build gate package. The Security & Privacy sign-off must confirm that the activation cohort is consent-eligible.',
  },
  {
    id: 'CON-PRG-CDP-004',
    label: 'Implementation Timeline vs Source-System Readiness',
    severity: 'high',
    partyA: 'Vendor implementation timeline',
    partyB: 'Source-system data quality state',
    detectionHint:
      'Fires when the vendor or systems-integrator timeline assumes data already meets quality thresholds the Discovery baseline shows it does not. Keywords: "timeline", "go-live", "data quality", "data readiness". Common when the SI prices an aggressive timeline to win the work.',
    resolutionPath:
      'Add a data-readiness track ahead of the integration track. Reset the timeline if remediation cannot run in parallel. Capture the contradiction in the Build gate package so the sponsor can decide consciously.',
  },
];

const CDP_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-CDP-001',
    label: 'Tooling Without Adoption',
    description:
      'The CDP is technically delivered but marketing and digital teams continue operating from legacy tools. Adoption is treated as a follow-on initiative rather than a Programme requirement, so value realisation flat-lines.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'Name a non-IT business owner at P0 and review their accountability at every gate.',
      'Make the Activate gate dependent on adoption telemetry, not just go-live.',
      'Defer or descope tooling features that no team is committed to using.',
    ],
  },
  {
    id: 'FM-PRG-CDP-002',
    label: 'Identity Graph Treated as Vendor Output',
    description:
      'The identity graph is delegated to the vendor without programme-side ownership. When match rates are below claim, neither side has authority to remediate, and the programme stalls in the Build phase.',
    stages: ['P3-Design', 'P4-Build'],
    mitigations: [
      'Require the identity-graph design as a programme artefact at P2 Synthesis.',
      'Allocate explicit responsibility for source-system identifier hygiene.',
      'Track match rates as a measured outcome, not a vendor commitment.',
    ],
  },
  {
    id: 'FM-PRG-CDP-003',
    label: 'Pilot Success Criteria Drift',
    description:
      'Pilot success thresholds are negotiated downward during the pilot to keep the programme on schedule, so the Activate decision is taken on weakened evidence and the eventual benefit case is unsupported.',
    stages: ['P4-Build'],
    mitigations: [
      'Lock success criteria in the Build gate package before pilot start.',
      'Require sponsor sign-off on any criterion change with explicit re-baseline language.',
      'Treat criterion drift as a contradiction event, not a routine plan update.',
    ],
  },
  {
    id: 'FM-PRG-CDP-004',
    label: 'Source-Event Decoupling',
    description:
      'The CDP programme treats the AMS or platform sourcing event as ambient context rather than a hard input. The programme attempts to enter Build before vendor selection, and the resulting design is contingent on assumptions that fail at award.',
    stages: ['P3-Design'],
    mitigations: [
      'Bind the linked source event to the P3 → P4 gate as a blocking dependency.',
      'Hold the Design gate review jointly with the source-event Selection committee.',
      'Document the contingency in writing if the programme advances ahead of award.',
    ],
  },
];

export const PAT_PRG_CDP_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-CDP-001',
  slug: 'cdp-program-lifecycle',
  title: 'Customer Data Platform Programme Lifecycle',
  domain: 'cdp',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'CDP programmes succeed when treated as cross-functional capability programmes — not platform installations. The 7-phase lifecycle enforces an evidence chain from value hypothesis (P0) through measured baseline (P1), architecture decision (P2), pilot scope (P3), pilot result (P4), scaled adoption (P5), and steady-state value realisation (P6). Each gate exists to surface contradictions between vendor claims, source-system reality, and adoption capacity before they convert into value-leakage downstream.',
  applicability:
    'Apply to any programme establishing a Customer Data Platform capability, whether managed (Twilio Segment, Salesforce Data Cloud, Adobe Real-Time CDP), composable (Hightouch, Census on a warehouse), or warehouse-native. Most relevant when the programme depends on a parallel sourcing event for vendor selection, when identity resolution must be designed across multiple source systems, or when the business case is denominated in marketing or digital outcomes that require new instrumentation.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.9,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 1,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: ['GDPR', 'CCPA'],
  relatedPatternIds: [
    'PAT-CDP-001',
    'PAT-CDP-004',
    'PAT-CDP-006',
    'PAT-CDP-007',
    'PAT-CDP-008',
    'PAT-CDP-009',
    'PAT-CDP-010',
  ],
  derivedFromPatternIds: ['PAT-CDP-001'],
  taggedContradictionIds: ['CON-PRG-CDP-001', 'CON-PRG-CDP-002', 'CON-PRG-CDP-003', 'CON-PRG-CDP-004'],
  body: `## What a CDP Programme Is

A Customer Data Platform programme is the cross-functional effort to stand up a unified view of the customer for activation, analytics, and personalisation purposes. It is not a platform installation. The platform is one component of a larger capability that includes identity resolution, consent management, source-system hygiene, use-case prioritisation, channel activation, change management, and steady-state value measurement. Programmes that conflate the platform with the capability under-deliver on the business case and erode sponsor trust.

## The Phase Gates Exist for a Reason

The 7-phase lifecycle (P0 Originate → P6 Operate) is not a project-management artefact; it is a contradiction-detection scaffold. P0 surfaces value-hypothesis ambiguity before funding. P1 surfaces source-system reality before architecture. P2 forces an explicit identity-graph decision before personalisation scope is locked. P3 binds the programme to a measured pilot. P4 produces evidence — kill or scale. P5 tests adoption against tooling. P6 measures sustained value. Skipping a gate or treating it as a calendar checkpoint defeats the purpose. The Build gate (P3 → P4) is the most commonly compressed: vendor selection is incomplete, the pilot cohort is not named, success criteria are vague. When this gate is weak, the Activate decision becomes subjective and the value case becomes unprovable.

## The Source-Event Linkage

Most CDP programmes have a hard dependency on a sourcing event — either an AMS partner who will operate the integration estate, or a managed-CDP vendor who will provide the platform itself. The programme must bind that source event as a P3 → P4 hard gate. Attempting to enter Build before the source event clears Selection produces designs contingent on vendor decisions that may not hold, and the resulting rework consumes pilot capacity that should have been spent learning. The AMS Vendor Consolidation source event in the Apex Retail demo is the canonical example: the CDP Build gate cannot clear until the AMS award and transition timeline are confirmed.

## Common Failure Modes

The four documented failure modes recur across CDP programmes. Tooling Without Adoption is the most expensive: a successful go-live followed by flat OKRs because the marketing operating model never absorbed the new capability. Identity Graph Treated as Vendor Output is the most under-recognised: the programme assumes the vendor will deliver high match rates without programme-side investment in source-system identifier hygiene. Pilot Success Criteria Drift is the most subtle: the pilot is in flight, schedule pressure builds, and thresholds are negotiated downward in working sessions rather than at the gate. Source-Event Decoupling is the most preventable: with a source-event link recorded as a hard gate dependency, the programme cannot accidentally drift past it.

## Adoption Is the Programme's Outcome

A CDP programme that delivers tooling but not adoption has not delivered. The Activate (P5) and Operate (P6) gates exist to make this assertion concrete: the programme measures adoption telemetry, value-realisation against OKR baselines, and use-case throughput against capacity. The named business owner outside of IT is the person who reads those reports and acts on them. Without that role, the platform is operationally complete but commercially unproven, and the next portfolio review will struggle to justify continued investment.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-CDP-001',
  stages: PROGRAM_STAGES,
  gateCriteria: CDP_GATE_CRITERIA,
  expectedArtifacts: CDP_EXPECTED_ARTIFACTS,
  contradictionTemplates: CDP_CONTRADICTIONS,
  failureModes: CDP_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-CDP-001',
    'PAT-CDP-004',
    'PAT-CDP-006',
    'PAT-CDP-007',
    'PAT-CDP-008',
    'PAT-CDP-009',
    'PAT-CDP-010',
    'PAT-SRC-AMS-001',
  ],
  typicalDurationDays: { min: 180, max: 365 },
};

// =============================================================================
// PAT-PRG-AI-CODING-001 — AI coding assistant rollout
// =============================================================================

const AI_CODING_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-AICOD-P0-01',
    description: 'CTO or VP Engineering signed sponsor for the rollout',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'AI coding assistant rollouts that lack engineering-leadership sponsorship default to vendor-driven adoption and fragmenting tool sprawl. The sponsor must be senior enough to land an org-wide developer-experience decision.',
  },
  {
    id: 'GATE-PRG-AICOD-P1-01',
    description: 'Baseline developer productivity metrics measured pre-rollout',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'PR-cycle time, change-failure rate, and self-reported time-on-task should be measured before the assistant is deployed. Without baselines, post-rollout claims of productivity uplift are anecdotal and cannot survive a portfolio review.',
  },
  {
    id: 'GATE-PRG-AICOD-P1-02',
    description: 'Repository inventory and IP exposure posture documented',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Discovery must enumerate the codebases in scope, the IP sensitivity of each, and the outbound traffic posture. Some repositories may not be eligible for context-window inclusion regardless of the vendor selected.',
  },
  {
    id: 'GATE-PRG-AICOD-P2-01',
    description: 'Vendor selection rationale documented (build-vs-buy and vendor short-list)',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Synthesis must record why a single vendor was chosen across a comparable set (Copilot, Cursor, Codeium, Tabnine, internal). Skipping comparison invites later vendor sprawl driven by individual developer preference.',
  },
  {
    id: 'GATE-PRG-AICOD-P2-02',
    description: 'Security and IP-leak posture confirmed for selected vendor',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Confirm code-context retention policy, model-training opt-out, and customer-data isolation. Vague vendor commitments around "we do not train on your code" are insufficient — request a contractual commitment.',
  },
  {
    id: 'GATE-PRG-AICOD-P3-01',
    description: 'Pilot cohort named (1–3 teams) with measurement plan',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'The pilot should run for 6–10 weeks with named teams, baselined on the same productivity metrics measured at P1, and a structured developer-experience survey at start and end.',
  },
  {
    id: 'GATE-PRG-AICOD-P4-01',
    description: 'Pilot productivity uplift measured (not assumed)',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Compare PR-cycle time, change-failure rate, and self-reported time-on-task against pre-rollout baselines. A self-reported uplift without measurement is insufficient for the Activate gate.',
  },
  {
    id: 'GATE-PRG-AICOD-P4-02',
    description: 'Code-quality regression evaluation complete',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Track defect-density and reviewer-rejection rate during pilot. Productivity uplift accompanied by quality regression is a different decision than productivity uplift without quality regression.',
  },
  {
    id: 'GATE-PRG-AICOD-P5-01',
    description: 'Rollout sequence aligned with capacity and licence economics',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Activate plan should sequence teams to fit licence-procurement cadence and avoid overwhelming the support model. A waterfall of all-at-once activation predicts support backlog.',
  },
  {
    id: 'GATE-PRG-AICOD-P5-02',
    description: 'Developer-experience survey instrumented as ongoing measurement',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Quarterly DX survey replaces the pilot survey for ongoing measurement. Results feed the portfolio kill/expand decision at the next portfolio review.',
  },
];

const AI_CODING_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-AICOD-P0-01', label: 'Engineering Sponsor Charter', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor commitment with named decision rights for vendor selection and rollout policy.' },
  { id: 'ART-PRG-AICOD-P0-02', label: 'Funding & Licence Envelope', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: '3-year licence-cost envelope and funding source.' },
  { id: 'ART-PRG-AICOD-P1-01', label: 'Productivity Baseline Report', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Pre-rollout PR-cycle time, change-failure rate, self-reported time-on-task per cohort.' },
  { id: 'ART-PRG-AICOD-P1-02', label: 'Repository Inventory & IP Posture', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Repository list with IP-sensitivity classification and outbound traffic posture per repo.' },
  { id: 'ART-PRG-AICOD-P1-03', label: 'Developer-Experience Baseline Survey', stageId: 'P1-Discovery', requirement: 'recommended', gateType: 'soft', description: 'Pre-rollout DX survey covering tool satisfaction, friction points, and trust posture toward AI tooling.' },
  { id: 'ART-PRG-AICOD-P2-01', label: 'Vendor Selection Rationale', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Documented short-list and rationale (Copilot, Cursor, Codeium, Tabnine, internal).' },
  { id: 'ART-PRG-AICOD-P2-02', label: 'Security & IP-Leak Assessment', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Vendor security review covering code-context retention, training opt-out, and isolation.' },
  { id: 'ART-PRG-AICOD-P2-03', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output for sponsor sign-off.' },
  { id: 'ART-PRG-AICOD-P3-01', label: 'Pilot Plan & Cohort Definition', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: '1–3 named pilot teams, success criteria, measurement plan, and timeline.' },
  { id: 'ART-PRG-AICOD-P3-02', label: 'IDE & Repository Configuration Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Per-IDE deployment plan with repository allow/deny lists.' },
  { id: 'ART-PRG-AICOD-P3-03', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Combined design and pilot package for sponsor Build gate decision.' },
  { id: 'ART-PRG-AICOD-P4-01', label: 'Pilot Productivity Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Measured uplift in PR-cycle time, change-failure rate, time-on-task.' },
  { id: 'ART-PRG-AICOD-P4-02', label: 'Code-Quality Regression Analysis', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Defect-density and reviewer-rejection rate analysis from pilot.' },
  { id: 'ART-PRG-AICOD-P4-03', label: 'Pilot DX Survey', stageId: 'P4-Build', requirement: 'recommended', gateType: 'soft', description: 'End-of-pilot developer-experience survey.' },
  { id: 'ART-PRG-AICOD-P5-01', label: 'Rollout Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Sequenced rollout aligned with licence procurement and support capacity.' },
  { id: 'ART-PRG-AICOD-P5-02', label: 'Enablement & Training Pack', stageId: 'P5-Activate', requirement: 'recommended', gateType: 'soft', description: 'Onboarding guide, prompt-library, and team-lead playbook.' },
  { id: 'ART-PRG-AICOD-P6-01', label: 'Quarterly DX Survey (Operationalised)', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Recurring survey instrumented as ongoing measurement.' },
  { id: 'ART-PRG-AICOD-P6-02', label: 'Portfolio Review Brief', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Post-rollout brief for the next portfolio review with kill/expand recommendation.' },
];

const AI_CODING_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-AICOD-001',
    label: 'Vendor Productivity Claim vs Measured Uplift',
    severity: 'high',
    partyA: 'Vendor productivity claim',
    partyB: 'Measured pilot uplift',
    detectionHint:
      'Fires when a vendor cites internal or industry studies showing 30–55% productivity uplift but the pilot measurement shows uplift below 15% on the same metrics. Keywords: "productivity", "uplift", "developer velocity", "PR throughput".',
    resolutionPath:
      'Treat the pilot measurement as authoritative. Adjust the business case to the measured value before Activate. If the vendor disputes, request the underlying methodology of their cited studies.',
  },
  {
    id: 'CON-PRG-AICOD-002',
    label: 'IP-Leak Claim vs Contractual Commitment',
    severity: 'high',
    partyA: 'Vendor verbal commitment on training data',
    partyB: 'MSA / DPA contractual language',
    detectionHint:
      'Fires when the vendor states verbally that customer code is not used for model training but the contract or DPA permits training on aggregated, anonymised, or feedback-derived signals. Keywords: "training data", "telemetry", "feedback", "anonymised", "aggregated".',
    resolutionPath:
      'Require a written addendum that mirrors the verbal commitment. If the vendor will not amend, escalate to security and reconsider the selection.',
  },
  {
    id: 'CON-PRG-AICOD-003',
    label: 'Productivity Uplift vs Quality Regression',
    severity: 'medium',
    partyA: 'PR throughput uplift',
    partyB: 'Defect-density or reviewer-rejection trend',
    detectionHint:
      'Fires when pilot shows productivity uplift accompanied by a measurable rise in defect-density, reviewer-rejection rate, or post-merge revert frequency. Keywords: "defects", "regression", "rejection", "revert".',
    resolutionPath:
      'Document the trade-off explicitly in the Pilot Results Report. Decide whether to scale, scale with reviewer-uplift mitigations, or pause for tooling-policy adjustment.',
  },
  {
    id: 'CON-PRG-AICOD-004',
    label: 'Rollout Pace vs Support Capacity',
    severity: 'medium',
    partyA: 'Rollout schedule',
    partyB: 'Support and licence-management capacity',
    detectionHint:
      'Fires when the rollout sequence onboards more teams per week than the support model and licence-procurement process can absorb. Keywords: "rollout", "onboarding", "support backlog", "licence".',
    resolutionPath:
      'Re-sequence to a sustainable cadence. Make the trade-off visible to the sponsor — pace vs support quality.',
  },
];

const AI_CODING_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-AICOD-001',
    label: 'Tool Sprawl from Bottom-Up Adoption',
    description:
      'Without sponsor authority, individual teams adopt different assistants based on personal preference, defeating the rationalisation case and exposing IP across multiple vendor boundaries.',
    stages: ['P0-Originate', 'P5-Activate'],
    mitigations: [
      'Secure CTO-level sponsorship at P0 with explicit vendor-decision authority.',
      'Treat unsanctioned tool usage as a governance event surfaced in the Operate review.',
      'Cite the vendor-rationalisation knowledge pattern (PAT-AI-003) in the business case.',
    ],
  },
  {
    id: 'FM-PRG-AICOD-002',
    label: 'Productivity Claim Without Measurement',
    description:
      'The programme cites vendor productivity claims in the business case, deploys broadly, and never measures actual uplift. At the next portfolio review the value case is anecdotal and cannot survive scrutiny.',
    stages: ['P1-Discovery', 'P4-Build', 'P6-Operate'],
    mitigations: [
      'Treat the productivity baseline as a P1 hard gate.',
      'Compare vendor-cited uplift against measured uplift at P4.',
      'Operationalise the DX survey as recurring measurement.',
    ],
  },
  {
    id: 'FM-PRG-AICOD-003',
    label: 'IP Leakage Through Context Windows',
    description:
      'The assistant is deployed without repository-level allow/deny configuration, and sensitive code is sent into vendor context windows or training pipelines that the security review did not authorise.',
    stages: ['P3-Design', 'P5-Activate'],
    mitigations: [
      'Require an IDE & Repository Configuration Plan as a P3 hard artefact.',
      'Tie IP posture to the repository inventory baselined at P1.',
      'Audit context-window settings post-rollout as a governance event.',
    ],
  },
  {
    id: 'FM-PRG-AICOD-004',
    label: 'Quality Regression Discovered Late',
    description:
      'Productivity gains during pilot mask a defect-density rise that becomes visible only after broad rollout, when reviewer capacity is overwhelmed and rollback is operationally costly.',
    stages: ['P4-Build', 'P5-Activate'],
    mitigations: [
      'Measure defect-density and reviewer-rejection trends as part of the pilot, not after.',
      'Make quality regression a decision input at the Activate gate.',
      'Pre-agree the rollback criterion before broad rollout.',
    ],
  },
];

export const PAT_PRG_AI_CODING_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-AI-CODING-001',
  slug: 'ai-coding-assistant-program-lifecycle',
  title: 'AI Coding Assistant Rollout Programme Lifecycle',
  domain: 'ai_programs',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'AI coding assistant rollouts succeed or fail on the strength of the measurement loop. The 7-phase lifecycle binds the value case to a baseline at P1, a vendor decision at P2, a measured pilot at P3 and P4, and recurring DX measurement at P6. Without this loop, the rollout becomes a licence-spend event whose productivity claims cannot be defended at the next portfolio review.',
  applicability:
    'Apply when an engineering organisation is rolling out an AI coding assistant (Copilot, Cursor, Codeium, Tabnine, internal) above pilot scale, when the rollout has consequential licence or vendor-rationalisation implications, or when the programme must report productivity outcomes to a governance body. Most relevant when the engineering estate is large enough that bottom-up tool sprawl is a credible failure mode.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.88,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: [
    'PAT-AI-001',
    'PAT-AI-002',
    'PAT-AI-003',
    'PAT-AI-006',
    'PAT-AI-008',
    'PAT-AI-010',
    'PAT-AI-013',
  ],
  derivedFromPatternIds: ['PAT-AI-006'],
  taggedContradictionIds: ['CON-PRG-AICOD-001', 'CON-PRG-AICOD-002', 'CON-PRG-AICOD-003', 'CON-PRG-AICOD-004'],
  body: `## What an AI Coding Assistant Rollout Is

An AI coding assistant rollout is the programme to deploy a developer-facing AI tool (Copilot, Cursor, Codeium, Tabnine, internal) across an engineering organisation, with the explicit objective of producing measurable productivity uplift while controlling IP exposure, vendor sprawl, and quality regression. The 7-phase lifecycle (P0 Originate → P6 Operate) keeps the programme honest about what is being measured, against what baseline, and under what governance.

## Measurement Is the Programme

Productivity claims for AI coding assistants vary widely (5–55% across published studies) and depend heavily on cohort, codebase, and methodology. The programme cannot defend its value case downstream by citing vendor studies; it must measure its own uplift. The P1 baseline (PR-cycle time, change-failure rate, self-reported time-on-task) is therefore a hard gate, not a nice-to-have. The P4 pilot measurement compares the same metrics in the same cohort. The P6 DX survey operationalises measurement as steady-state. Without these measurement points, the next portfolio review evaluates the programme on anecdote, and anecdote loses to budget pressure.

## Vendor Selection and IP Posture

Bottom-up tool adoption produces sprawl: different teams choose different assistants, IP is exposed across multiple vendor boundaries, and the rationalisation case becomes unrecoverable. The P0 sponsor must have authority to land an org-wide decision, and the P2 Synthesis gate must produce a documented short-list rationale. The IP-leak posture is decided here as well: code-context retention, model-training opt-out, customer-data isolation. Verbal vendor commitments around training data are insufficient — the contract must mirror the verbal posture, and a P2 gate cannot clear without a documented contractual commitment.

## Pilot Discipline

The pilot cohort (1–3 teams over 6–10 weeks) is where the programme produces its evidence. The Build gate (P3 → P4) requires a named cohort, locked success criteria, and a measurement plan that mirrors the P1 baseline. The Activate gate (P4 → P5) interprets pilot results: productivity uplift accompanied by quality regression is a different decision than uplift without regression. Either way, the decision is made on data, not enthusiasm. Programmes that compress the pilot — running for 2 weeks, surveying without measurement, scaling on developer enthusiasm — are reliably the programmes whose value case collapses at the next portfolio review.

## Operate-Phase Discipline

Activation is not the end of the programme. Operate (P6) operationalises the DX survey on a quarterly cadence, feeds results into the portfolio review process, and applies the kill-criteria pattern (PAT-AI-008) where uplift fails to sustain. Programmes that treat Activate as the finish line lose visibility into adoption fade, quality drift, and tooling sprawl that returns once the rollout pressure is off.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-AI-CODING-001',
  stages: PROGRAM_STAGES,
  gateCriteria: AI_CODING_GATE_CRITERIA,
  expectedArtifacts: AI_CODING_ARTIFACTS,
  contradictionTemplates: AI_CODING_CONTRADICTIONS,
  failureModes: AI_CODING_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-AI-001',
    'PAT-AI-002',
    'PAT-AI-003',
    'PAT-AI-006',
    'PAT-AI-008',
    'PAT-AI-010',
    'PAT-AI-013',
  ],
  typicalDurationDays: { min: 90, max: 270 },
};

// =============================================================================
// PAT-PRG-COPILOT-001 — Copilot deployment program (M365/productivity copilot)
// =============================================================================

const COPILOT_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-CPLT-P0-01',
    description: 'Sponsor agreement on knowledge-worker cohort and value hypothesis',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'Productivity copilot deployments fail when scope is "everyone". The sponsor must declare which knowledge-worker cohorts are in scope and what the value hypothesis is for each.',
  },
  {
    id: 'GATE-PRG-CPLT-P1-01',
    description: 'Permissions and data-exposure baseline measured (oversharing audit)',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Productivity copilots surface whatever the user already had latent access to. Discovery must measure SharePoint / OneDrive permission sprawl and identify the remediation track. A copilot deployed onto an over-shared estate produces governance incidents within weeks.',
  },
  {
    id: 'GATE-PRG-CPLT-P1-02',
    description: 'Time-spent-on-task baseline measured for target cohorts',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Either via diary studies, telemetry, or structured self-report. Without baselines, post-rollout uplift claims are anecdotal.',
  },
  {
    id: 'GATE-PRG-CPLT-P2-01',
    description: 'Sensitivity-labelling and DLP posture confirmed for copilot scope',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Copilot output inherits and propagates source-document sensitivity. The Synthesis gate must record the labelling and DLP posture and identify gaps that need remediation before pilot.',
  },
  {
    id: 'GATE-PRG-CPLT-P2-02',
    description: 'Use-case backlog scored by value-density and risk',
    gateType: 'soft',
    stageId: 'P3-Design',
    evaluationHint:
      'A use-case backlog that is unscored becomes a wish-list. Score each use case on time-saved, risk surface, and adoption fit so Activate can sequence high-value use-cases first.',
  },
  {
    id: 'GATE-PRG-CPLT-P3-01',
    description: 'Pilot cohort named (50–200 users) with locked success criteria',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Pilot at sub-50 users produces signal too weak to act on. Pilot at >200 users without prior remediation amplifies any oversharing or labelling issues. The named cohort, success criteria, and measurement plan are locked at P3.',
  },
  {
    id: 'GATE-PRG-CPLT-P4-01',
    description: 'Pilot results show measured time-savings and adoption rate',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Adoption rate (weekly active use) is as important as time-saved. A pilot with strong time-saved among heavy users but low adoption breadth is a different decision than uniform adoption with modest savings per user.',
  },
  {
    id: 'GATE-PRG-CPLT-P4-02',
    description: 'Sensitivity / DLP incidents during pilot reviewed and adjudicated',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Any incident where copilot exposed restricted material, propagated mis-labelled content, or surfaced unintended access must be reviewed before broad activation.',
  },
  {
    id: 'GATE-PRG-CPLT-P5-01',
    description: 'Change-management plan with named per-cohort owner',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Productivity copilots realise value through changed work patterns. Without a named change-owner per cohort, Activate becomes a licence push with no behavioural follow-through.',
  },
  {
    id: 'GATE-PRG-CPLT-P5-02',
    description: 'Quarterly value-realisation cadence with sponsor review',
    gateType: 'hard',
    stageId: 'P6-Operate',
    evaluationHint:
      'A standing review keeps the programme honest about whether the productivity case is materialising. Without it, the deployment becomes invisible until the next budget cycle.',
  },
];

const COPILOT_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-CPLT-P0-01', label: 'Sponsor Charter', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor commitment naming target cohorts and value hypothesis per cohort.' },
  { id: 'ART-PRG-CPLT-P0-02', label: 'Funding Envelope', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Per-seat licence cost and 3-year envelope.' },
  { id: 'ART-PRG-CPLT-P1-01', label: 'Oversharing Audit', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Measured baseline of permission sprawl across SharePoint, OneDrive, Teams, and email mailboxes.' },
  { id: 'ART-PRG-CPLT-P1-02', label: 'Time-Spent Baseline', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Per-cohort time-on-task baselines for the target activities.' },
  { id: 'ART-PRG-CPLT-P1-03', label: 'Use-Case Discovery Report', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Inventory of candidate use-cases per cohort with sponsor-validated priority.' },
  { id: 'ART-PRG-CPLT-P2-01', label: 'Sensitivity & DLP Posture Assessment', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Documented labelling and DLP gaps requiring remediation.' },
  { id: 'ART-PRG-CPLT-P2-02', label: 'Use-Case Backlog (Scored)', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Scored backlog by value-density, risk surface, and adoption fit.' },
  { id: 'ART-PRG-CPLT-P2-03', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output for sponsor.' },
  { id: 'ART-PRG-CPLT-P3-01', label: 'Pilot Plan & Cohort Definition', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: '50–200 user named cohort, locked success criteria.' },
  { id: 'ART-PRG-CPLT-P3-02', label: 'Permissions Remediation Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Plan to address oversharing baseline before pilot or in parallel with controlled pilot scope.' },
  { id: 'ART-PRG-CPLT-P3-03', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Sponsor-facing package for Build gate decision.' },
  { id: 'ART-PRG-CPLT-P4-01', label: 'Pilot Results Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Time-saved, adoption rate, satisfaction survey results.' },
  { id: 'ART-PRG-CPLT-P4-02', label: 'Sensitivity Incident Review', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Adjudication of any DLP / oversharing incidents observed during pilot.' },
  { id: 'ART-PRG-CPLT-P5-01', label: 'Rollout Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Cohort-by-cohort sequence with named change-owner per cohort.' },
  { id: 'ART-PRG-CPLT-P5-02', label: 'Enablement Pack', stageId: 'P5-Activate', requirement: 'recommended', gateType: 'soft', description: 'Prompt-library, use-case guides, and team-lead playbook per cohort.' },
  { id: 'ART-PRG-CPLT-P5-03', label: 'Adoption Telemetry Dashboard', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Live dashboard tracking weekly-active-use per cohort.' },
  { id: 'ART-PRG-CPLT-P6-01', label: 'Quarterly Value-Realisation Review', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Standing sponsor-review cadence on time-saved, adoption, incidents.' },
  { id: 'ART-PRG-CPLT-P6-02', label: 'Operating Runbook', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Steady-state runbook covering use-case grooming, incident response, and licence management.' },
];

const COPILOT_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-CPLT-001',
    label: 'Permissions Posture vs Copilot Surface',
    severity: 'high',
    partyA: 'Assumed least-privilege posture',
    partyB: 'Measured oversharing baseline',
    detectionHint:
      'Fires when the deployment plan assumes a clean permission posture but the oversharing audit shows widespread anonymous-link sharing, broad permissions on confidential libraries, or stale group memberships. Keywords: "oversharing", "anonymous link", "permissions", "broken inheritance".',
    resolutionPath:
      'Either remediate the permissions baseline before broad activation, or scope the pilot to permission-clean libraries until remediation completes. Make the trade-off visible to the security sponsor.',
  },
  {
    id: 'CON-PRG-CPLT-002',
    label: 'Vendor Time-Saved Claim vs Cohort Reality',
    severity: 'medium',
    partyA: 'Vendor productivity claim (e.g., 40% time saved)',
    partyB: 'Measured pilot time-savings',
    detectionHint:
      'Fires when vendor citations of large-scale time-savings are not corroborated by the pilot measurement, even with strong adoption. Keywords: "time saved", "productivity", "minutes per task".',
    resolutionPath:
      'Restate the value case at the measured level. If the vendor disputes, request the underlying methodology and cohort comparability.',
  },
  {
    id: 'CON-PRG-CPLT-003',
    label: 'Sensitivity Labelling Coverage vs Output Inheritance',
    severity: 'high',
    partyA: 'Documented sensitivity-label coverage',
    partyB: 'Copilot-generated artefact inheritance',
    detectionHint:
      'Fires when copilot-generated output is observed without an inherited sensitivity label, exposing confidential material in Teams, email, or external surfaces. Keywords: "sensitivity label", "DLP", "MIP", "label inheritance".',
    resolutionPath:
      'Pause activation for the affected scope. Remediate the labelling gap and re-baseline the DLP posture before resuming.',
  },
  {
    id: 'CON-PRG-CPLT-004',
    label: 'Adoption Breadth vs Heavy-User Skew',
    severity: 'medium',
    partyA: 'Reported per-cohort adoption',
    partyB: 'Distribution of weekly-active use',
    detectionHint:
      'Fires when reported adoption is healthy at the cohort aggregate but the distribution shows that >70% of usage comes from <20% of users. Keywords: "adoption", "weekly active", "long tail", "distribution".',
    resolutionPath:
      'Adjust the change-management plan to address the long tail. Sponsor decides whether to invest further in adoption breadth or accept the heavy-user pattern.',
  },
];

const COPILOT_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-CPLT-001',
    label: 'Oversharing Amplified by Copilot',
    description:
      'Latent permission sprawl is exposed by copilot semantic search, producing governance incidents within weeks of activation. Sponsor and CISO trust in the programme erodes rapidly.',
    stages: ['P4-Build', 'P5-Activate'],
    mitigations: [
      'Treat the oversharing audit as a P1 hard gate.',
      'Remediate before pilot or constrain pilot scope to clean libraries.',
      'Maintain a continuous DLP review during Activate.',
    ],
  },
  {
    id: 'FM-PRG-CPLT-002',
    label: 'Adoption Without Behavioural Change',
    description:
      'Users open copilot, generate output, and revert to existing patterns. Telemetry shows usage but time-spent baselines do not move. Value case fails the quarterly review.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'Name a change-owner per cohort at P5.',
      'Pair adoption telemetry with time-spent re-measurement.',
      'Operate the use-case backlog actively rather than as a static list.',
    ],
  },
  {
    id: 'FM-PRG-CPLT-003',
    label: '"Everyone" Scope',
    description:
      'Sponsor declines to name target cohorts and the deployment proceeds on the assumption that all knowledge workers will benefit equally. Adoption fragments and the value case becomes unattributable.',
    stages: ['P0-Originate', 'P5-Activate'],
    mitigations: [
      'Force cohort declaration as a P0 hard gate.',
      'Reject "everyone" sponsor language with a written follow-up.',
      'Sequence Activate by cohort value-density, not licence availability.',
    ],
  },
  {
    id: 'FM-PRG-CPLT-004',
    label: 'Licence Push Without Use-Case Backlog',
    description:
      'Licences are deployed but the use-case backlog is missing or unscored. Users encounter the tool with no curated examples, adoption stalls, and the programme becomes a licence-spend story.',
    stages: ['P3-Design', 'P5-Activate'],
    mitigations: [
      'Score the use-case backlog as a P2 hard artefact.',
      'Sequence Activate against backlog priority.',
      'Maintain backlog grooming as a P6 governance routine.',
    ],
  },
];

export const PAT_PRG_COPILOT_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-COPILOT-001',
  slug: 'copilot-deployment-program-lifecycle',
  title: 'Productivity Copilot Deployment Programme Lifecycle',
  domain: 'ai_programs',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Productivity copilot deployments (M365 Copilot, Google Duet, Salesforce Einstein Copilot) succeed when treated as cohort-by-cohort behaviour-change programmes anchored on a permissions and labelling baseline — not as licence pushes. The 7-phase lifecycle binds the value case to a measurable time-spent baseline, requires a permissions-remediation track ahead of broad activation, and operationalises adoption telemetry with a quarterly sponsor review.',
  applicability:
    'Apply when an enterprise is deploying a productivity copilot above pilot scale, especially when the underlying collaboration estate (SharePoint, OneDrive, Teams) has accumulated permission sprawl, when the deployment must report value-realisation to a governance body, or when sensitivity labelling is incomplete across the in-scope content estate.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.86,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: ['DLP', 'Information Protection'],
  relatedPatternIds: [
    'PAT-AI-002',
    'PAT-AI-004',
    'PAT-AI-005',
    'PAT-AI-007',
    'PAT-AI-010',
    'PAT-AI-014',
  ],
  derivedFromPatternIds: ['PAT-AI-007'],
  taggedContradictionIds: ['CON-PRG-CPLT-001', 'CON-PRG-CPLT-002', 'CON-PRG-CPLT-003', 'CON-PRG-CPLT-004'],
  body: `## What a Copilot Deployment Programme Is

A productivity copilot deployment programme is the cross-functional effort to introduce a knowledge-worker AI assistant (M365 Copilot, Google Duet, Salesforce Einstein Copilot) into an enterprise content estate, with the explicit objective of producing measurable time-savings within named cohorts while controlling oversharing, sensitivity-labelling drift, and adoption fade. The 7-phase lifecycle treats it as a behaviour-change programme rather than a licence rollout.

## The Permissions Baseline Is the Programme's Foundation

A productivity copilot does not create permissions; it surfaces what users already had latent access to. The Discovery (P1) oversharing audit is therefore a hard gate: if the underlying SharePoint, OneDrive, and Teams estate has accumulated anonymous-link sharing, broken inheritance, stale group memberships, or unlabelled confidential libraries, the copilot will expose those problems within weeks of activation. The Synthesis (P2) gate either commits to remediation ahead of pilot or constrains the pilot scope to clean libraries. There is no third path. Programmes that bypass this gate generate governance incidents at activation that erode sponsor and CISO trust faster than the value case can build.

## Cohort Discipline and Use-Case Backlog

"Everyone" is not a deployment scope. The P0 sponsor must name target cohorts and articulate a value hypothesis per cohort — sales, legal, finance, customer-success — because the use-cases, time-savings, and risk surfaces differ materially. The P2 use-case backlog is scored on value-density, risk surface, and adoption fit, and the Activate (P5) sequence follows backlog priority, not licence availability. Programmes that deploy licences without a curated, scored backlog encounter users who do not know what to do with the tool, and adoption flat-lines.

## Pilot Sized for Signal

The pilot cohort (50–200 users for 6–10 weeks) is sized for signal: smaller produces noise, larger amplifies oversharing or labelling issues before remediation. The Build gate (P3 → P4) requires a named cohort, locked success criteria (time-saved, adoption rate, satisfaction), and a measurement plan that mirrors the P1 baseline. The Activate gate (P4 → P5) requires both quantitative results and an explicit DLP / oversharing incident review. An activation decision taken without that incident review is reckless — productivity copilots do produce incidents, and the activation decision must be informed by them.

## Operate-Phase Discipline

Activation is not the end. The Operate (P6) phase operationalises adoption telemetry, runs a quarterly sponsor-review cadence on time-saved and incidents, and treats the use-case backlog as a living governance artefact. Programmes that close the change-management track at Activate experience adoption fade — usage holds for 4–6 weeks then declines, weekly-active-use distribution becomes heavy-user-skewed, and the value case erodes silently until the next licence renewal. The standing review keeps the programme accountable for the value it claimed.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-COPILOT-001',
  stages: PROGRAM_STAGES,
  gateCriteria: COPILOT_GATE_CRITERIA,
  expectedArtifacts: COPILOT_ARTIFACTS,
  contradictionTemplates: COPILOT_CONTRADICTIONS,
  failureModes: COPILOT_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-AI-002',
    'PAT-AI-004',
    'PAT-AI-005',
    'PAT-AI-007',
    'PAT-AI-010',
    'PAT-AI-014',
  ],
  typicalDurationDays: { min: 60, max: 180 },
};

// =============================================================================
// PAT-PRG-LOYALTY-001 — Customer Loyalty Programme
// =============================================================================

const LOYALTY_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-LOY-P0-01',
    description: 'Loyalty value hypothesis defined (retention, frequency, basket, advocacy)',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'A loyalty programme without a stated value hypothesis becomes a discount-distribution machine. Sponsor must name which dimensions (retention, frequency, basket size, advocacy) the programme intends to move and by what magnitude.',
  },
  {
    id: 'GATE-PRG-LOY-P1-01',
    description: 'Existing customer behaviour baselines measured (RFM, churn, NPS)',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Recency, frequency, monetary, churn rate, and NPS measured per segment. Required for value-attribution at P5 and P6.',
  },
  {
    id: 'GATE-PRG-LOY-P1-02',
    description: 'Margin and unit-economics baseline produced',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Loyalty mechanics consume margin. Discovery must produce a unit-economics baseline so the programme can be designed within an acceptable margin envelope.',
  },
  {
    id: 'GATE-PRG-LOY-P2-01',
    description: 'Earn / burn mechanics designed within margin envelope',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Synthesis must produce earn / burn mechanics that fit the unit-economics baseline. Mechanics designed to a competitive benchmark without margin discipline produce structural losses.',
  },
  {
    id: 'GATE-PRG-LOY-P2-02',
    description: 'Liability accounting posture decided (deferred-revenue treatment)',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Loyalty points are a balance-sheet liability under most accounting standards. Finance must approve the deferred-revenue treatment, breakage-rate assumption, and disclosure posture before P3.',
  },
  {
    id: 'GATE-PRG-LOY-P3-01',
    description: 'Pilot store / channel cohort named with measurement plan',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Pilot cohort sized for statistical signal — typically 5–15% of network — with a control cohort of comparable composition. Without a control, attribution at P5 is contestable.',
  },
  {
    id: 'GATE-PRG-LOY-P3-02',
    description: 'Customer-data and consent posture confirmed for loyalty enrolment',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Loyalty enrolment is a consent event. The Build gate must confirm consent flows comply with applicable regulations (GDPR, CCPA) and link to the CDP or identity layer correctly.',
  },
  {
    id: 'GATE-PRG-LOY-P4-01',
    description: 'Pilot lift measured against control cohort',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Compare RFM, churn, and basket-size between pilot and control. Headline lift figures without a control are insufficient — same-store growth and seasonality routinely produce false positives.',
  },
  {
    id: 'GATE-PRG-LOY-P4-02',
    description: 'Margin impact measured (gross and contribution margin)',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Lift in revenue without margin discipline is value-negative. The Activate gate decision must be made on contribution-margin lift, not just top-line lift.',
  },
  {
    id: 'GATE-PRG-LOY-P5-01',
    description: 'Operating model in place (programme team, finance, marketing-ops)',
    gateType: 'hard',
    stageId: 'P6-Operate',
    evaluationHint:
      'A loyalty programme requires a standing operating team: programme manager, finance liaison for liability accounting, marketing-ops for campaign execution, customer service for member support.',
  },
  {
    id: 'GATE-PRG-LOY-P5-02',
    description: 'Member-experience telemetry instrumented',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Enrolment, earn, burn, and NPS telemetry as standing measurement. Without this the programme cannot govern its own health.',
  },
];

const LOYALTY_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-LOY-P0-01', label: 'Loyalty Business Case', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor-signed business case naming the value hypothesis and 3-year envelope.' },
  { id: 'ART-PRG-LOY-P0-02', label: 'Sponsor Charter', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor commitment with named decision rights for mechanics and accounting.' },
  { id: 'ART-PRG-LOY-P1-01', label: 'Customer Behaviour Baseline (RFM, churn, NPS)', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Per-segment RFM, churn, NPS baseline.' },
  { id: 'ART-PRG-LOY-P1-02', label: 'Unit Economics Baseline', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Per-channel and per-segment margin and unit-economics baseline.' },
  { id: 'ART-PRG-LOY-P1-03', label: 'Competitive Loyalty Landscape', stageId: 'P1-Discovery', requirement: 'recommended', gateType: 'soft', description: 'Competitor mechanics, member-value benchmarks, and breakage-rate references.' },
  { id: 'ART-PRG-LOY-P2-01', label: 'Earn / Burn Mechanics Design', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Mechanics design fitting the margin envelope.' },
  { id: 'ART-PRG-LOY-P2-02', label: 'Liability Accounting Memo', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Finance-approved deferred-revenue treatment, breakage-rate assumption, and disclosure posture.' },
  { id: 'ART-PRG-LOY-P2-03', label: 'Tier Structure & Member Value Proposition', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Tiered structure (if any) and articulated member-value at each tier.' },
  { id: 'ART-PRG-LOY-P2-04', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output for sponsor.' },
  { id: 'ART-PRG-LOY-P3-01', label: 'Pilot Store / Channel Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Named pilot cohort with control cohort, measurement plan, and timeline.' },
  { id: 'ART-PRG-LOY-P3-02', label: 'Enrolment & Consent Flow Design', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Consent flow design covering enrolment, marketing consent, and identity-link.' },
  { id: 'ART-PRG-LOY-P3-03', label: 'Loyalty Platform Configuration Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Configuration plan against the chosen loyalty platform (Salesforce Loyalty, Comarch, Annex Cloud, internal).' },
  { id: 'ART-PRG-LOY-P3-04', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Sponsor-facing package for Build gate decision.' },
  { id: 'ART-PRG-LOY-P4-01', label: 'Pilot Lift Report (vs Control)', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'RFM, churn, basket-size comparison vs control.' },
  { id: 'ART-PRG-LOY-P4-02', label: 'Margin Impact Analysis', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Gross and contribution margin impact analysis.' },
  { id: 'ART-PRG-LOY-P4-03', label: 'Member Experience Survey (Pilot)', stageId: 'P4-Build', requirement: 'recommended', gateType: 'soft', description: 'Pilot member NPS and satisfaction survey.' },
  { id: 'ART-PRG-LOY-P5-01', label: 'Network Rollout Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Store / channel-by-channel scaling plan.' },
  { id: 'ART-PRG-LOY-P5-02', label: 'Operating Model & Team Charter', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Standing operating team with named programme manager, finance liaison, marketing-ops, customer service.' },
  { id: 'ART-PRG-LOY-P5-03', label: 'Marketing Communications Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Member acquisition and engagement communications across channels.' },
  { id: 'ART-PRG-LOY-P6-01', label: 'Member-Health Dashboard', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Live enrolment, earn, burn, NPS telemetry.' },
  { id: 'ART-PRG-LOY-P6-02', label: 'Quarterly Liability Reconciliation', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Recurring finance reconciliation of accrued liability and breakage rate.' },
];

const LOYALTY_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-LOY-001',
    label: 'Headline Revenue Lift vs Margin Reality',
    severity: 'high',
    partyA: 'Pilot revenue lift',
    partyB: 'Contribution margin impact',
    detectionHint:
      'Fires when pilot revenue lift is positive but contribution margin lift is flat or negative once earn-rate, redemption cost, and platform-fees are netted. Keywords: "lift", "uplift", "incremental", "revenue", "margin", "contribution".',
    resolutionPath:
      'Re-state the value case in margin terms. Revisit earn / burn mechanics within the margin envelope. Sponsor decides whether to scale on revenue lift alone or pause for mechanics adjustment.',
  },
  {
    id: 'CON-PRG-LOY-002',
    label: 'Vendor Member-Value Claim vs Cohort Reality',
    severity: 'medium',
    partyA: 'Vendor benchmark member-value claim',
    partyB: 'Measured member spend lift',
    detectionHint:
      'Fires when vendor citations of typical member-value uplift (e.g., 18%) are not corroborated by pilot results. Keywords: "member value", "lift", "uplift", "annual spend".',
    resolutionPath:
      'Restate at measured value. Investigate cohort comparability — vendor benchmarks often come from larger or differently-positioned brands.',
  },
  {
    id: 'CON-PRG-LOY-003',
    label: 'Breakage Assumption vs Member Behaviour',
    severity: 'high',
    partyA: 'Assumed breakage rate (in liability calculation)',
    partyB: 'Observed redemption rate',
    detectionHint:
      'Fires when finance has assumed a breakage rate (typically 15–25%) that is materially higher than observed redemption behaviour, producing a balance-sheet surprise as accrued liability outpaces forecast. Keywords: "breakage", "redemption", "liability", "accrual", "deferred revenue".',
    resolutionPath:
      'Reset the breakage assumption based on observed redemption. Adjust mechanics to manage liability growth. Disclose the change to finance leadership.',
  },
  {
    id: 'CON-PRG-LOY-004',
    label: 'Pilot Same-Store vs Network Mix',
    severity: 'medium',
    partyA: 'Pilot lift signal',
    partyB: 'Network composition outside pilot',
    detectionHint:
      'Fires when pilot stores or channels are systematically different from the broader network (urban vs rural, flagship vs satellite, online vs in-store skew), and the lift signal is unlikely to generalise. Keywords: "pilot", "same-store", "network", "comparable", "control cohort".',
    resolutionPath:
      'Apply a generalisation discount when forecasting network rollout. Consider a second pilot wave covering under-represented network segments before full activation.',
  },
];

const LOYALTY_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-LOY-001',
    label: 'Discount Distribution Without Behaviour Change',
    description:
      'The programme generates revenue lift through redemption discounts but does not change customer behaviour (RFM, retention). Margin compresses, value case fails margin scrutiny.',
    stages: ['P4-Build', 'P5-Activate'],
    mitigations: [
      'Anchor the value hypothesis on behaviour change at P0.',
      'Measure RFM and retention against control at P4.',
      'Redesign mechanics if behaviour-change signal is absent.',
    ],
  },
  {
    id: 'FM-PRG-LOY-002',
    label: 'Liability Surprise',
    description:
      'Breakage rate assumed in liability accounting is higher than observed redemption. As programme scales, accrued liability outpaces forecast, producing a balance-sheet event the finance organisation did not anticipate.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'Hard-gate the liability accounting memo at P2 with finance approval.',
      'Reconcile accrued liability quarterly at P6.',
      'Adjust mechanics if observed breakage diverges from assumption.',
    ],
  },
  {
    id: 'FM-PRG-LOY-003',
    label: 'Pilot Without Control',
    description:
      'Pilot is run without a comparable control cohort. Same-store growth and seasonality produce a positive lift signal that does not generalise. Activate gate decision is taken on noise.',
    stages: ['P3-Design', 'P4-Build'],
    mitigations: [
      'Hard-gate the pilot plan with control-cohort design at P3.',
      'Match control cohort composition to pilot cohort.',
      'Decompose pilot lift into same-store / programme-attributable / seasonality at P4.',
    ],
  },
  {
    id: 'FM-PRG-LOY-004',
    label: 'No Operating Team',
    description:
      'Programme is delivered as a build-and-launch project without a standing operating team. Member experience degrades within 6–12 months as mechanics drift, communications stall, and incidents are not handled.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'Hard-gate the operating model at P5.',
      'Name programme manager, finance liaison, marketing-ops, customer service before activation.',
      'Treat member-health dashboard as a standing review.',
    ],
  },
];

export const PAT_PRG_LOYALTY_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-LOYALTY-001',
  slug: 'loyalty-program-lifecycle',
  title: 'Customer Loyalty Programme Lifecycle',
  domain: 'industry_specific',
  tier: 'authoritative',
  vertical: 'retail',
  thesis:
    'Customer loyalty programmes succeed when designed inside a margin envelope, validated against a control cohort, and operated as a standing capability with finance, marketing-ops, and customer-service ownership. The 7-phase lifecycle binds the value hypothesis to behaviour change at P0, surfaces unit-economics and liability accounting discipline at P1–P2, and protects against pilot-noise and operating-team gaps at P3–P5.',
  applicability:
    'Apply when a retail or consumer-services organisation is launching, relaunching, or materially restructuring a loyalty programme. Most relevant when the programme will create a material balance-sheet liability, when the organisation has not previously operated a loyalty programme as a standing capability, or when the programme integrates with a CDP or identity layer.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.85,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: ['GDPR', 'CCPA', 'Liability Accounting (IFRS 15 / ASC 606)'],
  relatedPatternIds: [
    'PAT-CDP-001',
    'PAT-CDP-006',
    'PAT-CDP-008',
  ],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-PRG-LOY-001', 'CON-PRG-LOY-002', 'CON-PRG-LOY-003', 'CON-PRG-LOY-004'],
  body: `## What a Loyalty Programme Programme Is

A customer loyalty programme is the cross-functional effort to introduce, restructure, or relaunch a member-recognition mechanism intended to influence customer behaviour: retention, frequency, basket size, advocacy. It is not a marketing campaign and not a discount-distribution mechanic. The 7-phase lifecycle keeps the programme honest about the behaviour it is meant to change, the margin envelope it must fit inside, and the standing operating capability it requires once activated.

## Margin Discipline From P0

A loyalty programme that is designed to a competitive benchmark — "we want what they have" — without an explicit margin envelope produces structural losses. The Discovery (P1) gate requires both a customer-behaviour baseline (RFM, churn, NPS) and a unit-economics baseline (per-channel, per-segment margin). The Synthesis (P2) gate then designs earn / burn mechanics that fit inside the unit-economics envelope. Programmes that skip the unit-economics baseline routinely discover at P5 or P6 that revenue lift is positive but contribution margin is flat or negative — at which point the mechanics are embedded in member expectations and difficult to retract.

## Liability Accounting Is a Hard Gate

Loyalty points are a balance-sheet liability under IFRS 15 / ASC 606. The deferred-revenue treatment, breakage-rate assumption, and disclosure posture must be approved by finance before P3 Design. Programmes that defer this conversation until launch encounter a balance-sheet event: accrued liability grows as the programme scales, breakage assumption proves optimistic, and finance leadership is surprised. The P2 Liability Accounting Memo, signed by finance, prevents this. Quarterly liability reconciliation in P6 keeps the assumption calibrated against observed behaviour.

## Pilot With Control

Same-store growth and seasonality routinely produce false-positive lift signals in loyalty pilots. The Build gate (P3 → P4) requires a named pilot cohort and a comparable control cohort with matched composition. The Activate gate (P4 → P5) interprets pilot lift in margin terms (contribution-margin uplift, not just revenue uplift) decomposed against the control. Programmes that omit the control are forced into post-hoc attribution arguments at the next portfolio review and rarely win them.

## Standing Operating Capability

Loyalty programmes require a standing operating team: a programme manager who owns mechanics and member experience, a finance liaison who reconciles liability and breakage, a marketing-ops team that runs campaigns and segmentation, and a customer-service capability for member support and incident handling. The P5 Activate gate cannot clear without this team named. Programmes that go live without a standing team experience mechanic drift, communications stalls, and incident-handling failures within 6–12 months — at which point member experience erodes faster than the programme can react.

## Linkage to CDP

Many modern loyalty programmes integrate with a CDP or identity layer for member identity, segmentation, and personalisation. Where this dependency exists, the loyalty programme should record it as a hard cross-programme link so the gate calendars are aligned. A loyalty programme that activates ahead of its CDP dependency loses the segmentation and personalisation depth it was sold on.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-LOYALTY-001',
  stages: PROGRAM_STAGES,
  gateCriteria: LOYALTY_GATE_CRITERIA,
  expectedArtifacts: LOYALTY_ARTIFACTS,
  contradictionTemplates: LOYALTY_CONTRADICTIONS,
  failureModes: LOYALTY_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-CDP-001',
    'PAT-CDP-006',
    'PAT-CDP-008',
    'PAT-PRG-CDP-001',
  ],
  typicalDurationDays: { min: 270, max: 540 },
};

// =============================================================================
// PAT-PRG-CC-AI-001 — Contact Center AI
// =============================================================================

const CCAI_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-CCAI-P0-01',
    description: 'Sponsor agreement on intent scope and channel scope',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'Sponsor must declare which intents and which channels (voice, chat, email) are in scope. Open scope produces a build with no measurable boundary and no defendable success criterion.',
  },
  {
    id: 'GATE-PRG-CCAI-P1-01',
    description: 'Intent inventory and volume baseline measured',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Discovery must enumerate top intents by volume, average handle time, containment rate, and CSAT. The intent inventory becomes the deflection backlog at P2.',
  },
  {
    id: 'GATE-PRG-CCAI-P1-02',
    description: 'Existing IVR / bot performance baseline measured',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Existing automation containment rate and CSAT impact are required. Building "AI" on top of an under-performing IVR without addressing the underlying flow is a common failure pattern.',
  },
  {
    id: 'GATE-PRG-CCAI-P2-01',
    description: 'Deflection vs assistance vs full-resolution architecture decided',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Synthesis must decide where the programme operates: agent-assist (lower risk, smaller value), self-service deflection (medium risk, scaled value), full-resolution autonomous (high risk, high value). A programme that conflates these architectures cannot articulate a coherent value case.',
  },
  {
    id: 'GATE-PRG-CCAI-P2-02',
    description: 'Containment vs CSAT trade-off documented',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'High containment with low CSAT is value-negative — the call is deflected but the customer is dissatisfied and contacts again or escalates externally. Synthesis must document the trade-off and the acceptable threshold.',
  },
  {
    id: 'GATE-PRG-CCAI-P3-01',
    description: 'Pilot intent-set named with measurement plan',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Pilot scope is 3–7 intents with high volume and clear deflection feasibility. Measurement plan covers containment, CSAT, average handle time, and escalation patterns.',
  },
  {
    id: 'GATE-PRG-CCAI-P3-02',
    description: 'Live-agent handoff design tested',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'A handoff that loses context, drops the customer to a generic queue, or restarts the conversation predicts CSAT collapse. The handoff design must be tested with a live-agent rehearsal before pilot.',
  },
  {
    id: 'GATE-PRG-CCAI-P4-01',
    description: 'Containment and CSAT measured against pre-rollout baseline',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Compare containment, CSAT, average handle time, and escalation rate against P1 baseline. Any container rate gain accompanied by CSAT decline must be adjudicated before broad activation.',
  },
  {
    id: 'GATE-PRG-CCAI-P4-02',
    description: 'Hallucination and harmful-output review complete',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'Review pilot transcripts for hallucinations (incorrect product info, fabricated policies) and harmful outputs (regulatory advice the bot should not give). Any material incident must be adjudicated and remediated.',
  },
  {
    id: 'GATE-PRG-CCAI-P5-01',
    description: 'Intent-expansion roadmap with kill criteria',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Activate plan should include a roadmap of additional intents to onboard, each with kill criteria (lowest acceptable containment, CSAT). Reference PAT-AI-008 for kill-criteria pattern.',
  },
  {
    id: 'GATE-PRG-CCAI-P5-02',
    description: 'Operating dashboard live (containment, CSAT, hallucination flags)',
    gateType: 'hard',
    stageId: 'P6-Operate',
    evaluationHint:
      'Live dashboard tracking containment per intent, CSAT, escalation rate, and hallucination flags. Without this dashboard the programme cannot govern its own quality.',
  },
];

const CCAI_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-CCAI-P0-01', label: 'Sponsor Charter', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor commitment with named intent and channel scope.' },
  { id: 'ART-PRG-CCAI-P0-02', label: 'Funding & Vendor Envelope', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Cost envelope and any vendor commitments.' },
  { id: 'ART-PRG-CCAI-P1-01', label: 'Intent Inventory & Volume Baseline', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Top intents by volume, AHT, containment, CSAT.' },
  { id: 'ART-PRG-CCAI-P1-02', label: 'Existing Automation Performance Baseline', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Existing IVR / bot containment and CSAT impact.' },
  { id: 'ART-PRG-CCAI-P1-03', label: 'Customer Journey Map (key intents)', stageId: 'P1-Discovery', requirement: 'recommended', gateType: 'soft', description: 'Journey maps for the intents being targeted by the programme.' },
  { id: 'ART-PRG-CCAI-P2-01', label: 'Architecture Decision Memo (assist / deflect / resolve)', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Decision on agent-assist vs self-service deflection vs full-resolution autonomous architecture.' },
  { id: 'ART-PRG-CCAI-P2-02', label: 'Containment-CSAT Trade-off Brief', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Documented trade-off and acceptable thresholds.' },
  { id: 'ART-PRG-CCAI-P2-03', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output for sponsor.' },
  { id: 'ART-PRG-CCAI-P3-01', label: 'Pilot Intent Set & Measurement Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Named intents (3–7), measurement plan covering containment, CSAT, AHT, escalation.' },
  { id: 'ART-PRG-CCAI-P3-02', label: 'Live-Agent Handoff Design', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Handoff design with context-preservation, queue routing, and rehearsal plan.' },
  { id: 'ART-PRG-CCAI-P3-03', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Sponsor-facing package for Build gate decision.' },
  { id: 'ART-PRG-CCAI-P4-01', label: 'Pilot Performance Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Containment, CSAT, AHT, escalation results vs baseline.' },
  { id: 'ART-PRG-CCAI-P4-02', label: 'Hallucination & Harmful-Output Review', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'Pilot transcript review for hallucinations and harmful outputs.' },
  { id: 'ART-PRG-CCAI-P4-03', label: 'Live-Agent Sentiment Survey', stageId: 'P4-Build', requirement: 'recommended', gateType: 'soft', description: 'Survey of live agents on assist quality and handoff experience.' },
  { id: 'ART-PRG-CCAI-P5-01', label: 'Intent-Expansion Roadmap', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Roadmap of additional intents with kill criteria per intent.' },
  { id: 'ART-PRG-CCAI-P5-02', label: 'Knowledge-Base Maintenance Plan', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Ownership and cadence for KB updates feeding the bot.' },
  { id: 'ART-PRG-CCAI-P5-03', label: 'Operating Dashboard (Live)', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Live containment / CSAT / escalation / hallucination dashboard.' },
  { id: 'ART-PRG-CCAI-P6-01', label: 'Quarterly Operating Review', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Standing review on containment, CSAT, intent expansion, kill decisions.' },
  { id: 'ART-PRG-CCAI-P6-02', label: 'Cost Per Contained Contact Trend', stageId: 'P6-Operate', requirement: 'recommended', gateType: 'soft', description: 'Trend of cost per contained contact across model and channel.' },
];

const CCAI_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-CCAI-001',
    label: 'Containment Gain vs CSAT Decline',
    severity: 'high',
    partyA: 'Containment rate uplift',
    partyB: 'CSAT or NPS measurement',
    detectionHint:
      'Fires when pilot containment rises but CSAT or NPS for the affected intent drops by 3+ points. Keywords: "containment", "deflection", "CSAT", "NPS", "satisfaction".',
    resolutionPath:
      'Investigate transcript-level dissatisfaction signals. Decide whether to scale containment with mitigations (better handoff, scope reduction) or pause for redesign.',
  },
  {
    id: 'CON-PRG-CCAI-002',
    label: 'Vendor Containment Claim vs Pilot Reality',
    severity: 'high',
    partyA: 'Vendor benchmark containment claim',
    partyB: 'Measured pilot containment',
    detectionHint:
      'Fires when vendor cites benchmark containment (e.g., 65–80%) but pilot achieves below 30% on the same intent set. Keywords: "containment", "deflection", "benchmark".',
    resolutionPath:
      'Treat the pilot measurement as authoritative. Investigate intent-set mismatch and KB coverage. Adjust the business case and re-baseline.',
  },
  {
    id: 'CON-PRG-CCAI-003',
    label: 'Hallucination Incidents vs Confidence Telemetry',
    severity: 'high',
    partyA: 'Vendor confidence telemetry',
    partyB: 'Observed hallucination incidents',
    detectionHint:
      'Fires when the bot reports high confidence on responses that pilot review identifies as hallucinated or fabricated. Keywords: "hallucination", "confidence", "fabricated", "incorrect".',
    resolutionPath:
      'Treat the confidence signal as unreliable for the affected intent class. Add human-in-loop review or scope reduction. Engage the vendor on the underlying model.',
  },
  {
    id: 'CON-PRG-CCAI-004',
    label: 'Handoff Design vs Customer Experience',
    severity: 'medium',
    partyA: 'Handoff-design specification',
    partyB: 'Pilot handoff transcript review',
    detectionHint:
      'Fires when handoff transcripts show context loss, generic-queue routing, or conversation restart despite the design specifying context preservation. Keywords: "handoff", "transfer", "context", "restart".',
    resolutionPath:
      'Remediate the handoff implementation. A bad handoff makes any deflection a CSAT loss.',
  },
];

const CCAI_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-CCAI-001',
    label: 'Containment Without Quality',
    description:
      'Containment rate climbs while CSAT erodes. Customers are deflected from agents but contact again, escalate externally, or churn. Programme-level contact volume drops but customer-experience metrics decline.',
    stages: ['P4-Build', 'P5-Activate', 'P6-Operate'],
    mitigations: [
      'Treat containment-CSAT trade-off as a P2 decision artefact.',
      'Adjudicate any CSAT decline at P4 before activation.',
      'Operate dashboard tracks both metrics, not just containment.',
    ],
  },
  {
    id: 'FM-PRG-CCAI-002',
    label: 'Hallucinations in Production',
    description:
      'The bot generates incorrect product information, fabricated policies, or unauthorised regulatory advice. Incidents reach customers, generate complaints, and may trigger regulatory exposure.',
    stages: ['P4-Build', 'P5-Activate'],
    mitigations: [
      'Hallucination review as a P4 hard gate before activation.',
      'Restrict response generation to retrieval-grounded patterns where possible.',
      'Establish ongoing transcript review with named owner.',
    ],
  },
  {
    id: 'FM-PRG-CCAI-003',
    label: 'Knowledge-Base Decay',
    description:
      'The bot performs at pilot-level for a few months then degrades as products, policies, and pricing change but the underlying knowledge base is not maintained. Containment falls and hallucinations rise.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'Knowledge-base maintenance plan as a P5 hard artefact.',
      'Named owner with cadence for KB updates.',
      'Operate dashboard tracks containment-by-cohort to detect decay.',
    ],
  },
  {
    id: 'FM-PRG-CCAI-004',
    label: 'Handoff Disaster',
    description:
      'Live-agent handoff loses context or drops the customer to a generic queue. Customer must restart the conversation, and the deflection becomes a satisfaction loss.',
    stages: ['P3-Design', 'P4-Build'],
    mitigations: [
      'Handoff rehearsal as a P3 hard artefact.',
      'Test transcript review at P4.',
      'Standing handoff-quality measurement at P6.',
    ],
  },
];

export const PAT_PRG_CC_AI_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-CC-AI-001',
  slug: 'contact-center-ai-program-lifecycle',
  title: 'Contact Center AI Programme Lifecycle',
  domain: 'ai_programs',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Contact-center AI programmes succeed when containment is paired with CSAT measurement, when architecture (assist vs deflect vs resolve) is decided explicitly, and when knowledge-base maintenance is treated as an Operate-phase capability rather than a one-time configuration. The 7-phase lifecycle binds the programme to a measured intent baseline at P1, an architecture decision at P2, a hallucination review at P4, and a standing operating dashboard at P6.',
  applicability:
    'Apply when an enterprise is deploying conversational AI for customer-facing contact-center use (voice, chat, email) above pilot scale, where the programme must report on containment and CSAT, or when a vendor partner is providing platform capability that integrates into a live agent estate.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.87,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 1,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: ['GDPR', 'CCPA', 'AI Act'],
  relatedPatternIds: [
    'PAT-AI-002',
    'PAT-AI-008',
    'PAT-AI-011',
    'PAT-AI-009',
    'PAT-AI-010',
  ],
  derivedFromPatternIds: ['PAT-AI-011'],
  taggedContradictionIds: ['CON-PRG-CCAI-001', 'CON-PRG-CCAI-002', 'CON-PRG-CCAI-003', 'CON-PRG-CCAI-004'],
  body: `## What a Contact Center AI Programme Is

A contact-center AI programme is the cross-functional effort to introduce conversational AI into the customer-facing service estate (voice, chat, email) with the explicit objective of moving containment, CSAT, average handle time, and cost per contained contact in defendable directions. The 7-phase lifecycle keeps the programme honest about which architecture it has chosen, which intents it serves, and how it monitors quality once activated.

## Architecture Decision Is Not Optional

Contact-center AI programmes operate on three architectures with materially different risk and value profiles: agent-assist (lower risk, smaller per-contact value, big aggregate value across agent population), self-service deflection (medium risk, scaled value, requires KB and handoff investment), and full-resolution autonomous (high risk, high value, requires hallucination control and clear customer-experience guardrails). The Synthesis (P2) gate forces an explicit architecture decision; programmes that conflate architectures cannot articulate a coherent value case and cannot govern quality consistently.

## Containment Without CSAT Is Value-Negative

The most expensive failure pattern in this domain is containment that erodes CSAT. Contacts are deflected from agents — the headline containment metric rises — but customers contact again, escalate externally, or churn. The programme reduces handled contacts while increasing customer-experience damage. The Build gate (P3 → P4) measures both metrics. The Activate gate (P4 → P5) requires CSAT change to be adjudicated before broad activation. Operate (P6) dashboards both metrics permanently. This pattern is non-negotiable: a programme that scales containment without paired CSAT measurement is operating outside the lifecycle's discipline.

## Hallucination and Harmful-Output Review

Contact-center AI programmes generate language to customers. Hallucinated product information, fabricated policies, and unauthorised regulatory advice are not edge cases — they are predictable failure modes that must be reviewed before broad activation. The P4 hallucination review is a hard gate: pilot transcripts must be sampled and adjudicated, any incidents remediated. Vendor confidence telemetry is unreliable in this domain — the model frequently expresses high confidence on hallucinated responses — so the review cannot be delegated to telemetry alone.

## Knowledge-Base Decay Is Inevitable

The bot performs at pilot-level only as long as its underlying knowledge base reflects current products, policies, and pricing. Without a maintenance plan with a named owner, containment falls and hallucinations rise within months. The P5 Activate gate requires a knowledge-base maintenance plan; the P6 Operate phase tracks containment-by-cohort to detect decay early. Programmes that treat the KB as a one-time configuration rather than a living artefact see steady degradation that is expensive to reverse once member trust has eroded.

## Handoff Is the Safety Net

A handoff that loses context, drops the customer to a generic queue, or restarts the conversation makes any deflection a CSAT loss. The P3 handoff design includes a live-agent rehearsal, the P4 transcript review samples handoff cases specifically, and the P6 dashboard measures handoff-quality on an ongoing basis. Handoff is not a hand-off — it is the programme's safety net, and it must be engineered as such.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-CC-AI-001',
  stages: PROGRAM_STAGES,
  gateCriteria: CCAI_GATE_CRITERIA,
  expectedArtifacts: CCAI_ARTIFACTS,
  contradictionTemplates: CCAI_CONTRADICTIONS,
  failureModes: CCAI_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-AI-002',
    'PAT-AI-008',
    'PAT-AI-009',
    'PAT-AI-010',
    'PAT-AI-011',
  ],
  typicalDurationDays: { min: 180, max: 360 },
};

// =============================================================================
// PAT-PRG-DATA-FAB-001 — Data fabric / Demand Forecasting v2
// =============================================================================

const DATAFAB_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-PRG-DFAB-P0-01',
    description: 'Sponsor agreement on consuming use-cases (not just "data fabric")',
    gateType: 'hard',
    stageId: 'P1-Discovery',
    evaluationHint:
      'A data-fabric programme defined by infrastructure rather than consuming use-cases produces an unbounded build with no measurable outcome. Sponsor must name the consuming use-cases (forecasting, segmentation, planning) the fabric must serve.',
  },
  {
    id: 'GATE-PRG-DFAB-P1-01',
    description: 'Source-system inventory and data-quality baseline measured',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Discovery must enumerate source systems in scope, measure completeness, freshness, accuracy per critical attribute, and document known data-quality issues. Without this, design is unanchored.',
  },
  {
    id: 'GATE-PRG-DFAB-P1-02',
    description: 'Consuming use-case readiness assessed',
    gateType: 'hard',
    stageId: 'P2-Synthesis',
    evaluationHint:
      'Each consuming use-case must be assessed for its data dependencies, freshness requirements, and operational consumption pattern. A demand-forecasting use-case has different requirements from a segmentation use-case.',
  },
  {
    id: 'GATE-PRG-DFAB-P2-01',
    description: 'Architecture decision: warehouse / lakehouse / fabric / mesh',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Synthesis must decide the architecture posture (centralised warehouse, lakehouse, vendor data-fabric, decentralised mesh) and its trade-offs vs the consuming use-cases. The wrong choice creates years of operational drag.',
  },
  {
    id: 'GATE-PRG-DFAB-P2-02',
    description: 'Governance and ownership model decided',
    gateType: 'hard',
    stageId: 'P3-Design',
    evaluationHint:
      'Domain ownership, stewardship, and access policy must be decided. A fabric without governance becomes a sprawl problem within 12 months.',
  },
  {
    id: 'GATE-PRG-DFAB-P3-01',
    description: 'Pilot use-case named with measurement plan',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Pilot scope is one consuming use-case (typically demand forecasting v2) end-to-end, measured against a forecast-accuracy baseline.',
  },
  {
    id: 'GATE-PRG-DFAB-P3-02',
    description: 'Data-quality remediation plan active for pilot scope',
    gateType: 'hard',
    stageId: 'P4-Build',
    evaluationHint:
      'Pilot cannot proceed if pilot-scope data-quality issues identified at P1 are not in active remediation. Forecasting on bad data validates nothing.',
  },
  {
    id: 'GATE-PRG-DFAB-P4-01',
    description: 'Forecast accuracy lift measured against incumbent baseline',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'For demand-forecasting v2, MAPE / WAPE improvement vs incumbent forecast must be measured at the same temporal grain and segment grain as the incumbent. Aggregate-only comparisons routinely overstate improvement.',
  },
  {
    id: 'GATE-PRG-DFAB-P4-02',
    description: 'Operational consumption tested (downstream systems consume successfully)',
    gateType: 'hard',
    stageId: 'P5-Activate',
    evaluationHint:
      'A forecast that is accurate but cannot be consumed by replenishment, scheduling, or planning systems is operationally inert. Consumption must be tested end-to-end before activation.',
  },
  {
    id: 'GATE-PRG-DFAB-P5-01',
    description: 'Domain-by-domain expansion roadmap',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Activate plan should include a sequence for onboarding additional domains and consuming use-cases, each with its own readiness criteria.',
  },
  {
    id: 'GATE-PRG-DFAB-P5-02',
    description: 'Data-quality and freshness monitoring instrumented',
    gateType: 'hard',
    stageId: 'P6-Operate',
    evaluationHint:
      'Standing measurement of data-quality and freshness against thresholds. Without this the fabric degrades silently and consuming use-cases lose accuracy.',
  },
  {
    id: 'GATE-PRG-DFAB-P5-03',
    description: 'FinOps posture instrumented for compute and storage',
    gateType: 'soft',
    stageId: 'P6-Operate',
    evaluationHint:
      'Data-fabric costs scale non-linearly with consumption. FinOps measurement at the use-case level prevents cost surprises.',
  },
];

const DATAFAB_ARTIFACTS: ExpectedArtifact[] = [
  { id: 'ART-PRG-DFAB-P0-01', label: 'Sponsor Charter', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Sponsor commitment naming consuming use-cases.' },
  { id: 'ART-PRG-DFAB-P0-02', label: 'Funding Envelope', stageId: 'P0-Originate', requirement: 'required', gateType: 'hard', description: 'Multi-year build envelope and operating cost forecast.' },
  { id: 'ART-PRG-DFAB-P1-01', label: 'Source System Inventory', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Enumerated source systems with stewardship.' },
  { id: 'ART-PRG-DFAB-P1-02', label: 'Data-Quality Baseline', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Completeness, freshness, accuracy per critical attribute.' },
  { id: 'ART-PRG-DFAB-P1-03', label: 'Consuming Use-Case Readiness Matrix', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'Per-use-case data-dependency and readiness assessment.' },
  { id: 'ART-PRG-DFAB-P1-04', label: 'Forecast Accuracy Baseline (Incumbent)', stageId: 'P1-Discovery', requirement: 'required', gateType: 'hard', description: 'For demand-forecasting v2: incumbent MAPE / WAPE at the same grain as the proposed v2.' },
  { id: 'ART-PRG-DFAB-P2-01', label: 'Architecture Decision Memo', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Warehouse / lakehouse / fabric / mesh decision with trade-off analysis.' },
  { id: 'ART-PRG-DFAB-P2-02', label: 'Governance & Ownership Model', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Domain ownership, stewardship, access-policy model.' },
  { id: 'ART-PRG-DFAB-P2-03', label: 'Synthesis Gate Package', stageId: 'P2-Synthesis', requirement: 'required', gateType: 'hard', description: 'Combined synthesis output for sponsor and architecture review.' },
  { id: 'ART-PRG-DFAB-P3-01', label: 'Pilot Use-Case Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'End-to-end pilot covering one consuming use-case (typically demand forecasting v2).' },
  { id: 'ART-PRG-DFAB-P3-02', label: 'Data-Quality Remediation Plan', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Active remediation track for pilot-scope data-quality issues.' },
  { id: 'ART-PRG-DFAB-P3-03', label: 'Build Gate Package', stageId: 'P3-Design', requirement: 'required', gateType: 'hard', description: 'Sponsor-facing package for Build gate decision.' },
  { id: 'ART-PRG-DFAB-P4-01', label: 'Pilot Accuracy Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'MAPE / WAPE vs incumbent at same grain.' },
  { id: 'ART-PRG-DFAB-P4-02', label: 'Operational Consumption Test Report', stageId: 'P4-Build', requirement: 'required', gateType: 'hard', description: 'End-to-end test of forecast consumption by replenishment / planning systems.' },
  { id: 'ART-PRG-DFAB-P4-03', label: 'Cost & Performance Profile', stageId: 'P4-Build', requirement: 'recommended', gateType: 'soft', description: 'Compute / storage cost profile for the pilot workload.' },
  { id: 'ART-PRG-DFAB-P5-01', label: 'Domain Expansion Roadmap', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Sequence of additional domains / use-cases with readiness criteria.' },
  { id: 'ART-PRG-DFAB-P5-02', label: 'Data-Quality & Freshness Monitoring', stageId: 'P5-Activate', requirement: 'required', gateType: 'hard', description: 'Standing monitoring against thresholds.' },
  { id: 'ART-PRG-DFAB-P5-03', label: 'FinOps Dashboard', stageId: 'P5-Activate', requirement: 'recommended', gateType: 'soft', description: 'Use-case-level compute / storage cost telemetry.' },
  { id: 'ART-PRG-DFAB-P6-01', label: 'Quarterly Operating Review', stageId: 'P6-Operate', requirement: 'required', gateType: 'hard', description: 'Standing review on accuracy, consumption, cost, and domain expansion.' },
  { id: 'ART-PRG-DFAB-P6-02', label: 'Data Contract Catalogue', stageId: 'P6-Operate', requirement: 'recommended', gateType: 'soft', description: 'Catalogue of typed data contracts between domains and consuming systems.' },
];

const DATAFAB_CONTRADICTIONS: ContradictionTemplate[] = [
  {
    id: 'CON-PRG-DFAB-001',
    label: 'Aggregate Accuracy vs Segment Accuracy',
    severity: 'high',
    partyA: 'Reported aggregate MAPE / WAPE',
    partyB: 'Segment-level accuracy distribution',
    detectionHint:
      'Fires when aggregate MAPE shows improvement but segment-level accuracy distribution shows the gain comes from a few large segments while smaller segments degrade. Keywords: "MAPE", "WAPE", "aggregate", "segment", "accuracy", "forecast".',
    resolutionPath:
      'Restate accuracy at the segment grain that matches downstream consumption. Investigate degraded segments. Sponsor decides whether the segment-skew is acceptable or whether the model must be re-tuned.',
  },
  {
    id: 'CON-PRG-DFAB-002',
    label: 'Vendor Data-Fabric Claim vs Source-System Reality',
    severity: 'high',
    partyA: 'Vendor data-fabric capability claim',
    partyB: 'Measured source-system data quality',
    detectionHint:
      'Fires when the vendor claims out-of-the-box integration and quality remediation but the source-system data-quality baseline shows issues that require domain-specific remediation that the vendor cannot provide. Keywords: "data quality", "remediation", "integration", "out-of-the-box".',
    resolutionPath:
      'Add a domain-side remediation track to the build. Re-state the vendor scope as fabric assembly rather than data quality. Make the trade-off visible to the sponsor.',
  },
  {
    id: 'CON-PRG-DFAB-003',
    label: 'Forecast Accuracy vs Operational Consumption',
    severity: 'medium',
    partyA: 'Forecast accuracy improvement',
    partyB: 'Downstream system consumption pattern',
    detectionHint:
      'Fires when forecast accuracy improves but the downstream replenishment, planning, or scheduling system cannot consume the new forecast at the new grain or frequency. Keywords: "consumption", "replenishment", "downstream", "grain", "frequency".',
    resolutionPath:
      'Either change the forecast grain to match consumption or fund a downstream-system change. Activation cannot proceed without this resolution.',
  },
  {
    id: 'CON-PRG-DFAB-004',
    label: 'Build Cost Forecast vs Operational Consumption Cost',
    severity: 'medium',
    partyA: 'Build envelope (one-time + steady-state)',
    partyB: 'Observed compute / storage cost during pilot',
    detectionHint:
      'Fires when pilot compute and storage cost extrapolated to full-domain scope materially exceeds the operating-cost forecast in the business case. Keywords: "compute cost", "storage", "FinOps", "operating cost".',
    resolutionPath:
      'Adjust the operating-cost forecast in the business case before activation. If the new forecast invalidates the value case, sponsor decides on scope reduction or kill.',
  },
];

const DATAFAB_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-PRG-DFAB-001',
    label: 'Infrastructure Without Use-Cases',
    description:
      'Fabric is built to a generic capability target rather than to consuming use-cases. Build completes on time but consumption is sparse and the value case cannot be defended at portfolio review.',
    stages: ['P0-Originate', 'P5-Activate'],
    mitigations: [
      'Hard-gate consuming use-case naming at P0.',
      'Pilot one end-to-end consuming use-case at P4.',
      'Sequence Activate by use-case readiness, not capability completeness.',
    ],
  },
  {
    id: 'FM-PRG-DFAB-002',
    label: 'Data Quality Discovered During Build',
    description:
      'Source-system data quality issues that should have been baselined at P1 are encountered during build. Timeline slips, scope creeps to include remediation, and consuming use-case is delivered on weakly-validated data.',
    stages: ['P1-Discovery', 'P4-Build'],
    mitigations: [
      'Hard-gate the data-quality baseline at P1.',
      'Active remediation track entering Build.',
      'Refuse pilot start until pilot-scope data-quality issues are in active remediation.',
    ],
  },
  {
    id: 'FM-PRG-DFAB-003',
    label: 'Forecast That Cannot Be Consumed',
    description:
      'Forecast accuracy improves but downstream replenishment / planning / scheduling systems cannot consume the new grain or frequency. The improvement is operationally inert.',
    stages: ['P3-Design', 'P4-Build', 'P5-Activate'],
    mitigations: [
      'Test operational consumption at P4 as a hard gate.',
      'Co-design forecast grain with downstream system owners at P3.',
      'Treat consumption as the success criterion, not just accuracy.',
    ],
  },
  {
    id: 'FM-PRG-DFAB-004',
    label: 'FinOps Surprise',
    description:
      'Compute and storage costs scale non-linearly with consumption. Without per-use-case telemetry, costs surprise the finance organisation 6–12 months after activation.',
    stages: ['P5-Activate', 'P6-Operate'],
    mitigations: [
      'FinOps dashboard at P5.',
      'Cost profile included in pilot report at P4.',
      'Standing FinOps review at P6.',
    ],
  },
];

export const PAT_PRG_DATA_FAB_001: LifecyclePatternSeed = {
  id: 'PAT-PRG-DATA-FAB-001',
  slug: 'data-fabric-program-lifecycle',
  title: 'Data Fabric / Demand Forecasting Programme Lifecycle',
  domain: 'architecture',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Data-fabric programmes — including demand-forecasting v2, planning v2, and segmentation v2 deliveries on top of a fabric — succeed when defined by consuming use-cases rather than by infrastructure capability. The 7-phase lifecycle binds the build to a measured data-quality baseline at P1, an explicit architecture decision at P2, an end-to-end pilot use-case at P4, and standing data-quality, FinOps, and consumption monitoring at P6.',
  applicability:
    'Apply when an enterprise is establishing or modernising a data-fabric, lakehouse, or mesh capability with named consuming use-cases (typically demand forecasting, segmentation, financial planning), or when delivering a v2 of a data-driven capability that depends on a new data-platform layer.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.84,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 1,
  sourceDocuments: [
    'docs/build/PROGRAM_BUILD_SPEC.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: [
    'PAT-ARCH-001',
    'PAT-ARCH-002',
    'PAT-ARCH-003',
    'PAT-ARCH-004',
    'PAT-ARCH-009',
  ],
  derivedFromPatternIds: ['PAT-ARCH-001'],
  taggedContradictionIds: ['CON-PRG-DFAB-001', 'CON-PRG-DFAB-002', 'CON-PRG-DFAB-003', 'CON-PRG-DFAB-004'],
  body: `## What a Data-Fabric Programme Is

A data-fabric programme is the cross-functional effort to establish or modernise a data-platform capability (warehouse, lakehouse, vendor fabric, mesh) in service of named consuming use-cases — most commonly demand forecasting v2, segmentation v2, or financial planning v2. The 7-phase lifecycle keeps the programme from drifting into an unbounded infrastructure build by anchoring it on the consuming use-cases at every gate.

## Use-Cases Are the Programme

A data-fabric programme defined by infrastructure capability — "we want a fabric" — produces an unbounded build with no measurable outcome. The P0 sponsor must name the consuming use-cases the fabric must serve. The P1 readiness assessment evaluates each use-case's data dependencies and freshness requirements. The P3 pilot covers one consuming use-case end-to-end. The P5 expansion roadmap is sequenced by use-case readiness. Programmes that invert this relationship — building capability first, consuming later — encounter the canonical "fabric without consumers" failure mode at the next portfolio review.

## Data-Quality Discipline From P1

The P1 data-quality baseline is a hard gate. Source-system completeness, freshness, and accuracy per critical attribute must be measured before architecture is chosen. Programmes that defer the data-quality conversation discover at build time that source systems do not support the assumptions in the design, and the timeline slips while remediation is bolted on. The P3 Design gate cannot clear without an active data-quality remediation plan for pilot scope. Forecasting on bad data validates nothing — and worse, it can produce confident-looking outputs that downstream systems treat as authoritative.

## Architecture Decision

The P2 Synthesis gate forces a documented architecture decision: centralised warehouse, lakehouse, vendor data-fabric, decentralised mesh. Each has different cost, governance, and operational profiles. The wrong choice creates years of operational drag. The decision must be informed by the consuming use-cases (their grain, freshness, and consumption pattern) and by the existing source-system topology, not by vendor narrative or organisational fashion.

## Forecast Accuracy at Consumption Grain

For demand-forecasting v2 specifically, the P4 accuracy measurement must be at the same temporal grain and segment grain as the incumbent forecast and as downstream consumption. Aggregate accuracy improvements that come from a few large segments while smaller segments degrade are a documented contradiction template — they look good in a portfolio review but produce planning failures in operation. Operational consumption testing at P4 is mandatory: a forecast that is accurate but cannot be consumed by replenishment, planning, or scheduling systems is operationally inert.

## Standing Operating Disciplines

Activation is not the end. The P6 Operate phase runs three standing disciplines: data-quality and freshness monitoring (the fabric degrades silently otherwise), FinOps measurement at the use-case level (compute and storage costs scale non-linearly with consumption), and a quarterly operating review (kill criteria for under-performing domains, expansion sequencing for new ones). Programmes that close these disciplines at activation discover within 6–12 months that data-quality has drifted, costs have surprised finance, and consuming use-cases have lost accuracy without anyone noticing.`,
  kind: 'lifecycle',
  patternId: 'PAT-PRG-DATA-FAB-001',
  stages: PROGRAM_STAGES,
  gateCriteria: DATAFAB_GATE_CRITERIA,
  expectedArtifacts: DATAFAB_ARTIFACTS,
  contradictionTemplates: DATAFAB_CONTRADICTIONS,
  failureModes: DATAFAB_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-ARCH-001',
    'PAT-ARCH-002',
    'PAT-ARCH-003',
    'PAT-ARCH-004',
    'PAT-ARCH-009',
    'PAT-CDP-001',
  ],
  typicalDurationDays: { min: 365, max: 730 },
};

// =============================================================================
// Aggregate export
// =============================================================================

export const PROGRAM_LIFECYCLE_PATTERNS: LifecyclePatternSeed[] = [
  PAT_PRG_CDP_001,
  PAT_PRG_AI_CODING_001,
  PAT_PRG_COPILOT_001,
  PAT_PRG_LOYALTY_001,
  PAT_PRG_CC_AI_001,
  PAT_PRG_DATA_FAB_001,
];
