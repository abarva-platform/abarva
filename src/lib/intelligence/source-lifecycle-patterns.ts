import type {
  LifecyclePatternSeed,
  LifecycleStage,
  GateCriterion,
  ExpectedArtifact,
  ContradictionTemplate,
  FailureMode,
} from './seed-types';

// ---------------------------------------------------------------------------
// PAT-SRC-AMS-001  —  Application Managed Services (AMS) Lifecycle
// ---------------------------------------------------------------------------

const AMS_STAGES: LifecycleStage[] = [
  {
    id: 'Plan',
    label: 'Plan',
    description:
      'Define the sourcing objective, assemble the evaluation team, align stakeholders on scope, build the requirements workbook, and establish evaluation criteria. This stage ends with a signed project charter that authorises the market engagement.',
    order: 1,
  },
  {
    id: 'RFI',
    label: 'RFI',
    description:
      'Issue a Request for Information to the long-listed supplier market. Collect vendor capability statements, indicative commercial models, and early transition assumptions. Use responses to validate the requirements workbook and right-size the shortlist target.',
    order: 2,
  },
  {
    id: 'Shortlist',
    label: 'Shortlist',
    description:
      'Score RFI responses against the evaluation criteria matrix. Eliminate vendors that do not meet mandatory thresholds. Document shortlist rationale with named elimination reasons. Execute NDAs with every surviving finalist before issuing any confidential RFP material.',
    order: 3,
  },
  {
    id: 'RFP',
    label: 'RFP',
    description:
      'Issue the formal Request for Proposals to shortlisted vendors. The RFP must include scope boundaries, service-level schedules, commercial templates, transition obligations, governance expectations, and a mandatory Q&A window. Ambiguity at this stage compounds into BAFO inconsistency.',
    order: 4,
  },
  {
    id: 'Q&A',
    label: 'Q&A',
    description:
      'Receive and triage vendor clarification questions. Hold structured Q&A sessions and issue clarification amendments that all vendors receive equally. Freeze scope at the close of this stage; post-Q&A scope changes invalidate proposal comparability.',
    order: 5,
  },
  {
    id: 'Initial-Bid',
    label: 'Initial Bid',
    description:
      'Collect formal initial proposals. Score proposals against evaluation criteria. Build the initial financial model from submitted commercial templates. Identify completeness gaps and negotiation points to carry into BAFO. This stage determines which vendors qualify for the final round.',
    order: 6,
  },
  {
    id: 'BAFO',
    label: 'BAFO',
    description:
      'Best and Final Offer round. Invite surviving finalists (typically ≤3 vendors) with a structured BAFO letter that names negotiation points per vendor. Require normalized 3-year TCO worksheets, refreshed security attestations, and completed reference call evidence. This stage is the commercial crucible: incomplete BAFO responses are scored at face value, not re-requested.',
    order: 7,
  },
  {
    id: 'Selection',
    label: 'Selection',
    description:
      'Convene the selection committee with the scored BAFO evidence package. The committee reviews the selection scorecard, challenge assumptions, and documents the award rationale in a signed selection memo. Sponsor sign-off must precede any commercial commitment.',
    order: 8,
  },
  {
    id: 'Award',
    label: 'Award',
    description:
      'Execute the commercial instruments: Master Services Agreement, Statement of Work, and any SLA schedules. Notify the unsuccessful vendors per procurement policy. Align on an implementation timeline and initiate the transition plan. Security and legal reviews must be complete before signature.',
    order: 9,
  },
  {
    id: 'Onboard',
    label: 'Onboard',
    description:
      'Execute the knowledge transfer plan, complete team introductions, stand up governance cadences, baseline KPIs, and deliver the first operational report. Onboarding is complete when the service is operating under SLA and the transition team has stood down.',
    order: 10,
  },
];

const AMS_GATE_CRITERIA: GateCriterion[] = [
  // RFI → Shortlist gate
  {
    id: 'GATE-AMS-RFI-01',
    description: 'Minimum 4 vendor RFI responses received',
    gateType: 'hard',
    stageId: 'Shortlist',
    evaluationHint:
      'Count distinct vendor responses logged in the RFI tracking register. A response that does not address all mandatory sections counts as partial and does not satisfy this criterion.',
  },
  {
    id: 'GATE-AMS-RFI-02',
    description: 'Requirements document finalized and baselined',
    gateType: 'hard',
    stageId: 'Shortlist',
    evaluationHint:
      'The requirements workbook must carry a version number ≥ 1.0 and a sign-off from the business sponsor. Draft or "working" versions do not satisfy this criterion.',
  },
  {
    id: 'GATE-AMS-RFI-03',
    description: 'Evaluation team formally assembled with named roles',
    gateType: 'hard',
    stageId: 'Shortlist',
    evaluationHint:
      'The team register should name at least: sourcing lead, technical evaluator, commercial evaluator, and business sponsor. Vacant roles must have named interim cover.',
  },
  // Shortlist → RFP gate
  {
    id: 'GATE-AMS-SHL-01',
    description: 'Shortlist capped at ≤5 vendors with documented rationale per inclusion and exclusion',
    gateType: 'hard',
    stageId: 'RFP',
    evaluationHint:
      'The shortlist approval document must name every included vendor and every excluded vendor with a specific, evidence-backed rationale. Generic reasons such as "did not meet requirements" are insufficient.',
  },
  {
    id: 'GATE-AMS-SHL-02',
    description: 'NDA executed with each shortlisted finalist',
    gateType: 'hard',
    stageId: 'RFP',
    evaluationHint:
      'Legal must confirm countersigned NDAs on file for every shortlisted vendor before the RFP document is issued. A pending NDA blocks RFP transmission to that vendor.',
  },
  {
    id: 'GATE-AMS-SHL-03',
    description: 'Shortlist rationale approved by procurement governance committee',
    gateType: 'soft',
    stageId: 'RFP',
    evaluationHint:
      'Governance approval email or meeting minutes must be on file. If the governance committee meeting cannot be arranged before the commercial deadline, the sourcing lead may proceed with documented sponsor waiver.',
  },
  // BAFO → Selection gate
  {
    id: 'GATE-AMS-BAFO-01',
    description: 'Minimum 2 vendor BAFO responses received',
    gateType: 'hard',
    stageId: 'Selection',
    evaluationHint:
      'Fewer than 2 BAFO responses invalidates competitive tension and requires escalation to CPO. Do not advance to Selection with a single respondent without documented sole-source justification.',
  },
  {
    id: 'GATE-AMS-BAFO-02',
    description: 'Normalized 3-year TCO comparison complete for all BAFO respondents',
    gateType: 'hard',
    stageId: 'Selection',
    evaluationHint:
      'The TCO worksheet must normalize for scope differences, assumed FTE rates, and transition costs. Headline pricing comparisons without normalization do not satisfy this gate.',
  },
  {
    id: 'GATE-AMS-BAFO-03',
    description: 'Security attestations current (issued within 12 months) for each finalist',
    gateType: 'hard',
    stageId: 'Selection',
    evaluationHint:
      'SOC 2 Type II or equivalent. Check the attestation date, not the report-period end date. An attestation issued more than 12 months before the BAFO response date is considered stale and requires a bridge letter or refresh.',
  },
  {
    id: 'GATE-AMS-BAFO-04',
    description: 'Reference checks completed for each BAFO finalist',
    gateType: 'soft',
    stageId: 'Selection',
    evaluationHint:
      'Minimum 2 reference calls per finalist, from accounts of comparable size and complexity. Reference call notes must be on file. If time-constrained, a written reference questionnaire with signed responses satisfies this gate with sponsor waiver.',
  },
  // Selection → Award gate
  {
    id: 'GATE-AMS-SEL-01',
    description: 'Selection committee approval documented in signed meeting minutes',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Committee chair must countersign the minutes. A quorum requires at least 3 of the named committee members to have been present. Email ratification after the fact is acceptable if ≥3 members confirm.',
  },
  {
    id: 'GATE-AMS-SEL-02',
    description: 'Selection memo signed by programme sponsor',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'The selection memo must name the preferred vendor, the runner-up, the commercial basis for selection, and the programme dependencies addressed. Sponsor signature is a prerequisite to legal commencing contract review.',
  },
  {
    id: 'GATE-AMS-SEL-03',
    description: 'Legal review of contract terms complete',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Legal sign-off email referencing the specific contract version must be on file. Outstanding redlines that have not been resolved are a blocker. Legal may issue conditional sign-off if outstanding items are commercial (not legal) in nature.',
  },
  // Award → Onboard gate
  {
    id: 'GATE-AMS-AWD-01',
    description: 'Contract (MSA + SOW) fully executed with countersignature from awarded vendor',
    gateType: 'hard',
    stageId: 'Onboard',
    evaluationHint:
      'Execution requires wet or digital signature from an authorised signatory on both sides. Letters of intent or heads of terms do not satisfy this gate.',
  },
  {
    id: 'GATE-AMS-AWD-02',
    description: 'Implementation timeline agreed and baselined in project plan',
    gateType: 'hard',
    stageId: 'Onboard',
    evaluationHint:
      'The timeline must include named milestones, dependency links to the receiving programme (e.g. APX-CDP-2026), and accountability assignments. A verbal agreement does not satisfy this gate.',
  },
  {
    id: 'GATE-AMS-AWD-03',
    description: 'Knowledge transfer plan in place with named resources and dates',
    gateType: 'hard',
    stageId: 'Onboard',
    evaluationHint:
      'The KT plan must name at least one outgoing knowledge holder and one receiving resource per service domain. A plan without named resources is a template, not a plan.',
  },
];

const AMS_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  // Plan
  {
    id: 'ART-AMS-PLAN-01',
    label: 'RFP Project Charter',
    stageId: 'Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Signed charter authorising the sourcing event, naming the sponsor, business objective, commercial envelope, and decision target date.',
  },
  {
    id: 'ART-AMS-PLAN-02',
    label: 'Requirements Gathering Workbook',
    stageId: 'Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Structured workbook capturing functional, non-functional, service, and governance requirements. Version-controlled and signed off by the business sponsor before RFI issue.',
  },
  {
    id: 'ART-AMS-PLAN-03',
    label: 'Evaluation Criteria Matrix',
    stageId: 'Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Weighted scoring criteria across commercial, technical, transition, governance, and risk dimensions. Weights must be locked before any vendor responses are received.',
  },
  {
    id: 'ART-AMS-PLAN-04',
    label: 'Stakeholder Map',
    stageId: 'Plan',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'RACI or equivalent showing decision owners, reviewers, and approvers for each lifecycle stage. Prevents governance ambiguity at Selection.',
  },
  // RFI
  {
    id: 'ART-AMS-RFI-01',
    label: 'RFI Document (Issued)',
    stageId: 'RFI',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal RFI issued to the long-listed vendor market, including capability questionnaire, indicative commercial template, and response instructions.',
  },
  {
    id: 'ART-AMS-RFI-02',
    label: 'Vendor RFI Responses',
    stageId: 'RFI',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Collected vendor responses logged with receipt dates. Partial responses noted. Minimum 4 responses required to proceed to Shortlist.',
  },
  {
    id: 'ART-AMS-RFI-03',
    label: 'Market Scan Summary',
    stageId: 'RFI',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Summary of market observations from RFI responses: pricing bands, capability clustering, and notable differentiation or concentration risks.',
  },
  // Shortlist
  {
    id: 'ART-AMS-SHL-01',
    label: 'Vendor Shortlist with Rationale',
    stageId: 'Shortlist',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Scored shortlist document naming included and excluded vendors, scores against evaluation criteria, and specific rationale for each exclusion decision.',
  },
  {
    id: 'ART-AMS-SHL-02',
    label: 'NDA Tracking Log',
    stageId: 'Shortlist',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Log recording NDA status (issued, under review, signed, declined) for each shortlisted vendor. Signed NDAs are a prerequisite to RFP transmission.',
  },
  {
    id: 'ART-AMS-SHL-03',
    label: 'Shortlist Approval Record',
    stageId: 'Shortlist',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Governance committee approval email or meeting minutes confirming the shortlist. Named approver must be identified.',
  },
  // RFP
  {
    id: 'ART-AMS-RFP-01',
    label: 'RFP Document (Formal)',
    stageId: 'RFP',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Comprehensive RFP including scope schedule, SLA schedule, commercial template, transition obligations, governance model expectations, and Q&A process.',
  },
  {
    id: 'ART-AMS-RFP-02',
    label: 'Vendor Response Template',
    stageId: 'RFP',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Structured response template ensuring all vendors address identical sections. Prevents completeness gaps from distorting comparative scoring.',
  },
  {
    id: 'ART-AMS-RFP-03',
    label: 'Q&A Tracking Log',
    stageId: 'RFP',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Log of all vendor clarification questions received, triage decisions, and disposition (answered, deferred, declined). Feeds the Q&A amendment document.',
  },
  // Q&A
  {
    id: 'ART-AMS-QA-01',
    label: 'Q&A Session Log',
    stageId: 'Q&A',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal record of structured Q&A sessions including questions asked, answers given, and any scope clarifications. Distributed to all vendors equally.',
  },
  {
    id: 'ART-AMS-QA-02',
    label: 'Clarification Amendment Document',
    stageId: 'Q&A',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Issued amendment incorporating all material clarifications. Once issued, scope is frozen. Any post-amendment scope change requires a formal addendum and timeline reset.',
  },
  // Initial-Bid
  {
    id: 'ART-AMS-BID-01',
    label: 'Vendor Proposals',
    stageId: 'Initial-Bid',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Collected formal proposals per vendor, logged with receipt dates and completeness checked against the response template sections.',
  },
  {
    id: 'ART-AMS-BID-02',
    label: 'Initial Scoring Matrix',
    stageId: 'Initial-Bid',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Scored evaluation matrix for all initial proposals across the locked evaluation criteria. Individual evaluator scores should be recorded before consensus moderation.',
  },
  {
    id: 'ART-AMS-BID-03',
    label: 'Financial Model Inputs',
    stageId: 'Initial-Bid',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Extracted commercial data from initial proposals populated into the financial model. Basis for the initial TCO estimate and identification of pricing anomalies.',
  },
  // BAFO
  {
    id: 'ART-AMS-BAFO-01',
    label: 'BAFO Invitation Letter',
    stageId: 'BAFO',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal BAFO invitation per finalist, naming specific negotiation points, commercial improvement targets, and the BAFO response deadline.',
  },
  {
    id: 'ART-AMS-BAFO-02',
    label: 'BAFO Responses',
    stageId: 'BAFO',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Final offer submissions from all invited vendors. Responses are scored at face value; completeness gaps are not re-solicited.',
  },
  {
    id: 'ART-AMS-BAFO-03',
    label: 'Normalized 3-Year TCO Worksheet',
    stageId: 'BAFO',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Side-by-side TCO comparison normalizing scope assumptions, FTE rate differences, transition costs, and any vendor-specific add-ons. Must be complete before Selection committee convenes.',
  },
  {
    id: 'ART-AMS-BAFO-04',
    label: 'Security Attestation Checklist',
    stageId: 'BAFO',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Checklist confirming SOC 2 Type II (or equivalent) attestation currency for each BAFO finalist, including attestation date, scope, and any noted exceptions.',
  },
  {
    id: 'ART-AMS-BAFO-05',
    label: 'Reference Call Notes',
    stageId: 'BAFO',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Structured notes from reference calls with named accounts of comparable size and complexity. Should capture SLA performance history, transition experience, and escalation patterns.',
  },
  // Selection
  {
    id: 'ART-AMS-SEL-01',
    label: 'Selection Scorecard',
    stageId: 'Selection',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Final weighted scorecard across all BAFO respondents, used as the primary decision artifact in the committee meeting.',
  },
  {
    id: 'ART-AMS-SEL-02',
    label: 'Selection Memo',
    stageId: 'Selection',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Signed memo documenting the committee\'s preferred vendor, runner-up, commercial basis for selection, and programme dependencies satisfied by the decision.',
  },
  {
    id: 'ART-AMS-SEL-03',
    label: 'Committee Meeting Minutes',
    stageId: 'Selection',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal minutes recording attendees, decisions made, dissenting views, and any conditions attached to the selection recommendation.',
  },
  // Award
  {
    id: 'ART-AMS-AWD-01',
    label: 'Executed Contract (MSA + SOW)',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Fully countersigned Master Services Agreement and Statement of Work. This is the legal record of the commercial commitment.',
  },
  {
    id: 'ART-AMS-AWD-02',
    label: 'Onboarding Plan',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Phased onboarding plan covering governance setup, team introductions, system access, and initial SLA measurement period.',
  },
  {
    id: 'ART-AMS-AWD-03',
    label: 'Transition Timeline',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Dependency-linked Gantt or milestone plan showing transition milestones, receiving-programme handoff dates, and KT completion criteria.',
  },
  // Onboard
  {
    id: 'ART-AMS-ONB-01',
    label: 'Knowledge Transfer Plan',
    stageId: 'Onboard',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Named-resource KT plan covering each service domain. Must identify outgoing knowledge holders, receiving resources, and completion criteria per domain.',
  },
  {
    id: 'ART-AMS-ONB-02',
    label: 'Team Introductions Log',
    stageId: 'Onboard',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Record of formal introductions between incumbent and incoming teams, including relationship maps and escalation path agreements.',
  },
  {
    id: 'ART-AMS-ONB-03',
    label: 'Go-Live Checklist',
    stageId: 'Onboard',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Signed checklist confirming all prerequisites for steady-state service operation: governance cadences in place, SLA measurement active, escalation paths tested.',
  },
  {
    id: 'ART-AMS-ONB-04',
    label: 'KPI Baseline Report',
    stageId: 'Onboard',
    requirement: 'required',
    gateType: 'hard',
    description:
      'First operational report establishing KPI baselines against contracted SLAs. Becomes the reference point for performance governance in the steady-state.',
  },
];

