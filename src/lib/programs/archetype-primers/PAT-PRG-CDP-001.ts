// PR-OV2-3a: CDP Activation archetype primer (PAT-PRG-CDP-001).

import type { ArchetypePrimer } from './types';

export const CDP_ACTIVATION_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-CDP-001',
  displayName: 'CDP Activation',

  p1OutcomeStatement:
    'Phase 1 closes when we have a defensible, quantified read on customer-identity ' +
    'fragmentation across the first cohort’s source systems: a measured identity ' +
    'match-rate baseline, a fragmentation index that names where overlap is failing ' +
    'and why, and a consent-posture map that locks residency, lawful-basis, and audit ' +
    'obligations before P2 weighs activation patterns. We exit with a named stakeholder ' +
    'map (sponsor, MarTech architect, Privacy Counsel, Data Engineer, business owner of ' +
    'the cohort) and an evidence-validated problem statement that survives the sponsor ' +
    'readout. P1 is not a CDP-vendor evaluation — P2 owns that. P1 is the proof ' +
    'that there is a real identity-resolution problem worth solving for the cohort we ' +
    'committed to in P0.',

  smes: [
    {
      role: 'CDO / CMO Sponsor',
      rationale:
        'Owns the cohort decision and the activation outcome; without sponsor presence at kickoff the program drifts into an IT-led data-plumbing exercise that no marketing team will adopt.',
      neededAt: 'kickoff',
      escalationHint:
        'If no sponsor is named at P0 close, escalate to the Tenant Admin to block P1 entry until a sponsor 1:1 confirms accepted role.',
    },
    {
      role: 'Data Engineer',
      rationale:
        'Owns extracts, schemas, and identity keys across CRM / ecommerce / loyalty / email / web; identity match-rate cannot be measured without their access and source-of-record knowledge.',
      neededAt: 'data-discovery',
      escalationHint:
        'If no Data Engineer is on the program team, request named coverage from the Enterprise Data platform group before scheduling Day 1.',
    },
    {
      role: 'Privacy Counsel',
      rationale:
        'Identity unification touches consent, residency, and lawful-basis surfaces; a CDP designed in P3 without Privacy in P1 is rebuilt in P5 after the first audit finding.',
      neededAt: 'data-discovery',
      escalationHint:
        'If Privacy Counsel is unavailable, the DPO is an acceptable substitute for the Day 2 review; do not proceed without privacy-side coverage.',
    },
    {
      role: 'MarTech Architect',
      rationale:
        'Holds the current-state activation graph (ESP, web personalization, ad audiences); without them the consent-posture review cannot map downstream activations to the source consent state.',
      neededAt: 'data-discovery',
    },
    {
      role: 'Identity-Resolution SME',
      rationale:
        'Knows whether the existing match logic is deterministic, probabilistic, or a vendor black box; required to author a defensible match-rate baseline rather than a hand-waved “about 60%”.',
      neededAt: 'baseline',
      escalationHint:
        'May come from the existing CRM / loyalty platform team; if no internal SME exists, flag as a P3 talent gap and document the absence in the contradictions log.',
    },
    {
      role: 'Marketing Operations Lead',
      rationale:
        'Owns the cohort campaign cadence and the use case the CDP must light up first; their P0 acceptance of the cohort is what the synthesis-prep readout will be tested against.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'cdp-data-discovery-facilitator-guide',
      title: 'CDP data-discovery workshop facilitator guide',
      kind: 'workshop_facilitator_guide',
      description:
        'Run-of-show + prompts for the Day 1 session: maps every system that holds identity for the first cohort, names source-of-record per attribute, and surfaces overlap collisions.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
      ],
    },
    {
      id: 'consent-posture-review-template',
      title: 'Consent posture review capture template',
      kind: 'capture_template',
      description:
        'Per-source rows for consent state, lawful basis, residency, audit findings in flight, and downstream activations — filled live during the Day 2 Privacy session.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'identity-match-baseline-spreadsheet',
      title: 'Identity match-rate baseline spreadsheet',
      kind: 'baseline_spreadsheet',
      description:
        'Pairwise overlap matrix across source systems for the first cohort plus computed match-rate, fragmentation index, source/grain/method/owner columns and caveats.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'stakeholder-interview-script',
      title: 'CDP stakeholder interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for sponsor / business owner / dissenter 1:1s; surfaces decision rights, adoption blockers, and the falsifiers that would change the P0 hypothesis.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'discovery-report-template',
      title: 'CDP Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: validated problem statement, baseline + fragmentation index, consent posture, stakeholder map, contradictions, and the P2 readiness recommendation.',
      satisfiesEvidenceItems: [
        'validated-problem-statement',
        'okr-baseline-captured',
        'stakeholder-map-named',
        'discovery-contradictions-logged',
        'p2-readiness-recommendation',
      ],
    },
  ],

  workshops: [
    {
      id: 'cdp-data-discovery-workshop',
      title: 'CDP data-discovery workshop (Day 1)',
      description:
        'Three-hour working session that maps every system holding customer identity for the first cohort, names the source-of-record per attribute, and produces the seed of the fragmentation index. Output is a populated identity inventory the Data Engineer can extract against.',
      durationHours: 3,
      attendees: [
        'Data Engineer',
        'MarTech Architect',
        'Marketing Operations Lead',
        'Identity-Resolution SME',
      ],
      usesTemplates: [
        'cdp-data-discovery-facilitator-guide',
        'identity-match-baseline-spreadsheet',
      ],
    },
    {
      id: 'consent-posture-review',
      title: 'Consent posture review (Day 2)',
      description:
        'Two-hour Privacy-led review that captures consent state, lawful basis, residency, and audit findings per source system, and maps each downstream activation to the consent surface that would gate it. Locks privacy posture before P2 weighs activation patterns.',
      durationHours: 2,
      attendees: [
        'Privacy Counsel',
        'MarTech Architect',
        'Data Engineer',
      ],
      usesTemplates: ['consent-posture-review-template'],
    },
    {
      id: 'baseline-and-stakeholder-validation',
      title: 'Baseline + stakeholder validation (Day 3)',
      description:
        'Two-hour synthesis-prep session: sponsor 1:1 to confirm the P0 hypothesis still holds against Day 1–2 evidence, and stakeholder-map lock with named owners and dissenters. Closes with a draft P2 readiness recommendation.',
      durationHours: 2,
      attendees: [
        'CDO / CMO Sponsor',
        'Marketing Operations Lead',
        'Identity-Resolution SME',
      ],
      usesTemplates: [
        'stakeholder-interview-script',
        'discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'customer-master-sample',
      label: 'Customer master record sample (first cohort, ~10k rows)',
      rationale:
        'Anchors what the cohort actually looks like in the system-of-record — columns, fill rates, and the identifiers other systems will be joined against.',
      format: 'CSV',
      neededAt: 'data-discovery',
    },
    {
      id: 'identity-match-extracts-per-source',
      label: 'Per-source identity extracts (CRM, ecommerce, loyalty, email, web)',
      rationale:
        'Required to compute the pairwise overlap matrix and the headline match-rate; without them the baseline is anecdotal.',
      format: 'structured-export',
      neededAt: 'baseline',
    },
    {
      id: 'consent-state-per-source',
      label: 'Consent state export per source system',
      rationale:
        'Inputs to the Day 2 Privacy review; a CDP that activates without consent lineage will fail the first audit and the program loses sponsor air-cover.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'top-cohort-transaction-sample',
      label: 'Top-cohort transaction / engagement sample (last 90 days)',
      rationale:
        'Lets us reason about the value mechanism — cross-channel behavior the CDP would unify — without waiting for a full historical pull.',
      format: 'CSV',
      neededAt: 'baseline',
    },
    {
      id: 'current-activation-inventory',
      label: 'Current activation inventory (ESP segments, web personalization rules, ad audiences)',
      rationale:
        'Maps the downstream surfaces the CDP will activate; required for the consent posture review and the synthesis-prep stakeholder readout.',
      format: 'spreadsheet',
      neededAt: 'synthesis-prep',
    },
    {
      id: 'audit-findings-in-flight',
      label: 'Open privacy / data-governance audit findings',
      rationale:
        'Surfaces obligations the CDP design will inherit; absence here is itself a finding to log in the contradictions register.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-privacy-counsel-on-team',
      label: 'Confirm Privacy Counsel (or DPO) is named on the program team',
      rationale:
        'Day 2 cannot run without privacy-side coverage; deferring this to mid-P1 is the most common reason CDP discoveries slip a week.',
    },
    {
      id: 'schedule-day-1-data-discovery',
      label: 'Schedule the Day 1 data-discovery workshop with Data Engineer + MarTech Architect',
      rationale:
        'Calendar lock is the gating step — without a confirmed Day 1 the rest of the cadence floats and the Identity-Resolution SME will not commit to Day 3.',
    },
    {
      id: 'request-source-extracts',
      label: 'Request per-source identity and consent extracts from system owners',
      rationale:
        'Extracts have lead time; requesting them at P1 kickoff (not Day 1) is the difference between a measured baseline and a hand-waved one.',
    },
    {
      id: 'confirm-cohort-with-sponsor',
      label: 'Confirm the first cohort with the sponsor in writing',
      rationale:
        'P0 named the cohort; P1 must verify the sponsor still owns that cohort decision before workshops invest hours mapping its identity surface.',
    },
    {
      id: 'pre-read-p0-hypothesis-and-falsifiers',
      label: 'Circulate the P0 value hypothesis and its falsifiers to all Day 1 attendees',
      rationale:
        'Workshops that begin without the hypothesis on the table devolve into status updates; the falsifiers are what make Day 1 a discovery rather than a confirmation.',
    },
    {
      id: 'identify-dissenter-for-stakeholder-map',
      label: 'Identify at least one named dissenter or adoption blocker to interview',
      rationale:
        'Stakeholder maps without a dissenter are department-RACIs; the P1 anti-pattern detector will flag this at the gate if it is left unfilled.',
    },
  ],
};
