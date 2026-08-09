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
      subtitle: 'Service-tower economics',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload service-tower volumetrics: change-order spend, avoidable share, projected volume decline, automatable effort pool, and chronic SLA miss rate.',
      provenance: { owner: 'Ravi Menon, IT-Ops', source: 'ITSM / finance baseline' },
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
    approver: 'Commercial owner',
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
    approver: 'Decision owner',
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
    approver: 'Commercial owner',
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
        'Upload one row per vendor × value lever: Vendor, Lever Key, and Addressed as 1, 0.5, or 0.',
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

/**
 * The Evaluation stage scaffold. Mirrors the Scope three-beat structure but
 * foregrounds the one upload that flips Evaluation should-cost LIVE: the vendor
 * bids (one row per vendor — a Headline Bid USD, a Retained FTE Delta, and an SLA
 * Credit Cap % column) parsed into `vendor_headline_bid` /
 * `vendor_retained_fte_delta` / `vendor_sla_credit_cap_pct` vendor-kind facts via
 * `VENDOR_BIDS_V1`. The live stage builder swaps in the fact-derived waterfall +
 * intel lead over this structure; should-cost normalizes each real bid and surfaces
 * the trap (cheapest headline ≠ lowest normalized TCO) from real facts.
 */
export const SAMPLE_EVALUATION_STAGE: StageAnalyticsView = {
  stageKey: 'evaluation',
  stageName: 'Evaluation',
  purpose:
    'Normalize every bid to should-cost — the cheapest headline is a trap once retained-client cost and weak-SLA risk are priced in; the lowest TRUE TCO is the real winner.',
  intel: {
    provenance: 'sample',
    lead: "Here's each vendor's headline bid normalized to true TCO — confirm the bid inputs so the paper-cheapest bid can't win on a number that hides retained cost and SLA risk.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'A headline price is not a TCO — the cheapest bid often pushes the most effort back onto the retained team and offers the thinnest SLA remedies, so it loses once normalized.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Best-in-class AMS evaluations rank on normalized should-cost (headline + retained-FTE cost + weak-remedy risk), not list price — the flip after normalization is where the real winner appears.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Score on headline price alone and you award the trap — the retained cost and SLA-credit exposure surface after signature, when they are no longer negotiable.',
      },
    ],
  },
  tasks: [
    {
      id: 'evaluation.vendor-bids',
      title: 'Confirm vendor bids for should-cost',
      subtitle: 'One row per vendor · headline bid, retained FTE, SLA cap',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload one row per vendor: headline bid, retained-FTE delta, and SLA credit cap. Source normalizes bids from those facts.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'Vendor proposals / bid tabulation',
      },
      cta: 'Upload the vendor bids',
      // Parsed into VENDOR_BIDS_V1 → vendor_headline_bid / vendor_retained_fte_delta /
      // vendor_sla_credit_cap_pct vendor facts — flips the ✦ Intelligence Evaluation
      // should-cost insight LIVE (normalized per real bid, surfacing the trap).
      factTemplateCode: 'VENDOR_BIDS_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Every bid normalized to should-cost',
        detail: 'Each vendor’s headline bid carries its retained-FTE cost and SLA-credit risk into a true TCO.',
      },
      {
        label: 'The trap surfaced',
        detail: 'The paper-cheapest bid is checked against the lowest normalized TCO — the flip, if any, is on the record.',
      },
      {
        label: 'Evaluation complete',
        detail: 'Bids are normalized and ranked — advance to Pricing.',
      },
    ],
    generates: [{ label: 'Should-cost evaluation summary', code: 'd10' }],
    nextStageName: 'Pricing',
  },
};

/**
 * The Pricing stage scaffold. Keeps the step checklist aligned with the pricing
 * stage while the live value waterfall carries the computed economics.
 */
