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
      // A CSV/XLSX dropped here is parsed into typed volumetrics facts, flipping
      // the ✦ Intelligence step insight from MODEL to LIVE.
      factTemplateCode: 'VOLUMETRICS_V1',
    },
    {
      id: 'scope.app-inventory',
      title: 'Provide the application inventory',
      subtitle: 'Run cost + retained-FTE cost per app',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload your application & system inventory (CSV or XLSX). We read per-app annual run cost, loaded FTE cost, and the variable-cost share — the facts the volume-band pricing and retained-cost levers need.',
      provenance: { owner: 'Ravi Menon, IT-Ops', source: 'CMDB / finance export' },
      cta: 'Confirm inventory',
      // Parsed into APP_INVENTORY_V1 facts (annual_run_cost, loaded_fte_cost,
      // variable_cost_share_pct) — flips the pricing / retained-cost levers LIVE.
      factTemplateCode: 'APP_INVENTORY_V1',
    },
    {
      id: 'scope.vendor-commercials',
      title: 'Provide vendor commercials & contract terms',
      subtitle: 'Transition, SLA credits, credits, term',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the vendor commercials sheet (CSV or XLSX): transition fee, overrun probability & cost multiple, SLA credit cap and at-risk fee pool, committed productivity credit, retained-FTE delta, and contract term. This lands the vendor-side facts the SLA, productivity-credit, and transition-risk levers need.',
      provenance: { owner: 'Procurement lead', source: 'Vendor proposal / commercials sheet' },
      cta: 'Confirm commercials',
      // Parsed into CONTRACT_TERMS_V1 facts — flips the SLA, productivity-credit,
      // transition-risk, and retained-cost levers LIVE.
      factTemplateCode: 'CONTRACT_TERMS_V1',
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

/**
 * The RFP stage scaffold. Mirrors the Scope three-beat structure but foregrounds
 * the one upload that flips RFP clause coverage LIVE: the RFP clause checklist
 * (one row per value lever, a Clause Included 1/0 column) parsed into
 * `rfp_clause_present` value_lever facts via `RFP_CLAUSES_V1`. The live stage
 * builder swaps in the fact-derived waterfall + intel lead over this structure.
 */
export const SAMPLE_RFP_STAGE: StageAnalyticsView = {
  stageKey: 'rfp',
  stageName: 'RFP',
  purpose:
    'Lock every priced lever into a required clause — the RFP is the last point to make value a requirement vendors must answer.',
  intel: {
    provenance: 'sample',
    lead: "Here's which levers your RFP already protects — confirm the clause checklist so nothing worth negotiating slips out exposed.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'Every value lever needs a matching RFP clause — the clause is what turns the value into a requirement, not a hope.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'An estimated ~70% of AMS RFPs omit the volume-band step-down clause — the buyer keeps paying peak-volume rates as tickets fall.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'An unprotected lever cannot be recovered in Evaluation or BAFO — vendors answer only what the RFP required.',
      },
    ],
  },
  tasks: [
    {
      id: 'rfp.clause-coverage',
      title: 'Confirm RFP clause coverage',
      subtitle: 'One row per value lever · 1/0 per clause',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the RFP clause checklist (CSV or XLSX): one row per value lever (the Lever Key column) with Clause Included set to 1 when the RFP draft requires that lever\'s protecting clause, 0 when it does not. This flips RFP clause coverage from a model to a live protected-vs-exposed read.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'RFP draft / clause checklist',
      },
      cta: 'Confirm clause coverage',
      // Parsed into RFP_CLAUSES_V1 → rfp_clause_present value_lever facts —
      // flips the ✦ Intelligence RFP clause coverage insight LIVE.
      factTemplateCode: 'RFP_CLAUSES_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Every priced lever has a clause',
        detail: 'Each value lever is protected by a required RFP clause.',
      },
      {
        label: 'BAFO fallbacks paired',
        detail: 'Each clause has its BAFO ask if it slips the RFP.',
      },
      {
        label: 'RFP final',
        detail: 'The RFP is ready to issue — advance to Responses.',
      },
    ],
    generates: [{ label: 'RFP package (final)', code: 'd09' }],
    nextStageName: 'Responses',
  },
};