const AMS_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-AMS-001',
    label: 'Vendor Timeline vs Measured Median',
    severity: 'high',
    partyA: 'Vendor claim: deployment timeline',
    partyB: 'Measured reality: AMS transition median',
    detectionHint:
      'Fires when a vendor\'s proposed deployment timeline is more than 25% shorter than the measured median for AMS transitions of comparable scope and integration complexity. For mid-market AMS transitions with 5–15 integrations, the measured median is 26–32 weeks. A vendor claiming 16–18 weeks should trigger this contradiction and require a detailed workplan with resource-day assumptions before BAFO scoring proceeds.',
    resolutionPath:
      'Request a resource-loaded project plan from the vendor. Compare day counts against historical evidence from reference accounts. If no credible plan is provided, apply a timeline-risk penalty in the scoring matrix and flag to the selection committee as an unresolved contradiction.',
  },
  {
    id: 'CON-AMS-002',
    label: 'Scope Definition vs Delivered Coverage',
    severity: 'high',
    partyA: 'Vendor RFP scope statement',
    partyB: 'Final contract service schedule',
    detectionHint:
      'Fires when exclusions, carve-outs, or assumed-customer-responsibility items appear in the final contract that were not identified in the vendor\'s original RFP scope response. This is a common pattern where vendors describe inclusive scope at RFP to remain competitive but narrow coverage in contract redlines. Triggering condition: ≥2 material items in the contract service schedule that were not surfaced as exclusions in the RFP response.',
    resolutionPath:
      'Conduct a structured scope-delta analysis between the RFP response and the contract draft. Each delta item must be accepted, rejected, or priced as an addendum. Unresolved deltas are escalated to the selection committee before execution.',
  },
  {
    id: 'CON-AMS-003',
    label: 'Pricing vs 3-Year TCO',
    severity: 'high',
    partyA: 'Vendor headline rate (year 1)',
    partyB: 'Normalized 3-year TCO',
    detectionHint:
      'Fires when a vendor\'s headline pricing appears competitive (within 5% of lowest bid) but normalized 3-year TCO is more than 15% above the next alternative once transition costs, assumed FTE uplift, integration charges, and exit costs are included. This commonly arises when vendors quote attractive year-1 rates but embed cost escalators, excluded scope, or transition obligations that compress net economics by year 2.',
    resolutionPath:
      'Present the TCO analysis to the selection committee alongside the headline comparison. Require the vendor to provide a written TCO attestation if claiming their full-lifecycle costs are competitive. Do not select on headline rate alone when TCO diverges materially.',
  },
  {
    id: 'CON-AMS-004',
    label: 'SLA Claim vs Reference Evidence',
    severity: 'medium',
    partyA: 'Vendor stated SLA performance',
    partyB: 'Reference customer accounts',
    detectionHint:
      'Fires when reference accounts describe ≥2 SLA misses in the prior 12 months that were not disclosed in the vendor\'s proposal or BAFO submission. SLA misses include: availability breaches, response-time failures, escalation SLA violations, and any incidents that required contract-credit invocation. Vendors frequently present aggregate performance data that obscures incident-level SLA history.',
    resolutionPath:
      'Obtain a formal SLA performance report from the vendor covering the 24 months prior to BAFO. Request that reference accounts confirm the accuracy of the vendor\'s stated metrics. Any material discrepancy must be disclosed to the selection committee.',
  },
  {
    id: 'CON-AMS-005',
    label: 'Transition Risk vs Current Integration Depth',
    severity: 'high',
    partyA: 'Vendor transition plan obligations',
    partyB: 'Actual integration depth in current environment',
    detectionHint:
      'Fires when the vendor\'s transition plan proposes a KT window of less than 60 days for an environment with more than 5 active integrations, or less than 90 days for environments with more than 10 integrations. This mismatch predicts knowledge transfer gaps, integration failures during cutover, and post-go-live instability. It commonly occurs when vendors optimize their transition plan for competitive timeline appeal rather than operational reality.',
    resolutionPath:
      'Map the current integration inventory against the vendor\'s KT plan. For each integration not covered by a named KT resource and completion date, escalate as a gap. Require the vendor to extend the KT window or document the risk-acceptance rationale signed by both the programme sponsor and the incoming vendor.',
  },
];

const AMS_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-AMS-001',
    label: 'Vendor Lock-In via Proprietary Tooling',
    description:
      'During contract negotiation, the vendor introduces proprietary monitoring, ITSM, or delivery tools as a condition of service delivery. These tools become embedded in the operating model during Onboard, making exit difficult and creating leverage in future renewals.',
    stages: ['Award', 'Onboard'],
    mitigations: [
      'Require a tooling schedule in the SOW that identifies all proprietary tools, their data portability provisions, and exit transition obligations.',
      'Assess tool lock-in risk as a scored criterion in the evaluation matrix.',
      'Include data portability and transition assistance obligations in the contract before execution.',
    ],
  },
  {
    id: 'FM-AMS-002',
    label: 'Scope Creep Post-Award',
    description:
      'The RFP scope is interpreted expansively by the incoming vendor during Onboard, adding services, team members, or infrastructure that were not in the contracted SOW. This inflates year-1 costs and creates disputes about what was and was not included.',
    stages: ['Onboard'],
    mitigations: [
      'Conduct a scope-delta review between the final RFP response and the executed SOW before Onboard begins.',
      'Establish a formal change-control process as a day-one governance requirement.',
      'Baseline scope explicitly in the KPI baseline report so any additions are visible as changes.',
    ],
  },
  {
    id: 'FM-AMS-003',
    label: 'Security Debt from Waived Attestation',
    description:
      'Timeline pressure causes the team to proceed to Award before obtaining or reviewing the vendor\'s SOC 2 Type II attestation, or to accept an attestation that is more than 18 months old. This creates unquantified security risk in a live service environment.',
    stages: ['Award'],
    mitigations: [
      'Enforce the security attestation gate criterion as hard — no exceptions without CPO and CISO co-sign.',
      'Request attestations at RFI stage so currency is known before BAFO investment.',
      'If an attestation is genuinely unavailable, require a third-party penetration test scoped to AMS delivery infrastructure as a substitute.',
    ],
  },
  {
    id: 'FM-AMS-004',
    label: 'Knowledge Transfer Gap',
    description:
      'The KT plan is agreed as part of the contract but is not resourced with named individuals or funded by either party. During Onboard, the outgoing team is redeployed before KT is complete, leaving the incoming vendor operating with incomplete domain knowledge.',
    stages: ['Onboard'],
    mitigations: [
      'Require named KT resources and completion dates as contractual obligations, not aspirational plan items.',
      'Gate go-live on a signed KT completion sign-off per domain.',
      'Include KT resource costs in the programme budget, not the vendor\'s commercial proposal.',
    ],
  },
  {
    id: 'FM-AMS-005',
    label: 'Reference Check Shortcut',
    description:
      'Under time pressure, reference calls for BAFO finalists are abbreviated, delegated to junior team members, or replaced by vendor-supplied written testimonials. Material SLA performance history and transition quality issues are not surfaced before Selection.',
    stages: ['BAFO', 'Selection'],
    mitigations: [
      'Treat reference calls as a hard gate criterion. Sponsor waiver is required to proceed without completed calls.',
      'Use a structured reference call guide that explicitly asks about SLA breaches, escalation events, and transition quality.',
      'Confirm that reference accounts are independent — vendor-nominated references should be cross-checked against the vendor\'s own customer list to avoid coached testimony.',
    ],
  },
  {
    id: 'FM-AMS-006',
    label: 'Commercial Compression in BAFO',
    description:
      'Schedule pressure causes the BAFO stage to be truncated: TCO normalization is skipped, the BAFO letter omits specific negotiation points, or the response window is too short for vendors to re-price complex scope. The result is incomparable submissions that force a subjective selection.',
    stages: ['BAFO', 'Selection'],
    mitigations: [
      'Protect BAFO calendar time as a hard schedule constraint. If the overall timeline must compress, compress earlier stages, not BAFO.',
      'Issue BAFO letters with per-vendor negotiation points at least 10 business days before the response deadline.',
      'TCO normalization must be complete before the selection committee meeting is scheduled.',
    ],
  },
];

export const PAT_SRC_AMS_001: LifecyclePatternSeed = {
  // PatternSeed base fields
  id: 'PAT-SRC-AMS-001',
  slug: 'ams-sourcing-lifecycle',
  title: 'Application Managed Services (AMS) Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'AMS procurement decisions are more defensible, more replicable, and less prone to post-award failure when the sourcing lifecycle is governed as a typed 10-stage workflow with explicit gate criteria, artifact requirements, and contradiction templates that surface vendor-claim gaps before commitment.',
  applicability:
    'Apply when an enterprise is selecting a vendor to assume ongoing management of one or more application towers, including ERP, CRM, or custom application portfolios. Most relevant when the transition involves knowledge transfer from an incumbent, when the downstream programme depends on the AMS award as a commercial gate, or when the organization is rationalizing from multiple vendors to a strategic partner.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.91,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 1,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: [
    'PAT-SRC-001',
    'PAT-SRC-002',
    'PAT-SRC-003',
    'PAT-SRC-004',
    'PAT-SRC-005',
    'PAT-SRC-006',
    'PAT-SRC-007',
    'PAT-SRC-010',
    'PAT-SRC-012',
  ],
  derivedFromPatternIds: ['PAT-SRC-003'],
  taggedContradictionIds: ['CON-001', 'CON-AMS-001', 'CON-AMS-004', 'CON-AMS-005'],
  body: `## What AMS Is

Application Managed Services (AMS) is the contractual transfer of ongoing management, support, and optimization responsibility for an enterprise's application estate to a specialist third party. Unlike project-based procurement — where a vendor delivers a defined scope and exits — AMS establishes a durable operating relationship in which the vendor assumes accountability for service levels, team continuity, and continuous improvement across a live application portfolio. The commercial decision is therefore not just about price; it is about selecting an operating partner whose governance maturity, transition capability, and SLA history will determine service quality for a multi-year horizon.

## When This Lifecycle Applies

The AMS lifecycle pattern is the appropriate sourcing frame when: (a) the organization is moving management responsibility from an incumbent vendor or internal team to a new provider; (b) the application estate being transferred includes active integrations with other platforms, making transition complexity a material selection criterion; or (c) the sourcing outcome is a gating input for a downstream programme — as with APX-CDP-2026, which cannot advance to its Design gate until the AMS award is finalized and the transition timeline is confirmed. In this last case, the sourcing team must treat the programme dependency as a scheduling constraint, not a desirable feature. Slipping past the sourcing target date does not merely delay a procurement; it delays a programme gate.

## What Distinguishes AMS from Project-Based Procurement

Project-based procurement selects a vendor to deliver a bounded scope by a defined date, after which the commercial relationship winds down. AMS procurement selects a vendor to be the enterprise's operating partner for a sustained period — typically 3–5 years — under a performance-based SLA regime. This distinction creates several sourcing obligations that do not exist in project procurement: first, transition quality becomes a screening criterion because a weak transition creates operational risk that outlasts the sourcing event; second, reference checks must evaluate the vendor's steady-state service delivery, not just their implementation record; and third, contractual exit provisions must be evaluated at selection, not after award, because the cost of leaving an inadequate AMS provider is high. The evaluation criteria matrix, gate criteria, and artifact requirements in this pattern reflect these distinctions.

## The Critical BAFO Stage

BAFO is the commercial crucible of AMS sourcing. By the time finalists receive BAFO invitations, the evaluation team should already understand the material negotiation points per vendor — the specific gaps, pricing anomalies, scope ambiguities, and governance concerns that remain unresolved from initial proposals. The BAFO letter must be vendor-specific, naming these points explicitly, rather than a generic invitation for vendors to sharpen their pencils. Normalized 3-year TCO analysis must be completed as part of BAFO processing, not as a post-selection exercise, because headline pricing divergences of 5–10% routinely invert when transition costs, assumed FTE rates, and exit provisions are normalized. Two BAFO responses are the minimum threshold to sustain competitive tension; a single-respondent BAFO is a sole-source situation requiring separate governance justification. Security attestations must be current — an SOC 2 Type II attestation more than 12 months old requires a bridge letter before BAFO evidence is accepted as complete.

## Common Failure Modes

The six failure modes in this pattern represent the most frequently observed sources of post-award regret in AMS sourcing. Three occur most often: knowledge transfer gaps (the KT plan exists in the contract but is not resourced with named individuals, so the incoming vendor operates with incomplete domain knowledge); commercial compression (schedule pressure truncates BAFO, skipping TCO normalization and producing incomparable submissions); and vendor lock-in through proprietary tooling (monitoring, ITSM, and delivery tools introduced during contract negotiation become embedded in the operating model, creating switching costs that erode renewal leverage). Each failure mode has associated mitigations that should be tracked as checklist items during stage execution, not referenced retrospectively after problems emerge.

## Linkage to Programs

In the Apex Retail context, this lifecycle directly governs the AMS Vendor Consolidation 2026 sourcing event. The APX-CDP-2026 programme has a hard dependency on the AMS award: the CDP Design gate cannot clear until the AMS vendor is selected, the transition timeline is confirmed, and the integration sequencing is validated. The BAFO stage of this lifecycle is therefore on the critical path for a programme milestone. This linkage illustrates the core principle of the AbarVa Source layer: commercial events are not isolated procurement exercises. They are gating inputs to transformation programmes, and their lifecycle governance directly determines whether downstream programme timelines are realistic or aspirational.`,

  // LifecyclePatternSeed extended fields
  kind: 'lifecycle',
  patternId: 'PAT-SRC-AMS-001',
  stages: AMS_STAGES,
  gateCriteria: AMS_GATE_CRITERIA,
  expectedArtifacts: AMS_EXPECTED_ARTIFACTS,
  contradictionTemplates: AMS_CONTRADICTION_TEMPLATES,
  failureModes: AMS_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-001', // Vendor BAFO Orchestration
    'PAT-SRC-003', // Ten-Stage Sourcing Event Governance
    'PAT-SRC-004', // Linked-Program Commercial Dependency Mapping
    'PAT-SRC-006', // Transition Plan Sufficiency Screen
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-012', // Mobilization Timeline Reality Check
  ],
  typicalDurationDays: { min: 90, max: 210 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-RFP-001  —  Standard RFP Lifecycle
// ---------------------------------------------------------------------------

const RFP_STAGES: LifecycleStage[] = [
  {
    id: 'Intake',
    label: 'Intake',
    description:
      'Receive and validate the sourcing request. Confirm budget approval, business sponsor, and that requirements are sufficiently developed to proceed to market. Define the evaluation team and lock the commercial envelope.',
    order: 1,
  },
  {
    id: 'Requirements',
    label: 'Requirements',
    description:
      'Gather and baseline functional, non-functional, and commercial requirements with the business sponsor. Produce the evaluation criteria matrix with locked weights before any vendor engagement.',
    order: 2,
  },
  {
    id: 'Market-Engagement',
    label: 'Market Engagement',
    description:
      'Issue RFI or conduct supplier landscape research to validate the viable vendor set and calibrate requirements against current market capability. Results inform shortlist design and RFP structure.',
    order: 3,
  },
  {
    id: 'RFP-Issue',
    label: 'RFP Issue',
    description:
      'Issue the formal RFP to the shortlisted vendor set. Includes scope schedule, evaluation criteria, commercial template, and the Q&A process. NDAs must be in place for all recipients.',
    order: 4,
  },
  {
    id: 'Q&A',
    label: 'Q&A',
    description:
      'Receive and triage vendor clarification questions. Issue amendments to all vendors equally. Freeze scope at Q&A close.',
    order: 5,
  },
  {
    id: 'Evaluation',
    label: 'Evaluation',
    description:
      'Score proposals against the locked evaluation criteria matrix. Conduct individual evaluator scoring before consensus moderation. Document scoring rationale per vendor per criterion.',
    order: 6,
  },
  {
    id: 'Selection',
    label: 'Selection',
    description:
      'Present the evaluation summary to the selection committee. The committee ratifies or challenges the recommended vendor. The selection memo is signed by the business sponsor.',
    order: 7,
  },
  {
    id: 'Award',
    label: 'Award',
    description:
      'Execute the commercial instruments. Notify unsuccessful vendors. Brief the implementation team. Baseline the project plan against the agreed delivery timeline.',
    order: 8,
  },
];

const RFP_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-RFP-INT-01',
    description: 'Budget approval confirmed and documented',
    gateType: 'hard',
    stageId: 'Requirements',
    evaluationHint:
      'Finance approval email or budget system confirmation must be on file. Verbal commitments do not satisfy this gate.',
  },
  {
    id: 'GATE-RFP-REQ-01',
    description: 'Evaluation criteria matrix locked with weights before any vendor contact',
    gateType: 'hard',
    stageId: 'Market-Engagement',
    evaluationHint:
      'Weights must be finalized and version-controlled before any RFI, market briefing, or vendor conversation occurs. Post-hoc weight adjustment is a procurement governance breach.',
  },
  {
    id: 'GATE-RFP-RFP-01',
    description: 'NDAs executed with all shortlisted vendors',
    gateType: 'hard',
    stageId: 'RFP-Issue',
    evaluationHint:
      'All shortlisted vendors must have countersigned NDAs before the RFP document is distributed.',
  },
  {
    id: 'GATE-RFP-EVAL-01',
    description: 'All evaluators have submitted independent scores before moderation',
    gateType: 'hard',
    stageId: 'Selection',
    evaluationHint:
      'Individual evaluator scoresheets must be timestamped before the consensus moderation session begins. Score convergence achieved only after independent scoring preserves evaluation integrity.',
  },
  {
    id: 'GATE-RFP-SEL-01',
    description: 'Selection memo signed by business sponsor',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Sponsor signature is required before procurement commences contract negotiations. The memo must identify the preferred vendor, the evaluation basis, and any conditions attached to the selection.',
  },
  {
    id: 'GATE-RFP-SEL-02',
    description: 'Legal review of proposed contract terms complete',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Legal sign-off email referencing the specific contract version and confirming no material outstanding issues must be on file before execution.',
  },
];