export const SAMPLE_PRICING_STAGE: StageAnalyticsView = {
  stageKey: 'pricing',
  stageName: 'Pricing',
  purpose:
    'Normalize supplier commercials to comparable TCO, expose assumptions, and prepare the pricing position for BAFO.',
  intel: {
    provenance: 'sample',
    lead: "Here's the commercial comparison that needs confirmation before negotiation: normalized price, assumptions, and outlier traps.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'Pricing is where supplier offers become comparable. Unit rates, transition costs, escalators, and retained effort need one normalized basis.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Strong sourcing events separate headline price from TCO before BAFO, so the negotiation targets the real cost drivers.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Without normalized pricing, BAFO asks become generic discounts and hidden assumptions survive into the award decision.',
      },
    ],
  },
  tasks: [
    {
      id: 'pricing.normalized-supplier-pricing',
      title: 'Confirm normalized supplier pricing',
      subtitle: 'Vendor pricing · TCO · assumptions',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload or confirm the normalized supplier pricing package: vendor price lines, transition costs, assumptions, escalators, and comparable TCO by finalist. This is stage evidence for the pricing decision; it does not use a fact-template parser yet.',
      provenance: {
        owner: 'Sourcing lead',
        source: 'Supplier pricing submissions / normalization workbook',
      },
      cta: 'Upload normalized pricing',
    },
  ],
  gate: {
    approver: 'Commercial owner',
    confirms: [
      {
        label: 'Supplier pricing normalized',
        detail: 'Finalist pricing is on a comparable TCO basis.',
      },
      {
        label: 'Assumptions and traps reviewed',
        detail: 'Escalators, one-time costs, exclusions, and retained effort are visible.',
      },
      {
        label: 'Pricing ready for BAFO',
        detail: 'The commercial position is ready to convert into BAFO asks.',
      },
    ],
    generates: [
      { label: 'Pricing normalization workbook', code: 'd19' },
      { label: 'Pricing trap log', code: 'd20' },
    ],
    nextStageName: 'BAFO',
  },
};

/**
 * The Executive Decision stage scaffold. Keeps the decision checklist distinct
 * from Scope and focused on the recommendation, value case, and risk approval.
 */
export const SAMPLE_EXECUTIVE_DECISION_STAGE: StageAnalyticsView = {
  stageKey: 'executive_decision',
  stageName: 'Executive Decision',
  purpose:
    'Present the recommendation, value case, and residual risks so the executive owner can approve the award path.',
  intel: {
    provenance: 'sample',
    lead: "Here's the decision posture to confirm: recommended path, economics, risks, and approval conditions.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'The decision stage is not another intake gate. It is the point where value, risk, and supplier recommendation are put on the record.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'A defensible executive decision keeps price, delivery risk, transition exposure, and dissenting views visible in one approval packet.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Without a decision packet, award approval becomes a memory of the sourcing process instead of an auditable decision.',
      },
    ],
  },
  tasks: [
    {
      id: 'executive-decision.recommendation-packet',
      title: 'Confirm executive recommendation packet',
      subtitle: 'Recommendation · value case · risk conditions',
      type: 'decide',
      state: 'todo',
      guide:
        'Review the executive decision packet: recommended supplier, value case, residual risks, stakeholder objections, and approval conditions. Confirm that the decision owner has what they need to approve the award path.',
      provenance: {
        owner: 'Executive sponsor',
        source: 'Decision brief / risk register / value ledger',
      },
      cta: 'Confirm recommendation packet',
    },
  ],
  gate: {
    approver: 'Decision owner',
    confirms: [
      {
        label: 'Recommendation reviewed',
        detail: 'The preferred path and supporting rationale are visible to the decision owner.',
      },
      {
        label: 'Value and risk accepted',
        detail: 'Residual risks and value assumptions are documented with approval conditions.',
      },
      {
        label: 'Decision ready for selection',
        detail: 'The award path is approved to move into Selection.',
      },
    ],
    generates: [
      { label: 'Executive decision brief', code: 'd21' },
      { label: 'Decision approval record', code: 'd22' },
    ],
    nextStageName: 'Selection',
  },
};

/**
 * The Transition stage scaffold. Keeps go-live and handoff work distinct from
 * Scope intake while the value baseline prepares for realization tracking.
 */
