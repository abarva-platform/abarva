// S6 Contract - Sourcing Stage Pack
//
// Contract is the translation stage. Sentinel's job is to keep selection value
// from leaking while legal, security, finance, and delivery teams convert the
// award decision into enforceable obligations, usable governance, and a safe
// mobilization path.

import type { StagePack } from './types';

export const S6_CONTRACT: StagePack = {
  stage: 6,
  label: 'S6 Contract',
  sourceStageKeys: ['selection', 'contract_mobilization'],
  crossReferences: {
    patternIds: [
      'PAT-SRC-AMS-001',
      'PAT-SRC-SOLE-001',
      'PAT-SRC-FRAMEWORK-001',
    ],
    sourceStageKeys: ['selection', 'contract_mobilization'],
  },
  outcome:
    'Contract is complete when the awarded vendor, buyer, legal, security, finance, and delivery owners have converted the selection decision into signed or approval-ready contract language that preserves the negotiated value, allocates risk explicitly, defines service and transition obligations, and gives mobilization a usable operating baseline. This stage does not end because legal has a redline or the vendor has accepted a price. It ends when Sentinel can trace the final agreement back to the BAFO decision record, show where every material exception landed, and explain what must be true on day one for activation to proceed without hidden commercial, security, or delivery debt.',

  definitionOfDone: [
    {
      id: 'selection-to-contract-traceability',
      label: 'Selection decision traced into contract exhibits and schedules',
      severity: 'hard',
      evaluationHint:
        'Contract packet or decision memo maps awarded scope, pricing, service levels, transition commitments, assumptions, and non-negotiables from BAFO into agreement sections, exhibits, or schedules. Missing traces must be named as gaps, not implied.',
    },
    {
      id: 'material-exceptions-closed',
      label: 'Material legal, commercial, security, and operational exceptions closed or escalated',
      severity: 'hard',
      evaluationHint:
        'Exception tracker lists each material open point, owner, final position, fallback language, business consequence, and approval state. Deferred exceptions require named executive acceptance before activation.',
    },
    {
      id: 'sla-and-remedy-model-finalized',
      label: 'Service levels, remedies, and reporting cadence finalized',
      severity: 'hard',
      evaluationHint:
        'Agreement or schedule defines service levels, measurement source, reporting cadence, cure process, service credits or remedies, exclusions, and governance review mechanics tied to the selected scope.',
    },
    {
      id: 'mobilization-obligations-owned',
      label: 'Mobilization obligations owned by both buyer and vendor',
      severity: 'hard',
      evaluationHint:
        'Mobilization plan or contract exhibit names vendor duties, buyer retained obligations, data/access dependencies, security onboarding, transition milestones, acceptance criteria, and owners for unresolved prerequisites.',
    },
    {
      id: 'financial-controls-aligned',
      label: 'Financial controls aligned to contract mechanics',
      severity: 'hard',
      evaluationHint:
        'Finance or procurement evidence confirms term, pricing units, invoice rules, purchase order setup, renewal/escalation clauses, credits, one-time costs, and approval thresholds match the negotiated award economics.',
    },
    {
      id: 'security-risk-and-data-terms-approved',
      label: 'Security, privacy, data, and audit terms approved for launch risk',
      severity: 'soft',
      evaluationHint:
        'Security or privacy review records data handling, audit rights, incident notice, subprocessors, access model, retention, data return/destruction, and any accepted exceptions with accountable approver.',
    },
    {
      id: 'signature-or-approval-path-clear',
      label: 'Signature or final approval path clear with no orphan blockers',
      severity: 'soft',
      evaluationHint:
        'Contract status evidence names signatories, delegated approvals, pending blockers, escalation route, target execution date, and whether mobilization can begin before signature under controlled conditions.',
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'what-must-not-change-from-bafo',
        text: 'Which BAFO commitments are non-negotiable and must appear in the final contract without dilution?',
        why:
          'Contracting often erodes negotiated value through exhibit gaps, soft language, or deferred schedules. Sentinel needs the hard spine before redlines become fragmented.',
        expectedAnswerShape:
          'Commitment, contract location, owner, acceptable fallback language, and consequence if the term weakens.',
      },
      {
        id: 'who-owns-each-exception',
        text: 'Who owns every material exception, and which exceptions can still change the award decision?',
        why:
          'Open exceptions are manageable only when ownership and decision consequence are explicit. Otherwise legal cleanup can silently become business risk.',
        expectedAnswerShape:
          'Exception tracker with owner, current position, business impact, fallback, approval need, and activation impact.',
      },
      {
        id: 'activation-critical-terms',
        text: 'Which contract terms are required before mobilization can safely start?',
        why:
          'Some terms can close after signature mechanics; others block access, data handling, transition, service acceptance, or invoice control.',
        expectedAnswerShape:
          'Critical terms, launch dependency, risk if absent, owner, and no-go threshold.',
      },
    ],
    converge: [
      {
        id: 'schedule-completeness-test',
        text: 'Do the contract schedules contain enough detail for delivery teams to execute without reinterpreting the deal?',
        why:
          'High-level master terms do not mobilize a vendor. Delivery needs scope, service levels, dependencies, acceptance, reporting, and escalation mechanics.',
        expectedAnswerShape:
          'Schedule-by-schedule gap list covering scope, SLA, pricing, transition, governance, security, data, and reporting.',
      },
      {
        id: 'retained-obligation-risk',
        text: 'Where does the buyer retain obligations that could become vendor excuses if they are not staffed or funded?',
        why:
          'Vendors can miss outcomes when buyer dependencies are vague. Contract discipline must make retained obligations visible before activation.',
        expectedAnswerShape:
          'Buyer obligation, owner, due date, evidence needed, vendor dependency, and consequence of miss.',
      },
      {
        id: 'finance-mechanics-match-deal',
        text: 'Do invoice rules, escalation clauses, credits, and PO mechanics match the economics the sponsor approved?',
        why:
          'Commercial leakage often appears in payment mechanics rather than headline price. Sentinel should reconcile finance controls before signature.',
        expectedAnswerShape:
          'Approved economics, contract/payment mechanism, variance, owner, and approval or correction path.',
      },
    ],
    close: [
      {
        id: 'ready-to-sign-or-escalate',
        text: 'Are we ready to sign, or are we asking leadership to accept a named residual risk?',
        why:
          'Contract close should produce an execution decision, not a vague redline status. Any residual risk needs an accountable acceptance record.',
        expectedAnswerShape:
          'Sign recommendation, residual risks, approver, accepted exceptions, unresolved blockers, and activation restriction if any.',
      },
      {
        id: 'handoff-to-activation',
        text: 'What exactly is handed to activation on day one, and what must not be assumed?',
        why:
          'Activation fails when the contract packet does not become an operating packet. Sentinel should force a concrete handoff before S7.',
        expectedAnswerShape:
          'Mobilization baseline, owner map, milestones, dependencies, no-go items, governance cadence, and evidence gaps.',
      },
      {
        id: 'post-signature-control',
        text: 'Which controls keep post-signature change orders, scope drift, or missed credits from eroding the contract?',
        why:
          'A signed agreement still needs controls. The close must define how value, obligations, and remedies will be monitored after activation starts.',
        expectedAnswerShape:
          'Control owner, reporting cadence, change-control rule, credit/remedy trigger, and escalation path.',
      },
    ],
  },

  antiPatterns: [
    {
      id: 'redline-as-progress',
      label: 'Redline As Progress',
      detectionHint:
        'The team reports that contract work is moving because documents are being exchanged, but cannot explain which business risks are closed or still open.',
      whatToFlag:
        'Tell the user that redline activity is not the same as contract readiness. Movement only matters when material exceptions have owners, consequences, and decisions.',
      mitigation:
        'Convert redlines into an exception tracker with business impact, owner, fallback language, decision status, and activation consequence.',
    },
    {
      id: 'bafo-value-leak',
      label: 'BAFO Value Leak',
      detectionHint:
        'Terms won in BAFO are softened, moved to vague exhibits, or left as commercial assumptions that do not bind the vendor.',
      whatToFlag:
        'Surface that negotiated value is leaking between selection and signature. If it drove award, it must be enforceable or explicitly traded.',
      mitigation:
        'Trace every award-critical commitment to contract language, exhibit location, remedy, reporting mechanism, and accountable owner.',
    },
    {
      id: 'mobilization-by-assumption',
      label: 'Mobilization By Assumption',
      detectionHint:
        'The team expects implementation to begin while data access, buyer staffing, security onboarding, transition milestones, or acceptance criteria are still implicit.',
      whatToFlag:
        'Flag that activation is being loaded with hidden debt. Missing mobilization terms become day-one blockers or excuses.',
      mitigation:
        'Add a mobilization exhibit with buyer/vendor obligations, dependencies, owners, dates, no-go gates, and acceptance evidence.',
    },
    {
      id: 'finance-afterthought',
      label: 'Finance Afterthought',
      detectionHint:
        'PO setup, invoice rules, uplift clauses, credits, one-time charges, or renewal mechanics are handled after legal terms are nearly final.',
      whatToFlag:
        'Tell the user that payment mechanics can change the deal even when headline pricing stays the same.',
      mitigation:
        'Reconcile contract economics to the approved decision packet before signature and record any variance for sponsor or finance approval.',
    },
  ],

  coachingArc: {
    entry:
      'Start as a value-preservation guardrail. Pull the BAFO decision record into view, name non-negotiables, and force every material exception into an owned tracker before legal drafting becomes abstract.',
    midPhase:
      'Move clause by clause from paper terms to operating reality. Test service levels, remedies, retained obligations, finance mechanics, security terms, and mobilization dependencies against the selected scope.',
    exit:
      'Close in execution posture. Either recommend signature with a clean activation handoff or name the residual risks, approvers, and restrictions that must travel into S7.',
  },

  dependencies: {
    requiresFromPrior: [
      'S5 BAFO: preferred vendor, runner-up, dissenting view, and sponsor decision recorded',
      'S5 BAFO: normalized pricing, accepted concessions, and material commercial exceptions dispositioned',
      'S5 BAFO: non-negotiable terms, tradeable terms, and walkaway posture documented',
      'Current Source event: contract drafts, exception tracker, security/privacy reviews, finance controls, and mobilization evidence available through broker-routed context',
    ],
    producesForNext: [
      'Signed or approval-ready contract packet with award-critical commitments traced to enforceable language',
      'Closed or escalated exception tracker with owner, consequence, and approval state',
      'Mobilization baseline covering obligations, milestones, access/data dependencies, acceptance criteria, and no-go gates',
      'Finance, security, privacy, data, audit, service-level, remedy, and governance terms ready for activation monitoring',
      'Day-one handoff packet naming operating owners, residual risks, reporting cadence, and post-signature controls',
    ],
  },
};
