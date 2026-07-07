// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE view-model for the redesigned Source canvas — Scope stage exemplar.
//
// This is illustrative intelligence used to render the redesigned canvas while
// the real value-analytics slice (structured intake → fact model → evaluators)
// is being built. Every view produced here carries `provenance: 'sample'`, so
// the canvas renders the "sample intelligence" honesty note. The moment the
// evaluator slice can return live `StageAnalyticsView` / `ValueWaterfallView`,
// the canvas swaps to it and the note drops.
//
// The numbers mirror the approved standalone prototype (Apex AMS 2026) and the
// AMS archetype's value types — they are plausible, ranged, and cited, but NOT
// tenant-real. Do not present them as a live savings claim.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AvaLauncherView,
  StageAnalyticsView,
} from './view-model';

/** The Scope stage, rendered as the intake exemplar of the three-beat pattern. */
export const SAMPLE_SCOPE_STAGE: StageAnalyticsView = {
  stageKey: 'scope',
  stageName: 'Scope',
  purpose:
    'Define the work precisely, from evidence — so the RFP is built on facts, not assumptions.',
  intel: {
    provenance: 'sample',
    lead: "Here's what we already know about your estate — you're confirming, not starting from scratch.",
    points: [
      {
        tone: 'found',
        tag: 'Found',
        text: '147 apps inventoried from CMDB — 22 Tier-1, 4 with no owner, 2 mid-decommission flagged.',
      },
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'AMS scope needs volumetrics and a retained-responsibility boundary — both templated for you.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Comparable AMS events run ~4,200 L2/L3 tickets/mo — your baseline will confirm the band.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Scoping without ticket volumes yields an Outline-tier RFP that vendors pad against.',
      },
    ],
  },
  tasks: [
    {
      id: 'scope.apps',
      title: 'Confirm the applications in scope',
      subtitle: '147 apps · pre-filled',
      type: 'confirm',
      state: 'done',
      guide:
        'We pre-filled your application inventory from the enterprise systems. Review it and accept — nothing to upload.',
      rows: [
        { key: 'Applications in scope', value: '147 across 3 tiers' },
        { key: 'Business-critical (Tier 1)', value: '22 apps' },
        { key: 'Apps missing an owner', value: '4 — worth a look', flag: true },
      ],
      cta: 'Accept inventory',
    },
    {
      id: 'scope.volumetrics',
      title: 'Provide the volumetrics',
      subtitle: 'Ticket history + 18-month baseline',
      type: 'provide',
      state: 'todo',
      guide:
        "The one thing we can't pre-fill. Upload your ticket history so we can size the support tier from real volumes.",
      provenance: { owner: 'Ravi Menon, IT-Ops', source: 'ServiceNow export' },
      cta: 'Confirm volumetrics',
    },
    {
      id: 'scope.exclusions',
      title: "Confirm what's out of scope",
      subtitle: '6 exclusions',
      type: 'decide',
      state: 'done',
      guide:
        "Decide what the vendor isn't responsible for. We've started the list for you — fill in the rest.",
      template: {
        format: 'XLSX',
        name: 'Exclusions log',
        meta: 'Started for you, with 6 suggested exclusions',
      },
      rows: [
        { key: 'End-user device support', value: 'Retained in-house' },
        { key: 'Cybersecurity SOC', value: 'Separate contract' },
        { key: '2 apps mid-decommission', value: 'Flagged as ambiguous', flag: true },
      ],
      cta: 'Confirm exclusions',
    },
    {
      id: 'scope.matrix',
      title: 'Confirm retained vs. vendor',
      subtitle: 'Responsibility matrix + SLA',
      type: 'decide',
      state: 'done',
      guide:
        'Draw the line between your retained team and the vendor. Fill the matrix, attach your SLA baseline.',
      template: {
        format: 'XLSX',
        name: 'Retained-responsibility matrix',
        meta: 'Pre-filled with a row per tower',
      },
      file: {
        format: 'PDF',
        name: 'current-sla-baseline-2025.pdf',
        meta: 'SLA baseline · uploaded',
      },
      cta: 'Confirm matrix',
    },
    {
      id: 'scope.sponsor',
      title: 'Sponsor commitment',
      subtitle: 'Signed commitment letter',
      type: 'provide',
      state: 'todo',
      guide:
        'The last step. Upload the signed letter — it records that leadership stands behind the scope going into RFP.',
      provenance: {
        owner: 'Katherine Oshima, CIO',
        source: 'Template in your readiness pack',
      },
      cta: 'Upload letter',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Evidence complete',
        detail: 'Everything provided reached a usable state.',
      },
      {
        label: 'Exclusions reviewed',
        detail: 'The logged exclusions have been reviewed.',
      },
      {
        label: 'Scope final',
        detail: 'The boundary is correct — advance to RFP.',
      },
    ],
    generates: [
      { label: 'Scope Memo', code: 'd05' },
      { label: 'Exclusions Log (compiled)', code: 'd06' },
      { label: 'RFP draft', code: 'd09' },
      { label: 'Your RFP readiness pack', isReadinessPack: true },
    ],
    nextStageName: 'RFP',
  },
  // No value-type waterfall on Scope: the classified value pool is a downstream
  // artifact (Pricing/Evaluation/Value), computed from real facts — never
  // fabricated at an intake stage. The Intelligence tab here is the read only.
};

/** aVa's docked-launcher scope for the Scope stage. */
export const SAMPLE_SCOPE_AVA: AvaLauncherView = {
  role: 'Analyst · Scope',
  context:
    'Two steps left on Scope — volumetrics and the sponsor letter. Nothing is blocking; finish those and the gate arms.',
  suggestions: [
    "What's left before the gate?",
    'Draft the scope memo from what we have',
    'Who owns the ticket extract?',
  ],
};