export const SAMPLE_TRANSITION_STAGE: StageAnalyticsView = {
  stageKey: 'transition',
  stageName: 'Transition',
  purpose:
    'Track the awarded supplier into service: knowledge transfer, cutover readiness, blockers, and the value baseline for go-live.',
  intel: {
    provenance: 'sample',
    lead: "Here's the transition posture to confirm before go-live: milestones, blockers, handoff evidence, and measurement readiness.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'Transition is execution control, not scope intake. The stage should show cutover, handoff, and go-live evidence.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'Strong supplier transitions make blockers and knowledge-transfer gaps visible before go-live, when recovery options still exist.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Without transition evidence, go-live risk gets discovered after handoff and value measurement starts from an untrusted baseline.',
      },
    ],
  },
  tasks: [
    {
      id: 'transition.go-live-readiness',
      title: 'Confirm transition go-live readiness',
      subtitle: 'Milestones · blockers · knowledge transfer',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload or confirm the transition readiness packet: milestone tracker, open blockers, knowledge-transfer evidence, cutover plan, rollback plan, and go-live owner confirmation.',
      provenance: {
        owner: 'Transition owner',
        source: 'Transition tracker / go-live checklist / knowledge-transfer log',
      },
      cta: 'Upload transition readiness',
    },
  ],
  gate: {
    approver: 'Transition owner',
    confirms: [
      {
        label: 'Milestones reviewed',
        detail: 'Transition milestones are complete, deferred with approval, or flagged with owners.',
      },
      {
        label: 'Go-live blockers visible',
        detail: 'Open blockers, rollback needs, and cutover risks are documented.',
      },
      {
        label: 'Ready for value tracking',
        detail: 'The go-live baseline is ready for the Value stage to measure realization.',
      },
    ],
    generates: [
      { label: 'Transition readiness tracker', code: 'd23' },
      { label: 'Go-live checklist', code: 'd24' },
    ],
    nextStageName: 'Value',
  },
};

/**
 * The Value stage scaffold. Mirrors the Scope three-beat structure but foregrounds
 * the one upload that flips value realization LIVE: the realized-value actuals (one
 * row per value lever, a Realized Value To Date USD column) parsed into
 * `realized_value_usd` value_lever facts via `VALUE_REALIZATION_V1`. The live stage
 * builder swaps in the fact-derived waterfall + intel lead over this structure.
 *
 * The Value stage is Atlas-owned in the rail (transition & value, steps 10–11); this
 * scaffold keeps the dropzone + insight consistent with how the other stages render
 * so realization goes live the same way committed value / BAFO progress do. The
 * realized read is a realized-to-date SNAPSHOT, not a per-period series — the full
 * per-period time-series is a deferred enhancement.
 */
export const SAMPLE_VALUE_STAGE: StageAnalyticsView = {
  stageKey: 'value',
  stageName: 'Value',
  purpose:
    'Prove the committed value is actually being realized — an un-tracked committed value reverts to incumbent run-rate within a year or two, so book realized value per lever against what the award committed.',
  intel: {
    provenance: 'sample',
    lead: "Here's what has been realized to date per lever vs what the award committed — confirm the realized actuals so the committed value is a result, not a promise.",
    points: [
      {
        tone: 'archetype',
        tag: 'Archetype',
        text: 'Book realized value per lever against the committed line it maps to — value not measured against a committed lever is value that quietly leaks back.',
      },
      {
        tone: 'benchmark',
        tag: 'Benchmark',
        text: 'An estimated 40–60% of negotiated sourcing value is never measured post-award; without a realization track the committed value is a promise, not a result.',
      },
      {
        tone: 'without',
        tag: 'Without this',
        text: 'Realization is where the whole event pays off or leaks — an un-tracked committed value reverts to incumbent run-rate within a year or two.',
      },
    ],
  },
  tasks: [
    {
      id: 'value.realized-actuals',
      title: 'Confirm realized value to date',
      subtitle: 'One row per value lever · realized-to-date USD',
      type: 'provide',
      state: 'todo',
      guide:
        'Upload the realized-value actuals (CSV or XLSX): one row per value lever (the Lever Key column) with Realized Value To Date (USD) set to the value realized so far for that lever over the contract term (a cumulative realized-to-date snapshot, not annualized or per-period). A lever with no row stays "not yet realized". This flips value realization from a model to a live realized-vs-committed read.',
      provenance: {
        owner: 'Value realization lead',
        source: 'Run-cost / SLA-credit / productivity actuals record',
      },
      cta: 'Upload the realized-value actuals',
      // Parsed into VALUE_REALIZATION_V1 → realized_value_usd value_lever facts —
      // flips the ✦ Intelligence value realization insight LIVE (realized-to-date
      // vs committed per lever).
      factTemplateCode: 'VALUE_REALIZATION_V1',
    },
  ],
  gate: {
    approver: 'K. Oshima, CIO',
    confirms: [
      {
        label: 'Realized value booked per lever',
        detail: 'Each committed lever has a realized-to-date figure or a documented reason it has not yet realized.',
      },
      {
        label: 'Realization measured against committed',
        detail: 'Realized value is compared to what the award committed, so leakage is visible before it compounds.',
      },
      {
        label: 'Value tracked',
        detail: 'The realization track is live — the event value is being measured, not assumed.',
      },
    ],
    generates: [{ label: 'Value realization summary', code: 'd12' }],
    nextStageName: 'Closed',
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