const RFP_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-RFP-INT-01',
    label: 'Sourcing Request',
    stageId: 'Intake',
    requirement: 'required',
    gateType: 'hard',
    description: 'Formal sourcing request with business case, budget reference, and sponsor name.',
  },
  {
    id: 'ART-RFP-REQ-01',
    label: 'Requirements Workbook',
    stageId: 'Requirements',
    requirement: 'required',
    gateType: 'hard',
    description: 'Baselined requirements document signed off by the business sponsor.',
  },
  {
    id: 'ART-RFP-REQ-02',
    label: 'Evaluation Criteria Matrix',
    stageId: 'Requirements',
    requirement: 'required',
    gateType: 'hard',
    description: 'Weighted scoring criteria locked before any vendor engagement.',
  },
  {
    id: 'ART-RFP-MKT-01',
    label: 'Market Scan Summary',
    stageId: 'Market-Engagement',
    requirement: 'recommended',
    gateType: 'soft',
    description: 'Summary of vendor landscape, capability observations, and shortlist rationale.',
  },
  {
    id: 'ART-RFP-RFP-01',
    label: 'RFP Document',
    stageId: 'RFP-Issue',
    requirement: 'required',
    gateType: 'hard',
    description: 'Formal RFP with scope, SLA schedule, commercial template, and Q&A instructions.',
  },
  {
    id: 'ART-RFP-RFP-02',
    label: 'Vendor Response Template',
    stageId: 'RFP-Issue',
    requirement: 'required',
    gateType: 'hard',
    description: 'Structured template ensuring all vendors address identical response sections.',
  },
  {
    id: 'ART-RFP-QA-01',
    label: 'Q&A Amendment Document',
    stageId: 'Q&A',
    requirement: 'required',
    gateType: 'hard',
    description: 'Issued amendment incorporating all material clarifications, distributed to all vendors equally.',
  },
  {
    id: 'ART-RFP-EVAL-01',
    label: 'Scoring Matrix',
    stageId: 'Evaluation',
    requirement: 'required',
    gateType: 'hard',
    description: 'Individual and moderated scores for all proposals across locked evaluation criteria.',
  },
  {
    id: 'ART-RFP-SEL-01',
    label: 'Selection Memo',
    stageId: 'Selection',
    requirement: 'required',
    gateType: 'hard',
    description: 'Signed memo documenting the preferred vendor, evaluation basis, and sponsor approval.',
  },
  {
    id: 'ART-RFP-AWD-01',
    label: 'Executed Contract',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description: 'Fully countersigned commercial agreement.',
  },
];

const RFP_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-RFP-001',
    label: 'Scope Statement vs Contract Coverage',
    severity: 'high',
    partyA: 'Vendor RFP scope response',
    partyB: 'Final contract service schedule',
    detectionHint:
      'Fires when the executed contract service schedule contains exclusions or carve-outs not identified in the vendor\'s RFP response. Triggers when ≥2 material items appear as out-of-scope in the contract that were described as in-scope in the proposal.',
    resolutionPath:
      'Conduct a scope-delta analysis before contract execution. Each delta item must be accepted, rejected, or separately priced.',
  },
  {
    id: 'CON-RFP-002',
    label: 'Delivery Timeline vs Market Benchmark',
    severity: 'medium',
    partyA: 'Vendor proposed delivery timeline',
    partyB: 'Market benchmark for comparable scope',
    detectionHint:
      'Fires when a vendor\'s proposed implementation timeline is more than 30% shorter than the market benchmark for comparable scope and organizational complexity.',
    resolutionPath:
      'Request a resource-loaded delivery plan. Compare day counts against reference projects. Apply timeline-risk scoring penalty if plan is not credible.',
  },
  {
    id: 'CON-RFP-003',
    label: 'Price Competitiveness vs TCO',
    severity: 'medium',
    partyA: 'Vendor year-1 pricing',
    partyB: 'Normalized multi-year TCO',
    detectionHint:
      'Fires when the vendor with the lowest year-1 price has a normalized 3-year TCO more than 15% above the next alternative.',
    resolutionPath:
      'Present TCO analysis to the selection committee. Do not select on year-1 rate when multi-year economics diverge materially.',
  },
];

const RFP_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-RFP-001',
    label: 'Criteria Weight Manipulation',
    description:
      'Evaluation criteria weights are adjusted after proposals are received to favor a pre-determined vendor. This creates legal and governance exposure and undermines the defensibility of the selection.',
    stages: ['Evaluation', 'Selection'],
    mitigations: [
      'Version-control the evaluation criteria matrix with a timestamp before any vendor contact.',
      'Require governance committee approval to change weights after RFP issue.',
    ],
  },
  {
    id: 'FM-RFP-002',
    label: 'Scope Freeze Failure',
    description:
      'Scope changes are introduced after Q&A close, making proposals non-comparable and creating grounds for vendor challenges.',
    stages: ['Q&A', 'Evaluation'],
    mitigations: [
      'Formally communicate scope freeze to all vendors at Q&A close.',
      'Any post-freeze scope change requires a formal addendum with a proposal re-submission window.',
    ],
  },
  {
    id: 'FM-RFP-003',
    label: 'Sole-Respondent Evaluation',
    description:
      'Only one vendor submits a compliant proposal, eliminating competitive tension and benchmarking ability. The team proceeds to selection without acknowledging the governance implications.',
    stages: ['Evaluation', 'Selection'],
    mitigations: [
      'Escalate to CPO when fewer than 2 compliant responses are received.',
      'Document sole-source justification if proceeding. Consider re-issue with expanded vendor set.',
    ],
  },
];

export const PAT_SRC_RFP_001: LifecyclePatternSeed = {
  // PatternSeed base fields
  id: 'PAT-SRC-RFP-001',
  slug: 'standard-rfp-lifecycle',
  title: 'Standard RFP Lifecycle',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Standard RFP events produce defensible decisions when they follow a structured 8-stage lifecycle with locked evaluation criteria, enforced scope freeze, and signed selection documentation — rather than treating procurement as an administrative formality around a pre-determined outcome.',
  applicability:
    'Apply to competitive procurement events where the organization is selecting a vendor through a formal written proposal process. Scope includes technology, professional services, and managed services acquisitions where budget, requirements, and evaluation criteria are sufficiently defined to issue a formal RFP.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.85,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: [
    'PAT-SRC-AMS-001',
    'PAT-SRC-002',
    'PAT-SRC-003',
    'PAT-SRC-007',
    'PAT-SRC-011',
  ],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  body: `## Summary

The standard RFP lifecycle provides a reusable governance frame for competitive vendor selection. It enforces the critical sequencing rules — evaluation criteria locked before vendor engagement, scope frozen after Q&A, independent scoring before consensus moderation, and sponsor sign-off before contract execution — that distinguish defensible procurement from process-as-decoration. While simpler than the AMS lifecycle, it applies to a far broader category of sourcing events and serves as the baseline from which more complex lifecycle patterns derive.

## When to Apply

Use this lifecycle for any competitive procurement event where the organization has defined requirements and intends to select a vendor through a written proposal process. It is appropriate for technology platform acquisitions, professional services engagements, and lighter managed services arrangements where AMS-specific complexity (transition governance, multi-year operational accountability, integration-heavy KT) is not the primary concern.

## Key Governance Rules

Three governance rules underpin the entire lifecycle. First, evaluation criteria weights must be locked and version-controlled before any vendor receives the RFP — post-hoc weight adjustment is the most common procurement integrity failure and creates legal exposure. Second, scope must be frozen at Q&A close — post-freeze scope changes invalidate proposal comparability and create grounds for vendor challenges. Third, independent evaluator scoring must be completed and timestamped before the consensus moderation session — convergence achieved only after independent scoring is the only way to prevent anchoring bias from distorting the evaluation.`,

  // LifecyclePatternSeed extended fields
  kind: 'lifecycle',
  patternId: 'PAT-SRC-RFP-001',
  stages: RFP_STAGES,
  gateCriteria: RFP_GATE_CRITERIA,
  expectedArtifacts: RFP_EXPECTED_ARTIFACTS,
  contradictionTemplates: RFP_CONTRADICTION_TEMPLATES,
  failureModes: RFP_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-002', // Vendor Response Completeness Threshold
    'PAT-SRC-007', // Vendor BAFO Scoring Rubric
    'PAT-SRC-011', // Selection Committee Governance Cadence
  ],
  typicalDurationDays: { min: 45, max: 120 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-SOLE-001  —  Sole-Source / Direct Award Lifecycle
// ---------------------------------------------------------------------------

const SOLE_STAGES: LifecycleStage[] = [
  {
    id: 'Justify',
    label: 'Justify',
    description:
      'Author the written sole-source justification. The justification must establish both the regulatory or contractual basis for waiving competition and the commercial rationale for selecting the named vendor. Sourcing doctrine treats this stage as the integrity foundation of the entire event: if the justification cannot withstand external review, no later stage can repair it.',
    order: 1,
  },
  {
    id: 'Single-Vendor-DD',
    label: 'Single-Vendor Due Diligence',
    description:
      'Conduct targeted due diligence on the named vendor. Without competitive tension, due diligence carries the burden that scoring would otherwise carry: financial health, security attestations, reference history, and capability validation must be independently triangulated rather than inferred from a competitive field.',
    order: 2,
  },
  {
    id: 'Negotiate',
    label: 'Negotiate',
    description:
      'Negotiate commercial and contractual terms against documented benchmarks. In sole-source events the negotiator does not have a runner-up to anchor against, so external pricing benchmarks, prior contract baselines, and market rate cards must be assembled before negotiation begins. Without anchors, sole-source negotiation collapses into vendor-led pricing.',
    order: 3,
  },
  {
    id: 'Approve',
    label: 'Approve',
    description:
      'Obtain competition-exemption approval from the procurement governance authority. Approval evidence must reference the justification document, the negotiated commercial terms, and the post-award benchmarking commitment. The approver of last resort (CPO, board sub-committee, or equivalent) signs off in writing.',
    order: 4,
  },
  {
    id: 'Award',
    label: 'Award',
    description:
      'Execute the commercial instruments and publish the post-award notice consistent with the organisation\'s transparency obligations. Initiate the post-award benchmarking obligation: a documented commitment to verify, within a defined window, that the agreed pricing and terms remain market-aligned.',
    order: 5,
  },
];

const SOLE_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-SOLE-JUS-01',
    description: 'Written sole-source justification documents both regulatory and commercial basis',
    gateType: 'hard',
    stageId: 'Single-Vendor-DD',
    evaluationHint:
      'The justification must contain two distinct sections: (a) the legal or contractual basis for waiving competition (e.g. statutory exception, IP exclusivity, emergency carve-out, prior IP investment) and (b) the commercial rationale for the specific vendor. A justification that asserts only operational convenience does not satisfy this gate.',
  },
  {
    id: 'GATE-SOLE-JUS-02',
    description: 'Market-alternative survey performed and documented',
    gateType: 'hard',
    stageId: 'Single-Vendor-DD',
    evaluationHint:
      'Even in sole-source events, the team must document a structured survey of viable alternatives and the specific reason each was rejected. A justification that does not name the alternatives considered cannot rebut a future challenge that the market was not surveyed.',
  },
  {
    id: 'GATE-SOLE-DD-01',
    description: 'Independent financial-health assessment of the named vendor on file',
    gateType: 'hard',
    stageId: 'Negotiate',
    evaluationHint:
      'Audited accounts, credit-rating evidence, or equivalent third-party financial evaluation must be on file. Vendor-supplied financial summaries do not satisfy this gate; the assessment must originate from an independent source.',
  },
  {
    id: 'GATE-SOLE-DD-02',
    description: 'Security attestation current within 12 months',
    gateType: 'hard',
    stageId: 'Negotiate',
    evaluationHint:
      'SOC 2 Type II or equivalent attestation issued within the last 12 months. In sole-source events this gate cannot be waived under schedule pressure because there is no competitive screening to compensate for unknown security posture.',
  },
  {
    id: 'GATE-SOLE-DD-03',
    description: 'Reference checks completed with at least 2 independent accounts',
    gateType: 'soft',
    stageId: 'Negotiate',
    evaluationHint:
      'References must be independent of the vendor\'s nominated list where possible. Sourcing doctrine treats vendor-coached references with greater skepticism in sole-source contexts; cross-check at least one reference against the vendor\'s public customer list.',
  },
  {
    id: 'GATE-SOLE-NEG-01',
    description: 'External pricing benchmark assembled before negotiation begins',
    gateType: 'hard',
    stageId: 'Approve',
    evaluationHint:
      'Benchmark evidence may include prior contract pricing, published market rate cards, analyst pricing data, or comparable public-sector awards. The benchmark file must predate the first negotiation session by at least 5 business days; benchmarks assembled after pricing is on the table are anchored to vendor-led numbers.',
  },
  {
    id: 'GATE-SOLE-NEG-02',
    description: 'Negotiated terms include explicit benchmarking and adjustment clause',
    gateType: 'hard',
    stageId: 'Approve',
    evaluationHint:
      'The contract must contain a clause requiring post-award benchmarking within a defined window (typically 12 months) and an adjustment mechanism if the agreed pricing is found to be materially above market. Without this clause the post-award benchmarking obligation has no commercial enforcement.',
  },
  {
    id: 'GATE-SOLE-APP-01',
    description: 'Competition-exemption approval signed by procurement governance authority',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Approval must come from the organisation\'s procurement governance authority of last resort (CPO, audit committee, or board sub-committee, depending on the threshold). Sponsor approval alone does not satisfy this gate when the contract value exceeds the standard delegation limit.',
  },
  {
    id: 'GATE-SOLE-APP-02',
    description: 'Approval evidence references all three: justification, negotiated terms, benchmark',
    gateType: 'soft',
    stageId: 'Award',
    evaluationHint:
      'The approval memorandum should explicitly cite the justification document, the negotiated commercial terms, and the benchmarking evidence. An approval that does not reference these inputs is procedurally weak even if substantively defensible.',
  },
  {
    id: 'GATE-SOLE-AWD-01',
    description: 'Post-award notice published consistent with transparency obligations',
    gateType: 'soft',
    stageId: 'Award',
    evaluationHint:
      'For organisations subject to public-sector transparency rules or internal disclosure policies, the sole-source award notice must be published or filed within the required window. For private-sector events this gate is soft but recommended for governance defensibility.',
  },
];

const SOLE_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-SOLE-JUS-01',
    label: 'Sole-Source Justification Memo',
    stageId: 'Justify',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Written justification establishing both the regulatory or contractual basis for waiving competition and the commercial rationale for the specific vendor. Signed by the sourcing lead and business sponsor.',
  },
  {
    id: 'ART-SOLE-JUS-02',
    label: 'Market-Alternative Survey',
    stageId: 'Justify',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Structured survey of viable alternatives in the market and the specific reason each was rejected as non-viable for this requirement.',
  },
  {
    id: 'ART-SOLE-JUS-03',
    label: 'Regulatory Basis Citation',
    stageId: 'Justify',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Citation to the specific statutory exception, contractual provision, or policy clause that authorises the competition waiver. Optional for private-sector events without statutory drivers.',
  },
  {
    id: 'ART-SOLE-DD-01',
    label: 'Financial Health Assessment',
    stageId: 'Single-Vendor-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Independent financial evaluation of the named vendor: audited accounts, credit-rating evidence, or equivalent third-party assessment.',
  },
  {
    id: 'ART-SOLE-DD-02',
    label: 'Security Attestation Pack',
    stageId: 'Single-Vendor-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Current SOC 2 Type II (or equivalent) attestation, plus any sector-specific attestations required by the contracting organisation.',
  },
  {
    id: 'ART-SOLE-DD-03',
    label: 'Reference Call Notes',
    stageId: 'Single-Vendor-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Structured notes from at least 2 independent reference calls. References should not be drawn exclusively from the vendor-supplied list.',
  },
  {
    id: 'ART-SOLE-DD-04',
    label: 'Capability Validation Evidence',
    stageId: 'Single-Vendor-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Demonstrated evidence that the vendor can perform the specific scope: case studies, prior delivery references, technical proof points, or pilot results.',
  },
  {
    id: 'ART-SOLE-DD-05',
    label: 'Conflict-of-Interest Declaration',
    stageId: 'Single-Vendor-DD',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Declarations from sourcing team members and decision-makers confirming no undisclosed relationships with the named vendor.',
  },
  {
    id: 'ART-SOLE-NEG-01',
    label: 'External Pricing Benchmark File',
    stageId: 'Negotiate',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Benchmark file assembled before negotiation: prior contract pricing, published market rates, analyst pricing data, or comparable awards. Dated to confirm assembly preceded negotiation.',
  },
  {
    id: 'ART-SOLE-NEG-02',
    label: 'Negotiation Position Paper',
    stageId: 'Negotiate',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Internal position paper naming target pricing, walkaway thresholds, key term concessions, and benchmarking obligations to embed in the contract.',
  },
  {
    id: 'ART-SOLE-NEG-03',
    label: 'Term Sheet (Negotiated)',
    stageId: 'Negotiate',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Negotiated term sheet covering pricing, term length, exit provisions, and the post-award benchmarking and adjustment clause.',
  },
  {
    id: 'ART-SOLE-APP-01',
    label: 'Competition-Exemption Approval',
    stageId: 'Approve',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Signed approval memorandum from the procurement governance authority of last resort, citing the justification, negotiated terms, and benchmark evidence.',
  },
  {
    id: 'ART-SOLE-APP-02',
    label: 'Risk Acceptance Statement',
    stageId: 'Approve',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Documented acknowledgement of the residual risks of single-vendor commitment (lock-in, no competitive benchmark at award, dependency concentration) and mitigations agreed.',
  },
  {
    id: 'ART-SOLE-APP-03',
    label: 'Legal Sign-Off on Contract Terms',
    stageId: 'Approve',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Legal review email or memo referencing the specific contract version and confirming no material outstanding issues. Required before execution.',
  },
  {
    id: 'ART-SOLE-AWD-01',
    label: 'Executed Contract',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Fully countersigned commercial agreement including the post-award benchmarking and adjustment clause.',
  },
  {
    id: 'ART-SOLE-AWD-02',
    label: 'Post-Award Notice',
    stageId: 'Award',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Published or filed sole-source award notice consistent with transparency obligations. Required where statutory disclosure rules apply; recommended otherwise.',
  },
  {
    id: 'ART-SOLE-AWD-03',
    label: 'Benchmarking Obligation Schedule',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Calendar entry and assigned owner for the post-award benchmarking review, scheduled within the contractually agreed window (typically 12 months).',
  },
];