/**
 * The Selection stage scaffold. Mirrors the Scope three-beat structure but
 * foregrounds the one upload that flips committed value LIVE: the award
 * commitments (one row per value lever, a Committed Value USD column) parsed into
 * `committed_value_usd` value_lever facts via `COMMITTED_VALUE_V1`. The live stage
 * builder swaps in the fact-derived waterfall + intel lead over this structure.
 */
export const SAMPLE_SELECTION_STAGE: StageAnalyticsView = {
  stageKey: 'selection',
  stageName: 'Selection',
  purpose:
    'Confirm the value the executed award actually locked — the award is the contract of record the Value step measures realization against.',
  intel: {
    provenance: 'sample',
    lead: "Here's what the award committed per lever — confirm each negotiated line survived into the executed contract, or it is value forfeited.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'The award is the contract of record — a lever priced and negotiated but not written into the award is value the buyer forfeits.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'A meaningful share of negotiated sourcing value is lost between BAFO and signature when concessions are not carried into contract language.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Without a committed-value confirmation, the Value step has no baseline to measure realization against — realization becomes unfalsifiable.',
      },
    ],
  },
  tasks: [
    {
      id: 'selection.committed-value',
      title: 'Confirm committed value at award',
      subtitle: 'One row per value lever · committed USD',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the award commitments (CSV or XLSX): one row per value lever (the Lever Key column) with Committed Value (USD) set to the value the executed award locked for that lever over the contract term. This flips committed value from a model to a live committed-vs-target read.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'Executed contract / award record',
      },
      cta: 'Upload the award commitments',
      // Parsed into COMMITTED_VALUE_V1 → committed_value_usd value_lever facts —
      // flips the ✦ Intelligence committed value insight LIVE.
      factTemplateCode: 'COMMITTED_VALUE_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Every priced lever carried into the award',
        detail: 'Each value lever’s committed value is confirmed against the executed contract.',
      },
      {
        label: 'Committed baseline set',
        detail: 'The committed value becomes the baseline the Value step measures realization against.',
      },
      {
        label: 'Award final',
        detail: 'The contract is executed — advance to Transition.',
      },
    ],
    generates: [{ label: 'Award commitment summary', code: 'd11' }],
    nextStageName: 'Transition',
  },
};

/**
 * The BAFO stage scaffold. Mirrors the Scope three-beat structure but foregrounds
 * the one upload that flips BAFO progress LIVE: the BAFO concession actuals (one row
 * per value lever, a Concession Captured USD column) parsed into
 * `bafo_concession_captured_usd` value_lever facts via `BAFO_CONCESSIONS_V1`. The
 * live stage builder swaps in the fact-derived waterfall + intel lead over this
 * structure.
 */
