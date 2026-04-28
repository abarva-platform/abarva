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
// Exported collection
// ---------------------------------------------------------------------------

export const SOURCE_LIFECYCLE_PATTERNS: LifecyclePatternSeed[] = [
  PAT_SRC_AMS_001,
  PAT_SRC_RFP_001,
];

export default SOURCE_LIFECYCLE_PATTERNS;