const SOLE_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-SOLE-001',
    label: 'Vendor Lock-In Claim vs Market Alternative',
    severity: 'high',
    partyA: 'Vendor or sponsor claim of unique capability',
    partyB: 'Market-alternative survey evidence',
    detectionHint:
      'Fires when the sole-source justification asserts that no alternative exists, but the market-alternative survey identifies one or more vendors that could plausibly deliver the scope. Detection keywords: "only vendor", "unique capability", "no alternative", "proprietary technology" appearing in the justification while the survey lists ≥1 candidate that was not formally disqualified.',
    resolutionPath:
      'Require the sponsor to either re-classify the event as competitive (with the surveyed alternatives invited) or to author specific, evidence-backed disqualification reasons for each alternative named in the survey. A justification that names no alternatives is incomplete; one that names alternatives without disqualification reasons is internally inconsistent.',
  },
  {
    id: 'CON-SOLE-002',
    label: 'Pricing Benchmark Gap vs Best-Available Claim',
    severity: 'high',
    partyA: 'Vendor or sponsor claim of best-available pricing',
    partyB: 'External pricing benchmark file',
    detectionHint:
      'Fires when the negotiated pricing is more than 15% above the median of the external benchmark, while the justification or negotiation position paper asserts that the pricing is market-competitive or best-available. Detection keywords: "market rate", "best price", "competitive pricing" appearing alongside benchmark variance >15%.',
    resolutionPath:
      'Require either a renegotiation to bring pricing within the benchmark band or an explicit risk-acceptance statement acknowledging the benchmark variance and the rationale for accepting it (e.g. switching cost, transition risk). Do not allow the contradiction to remain unaddressed in the approval pack.',
  },
  {
    id: 'CON-SOLE-003',
    label: 'Regulatory Basis vs Commercial Convenience',
    severity: 'medium',
    partyA: 'Stated regulatory or contractual basis',
    partyB: 'Underlying commercial driver',
    detectionHint:
      'Fires when the justification cites a regulatory exception (statutory carve-out, IP exclusivity, emergency provision) but the underlying commercial driver appears to be operational convenience or relationship continuity rather than a true regulatory constraint. Detection keywords: "incumbent", "existing relationship", "legacy investment" appearing in the commercial rationale while the regulatory citation is generic or weakly mapped to the specific scope.',
    resolutionPath:
      'Require legal review of the regulatory citation. If the citation does not specifically authorise this scope and vendor, re-author the justification to rest on the genuine commercial driver, and re-route through the appropriate competition-exemption approval rather than a regulatory waiver.',
  },
  {
    id: 'CON-SOLE-004',
    label: 'Single-Reference Account vs Independence Standard',
    severity: 'medium',
    partyA: 'Reference call evidence',
    partyB: 'Sourcing independence standard',
    detectionHint:
      'Fires when all reference calls were drawn from the vendor\'s nominated list or from accounts with a material dependency on the vendor (parent organisation, joint venture, paid advisor). Without competitive tension, sole-source events depend on independent reference evidence; coached references provide false assurance.',
    resolutionPath:
      'Require at least one reference from a publicly verifiable customer relationship (case study, public award, regulatory filing) that was not on the vendor\'s nominated list. If no such reference can be obtained, document the limitation explicitly in the risk acceptance statement.',
  },
];

const SOLE_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-SOLE-001',
    label: 'Justification Drift to Convenience',
    description:
      'The justification document is initially authored on a defensible regulatory or commercial basis, but during negotiation and approval the rationale subtly drifts to operational convenience or sponsor preference. The approver signs a justification that no longer matches the original basis.',
    stages: ['Justify', 'Approve'],
    mitigations: [
      'Version-control the justification document and require approval evidence to reference the specific version.',
      'Require the procurement governance authority to read the original basis, not just the approval summary.',
      'If material edits to the justification are made after Single-Vendor-DD begins, re-route through governance.',
    ],
  },
  {
    id: 'FM-SOLE-002',
    label: 'Benchmark-After-Pricing Anchoring',
    description:
      'The external pricing benchmark is assembled after vendor pricing is on the table, causing the team to unconsciously calibrate the benchmark to validate the offered price rather than to challenge it.',
    stages: ['Negotiate'],
    mitigations: [
      'Enforce the benchmark-pre-negotiation gate as hard with no schedule waiver.',
      'Require benchmark file timestamps to predate the first negotiation session by at least 5 business days.',
      'Have a separate analyst (not the lead negotiator) assemble the benchmark.',
    ],
  },
  {
    id: 'FM-SOLE-003',
    label: 'Post-Award Benchmarking Never Executes',
    description:
      'The contract contains the post-award benchmarking and adjustment clause as required, but no owner is assigned and no calendar entry is created. The benchmarking window passes; the clause becomes a paper protection that was never invoked.',
    stages: ['Award'],
    mitigations: [
      'Require an assigned owner and a scheduled calendar entry as a hard artifact at Award.',
      'Make the benchmarking review part of the contract management workplan, not an optional governance activity.',
      'Track benchmarking-clause execution rate as a sourcing function KPI.',
    ],
  },
  {
    id: 'FM-SOLE-004',
    label: 'Conflict-of-Interest Disclosure Gap',
    description:
      'In sole-source events the absence of competitive tension makes undisclosed relationships between sourcing team members and the named vendor materially more damaging. The team operates without formal conflict-of-interest declarations and a relationship surfaces post-award.',
    stages: ['Justify', 'Single-Vendor-DD', 'Approve'],
    mitigations: [
      'Require formal conflict-of-interest declarations from all sourcing team members and decision-makers.',
      'Re-affirm declarations at the approval stage.',
      'Cross-check declarations against expense data and prior employment records where the contract value warrants.',
    ],
  },
];

export const PAT_SRC_SOLE_001: LifecyclePatternSeed = {
  id: 'PAT-SRC-SOLE-001',
  slug: 'sole-source-direct-award-lifecycle',
  title: 'Sole-Source / Direct Award Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Sole-source events are not a shortcut around competitive procurement; they are a different procurement frame that shifts the integrity burden from competitive scoring onto written justification, independent due diligence, external benchmarking, and a contractually enforced post-award benchmarking obligation. Without that shift, a sole-source award is procurement-as-decoration around a pre-determined commitment.',
  applicability:
    'Apply when an enterprise must commit to a single named vendor without running a competitive event. Most relevant when (a) regulatory or contractual exclusivity authorises a competition waiver, (b) prior IP investment or platform lock-in makes alternative selection economically irrational over the relevant horizon, or (c) the scope falls within a strategic-supplier relationship governed by a master agreement that authorises direct calls. Not appropriate when sole-sourcing is justified only by schedule pressure or sponsor preference; those situations should be re-classified as compressed competitive events or emergency events.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.88,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
    'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-008', 'PAT-SRC-010', 'PAT-SRC-011'],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-SOLE-001', 'CON-SOLE-002'],
  body: `## What Sole-Source Means

A sole-source — or direct-award — event commits the organisation to a named vendor without running a competitive process. The decision rests on a written justification rather than on comparative scoring. Sourcing doctrine treats sole-source events as a higher-burden procurement frame, not a lower-burden one: the absence of competitive tension shifts the integrity burden from the scoring matrix onto the justification document, the due diligence file, the external benchmark, and the post-award benchmarking obligation. A sole-source event that omits any of these substitutes is procurement-as-decoration around a pre-determined commercial commitment.

## When Sole-Source Is the Right Frame

Three conditions justify a sole-source frame. The first is regulatory or contractual exclusivity: a statutory carve-out, an IP-exclusive supplier, or a contractual provision in an existing master agreement that authorises direct calls. The second is genuine market singularity: where credible market-alternative surveys consistently produce no viable second source for the specific scope. The third is where prior IP or platform investment makes alternative selection economically irrational over the relevant horizon — typically when integration switching costs would exceed any plausible commercial benefit from re-competition. None of these conditions is satisfied by schedule pressure or sponsor preference; those drivers should re-route the event into a compressed competitive frame or, if the trigger is a genuine crisis, into the Emergency lifecycle pattern.

## The Justification Is the Foundation

The written justification is the integrity foundation of the entire event. It must establish two distinct things: the regulatory or contractual basis for waiving competition, and the commercial rationale for the specific vendor. Justifications that conflate these — that argue "the incumbent has done good work" as both the regulatory basis and the commercial rationale — collapse under external review because the regulatory basis is doing no work. The justification must also document the structured market-alternative survey: the alternatives considered and the specific reason each was rejected. A justification that names no alternatives cannot rebut a future challenge that the market was not surveyed; one that names alternatives without disqualification reasons is internally inconsistent.

## Without Competitive Tension, Benchmarks Replace Bids

In competitive events, pricing discipline arises from the bids themselves: the lowest credible bid anchors the negotiation, and the BAFO process compresses the field. In sole-source events, no such anchor exists. External benchmarks must replace competitive bids as the pricing-discipline mechanism. Benchmarks may include prior contract pricing, published market rate cards, analyst pricing data, or comparable public-sector awards. Critically, the benchmark must be assembled before negotiation begins — typically at least 5 business days ahead of the first negotiation session — because benchmarks assembled after vendor pricing is on the table are anchored to the vendor-led numbers. The contract must then embed a post-award benchmarking and adjustment clause: a contractual obligation to verify, within a defined window, that the agreed pricing remains market-aligned, with an adjustment mechanism if it does not. Without this clause the benchmarking obligation has no commercial enforcement.

## Co-Application with Knowledge Patterns

This lifecycle co-applies most strongly with PAT-SRC-010 (Vendor-Claim Verification Protocol), because in the absence of competitive scoring every vendor claim must be independently triangulated; with PAT-SRC-008 (Vendor Price Benchmarking and Variance Normalization), because the external benchmark file is the principal pricing-discipline mechanism in this frame; and with PAT-SRC-011 (Selection Committee Governance Cadence), because the competition-exemption approval is the single most important governance event in the lifecycle and must follow the same rigour as a competitive selection committee. Where the sole-source event is itself the result of an emergency trigger, this lifecycle co-applies with PAT-SRC-EMERGENCY-001, with the Emergency lifecycle\'s Backfill-Governance stage absorbing the post-fact benchmarking obligation.`,

  kind: 'lifecycle',
  patternId: 'PAT-SRC-SOLE-001',
  stages: SOLE_STAGES,
  gateCriteria: SOLE_GATE_CRITERIA,
  expectedArtifacts: SOLE_EXPECTED_ARTIFACTS,
  contradictionTemplates: SOLE_CONTRADICTION_TEMPLATES,
  failureModes: SOLE_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-008', // Vendor Price Benchmarking and Variance Normalization
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-011', // Selection Committee Governance Cadence
  ],
  typicalDurationDays: { min: 21, max: 75 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-FRAMEWORK-001  —  Framework Call-Off Lifecycle
// ---------------------------------------------------------------------------

const FRAMEWORK_STAGES: LifecycleStage[] = [
  {
    id: 'Eligibility-Check',
    label: 'Eligibility Check',
    description:
      'Confirm that the framework is currently valid, that the requirement falls within the framework\'s scope, and that the contracting organisation is an authorised user of the framework. Identify the specific lot or category that governs the requirement and validate the call-off mechanism (direct award vs mini-tender) prescribed by the framework rules.',
    order: 1,
  },
  {
    id: 'Mini-Tender',
    label: 'Mini-Tender',
    description:
      'Where the framework prescribes a competitive call-off, run the mini-tender among lot-eligible suppliers. The mini-tender must use the framework\'s prescribed evaluation criteria categories and may not introduce criteria that were not part of the original framework procurement.',
    order: 2,
  },
  {
    id: 'Evaluation',
    label: 'Evaluation',
    description:
      'Score mini-tender responses against the framework-permitted evaluation criteria. Where the framework authorises direct award, document the rationale for the chosen supplier against the framework\'s direct-award criteria. Maintain audit-trail evidence sufficient to satisfy framework governance.',
    order: 3,
  },
  {
    id: 'Award',
    label: 'Award',
    description:
      'Issue the call-off contract under the framework\'s terms. Call-off terms may not deviate materially from the framework agreement; any deviation requires either framework-owner approval or re-classification of the event outside the framework.',
    order: 4,
  },
  {
    id: 'Execute',
    label: 'Execute',
    description:
      'Execute the call-off contract instruments. The contract incorporates the framework agreement by reference and adds call-off-specific schedules (scope, pricing, timeline). Notification to the framework owner is required for many frameworks.',
    order: 5,
  },
  {
    id: 'Mobilize',
    label: 'Mobilize',
    description:
      'Stand up the call-off engagement: governance cadence, performance reporting, and any framework-mandated reporting obligations to the framework owner. For framework call-offs that aggregate into a framework-wide spend report, the contracting organisation has a reporting duty to the framework owner.',
    order: 6,
  },
];

const FRAMEWORK_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-FRAME-EL-01',
    description: 'Framework currently valid (not expired, not under suspension)',
    gateType: 'hard',
    stageId: 'Mini-Tender',
    evaluationHint:
      'The framework agreement\'s validity end-date must be confirmed against the framework owner\'s register. Frameworks that have entered an extension period should be checked specifically: some extensions are for run-off only, not new call-offs.',
  },
  {
    id: 'GATE-FRAME-EL-02',
    description: 'Requirement falls within the framework\'s declared scope',
    gateType: 'hard',
    stageId: 'Mini-Tender',
    evaluationHint:
      'The requirement must map cleanly to the framework\'s scope description. Stretching scope to fit the framework is a governance breach and creates challenge exposure from suppliers excluded at framework procurement.',
  },
  {
    id: 'GATE-FRAME-EL-03',
    description: 'Contracting organisation is an authorised user of the framework',
    gateType: 'hard',
    stageId: 'Mini-Tender',
    evaluationHint:
      'Framework user lists are typically published by the framework owner. Confirm that the contracting legal entity is on the user list. Subsidiaries and affiliates are not always covered by parent entity listings.',
  },
  {
    id: 'GATE-FRAME-EL-04',
    description: 'Correct lot identified for the requirement',
    gateType: 'hard',
    stageId: 'Mini-Tender',
    evaluationHint:
      'Multi-lot frameworks segment the supplier pool by lot. The requirement must be matched to the lot whose scope covers it, and only lot-eligible suppliers may be invited to the mini-tender.',
  },
  {
    id: 'GATE-FRAME-MT-01',
    description: 'All lot-eligible suppliers invited to the mini-tender',
    gateType: 'hard',
    stageId: 'Evaluation',
    evaluationHint:
      'Selective invitation that excludes lot-eligible suppliers is a framework governance breach. Where the supplier pool is large, the framework rules typically permit shortlisting on objective lot criteria but not on subjective preferences.',
  },
  {
    id: 'GATE-FRAME-MT-02',
    description: 'Evaluation criteria match those declared in the framework',
    gateType: 'hard',
    stageId: 'Evaluation',
    evaluationHint:
      'Mini-tender criteria must fall within the categories declared in the original framework procurement. Introducing entirely new criteria categories is grounds for challenge from suppliers who would have bid on the framework differently had those criteria been published.',
  },
  {
    id: 'GATE-FRAME-EV-01',
    description: 'Scoring documented per supplier per criterion',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Framework call-offs are subject to challenge from unsuccessful suppliers. Scoring documentation must be sufficient to demonstrate, post-hoc, that the chosen supplier was scored fairly against the framework-permitted criteria.',
  },
  {
    id: 'GATE-FRAME-EV-02',
    description: 'Direct-award rationale documented (where direct award is the call-off mechanism)',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Direct-award call-offs must reference the framework\'s direct-award criteria (e.g. lowest-price-on-framework-rate-card, capability match, geographic coverage) and document how the chosen supplier satisfies them.',
  },
  {
    id: 'GATE-FRAME-AW-01',
    description: 'Call-off terms do not deviate materially from the framework agreement',
    gateType: 'hard',
    stageId: 'Execute',
    evaluationHint:
      'Material deviations include pricing outside the framework rate card, scope outside the framework\'s declared scope, or term length beyond the framework\'s permitted call-off horizon. Material deviations require framework-owner approval or re-classification.',
  },
  {
    id: 'GATE-FRAME-AW-02',
    description: 'Framework-owner notification issued where required',
    gateType: 'soft',
    stageId: 'Execute',
    evaluationHint:
      'Many frameworks require call-off notification to the framework owner for spend aggregation and supplier-performance monitoring. Where required, notification must be issued within the framework\'s prescribed window.',
  },
];

const FRAMEWORK_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-FRAME-EL-01',
    label: 'Framework Validity Confirmation',
    stageId: 'Eligibility-Check',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Evidence that the framework is currently valid, including the validity end-date and any extension or suspension status as published by the framework owner.',
  },
  {
    id: 'ART-FRAME-EL-02',
    label: 'Scope-Match Memo',
    stageId: 'Eligibility-Check',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Memo documenting how the requirement maps to the framework\'s declared scope, with citation to the relevant sections of the framework agreement.',
  },
  {
    id: 'ART-FRAME-EL-03',
    label: 'Authorised-User Confirmation',
    stageId: 'Eligibility-Check',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Confirmation that the contracting legal entity is on the framework\'s authorised-user list.',
  },
  {
    id: 'ART-FRAME-EL-04',
    label: 'Lot Identification',
    stageId: 'Eligibility-Check',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Identification of the framework lot or category that governs the requirement, with rationale for the lot mapping where ambiguity could arise.',
  },
  {
    id: 'ART-FRAME-EL-05',
    label: 'Call-Off Mechanism Determination',
    stageId: 'Eligibility-Check',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Determination of whether the call-off proceeds via mini-tender or direct award, based on the framework\'s rules and the requirement\'s value.',
  },
  {
    id: 'ART-FRAME-MT-01',
    label: 'Lot-Eligible Supplier List',
    stageId: 'Mini-Tender',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Roster of suppliers eligible under the lot, drawn from the framework\'s published supplier register.',
  },
  {
    id: 'ART-FRAME-MT-02',
    label: 'Mini-Tender Invitation Document',
    stageId: 'Mini-Tender',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal invitation to mini-tender with scope schedule, evaluation criteria (drawn from the framework-permitted set), commercial template, and response deadline.',
  },
  {
    id: 'ART-FRAME-MT-03',
    label: 'Supplier Mini-Tender Responses',
    stageId: 'Mini-Tender',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Logged supplier responses with receipt timestamps and completeness check against the response template.',
  },
  {
    id: 'ART-FRAME-EV-01',
    label: 'Mini-Tender Scoring Matrix',
    stageId: 'Evaluation',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Scored evaluation matrix across the framework-permitted criteria. Individual evaluator scores recorded before consensus moderation.',
  },
  {
    id: 'ART-FRAME-EV-02',
    label: 'Direct-Award Rationale',
    stageId: 'Evaluation',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Where direct award is the mechanism, documented rationale referencing the framework\'s direct-award criteria.',
  },
  {
    id: 'ART-FRAME-EV-03',
    label: 'Call-Off Award Memo',
    stageId: 'Evaluation',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Memo recommending the awarded supplier with reference to scoring or direct-award rationale, signed by the sourcing lead and business sponsor.',
  },
  {
    id: 'ART-FRAME-AW-01',
    label: 'Call-Off Contract',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Executed call-off contract incorporating the framework agreement by reference and adding call-off-specific schedules.',
  },
  {
    id: 'ART-FRAME-AW-02',
    label: 'Framework-Compliance Checklist',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Checklist confirming that the call-off does not deviate materially from the framework agreement on pricing, scope, or term.',
  },
  {
    id: 'ART-FRAME-EX-01',
    label: 'Framework-Owner Notification',
    stageId: 'Execute',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Notification to the framework owner of the call-off, where the framework rules require such notification.',
  },
  {
    id: 'ART-FRAME-EX-02',
    label: 'Unsuccessful-Supplier Notification',
    stageId: 'Execute',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal notification to mini-tender participants who were not awarded, including evaluation feedback consistent with framework rules.',
  },
  {
    id: 'ART-FRAME-MO-01',
    label: 'Governance Cadence Schedule',
    stageId: 'Mobilize',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Defined performance review cadence for the call-off, aligned with framework-mandated reporting obligations.',
  },
  {
    id: 'ART-FRAME-MO-02',
    label: 'Framework-Reporting Obligations Register',
    stageId: 'Mobilize',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Register of any framework-mandated reporting obligations (e.g. quarterly spend aggregation, supplier performance feedback) with assigned owners.',
  },
];

