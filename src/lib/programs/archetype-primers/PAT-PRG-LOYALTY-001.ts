// PR-OV2-3a-LOYALTY: Loyalty Program AI archetype primer (PAT-PRG-LOYALTY-001).
//
// Source: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Sections
// D.0.3 (parameterized program-specific brief) and D.1.3 (loyalty AI
// parameterized P1 SMEs / templates / workshops / evidence). The primer
// translates a Loyalty Program AI brief into a Phase 1 plan that nails
// feasibility — first cohort × first offer mechanic, identity-resolution
// + consent posture across loyalty data sources, decisioning-engine
// integration map, and an incrementality / lift baseline framework with a
// holdout-control discipline named. P2 owns model-vs-vendor evaluation;
// P1 proves the program can produce a defensible, decision-grade lift
// signal at the customer touchpoint rather than a parallel score the
// offer engine ignores.

import type { ArchetypePrimer } from './types';

export const LOYALTY_AI_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-LOYALTY-001',
  displayName: 'Loyalty Program AI',

  p1OutcomeStatement:
    'Phase 1 closes when four artifacts are locked: (1) a first cohort × first offer ' +
    'mechanic — one tier or RFM cell, one channel, one offer type, never "all members" ' +
    'across "all channels"; (2) an incrementality / lift baseline framework with a ' +
    'holdout-control discipline named, because raw engagement lift confounded with ' +
    'seasonality and inventory effects is the most common reason loyalty AI claims ' +
    'victory and fails to renew; (3) an identity-resolution + consent posture audit ' +
    'across POS / ecommerce / mobile / partner / loyalty platform — overlap rates, ' +
    'consent state per channel, residency and price-discrimination posture; (4) a ' +
    'decisioning-engine integration map showing the path from AI score to each ' +
    'customer touchpoint (or admitting where it doesn\'t reach — that gap is where ' +
    'most loyalty AI dies as a parallel score operations ignores). P2 owns the ' +
    'model-vs-vendor evaluation; P1 nails feasibility and proves the program can ' +
    'produce a decision-grade lift signal in market.',

  smes: [
    {
      role: 'VP Loyalty / Loyalty Program Owner',
      rationale:
        'Owns the program and gates the cohort + offer mechanic decision; without their commitment to a single tier × single channel × single offer at P1, the program drifts into "personalize everything" and never produces a defensible lift signal.',
      neededAt: 'kickoff',
      escalationHint:
        'If no VP Loyalty is named at P0 close, escalate to the CMO sponsor to block P1 entry — without program ownership the cohort will be reopened at P2 and the workshops will have produced placeholder scope.',
    },
    {
      role: 'CMO / Sponsor',
      rationale:
        'Exec sponsor and the only role who can sign off on the kill criterion at the P2 gate; without sponsor presence the cohort and offer mechanic decisions get reopened by adjacent marketing teams and the program loses scope discipline.',
      neededAt: 'kickoff',
      escalationHint:
        'If the CMO cannot attend the Day 1 cohort + mechanic workshop, defer Day 1 rather than running it — a cohort locked without sponsor authority will not survive the synthesis-prep readout.',
    },
    {
      role: 'CRM / Loyalty Platform Architect',
      rationale:
        'Owns the loyalty platform integration (Salesforce Loyalty / SAP Customer Experience / Epsilon / Antavo / etc.); critical for whether the AI score actually reaches the offer engine or creates a parallel score the operating team ignores.',
      neededAt: 'data-discovery',
      escalationHint:
        'If the loyalty platform is fully managed by a SaaS vendor with opaque decisioning APIs, request the vendor solution architect for Day 2 and have them attest the integration map in writing.',
    },
    {
      role: 'Data Engineer / Customer Master Owner',
      rationale:
        'Owns identity resolution across POS / ecommerce / mobile app / partner channel / loyalty platform; without their access and source-of-record knowledge, churn and lifetime-value predictions are scored against partial profiles and the bias is unknowable.',
      neededAt: 'data-discovery',
      escalationHint:
        'If no Data Engineer is named, escalate to the Enterprise Data platform group before scheduling Day 2 — identity overlap rates cannot be computed without authoritative pulls per channel.',
    },
    {
      role: 'Privacy Counsel / DPO',
      rationale:
        'Owns consent state per channel, PII posture, residency, and the price-discrimination compliance question that personalized-offer programs surface in some jurisdictions; a loyalty AI designed in P3 without Privacy in P1 is rebuilt in P5 after the first regulator query.',
      neededAt: 'data-discovery',
      escalationHint:
        'If Privacy Counsel is unavailable, the DPO is an acceptable substitute for Day 2; if neither is named, block personalized-offer scoping and log the absence as a P2 readiness risk.',
    },
    {
      role: 'Marketing Analytics / Incrementality Lead',
      rationale:
        'Owns the holdout-control framework and the lift-vs-counterfactual discipline; without this role the program cannot separate AI lift from natural seasonality, inventory effects, or concurrent campaigns, and the P5 value claim collapses under finance scrutiny.',
      neededAt: 'baseline',
      escalationHint:
        'If no Incrementality Lead exists internally, request named coverage from the Marketing Mix Modeling / Test & Learn team or escalate to the CMO; the holdout discipline cannot be deferred to P3 without invalidating the P5 value mechanism.',
    },
    {
      role: 'Decisioning / Offer Engine Operator',
      rationale:
        'Runs the day-to-day offer rules and segmentation cadence in the loyalty platform; their attestation that the AI score will replace (not supplement) the legacy rule for the first cohort is what prevents the parallel-score failure mode.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'loyalty-cohort-and-offer-mechanic-workshop-guide',
      title: 'Loyalty cohort + offer mechanic workshop facilitator guide',
      kind: 'workshop_facilitator_guide',
      description:
        'Run-of-show + prompts for the Day 1 session: forces a single tier or RFM cell × single channel × single offer mechanic decision, names the lift hypothesis, and seeds the kill criterion the sponsor will sign at P2.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
        'validated-problem-statement',
      ],
    },
    {
      id: 'incrementality-baseline-and-holdout-spreadsheet',
      title: 'Incrementality baseline + holdout-control design spreadsheet',
      kind: 'baseline_spreadsheet',
      description:
        'Per-cohort rows for last-12-month engagement baseline (RFM segment, last-12-month redemption / spend / visit frequency), control-vs-treatment design specification, minimum detectable lift, and the holdout sizing and randomization protocol that will run in P3/P4.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'loyalty-identity-resolution-audit-template',
      title: 'Loyalty identity-resolution audit capture template',
      kind: 'capture_template',
      description:
        'Per-source rows (POS / ecommerce / mobile / partner / loyalty platform) for member coverage, identity-key fill rate, pairwise overlap with the loyalty platform of record, and consent state per channel — populated live during the Day 2 audit.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'decisioning-engine-integration-map-template',
      title: 'Decisioning-engine integration map capture template',
      kind: 'capture_template',
      description:
        'Pipeline diagram + per-touchpoint rows naming each customer-facing surface (email, app, web, in-store POS prompt, call center, partner) and whether AI scores currently reach it, via what API or batch path, and which legacy rule the score must replace rather than parallel.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
        'stakeholder-map-named',
      ],
    },
    {
      id: 'loyalty-stakeholder-interview-script',
      title: 'Loyalty AI stakeholder interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for sponsor / VP Loyalty / Incrementality Lead / Decisioning Operator / dissenter 1:1s; surfaces decision rights, adoption blockers, and the falsifiers (e.g. "what RFM cell would change your mind about the first cohort?") that keep Discovery from becoming confirmation work.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'loyalty-discovery-report-template',
      title: 'Loyalty AI Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: cohort + offer mechanic decision with sponsor rationale, incrementality baseline + holdout design, identity-resolution audit, consent-posture map, decisioning-engine integration map, stakeholder map, contradictions, and the P2 readiness recommendation (proceed / re-scope / reclassify / stop).',
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
      id: 'loyalty-cohort-and-mechanic-workshop',
      title: 'Loyalty cohort + offer mechanic workshop (Day 1)',
      description:
        'Three-hour decision workshop where the VP Loyalty, CMO sponsor, and Data Engineer lock a single first cohort (one tier or RFM cell), one channel, and one offer mechanic, with an explicit measurable lift hypothesis. Output is the cohort + mechanic decision the rest of P1 will baseline against, plus the sponsor-signed kill criterion the P2 gate will test.',
      durationHours: 3,
      attendees: [
        'VP Loyalty / Loyalty Program Owner',
        'CMO / Sponsor',
        'Data Engineer / Customer Master Owner',
      ],
      usesTemplates: [
        'loyalty-cohort-and-offer-mechanic-workshop-guide',
        'loyalty-stakeholder-interview-script',
      ],
    },
    {
      id: 'identity-and-decisioning-audit',
      title: 'Identity-resolution + decisioning-engine audit (Day 2)',
      description:
        'Four-hour audit session where the Data Engineer, Privacy Counsel, and CRM / Loyalty Platform Architect produce the identity-resolution audit (overlap rates across POS / ecommerce / mobile / partner / loyalty platform), the consent-posture map per channel, and the decisioning-engine integration map showing the path from AI score to each customer touchpoint. Output names every surface where the AI score currently does not reach, which is the gating finding for P2.',
      durationHours: 4,
      attendees: [
        'Data Engineer / Customer Master Owner',
        'Privacy Counsel / DPO',
        'CRM / Loyalty Platform Architect',
      ],
      usesTemplates: [
        'loyalty-identity-resolution-audit-template',
        'decisioning-engine-integration-map-template',
      ],
    },
    {
      id: 'incrementality-baseline-and-readiness',
      title: 'Incrementality baseline + P2 readiness (Day 3)',
      description:
        'Two-hour synthesis-prep session where the Marketing Analytics / Incrementality Lead, VP Loyalty, and CMO sponsor lock the holdout-control baseline framework (control sizing, randomization, minimum detectable lift) and validate the stakeholder map with a named dissenter. Closes with a draft P2 readiness recommendation grounded in the cohort × mechanic × incrementality framework rather than vendor preference.',
      durationHours: 2,
      attendees: [
        'Marketing Analytics / Incrementality Lead',
        'VP Loyalty / Loyalty Program Owner',
        'CMO / Sponsor',
        'Decisioning / Offer Engine Operator',
      ],
      usesTemplates: [
        'incrementality-baseline-and-holdout-spreadsheet',
        'loyalty-discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'first-cohort-rfm-segment-definition',
      label: 'First cohort RFM segment definition + last-12-month engagement (member count, redemption, spend, visit frequency)',
      rationale:
        'Anchors what the first cohort actually looks like in the loyalty system-of-record at the locked granularity; without it the lift hypothesis is hand-waved and the holdout sizing on Day 3 cannot be defended.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'identity-resolution-overlap-audit',
      label: 'Identity-resolution audit — pairwise overlap rates across POS / ecommerce / mobile / partner / loyalty platform',
      rationale:
        'Required to compute member coverage and identity-key fill rate per channel; without it churn and lifetime-value predictions are scored against partial profiles and the bias is unknowable, which the P2 anti-pattern detector will flag.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'consent-state-per-channel-map',
      label: 'Consent-state map per channel (lawful basis, residency, price-discrimination posture, audit findings in flight)',
      rationale:
        'Locks privacy posture before P2 weighs personalized-offer designs; a loyalty AI that activates without consent lineage and price-discrimination compliance fails the first regulator query and the program loses sponsor air-cover.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'incrementality-baseline-or-control-design',
      label: 'Incrementality baseline (control vs. treatment for the offer mechanic on the cohort, last 12 months) — or control-design specification if no prior tests exist',
      rationale:
        'The truth-tellable metric for loyalty AI is lift vs. counterfactual; either the prior holdout exists and seeds the baseline, or the absence is itself a finding and the Day 3 session locks the control-design specification P3/P4 will execute against.',
      format: 'spreadsheet',
      neededAt: 'baseline',
    },
    {
      id: 'decisioning-engine-integration-map',
      label: 'Decisioning-engine integration map — path from AI score to each customer touchpoint (email, app, web, POS prompt, call center, partner)',
      rationale:
        'Names every surface where the AI score currently reaches and every surface where it does not; the gaps are where most loyalty AI dies as a parallel score operations ignores, and the map is the gating evidence for P2 architecture options.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'current-offer-engine-rule-inventory',
      label: 'Current offer-engine rule inventory for the first cohort × channel (last 90 days)',
      rationale:
        'Documents the legacy segmentation rules the AI score must replace rather than parallel; required input for the synthesis-prep cohort-confirmation conversation and for the Decisioning Operator attestation that the score will reach the touchpoint.',
      format: 'spreadsheet',
      neededAt: 'synthesis-prep',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-first-cohort-bounded',
      label: 'Confirm the first cohort is bounded — one tier OR one RFM cell, one channel, one offer mechanic',
      rationale:
        'The "everywhere-charter" anti-pattern kills loyalty AI programs faster than any model choice; a P1 that tries to baseline "all members" across "all channels" produces a placeholder report and the sponsor will reopen the cohort at P2.',
    },
    {
      id: 'engage-privacy-counsel-before-personalized-offer-work',
      label: 'Engage Privacy Counsel BEFORE any personalized-offer scoping begins',
      rationale:
        'Personalized-offer programs surface price-discrimination compliance questions that vary by jurisdiction; deferring Privacy to mid-P1 is the most common reason loyalty AI discoveries either redo Day 2 or hit a regulator finding in P5.',
    },
    {
      id: 'confirm-loyalty-platform-architect-on-team',
      label: 'Confirm the CRM / Loyalty Platform Architect is named on the program team',
      rationale:
        'Without an integration path to the loyalty platform\'s decisioning engine, the AI score is theoretical — it never reaches the touchpoint, the offer engine still runs the legacy rule, and the program produces a parallel score the operating team ignores.',
    },
    {
      id: 'identify-incrementality-dissenter',
      label: 'Identify the dissenter — usually the Marketing Analytics / Incrementality Lead who will insist on holdout discipline',
      rationale:
        'Stakeholder maps without an incrementality-side dissenter become department-RACIs; the holdout discipline is what separates a defensible P5 value claim from a confirmation-bias engagement-lift narrative the next portfolio review rejects.',
    },
    {
      id: 'author-falsifiable-rfm-hypothesis',
      label: 'Author the falsifiable hypothesis: which RFM cell will show the largest incremental lift on the chosen offer mechanic, and what evidence would change the answer?',
      rationale:
        'Anti-confirmation discipline. Without a stated hypothesis and falsifiers entering Day 1, the cohort workshop becomes a confirmation of the program owner\'s priors rather than a discovery — and the holdout design on Day 3 inherits that confirmation bias.',
    },
    {
      id: 'schedule-marketing-analytics-day-3',
      label: 'Schedule Marketing Analytics / Incrementality Lead for the Day 3 baseline session',
      rationale:
        'The holdout-control framework cannot be deferred to P3 — without it the program cannot prove value at P5 and the kill criterion is undefined. Calendar lock for the Incrementality Lead is the gating step for a defensible P2 readiness recommendation.',
    },
    {
      id: 'name-decisioning-operator-for-touchpoint-attestation',
      label: 'Name the Decisioning / Offer Engine Operator who will attest the AI score replaces (not supplements) the legacy rule for the first cohort',
      rationale:
        'A loyalty AI score that runs alongside the legacy segmentation rule is the parallel-score failure mode; without operator attestation in P1 that the score will replace the rule for the first cohort × channel, the program ships a model the offer engine ignores.',
    },
  ],
};
