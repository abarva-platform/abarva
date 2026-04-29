import type { PatternSeed, SourceBasisRef } from './seed-types';

const FAR_OPTION_EXERCISE: SourceBasisRef = {
  type: 'regulatory-document',
  label: 'FAR 17.207 - Exercise of options',
  url: 'https://www.acquisition.gov/far/17.207',
  asOf: '2026-04-29',
  note:
    'Requires written notice within the contract option period, pre-exercise determinations on funds, need, price and other factors, past performance, acceptable contract performance, market comparison, and written file documentation.',
};

const FAR_OPTION_PERIODS: SourceBasisRef = {
  type: 'regulatory-document',
  label: 'FAR 17.204 - Contracts',
  url: 'https://www.acquisition.gov/far/17.204',
  asOf: '2026-04-29',
  note:
    'Requires contracts to state option exercise periods and set lead time for continuity when options or extensions are part of the instrument.',
};

const GSA_OPEN_PROCESS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'GSA OPEN - Options/Contract Renewal Process',
  url: 'https://vsc.gsa.gov/drupal/node/125',
  asOf: '2026-04-29',
  note:
    'Describes a renewal option workflow that queries expiring contracts 250 days out, sends government notifications, and uses 250-to-210-day and 210-day contractor communications.',
};

const RENEWAL_CALENDAR_STAGES = [
  {
    id: 'calendar_inventory',
    label: 'Calendar inventory',
    order: 1,
    description:
      'Capture contract end date, option exercise window, notice deadline, auto-renewal language, accountable owner, and linked business dependency before the renewal enters active preparation.',
  },
  {
    id: 'readiness_brief',
    label: 'Readiness brief',
    order: 2,
    description:
      'Prepare the evidence packet that will support renewal, renegotiation, non-renewal, or re-tender: utilization, performance, spend, market alternatives, switching cost, and open obligations.',
  },
  {
    id: 'decision_gate',
    label: 'Renewal decision gate',
    order: 3,
    description:
      'Decide whether to renew, renegotiate, re-tender, or exit before contractual notice and option windows remove buyer leverage.',
  },
  {
    id: 'notice_execution',
    label: 'Notice and execution',
    order: 4,
    description:
      'Send required notices, exercise or decline options, and execute renewal or transition actions using the approved decision record.',
  },
];