const FRAMEWORK_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-FRAME-001',
    label: 'Scope Stretch vs Framework Boundary',
    severity: 'high',
    partyA: 'Requirement scope description',
    partyB: 'Framework declared scope',
    detectionHint:
      'Fires when the requirement description includes elements that fall outside the framework\'s declared scope but the call-off proceeds under the framework anyway. Detection keywords: "additionally", "also includes", "extending to" appearing in the requirement scope while the framework scope citation does not cover the additional elements.',
    resolutionPath:
      'Either narrow the requirement scope to fit the framework, split the requirement into framework-eligible and non-framework portions, or re-classify the event as a competitive procurement outside the framework. Do not allow scope stretch to remain unresolved at award.',
  },
  {
    id: 'CON-FRAME-002',
    label: 'Evaluation Criteria vs Framework-Permitted Set',
    severity: 'high',
    partyA: 'Mini-tender evaluation criteria',
    partyB: 'Framework-permitted criteria categories',
    detectionHint:
      'Fires when the mini-tender evaluation criteria include categories that were not part of the original framework procurement\'s evaluation. This creates challenge exposure from framework suppliers who would have bid differently had the new criteria been declared at framework procurement.',
    resolutionPath:
      'Map each mini-tender criterion to a framework-permitted category. Remove or re-base any criterion that does not map. If the genuine evaluation need cannot be met within the framework-permitted set, the procurement should run outside the framework.',
  },
  {
    id: 'CON-FRAME-003',
    label: 'Selective Invitation vs Lot-Eligibility',
    severity: 'medium',
    partyA: 'Mini-tender invitee list',
    partyB: 'Lot-eligible supplier register',
    detectionHint:
      'Fires when the mini-tender invitee list excludes lot-eligible suppliers without an objective shortlisting basis. Detection keywords: "selected from", "preferred suppliers", "based on prior performance" appearing as the basis for invitation while the framework rules require all lot-eligible suppliers to be invited.',
    resolutionPath:
      'Either invite all lot-eligible suppliers or document an objective shortlisting basis (e.g. lot sub-category, geographic coverage, certification level) that is consistent with framework rules. Subjective preferences are not a permitted shortlisting basis.',
  },
  {
    id: 'CON-FRAME-004',
    label: 'Call-Off Pricing vs Framework Rate Card',
    severity: 'medium',
    partyA: 'Call-off contract pricing',
    partyB: 'Framework rate card',
    detectionHint:
      'Fires when the call-off contract pricing exceeds the framework rate card for the relevant role categories. Some frameworks permit competitive call-off pricing below the rate card but treat the rate card as a ceiling; others require pricing exactly at the rate card.',
    resolutionPath:
      'Re-base the call-off pricing to be at or below the framework rate card. If the supplier insists on pricing above the rate card, the call-off cannot proceed under the framework and must be re-classified.',
  },
];

const FRAMEWORK_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-FRAME-001',
    label: 'Expired-Framework Call-Off',
    description:
      'A call-off is initiated against a framework that has expired or entered a run-off-only extension period. The award is procedurally invalid and creates challenge exposure.',
    stages: ['Eligibility-Check', 'Award'],
    mitigations: [
      'Treat framework-validity confirmation as a hard gate at Eligibility-Check.',
      'Maintain a framework-validity register that is refreshed at least monthly.',
      'For long-running mini-tenders, re-confirm validity at Award if the framework end-date is approaching.',
    ],
  },
  {
    id: 'FM-FRAME-002',
    label: 'Scope-Stretch Award',
    description:
      'The requirement scope is broader than the framework\'s declared scope, but the team proceeds under the framework anyway because the alternative (a separate competitive procurement) would miss the timeline.',
    stages: ['Eligibility-Check', 'Award'],
    mitigations: [
      'Require the scope-match memo to cite specific framework scope sections.',
      'Where scope stretches, split the requirement into framework-eligible and non-framework portions.',
      'Treat schedule pressure as an indicator that the right frame may be a compressed competitive procurement, not a framework call-off.',
    ],
  },
  {
    id: 'FM-FRAME-003',
    label: 'Selective Invitation Without Objective Basis',
    description:
      'The mini-tender is run with a subset of lot-eligible suppliers based on prior relationships or sponsor preference, rather than on an objective lot-eligibility basis. The award becomes vulnerable to challenge from excluded suppliers.',
    stages: ['Mini-Tender'],
    mitigations: [
      'Default to inviting all lot-eligible suppliers unless an objective shortlisting basis is documented.',
      'Document the shortlisting basis with citation to the framework rules.',
      'Maintain an unsuccessful-invitee feedback log to surface challenge risks early.',
    ],
  },
  {
    id: 'FM-FRAME-004',
    label: 'Material Deviation in Call-Off Terms',
    description:
      'Call-off contract negotiations introduce pricing, scope, or term provisions that deviate materially from the framework agreement. The deviation is not surfaced to the framework owner and is discovered later in audit.',
    stages: ['Award', 'Execute'],
    mitigations: [
      'Require a framework-compliance checklist as a hard artifact at Award.',
      'Route material deviations through framework-owner approval before execution.',
      'Train negotiators on the difference between framework terms (the ceiling) and call-off terms (the floor).',
    ],
  },
];

export const PAT_SRC_FRAMEWORK_001: LifecyclePatternSeed = {
  id: 'PAT-SRC-FRAMEWORK-001',
  slug: 'framework-call-off-lifecycle',
  title: 'Framework Call-Off Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Framework call-offs deliver speed and pre-validated supplier pools, but only when the contracting organisation respects the boundaries the framework imposes: the framework\'s declared scope, the lot-eligible supplier set, the evaluation-criteria category permissions, and the call-off mechanism (mini-tender or direct award) prescribed by the framework rules. Each of these boundaries is a competition-integrity protection earned at framework procurement and forfeited if breached at call-off.',
  applicability:
    'Apply when a requirement can be satisfied through an existing framework agreement to which the contracting organisation is an authorised user. Most relevant for technology, professional services, and managed services that map cleanly to a framework lot. Not appropriate when the requirement is broader than any single framework\'s scope, when the contracting organisation is not on the framework\'s authorised-user list, or when the framework has expired or entered a run-off-only extension period.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.86,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-007', 'PAT-SRC-010', 'PAT-SRC-011'],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-FRAME-001', 'CON-FRAME-002'],
  body: `## What a Framework Call-Off Is

A framework call-off is a sourcing event executed under an existing framework agreement, in which the framework owner has already pre-qualified a pool of suppliers and pre-negotiated baseline commercial and contractual terms. The contracting organisation runs a call-off — either a competitive mini-tender among framework suppliers or a direct award to a named framework supplier — within the boundaries the framework imposes. Frameworks are widely used in public-sector procurement, in cross-organisation buying consortia, and increasingly in large enterprises with strategic-supplier panels.

## Why the Framework Boundary Matters

The boundaries a framework imposes — declared scope, lot-eligible supplier sets, permitted evaluation-criteria categories, prescribed call-off mechanism — are not administrative artefacts. They are competition-integrity protections earned at framework procurement: the suppliers who bid on the framework relied on those boundaries to model their bids and to invest in framework qualification. Breaching the boundaries at call-off forfeits those protections and creates challenge exposure from framework suppliers who would have bid differently had the breached boundary been declared at framework procurement. The most common breaches are scope stretch (the requirement is broader than the framework\'s declared scope), selective invitation (the mini-tender excludes lot-eligible suppliers without an objective basis), and criteria innovation (the mini-tender introduces evaluation criteria categories that were not part of the framework procurement). Each of these is a procurement governance breach, not an efficiency.

## The Mini-Tender Discipline

Where the framework prescribes a competitive call-off, the mini-tender must follow the same governance disciplines as a standalone competitive procurement, but with additional framework-specific constraints. Evaluation criteria must fall within the framework-permitted set; weights must be locked before any supplier engagement; scope must be frozen at Q&A close; and individual evaluator scoring must precede consensus moderation. The unsuccessful-supplier notification obligation is heightened in framework call-offs because excluded suppliers have a continuing relationship with the framework owner and a structured channel for challenge. Sourcing doctrine treats the mini-tender as a higher-discipline event than a standalone RFP because the failure modes are not just commercial; they include framework-owner sanctions and reputational exposure with strategic suppliers.

## The Direct-Award Path

Where the framework authorises direct award — typically for low-value call-offs against a published rate card, or for first-call rotation — the integrity burden shifts to the direct-award rationale. The rationale must reference the framework\'s direct-award criteria explicitly: lowest-price-on-rate-card, lot sub-category match, geographic coverage, certification level, or whatever criteria the framework prescribes. A direct-award rationale that asserts only "preferred supplier" or "prior good performance" is procedurally weak even if substantively defensible, because it does not tie the choice to the framework\'s declared direct-award criteria.

## Co-Application with Knowledge Patterns

This lifecycle co-applies most strongly with PAT-SRC-007 (Vendor BAFO Scoring Rubric), which is adapted for the mini-tender scoring stage; with PAT-SRC-010 (Vendor-Claim Verification Protocol), which still applies even within a pre-qualified supplier pool because supplier claims at mini-tender frequently exceed framework qualification scope; and with PAT-SRC-011 (Selection Committee Governance Cadence), where the call-off award memo follows the same governance pathway as a standalone selection memo. The lifecycle also commonly co-applies with PAT-SRC-RENEWAL-001 when the call-off is itself a renewal of a prior call-off engagement, in which case both lifecycles run in parallel.`,

  kind: 'lifecycle',
  patternId: 'PAT-SRC-FRAMEWORK-001',
  stages: FRAMEWORK_STAGES,
  gateCriteria: FRAMEWORK_GATE_CRITERIA,
  expectedArtifacts: FRAMEWORK_EXPECTED_ARTIFACTS,
  contradictionTemplates: FRAMEWORK_CONTRADICTION_TEMPLATES,
  failureModes: FRAMEWORK_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-003', // Ten-Stage Sourcing Event Governance
    'PAT-SRC-007', // Vendor BAFO Scoring Rubric
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-011', // Selection Committee Governance Cadence
  ],
  typicalDurationDays: { min: 30, max: 90 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-RENEWAL-001  —  Contract Renewal / Re-Tender Lifecycle
// ---------------------------------------------------------------------------

const RENEWAL_STAGES: LifecycleStage[] = [
  {
    id: 'Performance-Review',
    label: 'Performance Review',
    description:
      'Evaluate the incumbent\'s performance over the contract term against contracted SLAs, agreed KPIs, and the original commercial expectations. Performance evidence — not relationship continuity — is the primary input to the renew-vs-re-tender decision. Review must include incident history, escalation patterns, change-control behaviour, and any contract-credit invocations.',
    order: 1,
  },
  {
    id: 'Market-Test',
    label: 'Market Test',
    description:
      'Conduct a structured market test to refresh the comparison set against the incumbent. This is the re-test obligation that distinguishes a defensible renewal from automatic continuation. The market test does not require a full RFP; it does require sufficient evidence to determine whether the incumbent\'s pricing and capability remain competitive.',
    order: 2,
  },
  {
    id: 'Negotiate-Terms',
    label: 'Negotiate Terms',
    description:
      'Negotiate renewal terms anchored on the market test evidence and the performance review. Pricing escalators must be capped on a defensible basis (typically CPI + a delta tied to cost-driver indices). Exit-readiness obligations must be reaffirmed or strengthened: data-return formats, knowledge-transfer commitments, and exit assistance scope.',
    order: 3,
  },
  {
    id: 'Renew-or-Retender',
    label: 'Renew-or-Re-Tender Decision',
    description:
      'Make the explicit decision: renew on negotiated terms, or re-tender via the appropriate competitive lifecycle. The decision must rest on the documented evidence from the prior stages, not on default-to-renewal momentum. A "renew" decision must include named conditions; a "re-tender" decision must include the lifecycle path (RFP, framework call-off, AMS, etc.).',
    order: 4,
  },
  {
    id: 'Approval',
    label: 'Approval',
    description:
      'Obtain formal approval for the chosen path. For renewal, the approval must reference the performance review, market test, and negotiated terms. For re-tender, approval triggers initiation of the appropriate competitive lifecycle and confirms the incumbent\'s exit-readiness obligations.',
    order: 5,
  },
  {
    id: 'Execute',
    label: 'Execute',
    description:
      'Execute the renewal contract instruments or initiate the re-tender event. Renewal execution requires updated commercial schedules; re-tender initiation requires formal notice to the incumbent and confirmation of exit-readiness milestones.',
    order: 6,
  },
  {
    id: 'Onboard-Changes',
    label: 'Onboard Changes',
    description:
      'For renewals, onboard any term changes: revised governance cadence, updated KPI targets, refreshed escalation paths, and new commercial reporting requirements. For re-tenders, this stage is replaced by the initiation milestones of the chosen competitive lifecycle.',
    order: 7,
  },
];

const RENEWAL_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-REN-PR-01',
    description: 'Documented performance review covering full contract term',
    gateType: 'hard',
    stageId: 'Market-Test',
    evaluationHint:
      'The performance review must cover the entirety of the current contract term, not just the most recent performance period. Recency bias commonly distorts renewal decisions; full-term evidence corrects it.',
  },
  {
    id: 'GATE-REN-PR-02',
    description: 'Performance review includes incident, escalation, and contract-credit history',
    gateType: 'hard',
    stageId: 'Market-Test',
    evaluationHint:
      'Aggregate KPI performance data is insufficient. The review must include incident-level history, escalation events, and any contract-credit invocations. These signal vendor behaviour under stress more than aggregate metrics do.',
  },
  {
    id: 'GATE-REN-MT-01',
    description: 'Market test executed before negotiation begins',
    gateType: 'hard',
    stageId: 'Negotiate-Terms',
    evaluationHint:
      'The market test must be assembled before incumbent renewal pricing is on the table. Market tests run in parallel with negotiation are anchored to incumbent numbers and lose their disciplining effect.',
  },
  {
    id: 'GATE-REN-MT-02',
    description: 'Market test includes at least 3 alternative supplier price/capability points',
    gateType: 'hard',
    stageId: 'Negotiate-Terms',
    evaluationHint:
      'Market test evidence may include indicative quotes, recent comparable awards, analyst pricing data, or framework rate card comparisons. At least 3 distinct alternative reference points are required for the test to discipline pricing.',
  },
  {
    id: 'GATE-REN-NT-01',
    description: 'Pricing escalator capped on a documented basis',
    gateType: 'hard',
    stageId: 'Renew-or-Retender',
    evaluationHint:
      'Escalator caps must reference an external index or basis (CPI, sector-specific cost index, FTE-rate index). Uncapped escalators or escalators tied to vendor-controlled indices fail this gate.',
  },
  {
    id: 'GATE-REN-NT-02',
    description: 'Exit-readiness obligations affirmed or strengthened in renewal terms',
    gateType: 'hard',
    stageId: 'Renew-or-Retender',
    evaluationHint:
      'Renewal is the natural moment to strengthen exit-readiness: data-return formats, knowledge-transfer obligations, exit assistance scope, and IP-transfer commitments. Renewal terms that weaken or omit exit obligations fail this gate.',
  },
  {
    id: 'GATE-REN-DEC-01',
    description: 'Renew-vs-re-tender decision documented with named rationale',
    gateType: 'hard',
    stageId: 'Approval',
    evaluationHint:
      'The decision document must name the rationale: "renew because performance is strong and market test confirms competitiveness", or "re-tender because performance gaps justify market replacement". Default-to-renewal without rationale fails this gate.',
  },
  {
    id: 'GATE-REN-AP-01',
    description: 'Approval references performance review, market test, and negotiated terms',
    gateType: 'hard',
    stageId: 'Execute',
    evaluationHint:
      'The approval evidence (memo, committee minutes, or sponsor sign-off) must cite all three inputs. Approval that references only the negotiated commercial summary is procedurally weak.',
  },
  {
    id: 'GATE-REN-EX-01',
    description: 'For re-tender path: exit-readiness milestones confirmed with incumbent',
    gateType: 'hard',
    stageId: 'Onboard-Changes',
    evaluationHint:
      'Where the decision is to re-tender, the incumbent must confirm exit-readiness milestones (data return, KT, IP transfer, residual liability) before the competitive lifecycle advances to award. Without this confirmation, re-tender risks gap-of-service.',
  },
];

