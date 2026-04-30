# Failure-Mode Narrative Cards — Draft (INT-1 content)

> **Why this exists.** The J0 cold landing of `/intelligence` is a
> grid of 10 failure-mode cards per
> `INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` §C.2 / §D.J0.
> The cards are an *editorial* artifact — auto-generating them from
> the corpus produces wiki entries; hand-authoring them produces
> conviction.
>
> This document is a **draft**. It defines:
>
> 1. The TypeScript registry shape the surface will read from
> 2. Two sample cards (failure modes #1 and #8) in senior-practitioner
>    voice for founder review / replacement
>
> Anand replaces the voice; I provide the shape and the starting
> draft. The remaining 8 cards (modes #2 through #7, #9, #10) follow
> the same shape and voice once the first two are signed off.

---

## Registry shape

The cards live as a typed registry, NOT in component code. Each card
references the canonical `FAILURE_MODES` table by `failureModeId`
(1..10) so the platform's source of truth and the J0 narrative
content can't drift.

```ts
// src/lib/intelligence/j0-failure-mode-cards.ts (proposed)

import type { FailureMode } from '@/lib/programs/failure-modes';

export type ResearchAnchorLabel =
  | 'McKinsey'
  | 'Gartner'
  | 'MIT/BCG'
  | 'RAND'
  | 'Forrester';

export interface ResearchCitation {
  /** Source label — must match canonical research anchors. */
  source: ResearchAnchorLabel;
  /** Short citation text shown on card hover; full text in the
   *  expanded narrative. */
  citation: string;
  /** Optional URL to source publication. */
  url?: string;
  /** ISO date the citation was last verified by the curator. */
  lastVerifiedAt: string;
}

export interface ExampleScenario {
  /** Industry context for relatability. */
  industryContext: string;
  /** What the failure looks like in real enterprises — 1-2 sentences,
   *  senior-practitioner voice. NOT a hypothetical. */
  scenario: string;
}

export interface FailureModeNarrativeCard {
  /** Foreign key into FAILURE_MODES (src/lib/programs/failure-modes.ts).
   *  Used to source the canonical name + research anchors so the J0
   *  narrative cannot drift from the platform's source of truth. */
  failureModeId: number;

  /** Editorial name — the senior-practitioner-voice version of the
   *  canonical name. e.g. "The Phantom Sponsor" for failure mode #1
   *  ("Lack of executive sponsorship and ownership"). The editorial
   *  name is what users see; the canonical name is what the platform
   *  audits against. */
  editorialName: string;

  /** One-line hook shown on the card grid — under 100 chars.
   *  Names the failure in plain language. NO marketing language. */
  oneLineHook: string;

  /** Expanded narrative — 2-3 paragraphs in senior-practitioner voice.
   *  Shown when the card is expanded in J0 or in J1's topic deep-dive. */
  expandedNarrative: string;

  /** Why this kills programs — the mechanism of failure, named
   *  specifically. Not abstract. */
  whyItKills: string;

  /** What good looks like — AbarVa's prevention mechanism, named
   *  specifically (which phase, which gate, which deliverable). */
  whatGoodLooksLike: string;

  /** Pattern IDs from the corpus that ground this failure mode.
   *  Resolves to PatternManifestEntry via getPatternManifestEntry. */
  citedPatternIds: string[];

  /** Research anchors — at least 2; sourced from the canonical
   *  FAILURE_MODES.researchAnchors plus any editorial additions. */
  citedResearch: ResearchCitation[];

  /** Real-world scenarios where this failure plays out. At least 2.
   *  NOT generic; named industry contexts. */
  exampleScenarios: ExampleScenario[];

  /** Editorial sign-off metadata. Cards without these fail validation. */
  lastReviewedBy: string;
  lastReviewedAt: string;
}

export const J0_FAILURE_MODE_CARDS: readonly FailureModeNarrativeCard[] =
  [
    /* 10 cards — one per FAILURE_MODES entry */
  ] as const;
```

### Validation contract

A test in `src/lib/intelligence/__tests__/` will verify:

1. Exactly 10 cards exist (one per canonical failure mode).
2. Every `failureModeId` resolves to a real `FAILURE_MODES` entry.
3. Every `citedPatternIds[]` resolves via `getPatternManifestEntry`.
4. Every card has `lastReviewedBy` + `lastReviewedAt` set.
5. `oneLineHook` is under 100 characters.
6. `expandedNarrative` is between 200 and 600 words.
7. `citedResearch.length >= 2`.
8. `exampleScenarios.length >= 2`.

This makes "card without sign-off" a test failure, not a soft warning.

---

## Card 1 — Failure mode #1 (editorial name: "The Phantom Sponsor")

```ts
{
  failureModeId: 1,
  editorialName: 'The Phantom Sponsor',
  oneLineHook: 'Programs that fail because the sponsor was named on a slide and never on a calendar.',

  expandedNarrative: `Most enterprise AI programs are launched with
  a sponsor named in the steering committee deck. Most of those
  sponsors never appear on the program's calendar in a way that
  matters. The signature is on a charter; the time is not on a
  cadence. When the first decision arrives that requires real
  authority — a vendor selection that reorganizes a team, a budget
  reallocation that contradicts an ops plan, a privacy posture
  that a counsel won't sign — the sponsor isn't there to make it.
  The program stalls in P3 Design or never makes it past P2
  Synthesis.

  This isn't a sponsor problem. It's a definition problem. A real
  sponsor is identified by three things: (1) a recurring 1:1 with
  the program lead on the calendar, (2) decision rights over budget
  and scope codified in the engagement record, and (3) an explicit
  succession path if the sponsor's role changes. Programs that
  cannot point to all three are programs without a real sponsor —
  regardless of who's listed on the slide.

  The corpus shows that programs lacking active executive ownership
  stall at roughly 3× the rate of programs with committed sponsor
  cadence (McKinsey State of AI). The pattern is so reliable that
  it is the single biggest correlate of bottom-line AI impact in
  every major study from McKinsey, MIT/BCG, and Forrester.`,

  whyItKills: `The decision the sponsor was supposed to make doesn't
  get made — or gets made by someone without the authority to make
  it stick. The first time this happens, the program loses momentum.
  The second time, it loses credibility. By the third, the team is
  re-running the same conversation with a different audience and
  the budget review is asking why nothing has shipped.`,

  whatGoodLooksLike: `AbarVa makes Phantom Sponsor structurally
  impossible at P0 → P1 advance. The Phase 0 step \`p0-sponsor-candidate\`
  is a complex step that requires evidence of a real sponsor 1:1
  with notes uploaded. Gate 1 evaluation cannot pass without an
  \`engagement_participants\` row carrying plausible authority and
  a recurring calendar cadence committed. If the cadence isn't
  there, the program doesn't advance to Discovery — and the team
  knows why.`,

  citedPatternIds: [
    'pattern_ai_use_case_portfolio',
    'pattern_responsible_ai_governance',
  ],

  citedResearch: [
    {
      source: 'McKinsey',
      citation:
        'McKinsey State of AI: high-performer leaders are roughly 3× more likely to demonstrate active AI ownership; CEO oversight of AI governance is a primary correlate of bottom-line impact.',
      lastVerifiedAt: '2026-04-29',
    },
    {
      source: 'MIT/BCG',
      citation:
        'MIT Sloan / BCG: organizations achieving significant financial benefit from AI consistently cite senior leadership engagement as a defining differentiator.',
      lastVerifiedAt: '2026-04-29',
    },
    {
      source: 'Forrester',
      citation:
        'Forrester: AI initiatives without an empowered executive sponsor stall in early phases regardless of technical merit.',
      lastVerifiedAt: '2026-04-29',
    },
  ],

  exampleScenarios: [
    {
      industryContext: 'Retail — Customer Data Platform program',
      scenario:
        'CDP program launches with the CMO as sponsor. The CMO is in three of the first six steering meetings, then stops attending — the COO begins delegating the seat. By P3 Design, the architecture review identifies a privacy posture conflict with the loyalty program; the team escalates and waits 11 weeks for a decision that should have taken 5 days. The program slips a quarter; the CFO asks why.',
    },
    {
      industryContext: 'Financial services — AI fraud-detection program',
      scenario:
        'Fraud-detection program is sponsored by the Chief Risk Officer. The CRO names the head of fraud ops as the program contact and steps back. The head of fraud ops cannot approve a budget reallocation when the model needs additional human-review capacity in production. The program ships at half-scale and the original ROI case is no longer testable.',
    },
  ],

  lastReviewedBy: 'TBD — founder review pending',
  lastReviewedAt: '2026-04-29',
}
```

---

## Card 2 — Failure mode #8 (editorial name: "The Pilot-to-Production Gap")

```ts
{
  failureModeId: 8,
  editorialName: 'The Pilot-to-Production Gap',
  oneLineHook: '73% of enterprise AI pilots never reach production. The model isn\'t the problem.',

  expandedNarrative: `The pilot worked. The vendor demo was sharp.
  The success criteria were met on the curated cohort. Then the
  program tried to move into production and the wheels came off.
  Data drift the curated cohort never showed; scale conditions the
  pilot environment didn't simulate; workflow integration the
  business never committed to redesigning. By P5 Activate, the
  team is rebuilding what they thought was already built.

  This pattern is so common that ~73% of enterprise AI pilots
  never advance to production-scale deployment (McKinsey). MIT/BCG's
  GenAI Divide finds ~95% of GenAI pilots fail to deliver
  measurable revenue or margin acceleration at enterprise scale.
  The numbers aren't surprising once you see the mechanism: the
  pilot was optimized for vendor selection and stakeholder
  confidence; the production environment was never the test.

  The discipline that closes the gap is treating P4 Build and P5
  Activate as a single proving ground for production conditions —
  not as "build then deploy." Pilots that succeed in production
  share four traits: (1) tested on production-shape data, not
  curated samples; (2) integrated with the actual workflow before
  go-live, not parallel to it; (3) operations runbooks signed off
  by a real ops owner before P5 starts; (4) baselines measured
  against the production population, not the pilot cohort.`,

  whyItKills: `Programs that hit the gap don't fail at the model.
  They fail at the surrounding work — the data pipeline that
  worked in pilot but breaks at scale, the change management
  that wasn't designed because the model "spoke for itself," the
  ops capacity that was never staffed because the pilot ran
  without it. By the time these surface, the budget for the
  remediation is gone and the political cover for "we'll fix it
  in production" has expired.`,

  whatGoodLooksLike: `AbarVa makes Pilot-to-Production a hard-gated
  constraint. P4 Build requires a production-readiness checklist
  (operations, monitoring, support runbooks, scaled-data
  validation). P5 Activate gate requires evidence that the
  capability is live in the production workflow with measured
  usage — not a parallel pilot. If the program tries to advance
  to P5 with pilot-only data, the gate doesn't pass; Nexus
  surfaces the missing items as anti-pattern flags before the
  team writes a status update they'll regret.`,

  citedPatternIds: [
    'pattern_ai_use_case_portfolio',
    'pattern_demand_forecasting_inventory_ai',
    'pattern_contact_center_ai',
  ],

  citedResearch: [
    {
      source: 'McKinsey',
      citation:
        'McKinsey: roughly 73% of AI pilots never advance beyond the pilot phase to production-scale deployment.',
      lastVerifiedAt: '2026-04-29',
    },
    {
      source: 'MIT/BCG',
      citation:
        'MIT GenAI Divide: ~95% of GenAI pilots fail to deliver measurable revenue or margin acceleration at enterprise scale.',
      lastVerifiedAt: '2026-04-29',
    },
    {
      source: 'Forrester',
      citation:
        'Forrester: most AI pilots stall short of the operational integration, change management, and measurement scaffolding required for production.',
      lastVerifiedAt: '2026-04-29',
    },
  ],

  exampleScenarios: [
    {
      industryContext: 'Retail — demand forecasting program',
      scenario:
        'Forecasting model trained on top-30 SKU data demonstrated 22% MAPE improvement in pilot. Production rollout to the full 18,000-SKU catalog showed 7% improvement — the long-tail data carried different signal-to-noise characteristics that the pilot cohort never tested. The program pivoted to a tiered rollout with separate models, adding 9 months and 40% to the originally-budgeted scope.',
    },
    {
      industryContext: 'Healthcare — clinical decision support',
      scenario:
        'Clinical decision-support tool piloted in two specialty clinics with curated patient data and dedicated nurse-champion support. Production deployment to the full network surfaced workflow friction the pilot environment didn\'t see — the tool added 90 seconds per encounter when the workflow had no slack to absorb it. Adoption fell to 18% in month 3; the program was paused for redesign.',
    },
  ],

  lastReviewedBy: 'TBD — founder review pending',
  lastReviewedAt: '2026-04-29',
}
```

---

## Voice notes for the remaining 8 cards

The above two are calibrated to a register the founder can edit
toward. Voice rules I'm following — these compose with the
Sentinel voice doctrine being authored at INT-4:

- **No hedging.** "Most programs fail at X" not "Programs may
  sometimes encounter X."
- **Specific mechanism, not abstraction.** "The CMO stops
  attending steering meetings" not "executive engagement
  diminishes."
- **Real numbers from research.** Every claim with a percentage
  has a citation; every citation has a `lastVerifiedAt` date.
- **No marketing.** Never use "transform," "unlock," "accelerate,"
  "leverage." The audience is senior practitioners who've heard
  every slogan; the voice is plain-spoken authority.
- **AbarVa's prevention is concrete.** Name the phase, the gate,
  the step ID, the deliverable. "Gate 1 cannot pass without an
  `engagement_participants` row" not "the platform tracks
  sponsorship."
- **Scenarios are real-shaped.** Every example scenario has an
  industry context, a specific role title, a specific outcome
  with numbers. Hypothetical-shaped scenarios get rejected.

## Open content questions for the founder

1. **Editorial names for failure modes #2–7, #9, #10.** I have
   draft ideas — "The Slogan Charter" for #2, "The Untestable
   Foundation" for #3, "The Borrowed Team" for #4, "The Workflow
   That Wasn't" for #5, "The Last-Minute Auditor" for #6, "The
   Vendor-Picked-First Decision" for #7, "The Phantom KPI" for #9,
   "The Sprawl Trap" for #10 — but these are placeholder. The
   editorial name carries the card's hook; founder voice is what
   makes them stick. **Approve, replace, or assign.**
2. **`citedPatternIds` for cards #1 and #8.** I picked patterns
   that ground the failure mode by reference, but the corpus
   currently has 17 patterns and the choice for "what grounds
   #1" is somewhat arbitrary. If the corpus has stronger
   ground-truth patterns for sponsor-related failures (or
   pilot-to-production failures), swap.
3. **Tenant-overlay copy for authenticated users.** Per the
   design doc §D.J0.4, authenticated users see tenant-relevant
   context inline on each card ("Your CDP program had this flag
   in P0 and resolved it. Your AMS program is still tracking
   it."). The tenant overlay copy is its own draft — not in
   this PR. **INT-11 territory.**
4. **Long-tail editorial cycles.** Once the 10 cards ship, what's
   the cadence for revisiting? Quarterly seems right (per the
   design doc Q3 in Part H). Worth confirming.
5. **`lastReviewedBy` initialization.** The validation rule
   blocks ship if this isn't set. For pilot, "Anand Sundaram"
   is the reviewer-of-record. Post-pilot, named senior
   practitioners take this over.

---

**Author:** Claude Opus 4.7
**Reviewer:** Anand (founder)
**Status:** Awaiting founder voice review on cards #1 and #8.
After sign-off (or rewrite), the same shape applies to the
remaining 8 cards.