export const SAMPLE_BAFO_STAGE: StageAnalyticsView = {
  stageKey: 'bafo',
  stageName: 'BAFO',
  purpose:
    'Pull every open lever into a booked concession — BAFO is the last negotiation round, and a lever not captured here is captured never.',
  intel: {
    provenance: 'sample',
    lead: "Here's what BAFO has captured per lever vs its target — confirm the concession actuals so each open lever gets pressed before the round closes.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'Enter BAFO with a per-lever concession ask, not a lump-sum discount — a lever-level ask is defensible; "sharpen your pencil" is not.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Structured, lever-level BAFO asks recover materially more than a single "best price" round — the concession left un-booked is the concession that never lands.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'BAFO is the last negotiation round — a lever not captured here is captured never; the award locks whatever BAFO booked.',
      },
    ],
  },
  tasks: [
    {
      id: 'bafo.concession-actuals',
      title: 'Confirm BAFO concessions captured',
      subtitle: 'One row per value lever · captured USD',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the BAFO concession actuals (CSV or XLSX): one row per value lever (the Lever Key column) with Concession Captured (USD) set to the concession the BAFO round booked for that lever over the contract term. A lever with no row stays 0-captured / still-open. This flips BAFO progress from a model to a live captured-vs-target read.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'BAFO round / concession log',
      },
      cta: 'Upload the BAFO concession actuals',
      // Parsed into BAFO_CONCESSIONS_V1 → bafo_concession_captured_usd value_lever
      // facts — flips the ✦ Intelligence BAFO progress insight LIVE.
      factTemplateCode: 'BAFO_CONCESSIONS_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Every open lever pressed in BAFO',
        detail: 'Each value lever has a booked concession or a documented reason it stayed open.',
      },
      {
        label: 'Concessions booked per lever',
        detail: 'Each captured concession is booked against the lever it moves, so it is auditable at award.',
      },
      {
        label: 'BAFO final',
        detail: 'The best-and-final round is closed — advance to Executive Decision.',
      },
    ],
    generates: [{ label: 'BAFO concession summary', code: 'd10' }],
    nextStageName: 'Executive Decision',
  },
};

/**
 * The Responses stage scaffold. Mirrors the Scope three-beat structure but
 * foregrounds the one upload that flips Responses coverage LIVE: the vendor
 * response coverage matrix (one row per vendor × value lever, an Addressed 1/0/0.5
 * column) parsed into `response_addressed` vendor_lever facts via
 * `RESPONSE_COVERAGE_V1`. The live stage builder swaps in the fact-derived
 * waterfall + intel lead over this structure.
 */
export const SAMPLE_RESPONSES_STAGE: StageAnalyticsView = {
  stageKey: 'responses',
  stageName: 'Responses',
  purpose:
    'Map every vendor’s answer to every priced lever — a lever no vendor addressed is exposure to press in evaluation, not a settled price.',
  intel: {
    provenance: 'sample',
    lead: "Here's which levers your vendors answered vs dodged — confirm the response coverage so nothing worth negotiating is quietly conceded.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'A vendor answers only what the RFP required and it chose to address — a dodged lever is a negotiation opening, not a closed line.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Vendors most often dodge the volume-band step-down and SLA chronic-miss remedy — the two levers that cost the buyer most when left un-pressed.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'A lever no vendor addressed cannot be scored in evaluation — it slips to BAFO exposed, or to award unpriced.',
      },
    ],
  },
  tasks: [
    {
      id: 'responses.coverage',
      title: 'Confirm vendor response coverage',
      subtitle: 'One row per vendor × value lever · 1/0/0.5',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the vendor response coverage matrix (CSV or XLSX): one row per vendor × value lever, with Vendor set to the bidding vendor, Lever Key set to the canonical value-lever key, and Addressed set to 1 (addressed), 0 (dodged), or 0.5 (partial). This flips Responses coverage from a model to a live per-vendor answered-vs-dodged read.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'Vendor proposals / response matrix',
      },
      cta: 'Confirm response coverage',
      // Parsed into RESPONSE_COVERAGE_V1 → response_addressed vendor_lever facts —
      // flips the ✦ Intelligence Responses coverage insight LIVE.
      factTemplateCode: 'RESPONSE_COVERAGE_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Every lever mapped to each vendor’s answer',
        detail: 'Each value lever has a per-vendor addressed/dodged status.',
      },
      {
        label: 'Dodged levers flagged for evaluation',
        detail: 'Each dodged lever carries its evaluation-impact ask into scoring.',
      },
      {
        label: 'Responses complete',
        detail: 'All vendor responses are in — advance to Evaluation.',
      },
    ],
    generates: [{ label: 'Response coverage summary', code: 'd10' }],
    nextStageName: 'Evaluation',
  },
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