const RENEWAL_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-REN-PR-01',
    label: 'Performance Review Report',
    stageId: 'Performance-Review',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Full-term performance evaluation against contracted SLAs, agreed KPIs, and original commercial expectations.',
  },
  {
    id: 'ART-REN-PR-02',
    label: 'Incident and Escalation History',
    stageId: 'Performance-Review',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Incident-level history including severity, duration, response times, and any contract-credit invocations.',
  },
  {
    id: 'ART-REN-PR-03',
    label: 'Stakeholder Feedback Summary',
    stageId: 'Performance-Review',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Structured feedback from business stakeholders, operational owners, and governance committee members on the incumbent\'s performance.',
  },
  {
    id: 'ART-REN-PR-04',
    label: 'Contract-Credit Register',
    stageId: 'Performance-Review',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Register of any contract-credit invocations during the contract term, including invocation rationale and remediation outcomes.',
  },
  {
    id: 'ART-REN-MT-01',
    label: 'Market Test Methodology',
    stageId: 'Market-Test',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Documented methodology for the market test: comparator selection criteria, evidence sources, and pricing normalisation approach.',
  },
  {
    id: 'ART-REN-MT-02',
    label: 'Market Test Evidence Pack',
    stageId: 'Market-Test',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Assembled evidence: indicative quotes, comparable awards, analyst pricing data, or framework rate card comparisons. At least 3 alternative reference points.',
  },
  {
    id: 'ART-REN-MT-03',
    label: 'Comparative Pricing Analysis',
    stageId: 'Market-Test',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Analysis comparing incumbent pricing to market test evidence on a normalised basis.',
  },
  {
    id: 'ART-REN-NT-01',
    label: 'Negotiation Position Paper',
    stageId: 'Negotiate-Terms',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Internal position paper anchoring negotiation on the performance review and market test evidence.',
  },
  {
    id: 'ART-REN-NT-02',
    label: 'Pricing Escalator Cap Memo',
    stageId: 'Negotiate-Terms',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Memo documenting the proposed pricing escalator cap, the index or basis it references, and the cap calculation.',
  },
  {
    id: 'ART-REN-NT-03',
    label: 'Exit-Readiness Schedule',
    stageId: 'Negotiate-Terms',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Schedule of exit-readiness obligations: data-return formats, knowledge-transfer commitments, exit assistance scope, IP-transfer provisions.',
  },
  {
    id: 'ART-REN-DEC-01',
    label: 'Renew-or-Re-Tender Decision Memo',
    stageId: 'Renew-or-Retender',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Decision memo naming the chosen path, the rationale anchored on performance and market test evidence, and any conditions attached.',
  },
  {
    id: 'ART-REN-AP-01',
    label: 'Approval Evidence',
    stageId: 'Approval',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Approval memo or committee minutes referencing the performance review, market test, and negotiated terms.',
  },
  {
    id: 'ART-REN-EX-01',
    label: 'Renewal Contract or Re-Tender Initiation Notice',
    stageId: 'Execute',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Either the executed renewal contract or the formal re-tender initiation notice issued to the incumbent.',
  },
  {
    id: 'ART-REN-EX-02',
    label: 'Updated Governance Cadence',
    stageId: 'Execute',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'For renewals: updated governance cadence reflecting the new term length and any agreed reporting changes.',
  },
  {
    id: 'ART-REN-OC-01',
    label: 'Term-Change Onboarding Plan',
    stageId: 'Onboard-Changes',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'For renewals: onboarding plan for any term changes (KPI targets, escalation paths, commercial reporting).',
  },
  {
    id: 'ART-REN-OC-02',
    label: 'Exit-Readiness Confirmation (Re-Tender Path)',
    stageId: 'Onboard-Changes',
    requirement: 'required',
    gateType: 'hard',
    description:
      'For re-tender: incumbent confirmation of exit-readiness milestones aligned with the competitive lifecycle\'s award date.',
  },
];

const RENEWAL_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-REN-001',
    label: 'Stated Performance vs Incident History',
    severity: 'high',
    partyA: 'Vendor or sponsor performance summary',
    partyB: 'Incident, escalation, and contract-credit history',
    detectionHint:
      'Fires when the high-level performance summary asserts strong service quality but the incident-level history shows ≥2 SLA breaches, escalation events, or contract-credit invocations in the prior 12 months that are not surfaced in the summary. Detection keywords: "strong performance", "no material issues", "high satisfaction" appearing alongside incident-history evidence to the contrary.',
    resolutionPath:
      'Require the performance review to explicitly reference and reconcile the incident history. The summary statement and the incident evidence must be consistent or the discrepancy must be named and explained.',
  },
  {
    id: 'CON-REN-002',
    label: 'Renewal Pricing vs Market Test Evidence',
    severity: 'high',
    partyA: 'Negotiated renewal pricing',
    partyB: 'Market test evidence',
    detectionHint:
      'Fires when the negotiated renewal pricing is more than 12% above the median of the market test evidence on a normalised basis. Detection keywords: "fair value", "competitive renewal", "below market" appearing in the negotiation summary while the comparative pricing analysis shows variance >12%.',
    resolutionPath:
      'Require either further negotiation to bring pricing within band, an explicit risk-acceptance statement naming the rationale for accepting the variance (e.g. switching cost, transition risk), or a re-tender decision.',
  },
  {
    id: 'CON-REN-003',
    label: 'Escalator Cap vs External Index',
    severity: 'medium',
    partyA: 'Negotiated pricing escalator',
    partyB: 'External index referenced',
    detectionHint:
      'Fires when the escalator cap is described as CPI-tied or index-tied but the actual cap calculation is materially divergent from the named index over plausible scenarios. This commonly arises when the escalator floor is high enough that the index linkage is illusory.',
    resolutionPath:
      'Recalculate the escalator cap under stress scenarios. Require the cap to bind under at least 50% of plausible scenarios; otherwise the index linkage is decoration.',
  },
  {
    id: 'CON-REN-004',
    label: 'Exit-Readiness Obligations vs Renewal Term Length',
    severity: 'medium',
    partyA: 'Exit-readiness schedule',
    partyB: 'Renewal term length and exit-cost provisions',
    detectionHint:
      'Fires when the renewal term length increases significantly while exit-readiness obligations are weakened or unchanged. Longer terms with weaker exit obligations indicate that the renewal is increasing lock-in rather than reducing it.',
    resolutionPath:
      'Renegotiate exit-readiness obligations to be at least as strong as the prior contract, with stronger obligations where the term length has increased. Renewal is the natural moment to strengthen exit-readiness.',
  },
];

const RENEWAL_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-REN-001',
    label: 'Default-to-Renewal Without Re-Test',
    description:
      'The renewal proceeds without a structured market test. Pricing is renegotiated against incumbent positions only, losing the disciplining effect of comparison. Over multiple renewal cycles the cumulative pricing drift can be material.',
    stages: ['Market-Test', 'Negotiate-Terms'],
    mitigations: [
      'Treat the market test as a hard gate at every renewal regardless of relationship strength.',
      'Require at least 3 alternative reference points in the market test evidence pack.',
      'Track the cumulative price/index ratio across multiple renewal cycles and flag drift.',
    ],
  },
  {
    id: 'FM-REN-002',
    label: 'Recency Bias in Performance Review',
    description:
      'The performance review focuses on the most recent performance period rather than the full contract term. Recent strong performance can mask a pattern of earlier issues and remediation.',
    stages: ['Performance-Review'],
    mitigations: [
      'Require full-term performance evidence as a hard gate.',
      'Include stakeholders who were involved at contract start, not just current operators.',
      'Surface the incident-level history as a distinct artefact, not merged into the aggregate performance summary.',
    ],
  },
  {
    id: 'FM-REN-003',
    label: 'Escalator Erosion',
    description:
      'Pricing escalator caps weaken across successive renewals, either because the index basis shifts or because the cap floor rises. The cumulative effect over multiple renewal cycles is significant pricing drift above the relevant cost-driver index.',
    stages: ['Negotiate-Terms'],
    mitigations: [
      'Treat escalator cap negotiation as a renewal-cycle KPI, tracked across cycles.',
      'Require the escalator cap to reference the same index basis as the prior renewal unless a deliberate change is documented.',
      'Stress-test the cap under plausible scenarios before agreeing.',
    ],
  },
  {
    id: 'FM-REN-004',
    label: 'Exit-Readiness Erosion',
    description:
      'Exit-readiness obligations are weakened in renewal negotiations because they are not high-priority for either party at the moment of renewal. The cumulative effect over multiple renewals is that exit becomes increasingly difficult.',
    stages: ['Negotiate-Terms'],
    mitigations: [
      'Treat exit-readiness obligations as a hard renewal gate, not a negotiable concession.',
      'Track exit-readiness obligations across renewal cycles to surface drift.',
      'Make the exit-readiness schedule a distinct contract schedule, not buried in general terms.',
    ],
  },
  {
    id: 'FM-REN-005',
    label: 'Re-Tender Decision Without Exit-Readiness Confirmation',
    description:
      'A re-tender decision is made and the competitive lifecycle is initiated, but exit-readiness milestones with the incumbent are not confirmed. The re-tender award lands but the incumbent\'s exit creates service gaps or contested data return.',
    stages: ['Approval', 'Execute', 'Onboard-Changes'],
    mitigations: [
      'Treat exit-readiness confirmation as a hard gate before the competitive lifecycle advances to award.',
      'Run the exit-readiness workstream in parallel with the competitive lifecycle, not after award.',
      'Co-apply PAT-SRC-DECOM-001 from the moment the re-tender decision is taken.',
    ],
  },
];

export const PAT_SRC_RENEWAL_001: LifecyclePatternSeed = {
  id: 'PAT-SRC-RENEWAL-001',
  slug: 'contract-renewal-retender-lifecycle',
  title: 'Contract Renewal / Re-Tender Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Contract renewals are the most frequently abused sourcing event in the enterprise: relationship continuity and operational comfort generate momentum toward default-to-renewal, and the procurement governance disciplines that would protect commercial value are routinely bypassed. A defensible renewal rests on a full-term performance review, a structured market re-test executed before negotiation, escalator caps anchored on external indices, and a deliberate renew-or-re-tender decision documented with named rationale.',
  applicability:
    'Apply at the renewal point of any material contract — managed services, technology platforms, professional services frameworks, or outsourcing arrangements. Most relevant when (a) the contract has a renewal option that requires affirmative exercise, (b) the contract has expired or is approaching expiry without auto-renewal, or (c) the contract has an auto-renewal clause but a renewal review is governance-mandated. Not appropriate for low-value contracts where the cost of running the lifecycle exceeds plausible commercial benefit; for those cases, a lighter renewal review checklist applies.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.89,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: ['PAT-SRC-008', 'PAT-SRC-009', 'PAT-SRC-010', 'PAT-SRC-RFP-001', 'PAT-SRC-DECOM-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-REN-001', 'CON-REN-002'],
  body: `## Why Renewals Are the Hardest Sourcing Event to Govern

Contract renewals are the most frequently abused sourcing event in the enterprise. Relationship continuity, operational comfort, and the absence of a forcing competitive event generate strong momentum toward default-to-renewal. Stakeholders who would resist a weak RFP outcome routinely accept a weak renewal because the renewal feels lower-stakes — a continuation of an existing arrangement rather than a new commitment. Sourcing doctrine treats this momentum as the primary risk to govern. The disciplines that protect commercial value in a competitive event — locked evaluation criteria, scope freeze, independent scoring, sponsor sign-off — must be reconstructed in the renewal lifecycle as performance review, market re-test, escalator cap negotiation, and a deliberate renew-or-re-tender decision.

## The Re-Test Obligation

The market re-test is the disciplining mechanism that distinguishes a defensible renewal from automatic continuation. The test does not require a full RFP — for many renewals that would be disproportionate — but it does require sufficient evidence to determine whether the incumbent\'s pricing and capability remain competitive. Acceptable evidence includes indicative quotes from at least 3 alternative suppliers, recent comparable awards, analyst pricing data, or framework rate card comparisons. The market test must be assembled before negotiation begins, for the same reason that external benchmarks must precede negotiation in sole-source events: tests run after incumbent pricing is on the table are anchored to incumbent numbers and lose their disciplining effect. Where the market test surfaces variance greater than 12% on a normalised basis, the renewal cannot proceed without either further negotiation, an explicit risk-acceptance statement, or a re-tender decision.

## Escalator Caps and Cumulative Drift

Pricing escalators are the mechanism by which renewal pricing erodes across cycles. An escalator described as CPI-tied is only meaningful if the cap calculation actually binds under plausible scenarios; an escalator with a high floor or a vendor-controlled index is decoration. Sourcing doctrine treats the escalator cap as a multi-cycle KPI: the cumulative price/index ratio across successive renewals must be tracked, and drift must be explained. A single renewal with a 4% escalator may look reasonable; the same escalator over five cycles produces 22% cumulative drift above index, which would not be tolerated in a single competitive event. Renewal governance must surface this cumulative drift, not just the single-cycle delta.

## Exit-Readiness as Renewal Discipline

Renewal is the natural moment to strengthen exit-readiness obligations: the incumbent has commercial incentive to renew and is therefore more amenable to terms that improve the customer\'s exit position. Renewals that weaken exit-readiness — shorter exit-assistance windows, narrower data-return formats, removed IP-transfer obligations — increase lock-in over the renewal term and degrade leverage at the next renewal. Exit-readiness obligations should be tracked across renewal cycles in the same way as escalator caps; cumulative weakening is a governance signal even where each cycle\'s change looks modest.

## The Renew-or-Re-Tender Decision

The lifecycle ends in an explicit decision: renew on negotiated terms, or re-tender via the appropriate competitive lifecycle. The decision must rest on the documented evidence from the prior stages, not on default-to-renewal momentum. A "renew" decision must include named conditions tied to the performance review and market test; a "re-tender" decision must include the lifecycle path (RFP, framework call-off, AMS, etc.) and confirmation of incumbent exit-readiness milestones. Where the re-tender path is chosen, this lifecycle co-applies with PAT-SRC-DECOM-001 from the moment of decision: the incumbent\'s exit cannot be left to discover after the competitive award lands.`,

  kind: 'lifecycle',
  patternId: 'PAT-SRC-RENEWAL-001',
  stages: RENEWAL_STAGES,
  gateCriteria: RENEWAL_GATE_CRITERIA,
  expectedArtifacts: RENEWAL_EXPECTED_ARTIFACTS,
  contradictionTemplates: RENEWAL_CONTRADICTION_TEMPLATES,
  failureModes: RENEWAL_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-008', // Vendor Price Benchmarking and Variance Normalization
    'PAT-SRC-009', // Negotiation Leverage Preservation
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-RFP-001', // Standard RFP Lifecycle (when re-tender path chosen)
    'PAT-SRC-DECOM-001', // Vendor Decommission (when re-tender path chosen)
  ],
  typicalDurationDays: { min: 60, max: 150 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-DECOM-001  —  Vendor Decommission / Exit Lifecycle
// ---------------------------------------------------------------------------

const DECOM_STAGES: LifecycleStage[] = [
  {
    id: 'Notify',
    label: 'Notify',
    description:
      'Issue formal notice of contract termination or non-renewal to the outgoing vendor, consistent with the contract\'s notice provisions. Initiate the exit-assistance regime contemplated by the contract. Confirm the incoming arrangement (replacement vendor, in-house transfer, or service retirement) and the cutover target date.',
    order: 1,
  },
  {
    id: 'Transition-Plan',
    label: 'Transition Plan',
    description:
      'Develop the joint transition plan with the outgoing vendor and the incoming party. The plan must identify all transferring scope elements, name the resources executing each transfer, define completion criteria per element, and align the plan with the cutover target. Sourcing doctrine treats the plan, not the contract, as the operational artefact that determines exit success.',
    order: 2,
  },
  {
    id: 'Knowledge-Transfer',
    label: 'Knowledge Transfer',
    description:
      'Execute the knowledge transfer programme: documentation handover, shadowing periods, joint operations windows, and structured Q&A sessions. KT is the highest-risk stage of decommission because incomplete KT manifests as service quality issues months after cutover, when remediation is hardest.',
    order: 3,
  },
  {
    id: 'Service-Cutover',
    label: 'Service Cutover',
    description:
      'Execute the service cutover from outgoing to incoming party. The cutover plan must include a roll-back option, a stabilisation window, and explicit acceptance criteria. The outgoing vendor remains on call for a contractually defined exit-assistance window.',
    order: 4,
  },
  {
    id: 'Data-Return',
    label: 'Data Return',
    description:
      'Execute the data return programme: data extracts in agreed formats, data destruction certifications for residual copies held by the outgoing vendor, and IP transfer for any vendor-developed assets contracted as customer-owned. Data return is the most legally consequential stage of decommission.',
    order: 5,
  },
  {
    id: 'Contract-Close',
    label: 'Contract Close',
    description:
      'Execute formal contract close: final invoice settlement, exit-assistance hours reconciliation, residual liability release, and archival of contract artefacts for the post-termination retention period. Contract close is the formal record that the decommission is complete and surprises beyond this point are escalations, not operations.',
    order: 6,
  },
];

const DECOM_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-DEC-NO-01',
    description: 'Termination notice issued consistent with contract notice provisions',
    gateType: 'hard',
    stageId: 'Transition-Plan',
    evaluationHint:
      'The notice must follow the form, addressee, and timing prescribed by the contract. Notice defects can give the outgoing vendor grounds to dispute the termination or to invoke compensation provisions.',
  },
  {
    id: 'GATE-DEC-NO-02',
    description: 'Incoming arrangement confirmed before transition plan begins',
    gateType: 'hard',
    stageId: 'Transition-Plan',
    evaluationHint:
      'The replacement vendor, in-house transfer destination, or service retirement plan must be confirmed. A decommission without a confirmed incoming arrangement creates service-gap risk.',
  },
  {
    id: 'GATE-DEC-TP-01',
    description: 'Joint transition plan signed by outgoing vendor, incoming party, and customer',
    gateType: 'hard',
    stageId: 'Knowledge-Transfer',
    evaluationHint:
      'A unilateral transition plan is not sufficient. All three parties must sign because each party has accountability for portions of the plan. Outgoing-vendor cooperation cannot be assumed in the absence of a signed plan.',
  },
  {
    id: 'GATE-DEC-TP-02',
    description: 'Transition plan covers all in-scope service elements with named resources',
    gateType: 'hard',
    stageId: 'Knowledge-Transfer',
    evaluationHint:
      'Coverage must be comprehensive. A plan with named gaps is preferable to a plan with implicit gaps; surfacing gaps is the value of the planning stage.',
  },
  {
    id: 'GATE-DEC-KT-01',
    description: 'KT completion sign-off per service domain',
    gateType: 'hard',
    stageId: 'Service-Cutover',
    evaluationHint:
      'Per-domain sign-off is required, not a single aggregate sign-off. Aggregate sign-off masks domain-specific gaps that surface as incidents post-cutover.',
  },
  {
    id: 'GATE-DEC-CO-01',
    description: 'Cutover acceptance criteria met across all in-scope services',
    gateType: 'hard',
    stageId: 'Data-Return',
    evaluationHint:
      'Acceptance criteria must be tested, not assumed. Cutover proceeding under the assumption that services are functioning rather than on tested evidence creates significant post-cutover incident risk.',
  },
  {
    id: 'GATE-DEC-CO-02',
    description: 'Stabilisation window observed before declaring cutover complete',
    gateType: 'soft',
    stageId: 'Data-Return',
    evaluationHint:
      'A stabilisation window of at least 5 business days is recommended for material services. Shorter windows are acceptable with documented sponsor risk acceptance.',
  },
  {
    id: 'GATE-DEC-DR-01',
    description: 'Data return certification provided by outgoing vendor',
    gateType: 'hard',
    stageId: 'Contract-Close',
    evaluationHint:
      'The certification must be specific: data sets returned, formats used, residual data destroyed, and the destruction methodology employed. Generic certifications without specifics are insufficient.',
  },
  {
    id: 'GATE-DEC-DR-02',
    description: 'IP transfer complete for customer-owned assets',
    gateType: 'hard',
    stageId: 'Contract-Close',
    evaluationHint:
      'IP transfer covers any vendor-developed assets contracted as customer-owned: source code, documentation, configurations, models, datasets. Transfer evidence must be complete and verifiable.',
  },
  {
    id: 'GATE-DEC-CC-01',
    description: 'Residual liability release executed',
    gateType: 'hard',
    stageId: 'Contract-Close',
    evaluationHint:
      'Both parties must execute a release that closes the commercial relationship and confirms no residual claims, subject to any ongoing exit-assistance obligations. Releases that omit named obligations on either side are incomplete.',
  },
];