export const SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-PROC-007',
    slug: 'renewal-calendar-governance',
    title: 'Renewal Calendar Governance',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Renewal leverage is preserved when contract dates, notice windows, option exercise evidence, and readiness briefs are governed as a calendar system rather than discovered inside a late-stage renewal scramble.',
    applicability:
      'Apply to material SaaS, services, outsourcing, framework, data, AI, and infrastructure contracts where renewal, extension, option exercise, non-renewal, or re-tender decisions depend on notice timing and pre-decision evidence.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex-proc-renewals',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'src/lib/intelligence/source-lifecycle-patterns.ts',
      'https://www.acquisition.gov/far/17.204',
      'https://www.acquisition.gov/far/17.207',
      'https://vsc.gsa.gov/drupal/node/125',
    ],
    regulatoryChips: ['Option-exercise-review', 'Notice-window-control', 'Past-performance-review'],
    relatedPatternIds: ['PAT-SRC-CON-002', 'PAT-SRC-PROC-001', 'PAT-SRC-PROC-002', 'PAT-SRC-PROC-003'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'process_methodology',
    lifecycleStages: RENEWAL_CALENDAR_STAGES,
    perStageGateCriteria: {
      calendar_inventory: [
        {
          id: 'proc-renewal-calendar-critical-dates',
          description:
            'The renewal record captures contract end date, option exercise period, notice deadline, auto-renewal trigger, and the owner accountable for each date.',
          gateType: 'hard',
          stageId: 'calendar_inventory',
          evaluationHint:
            'Check the contract record and renewal calendar for dated fields rather than a generic renewal month or vendor account note.',
        },
        {
          id: 'proc-renewal-calendar-source-link',
          description:
            'Material renewals are linked to the applicable Source lifecycle, Tower vendor view, or program dependency before readiness work begins.',
          gateType: 'soft',
          stageId: 'calendar_inventory',
          evaluationHint:
            'Look for linkage to renewal calendar governance, vendor leverage analysis, or a program decision that depends on the renewal outcome.',
        },
      ],
      readiness_brief: [
        {
          id: 'proc-renewal-readiness-brief-complete',
          description:
            'The readiness brief includes utilization, performance, spend trajectory, alternatives, switching cost, open obligations, and renewal decision options.',
          gateType: 'hard',
          stageId: 'readiness_brief',
          evaluationHint:
            'A calendar reminder alone does not clear the gate; the event needs evidence that can support renew, renegotiate, re-tender, or exit.',
        },
      ],
      decision_gate: [
        {
          id: 'proc-renewal-decision-before-notice-risk',
          description:
            'The renewal decision is approved before the earliest notice, auto-renewal, or option-exercise deadline that would reduce buyer choice.',
          gateType: 'hard',
          stageId: 'decision_gate',
          evaluationHint:
            'Compare the approval date to all contractual notice dates and confirm late decisions carry explicit risk acceptance.',
        },
      ],
      notice_execution: [
        {
          id: 'proc-renewal-notice-evidence-archived',
          description:
            'Exercise, non-renewal, renegotiation, or re-tender notices are archived with the clause authority, addressee, delivery date, and approved decision record.',
          gateType: 'hard',
          stageId: 'notice_execution',
          evaluationHint:
            'The execution artifact should prove what notice was sent, why, under which clause, and by whose authority.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      calendar_inventory: [
        {
          id: 'artifact-renewal-calendar-record',
          label: 'Renewal calendar record',
          stageId: 'calendar_inventory',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Structured record of contract end date, notice deadline, option period, auto-renewal terms, owner, linked vendor, and linked program or Source event.',
        },
      ],
      readiness_brief: [
        {
          id: 'artifact-renewal-readiness-brief',
          label: 'Renewal readiness brief',
          stageId: 'readiness_brief',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Evidence packet covering utilization, value attribution, performance, spend, alternatives, switching cost, unresolved obligations, and recommended posture.',
        },
      ],
      decision_gate: [
        {
          id: 'artifact-renewal-decision-record',
          label: 'Renewal decision record',
          stageId: 'decision_gate',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Approved renew, renegotiate, re-tender, or exit decision with rationale, approver, timing risk, and notice/execution instruction.',
        },
      ],
      notice_execution: [
        {
          id: 'artifact-renewal-notice-log',
          label: 'Renewal notice log',
          stageId: 'notice_execution',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Archive of option exercise, non-renewal, renegotiation, or re-tender notices and proof of delivery.',
        },
      ],
    },
    riskFactors: [
      {
        id: 'renewal-date-notice-gap',
        label: 'Renewal dates tracked without notice windows',
        severity: 'high',
        detectionSignals: ['Calendar has contract end date only', 'Auto-renewal clause is not parsed', 'No owner is assigned to option exercise timing'],
        mitigations: ['Capture option and notice dates as required fields', 'Assign accountable owner', 'Escalate records missing contractual timing data'],
        sourceBasis: [FAR_OPTION_PERIODS, FAR_OPTION_EXERCISE],
      },
      {
        id: 'late-renewal-brief',
        label: 'Readiness brief arrives after leverage is lost',
        severity: 'high',
        detectionSignals: ['Brief is created after vendor renewal quote', 'Alternatives analysis is missing', 'Decision date falls inside or after notice deadline'],
        mitigations: ['Trigger brief ahead of contractual notice risk', 'Link Tower renewal workspace to Source renewal lifecycle', 'Document residual risk if timing is already missed'],
        sourceBasis: [GSA_OPEN_PROCESS],
      },
      {
        id: 'option-exercise-without-file-rationale',
        label: 'Option or renewal exercised without decision evidence',
        severity: 'high',
        detectionSignals: ['Renewal approval does not mention performance', 'No market or alternative evidence exists', 'Notice was sent but clause authority is absent'],
        mitigations: ['Require renewal decision record', 'Attach performance and market-test evidence', 'Archive notice with clause authority and approval'],
        sourceBasis: [FAR_OPTION_EXERCISE],
      },
    ],
    body: `## Summary
Renewal calendar governance is the control system that prevents a contract end date from masquerading as a renewal process. A usable calendar does more than remind a sourcing owner that a vendor term is ending. It records the dates that change buyer leverage: contract expiry, option exercise window, notice deadline, auto-renewal trigger, internal approval date, readiness-brief target, and execution deadline. The Source renewal lifecycle already treats renewal as a deliberate renew-or-re-tender decision, not a continuation reflex. Tower adds the operating surface: a vendor renewal workspace that prepares evidence before expiry and a vendor drill-down with a renewal calendar, utilization, alternatives, switching cost, and leverage indicators.

## When to apply
Use this pattern for material technology, services, outsourcing, framework, data, AI, and infrastructure contracts where a late renewal decision would reduce choice. It applies whether the contract has an affirmative option, an auto-renewal clause, a non-renewal notice requirement, or simply an operational dependency that makes replacement hard. It is especially useful for renewals that feel administratively routine but carry commercial, security, exit, or program-delivery consequences.

## Operating doctrine
The calendar should be clause-aware. FAR 17.204 requires contracts with options to state the period in which the option may be exercised and to provide lead time for continuity. FAR 17.207 reinforces that exercising an option is not a clerical act: the buyer must consider available funds, continuing need, price and other factors, past performance, acceptable current performance, and written file documentation. Even outside public procurement, the same doctrine holds. A renewal calendar should create time to prove the decision before the notice window closes.

## Lifecycle and gates
The first gate is critical-date completeness. A record with only a renewal month is not ready; it needs specific notice, option, auto-renewal, and owner fields. The second gate is readiness evidence. Tower's renewal workflow prepares utilization, value attribution, pressure summary, alternatives, walkaway analysis, and recommended position at defined preparation points. GSA's OPEN process is a useful public example of why this starts early: it queries expiring contracts 250 days out and uses 250-to-210-day and 210-day communications. Do not copy those days blindly into every private contract; use them as evidence that governed renewal processes start well before expiry.

## Artifacts
The required artifacts are the renewal calendar record, renewal readiness brief, decision record, and notice log. The calendar record owns dates and accountability. The readiness brief owns evidence. The decision record names the approved path: renew, renegotiate, re-tender, or exit. The notice log proves execution, including clause authority, addressee, delivery date, and attachment to the approved decision.

## Failure modes
The first failure is date-only governance: the contract end date is known, but the notice window, option period, or auto-renewal trigger is not. The second is quote-led renewal, where the vendor's renewal proposal arrives before the buyer has utilization, performance, and alternatives evidence. The third is evidence-free exercise, where an option is exercised because time ran out rather than because performance, price, continuity, and alternatives were reviewed. The remedy is to make renewal timing deterministic, decision evidence mandatory, and missed-window risk visible before the buyer's leverage disappears.`,
  },
];

export const SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERN_COUNT = SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERNS.length;
export const SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERN_IDS = SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERNS.map((pattern) => pattern.id);

export default SOURCING_PROCESS_RENEWAL_CALENDAR_PATTERNS;
