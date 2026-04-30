// PR-OV2-3a-CCAI: Contact Center AI archetype primer (PAT-PRG-CC-AI-001).

import type { ArchetypePrimer } from './types';

export const CONTACT_CENTER_AI_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-CC-AI-001',
  displayName: 'Contact Center AI',

  p1OutcomeStatement:
    'Phase 1 closes when we can hand P2 three artifacts that survive scrutiny: a top-intent ' +
    'inventory accounting for roughly 70% of volume in the first cohort, current ' +
    'containment / AHT / CSAT / transfer-rate per top intent with verified data lineage on ' +
    'every metric, and a representative audited transcript sample (50–100 calls, redacted) ' +
    'that proves the intent classification holds. We exit with a named stakeholder map ' +
    '(WFM Lead, CX Operations VP, Voice/IVR Architect, Digital Channels Owner, Privacy ' +
    'Counsel, sponsor) and a P2-readiness recommendation grounded in those baselines. P1 ' +
    'is not a vendor evaluation — P2 owns the assist/deflect/resolve trade-off and the ' +
    'platform call. P1 is the proof that the intents are real, the baseline numbers are ' +
    'defensible, and the transcripts say what the dashboards claim.',

  smes: [
    {
      role: 'WFM Lead',
      rationale:
        'Owns the intent categorization model and the WFM data the volume baseline is computed against; without WFM the top-intent table is anecdotal and the representative sample cannot be drawn cleanly.',
      neededAt: 'data-discovery',
      escalationHint:
        'If no WFM Lead is named on the program team, escalate to the CX Operations VP at P0 close to confirm coverage before Day 1 is scheduled.',
    },
    {
      role: 'CX Operations VP',
      rationale:
        'Owns the source of truth for containment %, AHT, CSAT, and transfer-rate; the operating team will reject any P2 charter built on numbers they did not attest to in P1.',
      neededAt: 'kickoff',
      escalationHint:
        'If the CX Ops VP is unavailable, an empowered CX Operations Director with metric sign-off authority is acceptable; do not run Day 3 without operations-side coverage.',
    },
    {
      role: 'Voice/IVR Architect',
      rationale:
        'Holds the integration map between IVR, agent desktop, and WFM; required to confirm whether a top intent currently lands in self-service, agent, or both, and where transfer-rate is actually counted.',
      neededAt: 'data-discovery',
      escalationHint:
        'If the IVR is fully managed by a vendor, request the vendor solution architect for Day 1 and have them attest to the integration map in writing.',
    },
    {
      role: 'Digital Channels Owner',
      rationale:
        'Owns chat / web / SMS containment data lineage and flags whether a digital cohort can serve as the first pilot intents — voice-only first cohorts often miss the easier deflection wins.',
      neededAt: 'data-discovery',
      escalationHint:
        'If digital channels are owned by Marketing rather than CX, name a single accountable cross-functional owner before Day 1 to avoid lineage hand-offs mid-baseline.',
    },
    {
      role: 'Privacy Counsel / DPO',
      rationale:
        'Transcripts are personal data; if the P1 evidence package includes a transcript sample, retention, redaction, and lawful-basis posture must be locked in P1 — not retrofitted in P5 after the first audit.',
      neededAt: 'baseline',
      escalationHint:
        'If Privacy Counsel is unavailable, the DPO is an acceptable substitute; if neither is named, block transcript sampling and log the absence as a P2 readiness risk.',
    },
    {
      role: 'Data Engineer / Analytics Owner',
      rationale:
        'Verifies the data path behind the containment dashboard; without explicit lineage attestation the baseline triggers the `wishlist-baseline` anti-pattern and the P2 case is built on sand.',
      neededAt: 'baseline',
      escalationHint:
        'If the dashboard is vendor-hosted with opaque lineage, request a written data-lineage attestation from the vendor or escalate to flag the metric as not decision-grade.',
    },
    {
      role: 'CX / Operations Sponsor',
      rationale:
        'Owns the cohort decision and the P2-readiness call; without sponsor presence at synthesis-prep the program drifts into a vendor-comparison exercise the operating team will not adopt.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'cc-ai-intent-inventory-workshop-guide',
      title: 'CC-AI intent inventory workshop facilitator guide',
      kind: 'workshop_facilitator_guide',
      description:
        'Run-of-show + prompts for the Day 1 session: surfaces the top intents accounting for ~70% of volume in the first cohort, names the current handle path per intent (IVR / agent / digital), and seeds the containment baseline.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
      ],
    },
    {
      id: 'containment-baseline-spreadsheet',
      title: 'Containment / AHT / CSAT / transfer-rate baseline spreadsheet',
      kind: 'baseline_spreadsheet',
      description:
        'Per-intent rows for current containment %, AHT, CSAT, transfer-rate, source system, grain, method, owner, and known caveats — populated from WFM and CX Ops data pulls covering the last 90 days.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'cc-ai-transcript-sampling-protocol',
      title: 'CC-AI transcript sampling and redaction protocol',
      kind: 'capture_template',
      description:
        'Privacy-reviewed protocol for drawing 50–100 representative calls per top intent, with PII redaction rules, retention limits, lawful-basis citation, and the audit log that proves the sample matches the WFM intent classification.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'wfm-stakeholder-interview-script',
      title: 'WFM + CX Ops stakeholder interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for sponsor / WFM Lead / CX Ops / dissenter 1:1s; surfaces metric ownership, decision rights, adoption blockers, and the falsifiers that would change the P0 hypothesis on cohort scope or first-channel choice.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'cc-ai-discovery-report-template',
      title: 'CC-AI Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: top-intent inventory, baseline table per intent with verified lineage, audited transcript-sample summary, validated problem statement, stakeholder map, contradictions, and the P2-readiness recommendation.',
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
      id: 'cc-ai-intent-inventory-workshop',
      title: 'CC-AI intent inventory workshop (Day 1)',
      description:
        'Three-hour working session that surfaces the top intents accounting for ~70% of volume in the first cohort and names the current handle path per intent (IVR self-service, agent, digital). Output is a populated top-intent table the WFM Lead and Voice/IVR Architect can extract baseline metrics against.',
      durationHours: 3,
      attendees: [
        'WFM Lead',
        'CX Operations VP',
        'Voice/IVR Architect',
        'Digital Channels Owner',
      ],
      usesTemplates: [
        'cc-ai-intent-inventory-workshop-guide',
        'containment-baseline-spreadsheet',
      ],
    },
    {
      id: 'cc-ai-baseline-and-transcript-audit',
      title: 'CC-AI baseline + transcript audit (Day 2)',
      description:
        'Three-hour Privacy + Data-Engineering led review that locks containment / AHT / CSAT / transfer-rate per top intent with verified data lineage and produces an audited representative transcript sample (50–100 redacted calls). Output is a decision-grade baseline and the proof that the intent classification holds.',
      durationHours: 3,
      attendees: [
        'WFM Lead',
        'Privacy Counsel / DPO',
        'Data Engineer / Analytics Owner',
      ],
      usesTemplates: [
        'containment-baseline-spreadsheet',
        'cc-ai-transcript-sampling-protocol',
      ],
    },
    {
      id: 'cc-ai-stakeholder-validation-and-readiness',
      title: 'CC-AI stakeholder validation + P2 readiness (Day 3)',
      description:
        'Two-hour synthesis-prep session: sponsor 1:1 to confirm the P0 hypothesis still holds against Day 1–2 evidence, and stakeholder-map lock with named owners and at least one named dissenter. Closes with a draft P2 readiness recommendation (proceed / re-scope / reclassify / stop).',
      durationHours: 2,
      attendees: [
        'CX / Operations Sponsor',
        'CX Operations VP',
        'WFM Lead',
      ],
      usesTemplates: [
        'wfm-stakeholder-interview-script',
        'cc-ai-discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'wfm-intent-classification-export',
      label: 'WFM intent classification model export (first cohort)',
      rationale:
        'Anchors the top-intent inventory in the same model the operating team uses every day; without it the inventory is a workshop artifact rather than a system-of-record reading.',
      format: 'structured-export',
      neededAt: 'data-discovery',
    },
    {
      id: 'containment-aht-csat-dashboard-pull',
      label: 'Containment / AHT / CSAT dashboard pull per top intent (last 90 days)',
      rationale:
        'Required to compute the per-intent baseline at the grain P3/P4 will use; aggregate contact-center metrics hide the intents where automation can actually move the number.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'audited-transcript-sample',
      label: 'Audited representative transcript sample (~50–100 calls per top intent, redacted)',
      rationale:
        'Proves the intent classification reflects what is actually said on the call; without it the baseline is dashboard-deep and P3 will rebuild the intent model from scratch.',
      format: 'text-summary',
      neededAt: 'baseline',
    },
    {
      id: 'ivr-agent-wfm-integration-map',
      label: 'IVR / agent-desktop / WFM integration map',
      rationale:
        'Names where each metric is captured and which system is authoritative for handle-path and transfer-rate; required for the Day 2 lineage attestation and to scope P2 architecture options.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'containment-metric-lineage-attestation',
      label: 'Containment-metric data-lineage attestation',
      rationale:
        'Owner-signed confirmation that the data path behind the containment dashboard is accurate and decision-grade; absence here triggers the `wishlist-baseline` anti-pattern and the metric must be flagged as not yet defensible.',
      format: 'PDF',
      neededAt: 'baseline',
    },
    {
      id: 'digital-channel-containment-pull',
      label: 'Digital-channel containment pull (chat / web / SMS, last 90 days)',
      rationale:
        'Lets the team test whether a digital cohort is the cleaner first pilot than voice; required input for the synthesis-prep cohort-confirmation conversation with the sponsor.',
      format: 'spreadsheet',
      neededAt: 'synthesis-prep',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-privacy-counsel-on-team',
      label: 'Confirm Privacy Counsel (or DPO) is named on the program team before transcript sampling begins',
      rationale:
        'Transcripts are personal data; sampling without privacy-side coverage either violates retention/redaction posture or has to be redone after the first audit finding.',
    },
    {
      id: 'schedule-day-1-intent-inventory',
      label: 'Schedule the Day 1 intent inventory workshop with WFM Lead in the next 5 business days',
      rationale:
        'WFM calendars run two to three weeks ahead in most contact centers; intent inventory is the gating workshop, and a slipped Day 1 cascades into a slipped baseline.',
    },
    {
      id: 'request-90-day-dashboard-pulls',
      label: 'Request 90-day containment / AHT / CSAT / transfer-rate pulls from the Data Engineer',
      rationale:
        'Some dashboard pulls take 2–3 business days even when prioritized; requesting at P1 kickoff (not Day 1) is the difference between a measured baseline and one filled in after the workshop.',
    },
    {
      id: 'confirm-first-cohort-with-sponsor',
      label: 'Confirm first cohort with sponsor — top-volume intents in voice OR digital, not both at once',
      rationale:
        'The `everywhere-charter` anti-pattern kills CC-AI programs; a P1 that tries to baseline voice and digital in the same cohort produces two thin reports instead of one defensible one.',
    },
    {
      id: 'author-falsifiable-hypothesis',
      label: 'Author a falsifiable hypothesis the Day 1 workshop can disprove',
      rationale:
        'Anti-confirmation discipline: workshops without a stated falsifier devolve into status updates, and Discovery becomes a search for evidence that supports the seed rather than tests it.',
    },
    {
      id: 'name-containment-metric-owner',
      label: 'Name the containment-metric owner and confirm they will sign the lineage attestation',
      rationale:
        'A contested or ownerless containment number is the most common reason CC-AI P1 packages fail the P2 gate; locking the owner before baseline capture prevents the rework loop.',
    },
  ],
};