const DECOM_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-DEC-NO-01',
    label: 'Termination Notice',
    stageId: 'Notify',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Formal termination or non-renewal notice issued consistent with the contract\'s notice provisions, including form, addressee, and timing.',
  },
  {
    id: 'ART-DEC-NO-02',
    label: 'Incoming Arrangement Confirmation',
    stageId: 'Notify',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Documented confirmation of the incoming arrangement: replacement vendor, in-house transfer destination, or service retirement plan with cutover target.',
  },
  {
    id: 'ART-DEC-NO-03',
    label: 'Exit-Assistance Window Confirmation',
    stageId: 'Notify',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Confirmation from the outgoing vendor of the exit-assistance window length, hour pool, and scope as defined by the contract.',
  },
  {
    id: 'ART-DEC-TP-01',
    label: 'Joint Transition Plan',
    stageId: 'Transition-Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Tri-party transition plan signed by outgoing vendor, incoming party, and customer. Identifies all transferring scope elements with named resources, completion criteria, and timeline.',
  },
  {
    id: 'ART-DEC-TP-02',
    label: 'Risk Register (Decommission)',
    stageId: 'Transition-Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Risk register specific to the decommission: knowledge-loss risks, integration-failure risks, data-orphaning risks, surprise-fee risks. Tracked through to contract close.',
  },
  {
    id: 'ART-DEC-TP-03',
    label: 'Cutover Plan',
    stageId: 'Transition-Plan',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Detailed cutover plan including roll-back option, stabilisation window, acceptance criteria, and decision points.',
  },
  {
    id: 'ART-DEC-KT-01',
    label: 'KT Schedule and Completion Log',
    stageId: 'Knowledge-Transfer',
    requirement: 'required',
    gateType: 'hard',
    description:
      'KT execution log per service domain: shadowing sessions completed, documentation handed over, Q&A sessions held, and per-domain completion sign-offs.',
  },
  {
    id: 'ART-DEC-KT-02',
    label: 'Documentation Handover Pack',
    stageId: 'Knowledge-Transfer',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Complete documentation pack from outgoing vendor: runbooks, architecture diagrams, configurations, integration specs, escalation paths, on-call rotas as applicable.',
  },
  {
    id: 'ART-DEC-KT-03',
    label: 'KT Quality Sign-Off',
    stageId: 'Knowledge-Transfer',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Per-domain sign-off from incoming party confirming KT quality is sufficient to operate the service.',
  },
  {
    id: 'ART-DEC-CO-01',
    label: 'Cutover Execution Log',
    stageId: 'Service-Cutover',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Log of cutover execution: steps completed, issues encountered, roll-back triggers (if any), and acceptance criteria status.',
  },
  {
    id: 'ART-DEC-CO-02',
    label: 'Stabilisation Window Report',
    stageId: 'Service-Cutover',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Report covering the stabilisation window: incidents observed, exit-vendor support invocations, and remediation actions.',
  },
  {
    id: 'ART-DEC-DR-01',
    label: 'Data Return Certification',
    stageId: 'Data-Return',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Specific certification from outgoing vendor: data sets returned, formats used, residual data destroyed, destruction methodology, and certifying signatory.',
  },
  {
    id: 'ART-DEC-DR-02',
    label: 'IP Transfer Schedule',
    stageId: 'Data-Return',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Schedule of customer-owned IP transferred: source code, documentation, configurations, models, datasets, with transfer evidence per item.',
  },
  {
    id: 'ART-DEC-DR-03',
    label: 'Final Data-Privacy Compliance Confirmation',
    stageId: 'Data-Return',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Confirmation that data return and destruction are consistent with applicable data-privacy regimes (GDPR, sectoral regulations, contractual privacy schedules).',
  },
  {
    id: 'ART-DEC-CC-01',
    label: 'Final Invoice Reconciliation',
    stageId: 'Contract-Close',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Reconciliation of final invoices, including exit-assistance hour usage and any disputed charges resolved or escalated.',
  },
  {
    id: 'ART-DEC-CC-02',
    label: 'Residual Liability Release',
    stageId: 'Contract-Close',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Mutual release executed by both parties, confirming no residual claims subject to ongoing exit-assistance obligations explicitly named.',
  },
  {
    id: 'ART-DEC-CC-03',
    label: 'Contract Archival Pack',
    stageId: 'Contract-Close',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'Archival pack of contract artefacts retained for the post-termination retention period: contract, amendments, key correspondence, dispute history, and decommission artefacts.',
  },
];

const DECOM_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-DEC-001',
    label: 'KT Plan Coverage vs Service Inventory',
    severity: 'high',
    partyA: 'Joint transition plan',
    partyB: 'Actual service inventory',
    detectionHint:
      'Fires when the joint transition plan covers fewer service elements than the documented service inventory. Detection keywords: "key services", "primary scope" appearing in the plan while the inventory contains material elements not addressed.',
    resolutionPath:
      'Map every service element to a transition plan entry. Where elements are intentionally excluded (e.g. service being retired, not transferred), document the exclusion explicitly.',
  },
  {
    id: 'CON-DEC-002',
    label: 'Data Return Certification vs Data Privacy Compliance',
    severity: 'high',
    partyA: 'Data return certification',
    partyB: 'Applicable data-privacy regime',
    detectionHint:
      'Fires when the data return certification omits or under-specifies destruction methodology, residual copy handling, or sub-processor data handling, in a context where the applicable data-privacy regime requires those specifics.',
    resolutionPath:
      'Require certification specifics consistent with the privacy regime. Generic certifications are insufficient where regulators or contractual privacy schedules prescribe specifics.',
  },
  {
    id: 'CON-DEC-003',
    label: 'Cutover Acceptance vs Stabilisation Evidence',
    severity: 'medium',
    partyA: 'Cutover acceptance declaration',
    partyB: 'Stabilisation window incident evidence',
    detectionHint:
      'Fires when cutover is declared complete despite material incidents observed during the stabilisation window. Detection keywords: "successful cutover", "complete" appearing while the stabilisation report records ≥2 severity-1 or severity-2 incidents.',
    resolutionPath:
      'Re-evaluate cutover acceptance against the documented criteria. Either resolve outstanding incidents before declaring complete, or extend the stabilisation window with the outgoing vendor\'s exit-assistance support.',
  },
  {
    id: 'CON-DEC-004',
    label: 'Exit-Assistance Hours vs Forecast Demand',
    severity: 'medium',
    partyA: 'Contracted exit-assistance hour pool',
    partyB: 'Forecast exit-assistance demand',
    detectionHint:
      'Fires when the forecast exit-assistance demand (based on KT scope, integration count, and incident history) materially exceeds the contracted hour pool. Detection: forecast >120% of contracted pool.',
    resolutionPath:
      'Either negotiate a top-up of exit-assistance hours, prioritise demand within the contracted pool with surfaced trade-offs, or escalate to the outgoing vendor\'s account leadership for goodwill cooperation.',
  },
];

const DECOM_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-DEC-001',
    label: 'Knowledge Loss',
    description:
      'KT is rushed, under-resourced, or executed by junior outgoing-vendor resources without sufficient depth. Service quality issues manifest months after cutover when domain knowledge gaps surface as incidents that cannot be resolved by the incoming party alone.',
    stages: ['Knowledge-Transfer', 'Service-Cutover'],
    mitigations: [
      'Require named senior outgoing-vendor resources for KT, not just nominal coverage.',
      'Use shadowing periods (incoming operates with outgoing oversight) before cutover, not just documentation handover.',
      'Track KT completion at domain level with sign-off from incoming party operators, not just management.',
    ],
  },
  {
    id: 'FM-DEC-002',
    label: 'Data Orphaning',
    description:
      'Customer data remains in outgoing-vendor systems after cutover because the data return scope was incomplete, formats were unagreed, or sub-processor data handling was not addressed. Data orphaning creates regulatory exposure and intellectual property risk.',
    stages: ['Data-Return'],
    mitigations: [
      'Define data return scope explicitly at the transition plan stage, not at the data return stage.',
      'Address sub-processor data handling explicitly in the certification requirements.',
      'Require destruction methodology specifics, not generic certifications.',
    ],
  },
  {
    id: 'FM-DEC-003',
    label: 'Surprise Post-Exit Fees',
    description:
      'After contract close the outgoing vendor invoices for unexpected charges: data export fees, archival fees, transition surcharges, or premium-rate exit-assistance hours. The customer is in a weak position to dispute because the relationship has ended and leverage has expired.',
    stages: ['Notify', 'Contract-Close'],
    mitigations: [
      'Audit the contract for fee schedules that activate at exit before issuing the termination notice.',
      'Negotiate fee caps or waivers as part of the renewal cycle preceding termination, not as part of the exit itself.',
      'Treat the residual liability release as a hard gate; do not accept release language that preserves vendor invoicing rights without name and limit.',
    ],
  },
  {
    id: 'FM-DEC-004',
    label: 'Cutover Roll-Back Path Untested',
    description:
      'The cutover plan includes a roll-back option in name but the roll-back path is not tested. When a material cutover issue arises, the roll-back option proves to be impractical because dependencies have already shifted to the incoming party.',
    stages: ['Transition-Plan', 'Service-Cutover'],
    mitigations: [
      'Require the roll-back path to be tested at the transition plan stage, not contemplated as theoretical.',
      'Define a roll-back trigger threshold so the decision is evidence-based, not ad-hoc under pressure.',
      'Maintain incoming-party readiness so a roll-back does not destroy the option to retry cutover.',
    ],
  },
  {
    id: 'FM-DEC-005',
    label: 'IP Transfer Gap',
    description:
      'Customer-owned IP (source code, configurations, models, datasets) is contracted as customer-owned but is not transferred completely at exit. The customer discovers the gap when the incoming party cannot operate without the missing IP.',
    stages: ['Data-Return'],
    mitigations: [
      'Maintain a customer-owned-IP register throughout the contract term, not just at exit.',
      'Require an IP transfer schedule listing every register entry with transfer evidence per item.',
      'Test that the incoming party can operate using only the transferred IP before declaring transfer complete.',
    ],
  },
];

export const PAT_SRC_DECOM_001: LifecyclePatternSeed = {
  id: 'PAT-SRC-DECOM-001',
  slug: 'vendor-decommission-exit-lifecycle',
  title: 'Vendor Decommission / Exit Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Vendor decommission is treated as an operational tail-end activity in most enterprises, but it is in fact a high-risk procurement event in its own right: knowledge loss, data orphaning, and surprise post-exit fees materialise as service-quality issues, regulatory exposure, and unplanned cost months after cutover. A defensible decommission rests on a tri-party transition plan, per-domain KT sign-off, tested cutover roll-back, specific data return certification, IP transfer evidence, and a residual liability release that closes the commercial relationship cleanly.',
  applicability:
    'Apply when a contractual relationship is ending — whether by termination, non-renewal, re-tender award to a different supplier, or service retirement. Most relevant for managed services, technology platforms, and outsourcing arrangements where transition complexity is material. Also relevant when a supplier is being consolidated out of a vendor portfolio. Not strictly necessary for low-complexity engagements where exit consists only of stopping new work and final invoice settlement; for those, a lighter exit checklist applies.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.9,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: ['PAT-SRC-006', 'PAT-SRC-009', 'PAT-SRC-RENEWAL-001', 'PAT-SRC-AMS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-DEC-001', 'CON-DEC-002'],
  body: `## Why Decommission Is a Sourcing Event

Decommission is treated as an operational tail-end activity in most enterprises — the formal close of a relationship that has already wound down in practice. Sourcing doctrine treats this framing as the principal failure mode. Decommission is a high-risk procurement event in its own right: knowledge loss, data orphaning, surprise post-exit fees, and IP transfer gaps materialise as service-quality issues, regulatory exposure, and unplanned cost months after cutover. The exit-assistance regime in the contract is the only commercial leverage the customer has during decommission, and it expires on a defined timeline. Treating decommission as an operational handover rather than a procurement event forfeits that leverage and creates the conditions for the failure modes the regime was designed to prevent.

## The Tri-Party Plan as Operational Foundation

Sourcing doctrine treats the joint transition plan, signed by outgoing vendor, incoming party, and customer, as the operational foundation of decommission. A unilateral plan — written by the customer or by the incoming party — does not bind the outgoing vendor\'s cooperation, and outgoing-vendor cooperation cannot be assumed in the absence of contractual obligation backed by signed plan. The plan must identify all transferring scope elements with named resources, define completion criteria per element, and align the plan with the cutover target. Plans with named gaps are preferable to plans with implicit gaps: surfacing gaps is the value of the planning stage. Where the plan covers fewer elements than the documented service inventory, the gap is a risk to govern, not a detail to defer.

## Knowledge Transfer as the Highest-Risk Stage

KT is the highest-risk stage of decommission because incomplete KT manifests as service quality issues months after cutover, when remediation is hardest and exit-assistance hours have expired. Sourcing doctrine treats KT execution as a domain-by-domain discipline: per-domain sign-off is required, not aggregate sign-off, because aggregate sign-off masks domain-specific gaps. Shadowing periods — where the incoming party operates with outgoing oversight — produce stronger KT than documentation handover alone, because tacit knowledge transfers through observation, not text. KT under-resourcing is a common pattern: the outgoing vendor nominates junior resources for KT because senior resources have already been redeployed to the next engagement. The customer must require named senior resources, not just nominal coverage.

## Data Return and IP Transfer as Legal Foundations

Data return is the most legally consequential stage of decommission. Generic certifications without specifics are insufficient where applicable data-privacy regimes (GDPR, sectoral regulations, contractual privacy schedules) prescribe destruction methodology, residual copy handling, and sub-processor data handling. The certification must name these specifics. IP transfer is the corresponding intellectual-property foundation: customer-owned assets contracted as customer-owned must be transferred with evidence per item, and the incoming party must be able to operate using only the transferred IP before transfer is declared complete. A customer-owned-IP register maintained throughout the contract term, not just at exit, is the protection against the IP transfer gap failure mode.

## Surprise Post-Exit Fees and the Residual Release

The contract\'s fee schedule frequently activates additional charges at exit: data export fees, archival fees, transition surcharges, premium-rate exit-assistance hours. These are most cleanly addressed in the renewal cycle preceding termination, not in the exit itself, because exit leverage is weaker than renewal leverage. Where exit-fee schedules cannot be capped or waived in advance, the residual liability release becomes the customer\'s last protection: the release must be a mutual instrument that closes the commercial relationship cleanly, naming any ongoing exit-assistance obligations explicitly. Release language that preserves vendor invoicing rights without name and limit is incomplete; sourcing doctrine treats the residual release as a hard gate, not a closing formality.`,

  kind: 'lifecycle',
  patternId: 'PAT-SRC-DECOM-001',
  stages: DECOM_STAGES,
  gateCriteria: DECOM_GATE_CRITERIA,
  expectedArtifacts: DECOM_EXPECTED_ARTIFACTS,
  contradictionTemplates: DECOM_CONTRADICTION_TEMPLATES,
  failureModes: DECOM_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-006', // Transition Plan Sufficiency Screen
    'PAT-SRC-009', // Negotiation Leverage Preservation
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-RENEWAL-001', // Contract Renewal (when decommission follows re-tender decision)
    'PAT-SRC-AMS-001', // AMS lifecycle (when decommission is part of AMS exit)
  ],
  typicalDurationDays: { min: 60, max: 180 },
};

// ---------------------------------------------------------------------------
// PAT-SRC-EMERGENCY-001  —  Emergency / Crisis Sourcing Lifecycle
// ---------------------------------------------------------------------------

const EMERGENCY_STAGES: LifecycleStage[] = [
  {
    id: 'Trigger-Confirm',
    label: 'Trigger Confirm',
    description:
      'Confirm that the trigger event meets the organisation\'s emergency-sourcing threshold. The threshold is a definitional decision, not a discretionary one: emergency framing waives standard procurement disciplines, and that waiver is only legitimate when the trigger is genuine. Document the trigger nature, the impact horizon if unaddressed, and the named approver who confirms emergency status.',
    order: 1,
  },
  {
    id: 'Rapid-DD',
    label: 'Rapid DD',
    description:
      'Conduct compressed due diligence on the named vendor or vendors. Standard due diligence is not feasible on emergency timelines, but minimum-viable due diligence is non-negotiable: financial-health spot check, security baseline confirmation, capability validation, and at least one independent reference. Compression must not become substitution.',
    order: 2,
  },
  {
    id: 'Award',
    label: 'Award',
    description:
      'Execute commercial instruments under emergency authority. The contract should be a short-form instrument suited to the emergency horizon (typically 30–90 days), with explicit transition-out provisions to a standard procurement event once the emergency is contained. Pricing should reference benchmark evidence to the extent feasible.',
    order: 3,
  },
  {
    id: 'Backfill-Governance',
    label: 'Backfill Governance',
    description:
      'Execute the post-fact governance backfill within the committed window (typically 30 days). The backfill reconstructs the procurement governance disciplines that were waived under emergency authority: written justification, market-alternative survey, benchmark comparison, security attestation, and approval evidence. The backfill is the mechanism by which emergency authority is held accountable; without it, emergency framing becomes a permanent procurement-discipline bypass.',
    order: 4,
  },
];

const EMERGENCY_GATE_CRITERIA: GateCriterion[] = [
  {
    id: 'GATE-EMR-TR-01',
    description: 'Emergency trigger documented with named approver',
    gateType: 'hard',
    stageId: 'Rapid-DD',
    evaluationHint:
      'The trigger documentation must name the trigger nature, the impact horizon if unaddressed, and a specific approver authorised to confirm emergency status. Generic framing ("urgent need", "schedule pressure") does not satisfy this gate; emergency authority requires named-event triggers.',
  },
  {
    id: 'GATE-EMR-TR-02',
    description: 'Emergency status approved by procurement governance authority',
    gateType: 'hard',
    stageId: 'Rapid-DD',
    evaluationHint:
      'The procurement governance authority of last resort (CPO, CFO, or board sub-committee per the organisation\'s policy) must confirm emergency status. Emergency status confirmed only by the requesting sponsor is insufficient — the waiver of standard disciplines must be approved by the function that owns those disciplines.',
  },
  {
    id: 'GATE-EMR-TR-03',
    description: 'Backfill governance commitment documented at trigger',
    gateType: 'hard',
    stageId: 'Rapid-DD',
    evaluationHint:
      'The emergency authority must be paired with a documented commitment to backfill standard governance within a defined window (typically 30 days). The commitment is the accountability mechanism for the waiver. Without it, emergency framing becomes a permanent bypass.',
  },
  {
    id: 'GATE-EMR-DD-01',
    description: 'Minimum-viable due diligence completed',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Even on compressed timelines, four checks are non-negotiable: financial-health spot check, security baseline confirmation, capability validation, and at least one independent reference. Compression of due diligence is acceptable; substitution is not.',
  },
  {
    id: 'GATE-EMR-DD-02',
    description: 'Conflict-of-interest declarations on file from emergency decision-makers',
    gateType: 'hard',
    stageId: 'Award',
    evaluationHint:
      'Emergency decisions are particularly vulnerable to undisclosed-relationship distortion because the schedule pressure suppresses normal scrutiny. Declarations from all decision-makers on the emergency are a hard gate.',
  },
  {
    id: 'GATE-EMR-AW-01',
    description: 'Short-form contract with explicit emergency horizon and transition-out provision',
    gateType: 'hard',
    stageId: 'Backfill-Governance',
    evaluationHint:
      'The contract must be scoped to the emergency horizon (typically 30–90 days) with an explicit transition-out clause specifying how the engagement will be re-procured under standard governance once the emergency is contained.',
  },
  {
    id: 'GATE-EMR-AW-02',
    description: 'Pricing references benchmark evidence to the extent feasible',
    gateType: 'soft',
    stageId: 'Backfill-Governance',
    evaluationHint:
      'Emergency pricing rarely permits a full benchmark, but at least one external reference point (prior contract pricing, framework rate card, comparable award) should be on file. Pure-emergency pricing without any external reference is a soft-gate failure to surface in the backfill.',
  },
  {
    id: 'GATE-EMR-BF-01',
    description: 'Backfill governance complete within committed window',
    gateType: 'hard',
    stageId: 'Backfill-Governance',
    evaluationHint:
      'The backfill window is typically 30 days from award. Backfills not completed within window represent a procurement-discipline failure that should be escalated to the procurement governance authority.',
  },
  {
    id: 'GATE-EMR-BF-02',
    description: 'Backfill includes written justification, market-alternative survey, benchmark, and approval evidence',
    gateType: 'hard',
    stageId: 'Backfill-Governance',
    evaluationHint:
      'The backfill must reconstruct the governance disciplines that were waived: written justification, market-alternative survey, benchmark comparison, security attestation review, and approval evidence. A backfill that omits any of these is incomplete.',
  },
];

const EMERGENCY_EXPECTED_ARTIFACTS: ExpectedArtifact[] = [
  {
    id: 'ART-EMR-TR-01',
    label: 'Emergency Trigger Memo',
    stageId: 'Trigger-Confirm',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Trigger documentation: trigger nature, impact horizon if unaddressed, named approver, and time-stamp of trigger confirmation.',
  },
  {
    id: 'ART-EMR-TR-02',
    label: 'Emergency Status Approval',
    stageId: 'Trigger-Confirm',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Approval evidence from the procurement governance authority confirming emergency status and authorising compressed lifecycle execution.',
  },
  {
    id: 'ART-EMR-TR-03',
    label: 'Backfill Governance Commitment',
    stageId: 'Trigger-Confirm',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Documented commitment to complete backfill governance within a defined window (typically 30 days), naming the accountable owner.',
  },
  {
    id: 'ART-EMR-DD-01',
    label: 'Rapid Due Diligence Pack',
    stageId: 'Rapid-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Compressed DD evidence: financial-health spot check, security baseline confirmation, capability validation, and at least one independent reference.',
  },
  {
    id: 'ART-EMR-DD-02',
    label: 'Conflict-of-Interest Declarations',
    stageId: 'Rapid-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Declarations from emergency decision-makers confirming no undisclosed relationships with the named vendor.',
  },
  {
    id: 'ART-EMR-DD-03',
    label: 'Vendor Capability Statement',
    stageId: 'Rapid-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Vendor-supplied capability statement specific to the emergency scope, validated against at least one independent reference point.',
  },
  {
    id: 'ART-EMR-DD-04',
    label: 'Reference Call Notes',
    stageId: 'Rapid-DD',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Notes from at least one independent reference call covering the vendor\'s capability and reliability for the emergency scope.',
  },
  {
    id: 'ART-EMR-AW-01',
    label: 'Short-Form Emergency Contract',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Short-form contract scoped to the emergency horizon with explicit transition-out clause to standard procurement once the emergency is contained.',
  },
  {
    id: 'ART-EMR-AW-02',
    label: 'Indicative Benchmark Reference',
    stageId: 'Award',
    requirement: 'recommended',
    gateType: 'soft',
    description:
      'At least one external pricing reference point (prior contract, framework rate card, comparable award) used to anchor the emergency pricing.',
  },
  {
    id: 'ART-EMR-AW-03',
    label: 'Legal Sign-Off (Compressed)',
    stageId: 'Award',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Compressed legal sign-off on the short-form contract terms. Legal compression is acceptable; legal omission is not.',
  },
  {
    id: 'ART-EMR-BF-01',
    label: 'Backfill Justification Memo',
    stageId: 'Backfill-Governance',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Post-fact written justification reconstructing the procurement rationale: why this vendor, why this scope, why this pricing, and why competitive procurement was not feasible on the emergency timeline.',
  },
  {
    id: 'ART-EMR-BF-02',
    label: 'Market-Alternative Survey (Backfill)',
    stageId: 'Backfill-Governance',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Survey of viable alternatives that could have been considered absent the emergency, with disqualification reasons. Used to inform the standard re-procurement when the emergency is contained.',
  },
  {
    id: 'ART-EMR-BF-03',
    label: 'Benchmark Comparison',
    stageId: 'Backfill-Governance',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Post-fact benchmark comparison verifying the emergency pricing was reasonable on a normalised basis, with rationale for any variance.',
  },
  {
    id: 'ART-EMR-BF-04',
    label: 'Security Attestation Review',
    stageId: 'Backfill-Governance',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Full security attestation review (SOC 2 Type II or equivalent) to backfill the security baseline confirmation completed at Rapid-DD.',
  },
  {
    id: 'ART-EMR-BF-05',
    label: 'Backfill Approval Evidence',
    stageId: 'Backfill-Governance',
    requirement: 'required',
    gateType: 'hard',
    description:
      'Procurement governance approval of the backfill pack, confirming the emergency authority is closed out and the standard re-procurement plan (where applicable) is in motion.',
  },
];

const EMERGENCY_CONTRADICTION_TEMPLATES: ContradictionTemplate[] = [
  {
    id: 'CON-EMR-001',
    label: 'Emergency Trigger vs Schedule Pressure',
    severity: 'high',
    partyA: 'Stated emergency trigger',
    partyB: 'Underlying scheduling history',
    detectionHint:
      'Fires when the emergency trigger is described as a sudden event but the underlying scheduling history shows the requirement was foreseeable for ≥30 days without standard procurement initiation. Detection keywords: "urgent", "critical", "immediate need" appearing while planning evidence shows earlier awareness.',
    resolutionPath:
      'Re-classify the event as a compressed competitive procurement, not an emergency. Emergency authority is reserved for genuinely sudden triggers; foreseen-but-not-actioned needs do not qualify, even if the consequence of delay is now severe.',
  },
  {
    id: 'CON-EMR-002',
    label: 'Backfill Commitment vs Backfill Execution',
    severity: 'high',
    partyA: 'Backfill governance commitment at trigger',
    partyB: 'Backfill execution within window',
    detectionHint:
      'Fires when the backfill governance commitment is documented at trigger but the backfill is not completed within the committed window. This is the principal mechanism by which emergency framing becomes a permanent procurement-discipline bypass.',
    resolutionPath:
      'Escalate the backfill failure to the procurement governance authority. The emergency vendor relationship cannot proceed beyond the backfill window without either backfill completion or an explicit secondary approval.',
  },
  {
    id: 'CON-EMR-003',
    label: 'Compressed DD vs Substitution',
    severity: 'high',
    partyA: 'Documented Rapid-DD scope',
    partyB: 'Minimum-viable DD requirements',
    detectionHint:
      'Fires when the Rapid-DD pack omits one or more of the four non-negotiable checks (financial-health, security, capability validation, independent reference). Detection: any of the four artifacts missing from the DD pack.',
    resolutionPath:
      'Complete the missing check before award where feasible; otherwise document the gap explicitly in the trigger memo, escalate to procurement governance, and prioritise the gap-closure activity in the backfill stage.',
  },
  {
    id: 'CON-EMR-004',
    label: 'Emergency Horizon vs Contract Term',
    severity: 'medium',
    partyA: 'Stated emergency horizon',
    partyB: 'Negotiated contract term length',
    detectionHint:
      'Fires when the contract term materially exceeds the emergency horizon. A 12-month contract under 30-day emergency authority is not an emergency contract; it is a sole-source contract executed without sole-source governance.',
    resolutionPath:
      'Either compress the contract term to match the emergency horizon with an explicit transition-out clause, or re-classify and re-route through PAT-SRC-SOLE-001 with full sole-source governance.',
  },
];

const EMERGENCY_FAILURE_MODES: FailureMode[] = [
  {
    id: 'FM-EMR-001',
    label: 'Emergency Framing Without Genuine Trigger',
    description:
      'The team frames a foreseen-but-not-actioned requirement as an emergency to bypass standard procurement disciplines. The framing is procedurally invalid even where the underlying need is genuine, because emergency authority is reserved for sudden triggers.',
    stages: ['Trigger-Confirm'],
    mitigations: [
      'Require a named-event trigger description, not generic urgency framing.',
      'Cross-check the trigger description against planning evidence (calendars, prior briefings, project schedules).',
      'Have a non-sponsor approver (procurement governance authority) confirm emergency status.',
    ],
  },
  {
    id: 'FM-EMR-002',
    label: 'Backfill Governance Never Executes',
    description:
      'Emergency authority is granted with a backfill commitment, but the backfill is never executed because the emergency has passed and the team has redeployed to other priorities. The bypass becomes permanent.',
    stages: ['Backfill-Governance'],
    mitigations: [
      'Treat the backfill window as a hard deadline tracked at the procurement governance level.',
      'Schedule the backfill activity at the moment of award, not after the emergency horizon ends.',
      'Make backfill execution a sourcing function KPI tracked across emergency events.',
    ],
  },
  {
    id: 'FM-EMR-003',
    label: 'DD Substitution Under Time Pressure',
    description:
      'Rapid-DD becomes substitution rather than compression: one or more of the four non-negotiable checks is omitted entirely under schedule pressure, replaced with vendor self-attestation or sponsor assurance.',
    stages: ['Rapid-DD'],
    mitigations: [
      'Define the four checks as hard gates, not aspirations.',
      'Where a check cannot be completed before award, document the gap explicitly in the trigger memo and prioritise gap-closure in the backfill stage.',
      'Maintain a pre-vetted emergency supplier list so basic checks are pre-completed before any specific emergency.',
    ],
  },
  {
    id: 'FM-EMR-004',
    label: 'Emergency Contract Becomes Permanent',
    description:
      'The short-form emergency contract is renewed or extended without re-procurement under standard governance once the emergency is contained. Emergency framing locks in the vendor permanently.',
    stages: ['Award', 'Backfill-Governance'],
    mitigations: [
      'Make the transition-out clause explicit in the short-form contract: how and when the engagement will be re-procured.',
      'Schedule the re-procurement activity at award, not at emergency-contract expiry.',
      'Treat any renewal of the emergency contract as a sole-source event subject to PAT-SRC-SOLE-001 governance.',
    ],
  },
];

export const PAT_SRC_EMERGENCY_001: LifecyclePatternSeed = {
  id: 'PAT-SRC-EMERGENCY-001',
  slug: 'emergency-crisis-sourcing-lifecycle',
  title: 'Emergency / Crisis Sourcing Lifecycle',
  domain: 'sourcing',
  tier: 'authoritative',
  vertical: 'cross-industry',
  thesis:
    'Emergency sourcing is the only sourcing frame that legitimately waives standard procurement disciplines, and that waiver is only legitimate when (a) the trigger is genuine and named, (b) minimum-viable due diligence is compressed but not substituted, (c) the contract is short-form and scoped to the emergency horizon, and (d) the standard governance disciplines are reconstructed in a documented backfill within a committed window. Without all four, emergency framing is a permanent procurement-discipline bypass.',
  applicability:
    'Apply when a sudden trigger event creates a need that cannot be addressed within standard procurement timelines: regulatory deadline imposed without notice, security incident requiring immediate remediation, supplier failure creating service-gap risk, natural disaster or other crisis driving rapid sourcing. Not appropriate for foreseen-but-not-actioned requirements regardless of consequence severity; those should be re-classified as compressed competitive procurement.',
  status: 'AUTHORED-EXPERT',
  version: '1.0',
  confidence: 0.87,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-28',
  instanceCount: 0,
  sourceDocuments: [
    'docs/build/SOURCE_BUILD_SPEC.md',
    'docs/source-material/build-specs/abarva-source-build-spec.md',
  ],
  regulatoryChips: [],
  relatedPatternIds: ['PAT-SRC-008', 'PAT-SRC-010', 'PAT-SRC-SOLE-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: ['CON-EMR-001', 'CON-EMR-002'],
  body: `## What Makes a Trigger Genuine

Emergency sourcing is the only sourcing frame that legitimately waives standard procurement disciplines, and the threshold for that waiver matters. A genuine emergency trigger is sudden, named, and time-bound: a regulatory deadline imposed without notice, a security incident requiring immediate remediation, a supplier failure creating service-gap risk, a natural disaster, or a comparable crisis. Sourcing doctrine treats foreseen-but-not-actioned requirements — needs that were predictable for 30 days or more without standard procurement initiation — as ineligible for emergency framing regardless of consequence severity. Schedule pressure on a foreseen need is a planning failure, not an emergency. Where the team is tempted to apply emergency framing to such a need, the correct route is a compressed competitive procurement under PAT-SRC-RFP-001 with explicit timeline compression, or, where the consequence of compression is too severe, a sole-source event under PAT-SRC-SOLE-001 with full sole-source governance.

## Compression vs Substitution

Emergency framing compresses standard due diligence; it does not substitute for it. Sourcing doctrine treats four checks as non-negotiable even on emergency timelines: financial-health spot check, security baseline confirmation, capability validation against the emergency scope, and at least one independent reference. Emergencies frequently surface vendors that the team would not have selected under standard scrutiny, and the four checks are the minimum protection against that selection error. Where a check cannot be completed before award — for example, a vendor whose audited financials are not publicly available — the gap must be documented explicitly in the trigger memo and prioritised for closure in the backfill stage. Pre-vetted emergency supplier lists, maintained by procurement function in advance of any specific emergency, are the structural mitigation for this failure mode: basic checks are pre-completed so the emergency-time activity is contract negotiation, not vendor discovery.

## Short-Form Contracts and Transition-Out

The contract that emerges from emergency sourcing should be a short-form instrument scoped to the emergency horizon — typically 30 to 90 days — with an explicit transition-out clause specifying how the engagement will be re-procured under standard governance once the emergency is contained. Long-form contracts under emergency authority are sole-source contracts executed without sole-source governance: a 12-month engagement under a 30-day emergency trigger is a category error. The transition-out clause is the mechanism by which the emergency does not become permanent. Where the emergency horizon proves to require extension, the extension itself is a procurement event: either a re-affirmation of emergency status, a re-classification to sole-source under PAT-SRC-SOLE-001, or a competitive re-procurement.

## The Backfill as Accountability Mechanism

The post-fact governance backfill is the mechanism by which emergency authority is held accountable. Emergency framing waives standard disciplines under time pressure; the backfill reconstructs those disciplines once the immediate pressure has passed. The backfill must include the written justification, the market-alternative survey, the benchmark comparison, the security attestation review, and the procurement governance approval evidence — the same artefacts that a standard procurement event would produce. A backfill that omits any of these is incomplete. Sourcing doctrine treats the backfill window — typically 30 days from award — as a hard deadline tracked at the procurement governance level, not at the requesting team level, because the requesting team\'s incentive shifts away from backfill once the emergency is contained. The principal failure mode of this lifecycle is backfill-never-executes: the emergency has passed, the team has redeployed, and the bypass becomes permanent. Sourcing function KPIs should track emergency-event backfill completion rate as a discipline measure across the organisation.`,

  kind: 'lifecycle',
  patternId: 'PAT-SRC-EMERGENCY-001',
  stages: EMERGENCY_STAGES,
  gateCriteria: EMERGENCY_GATE_CRITERIA,
  expectedArtifacts: EMERGENCY_EXPECTED_ARTIFACTS,
  contradictionTemplates: EMERGENCY_CONTRADICTION_TEMPLATES,
  failureModes: EMERGENCY_FAILURE_MODES,
  coAppliesWithPatternIds: [
    'PAT-SRC-008', // Vendor Price Benchmarking and Variance Normalization
    'PAT-SRC-010', // Vendor-Claim Verification Protocol
    'PAT-SRC-SOLE-001', // Sole-source (when emergency contract extends or is re-procured under sole-source authority)
  ],
  typicalDurationDays: { min: 1, max: 14 },
};

// ---------------------------------------------------------------------------
// Exported collection
// ---------------------------------------------------------------------------

import { CAT_LIFECYCLE_PATTERNS } from './source-lifecycle-patterns-cat';

export const SOURCE_LIFECYCLE_PATTERNS: LifecyclePatternSeed[] = [
  PAT_SRC_AMS_001,
  PAT_SRC_RFP_001,
  PAT_SRC_SOLE_001,
  PAT_SRC_FRAMEWORK_001,
  PAT_SRC_RENEWAL_001,
  PAT_SRC_DECOM_001,
  PAT_SRC_EMERGENCY_001,
  // Category-pattern lifecycle wrappers — 12 PAT-SRC-CAT entries
  ...CAT_LIFECYCLE_PATTERNS,
];

export default SOURCE_LIFECYCLE_PATTERNS;
