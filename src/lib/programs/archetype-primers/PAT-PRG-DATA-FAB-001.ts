// PR-OV2-3a-FORECAST: Demand Forecasting archetype primer (PAT-PRG-DATA-FAB-001).
//
// Source: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md Sections
// D.0.3 (parameterized P0), D.1.3 (parameterized P1), and D.1.8 Scenario D
// (Apex Demand Forecasting worked example for P1). The primer turns the P0
// brief into a Phase 1 plan for a forecasting program: granularity decision,
// baseline-with-bias-distribution discipline, and S&OP cadence inventory.
//
// The pattern id `PAT-PRG-DATA-FAB-001` is the data-fabric pattern id used by
// the seeded Apex Demand Forecasting AI program (per OV2-1d-archetype #1181).
// The catalog reuses the data-fabric pattern for forecasting because Apex's
// forecasting program is anchored on the data-foundation work; a dedicated
// PAT-PRG-FORECAST-001 is provisional in the design doc and not yet seeded.

import type { ArchetypePrimer } from './types';

export const DEMAND_FORECASTING_PRIMER: ArchetypePrimer = {
  patternId: 'PAT-PRG-DATA-FAB-001',
  displayName: 'Demand Forecasting',

  p1OutcomeStatement:
    'Phase 1 closes when three artifacts are locked at a single, named granularity: ' +
    '(1) a granularity decision — SKU-store-week vs. category-region-month vs. ' +
    'brand-quarter — chosen with rationale by the Demand Planner and Supply Chain ' +
    'VP, because every downstream baseline, value mechanism, and consumption ' +
    'commitment depends on it; (2) a 12-month forecast-vs-actual baseline at that ' +
    'granularity that exposes the *distribution* of error and the *bias structure* ' +
    '(over- or under-forecast by season, by promotion, by lifecycle stage) — not ' +
    'an aggregate MAPE, because a flat 25% MAPE with structural promotional ' +
    'under-forecast is a different program than a flat 25% randomly distributed; ' +
    '(3) an S&OP cadence inventory naming who currently consumes the forecast, at ' +
    'what cadence, with what decision rights, because a forecast the business ' +
    'never adopts is the most common reason demand-forecasting programs fail to ' +
    'renew. P1 is not a model-vs-vendor evaluation — P2 owns that — and P1 is not ' +
    'a model build. P1 is the proof that the accuracy gap is real, structurally ' +
    'understood at a decision-grade grain, and that there is a named consumption ' +
    'path the eventual model can land into.',

  smes: [
    {
      role: 'Demand Planner',
      rationale:
        'Owns the granularity decision and the operational forecast today; without their commitment to a single granularity, P1 cannot baseline and the program drifts into a generic "improve forecasting" effort.',
      neededAt: 'kickoff',
      escalationHint:
        'If no Demand Planner is named on the program team, escalate to the Supply Chain VP at P0 close — without an operating planner the program is sponsor-only and will fail at S&OP.',
    },
    {
      role: 'Supply Chain VP',
      rationale:
        'Sponsor authority — signs off on the granularity-vs-cohort tradeoff and owns the inventory / stockout / fill-rate value mechanism the forecast is supposed to move.',
      neededAt: 'kickoff',
      escalationHint:
        'If the Supply Chain VP cannot attend the Day 1 granularity workshop, defer Day 1 rather than running it without sponsor authority — granularity locked without sponsor reopens at P2.',
    },
    {
      role: 'Data Engineer',
      rationale:
        'Owns the historical demand and forecast-error trace pulls across the planning systems; without their access and lineage knowledge, the baseline cannot be defended as decision-grade.',
      neededAt: 'data-discovery',
      escalationHint:
        'Forecast traces often live behind the planning vendor (SAP IBP, o9, Blue Yonder, internal); if no Data Engineer can authoritatively pull them, escalate to the Enterprise Data platform group before scheduling Day 2.',
    },
    {
      role: 'S&OP Lead',
      rationale:
        'Owns the S&OP cadence and the decision adherence; the program kills at P2 kill-criterion if S&OP refuses to consume the new forecast, so their P1 attestation of cadence + willingness is gating.',
      neededAt: 'data-discovery',
      escalationHint:
        'If no S&OP Lead exists or cadence is informal, that absence IS a finding — log it as a contradiction and treat S&OP-consumption design as P2 must-have rather than nice-to-have.',
    },
    {
      role: 'Forecast Modeling SME',
      rationale:
        'Defends the baseline against the wishlist-baseline anti-pattern and ensures the bias-distribution analysis is real (over/under by season, promo, lifecycle) — not hand-waved as "MAPE 25%" with no structure.',
      neededAt: 'baseline',
      escalationHint:
        'May come from the existing planning team, an internal data-science group, or the incumbent vendor; if no modeling SME exists, document as a P3 talent gap and flag the baseline as analyst-grade rather than modeler-grade.',
    },
    {
      role: 'Finance Partner',
      rationale:
        'Links forecast accuracy to inventory turn, stockout cost, and working-capital impact so the value mechanism is testable at P5 — without finance attestation the OKR baseline is operational and not yet decision-grade.',
      neededAt: 'synthesis-prep',
    },
  ],

  templates: [
    {
      id: 'forecast-granularity-decision-template',
      title: 'Forecast granularity decision capture template',
      kind: 'capture_template',
      description:
        'Captures the Day 1 granularity decision: candidate grains weighed (SKU-store-week / category-region-month / brand-quarter), the data availability + value-mechanism tradeoff, and the locked choice with sponsor rationale.',
      satisfiesEvidenceItems: [
        'p0-seed-ingested',
        'pattern-specific-evidence-complete',
        'validated-problem-statement',
      ],
    },
    {
      id: 'forecast-accuracy-baseline-spreadsheet',
      title: 'Forecast accuracy baseline spreadsheet (distribution + bias)',
      kind: 'baseline_spreadsheet',
      description:
        '12-month forecast-vs-actual at the locked granularity with computed MAPE/WAPE, the *distribution* of error by cohort/period, and the bias structure (over/under by season, promo, lifecycle stage) — not just an aggregate accuracy number.',
      satisfiesEvidenceItems: [
        'okr-baseline-captured',
        'pattern-specific-evidence-complete',
      ],
    },
    {
      id: 'sop-cadence-inventory-script',
      title: 'S&OP cadence inventory interview script',
      kind: 'interview_script',
      description:
        'Sequenced prompts for the S&OP Lead and downstream consumers: who currently consumes the forecast, at what cadence, with what decision rights, and the last 12 weeks of decision adherence vs. forecast recommendations.',
      satisfiesEvidenceItems: [
        'pattern-specific-evidence-complete',
        'stakeholder-map-named',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'demand-stakeholder-interview-script',
      title: 'Demand-forecasting stakeholder interview script',
      kind: 'interview_script',
      description:
        'Sponsor / Demand Planner / dissenter 1:1 prompts: surfaces decision rights, adoption blockers, and the falsifiers (e.g. "what bias pattern would change your mind about which model class to pursue?") that keep Discovery from becoming confirmation work.',
      satisfiesEvidenceItems: [
        'stakeholder-map-named',
        'validated-problem-statement',
        'discovery-contradictions-logged',
      ],
    },
    {
      id: 'forecast-discovery-report-template',
      title: 'Demand Forecasting Discovery Report template',
      kind: 'document',
      description:
        'Final P1 deliverable scaffold: granularity decision + rationale, baseline distribution + bias structure, S&OP cadence inventory, stakeholder map, contradictions, and the P2 readiness recommendation (proceed / re-scope / reclassify / stop).',
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
      id: 'forecast-granularity-decision-workshop',
      title: 'Forecast granularity decision workshop (Day 1)',
      description:
        'Three-hour decision workshop where the Demand Planner, Supply Chain VP, and Forecast Modeling SME weigh SKU-store-week vs. category-region-month vs. brand-quarter against data availability and value mechanism, and lock a single granularity with rationale. Output is the granularity decision the rest of P1 will baseline against.',
      durationHours: 3,
      attendees: [
        'Demand Planner',
        'Supply Chain VP',
        'Forecast Modeling SME',
      ],
      usesTemplates: [
        'forecast-granularity-decision-template',
        'demand-stakeholder-interview-script',
      ],
    },
    {
      id: 'forecast-baseline-and-bias-analysis',
      title: 'Forecast baseline + bias-structure analysis (Day 2)',
      description:
        'Four-hour working session where the Demand Planner, Forecast Modeling SME, and Data Engineer pull 12 months of forecast-vs-actual at the locked granularity and analyze the *distribution* of error and the bias structure (over/under by season, promo, lifecycle). Output is a defensible baseline — not an aggregate MAPE — that P2 can charter against.',
      durationHours: 4,
      attendees: [
        'Demand Planner',
        'Forecast Modeling SME',
        'Data Engineer',
      ],
      usesTemplates: [
        'forecast-accuracy-baseline-spreadsheet',
      ],
    },
    {
      id: 'sop-consumption-and-stakeholder-validation',
      title: 'S&OP consumption + stakeholder validation (Day 3)',
      description:
        'Two-hour synthesis-prep session where the S&OP Lead, Demand Planner, and Supply Chain VP confirm the cadence inventory, attest decision adherence, and validate the stakeholder map. Closes with a draft P2 readiness recommendation (proceed / re-scope / reclassify / stop).',
      durationHours: 2,
      attendees: [
        'S&OP Lead',
        'Demand Planner',
        'Supply Chain VP',
      ],
      usesTemplates: [
        'sop-cadence-inventory-script',
        'forecast-discovery-report-template',
      ],
    },
  ],

  dataAssets: [
    {
      id: 'historical-forecast-vs-actual',
      label: 'Historical forecast-vs-actual at proposed granularity (last 12 months)',
      rationale:
        'The core baseline input — without 12 months at the locked grain, the bias-distribution analysis collapses into an aggregate MAPE that hides exactly the structural pattern P2 must charter against.',
      format: 'spreadsheet',
      neededAt: 'data-discovery',
    },
    {
      id: 'forecast-bias-structure',
      label: 'Forecast accuracy bias structure (over/under by season, promo, lifecycle)',
      rationale:
        'Distinguishes random noise from structural error; the bias map is what makes the baseline decision-grade and is the input P2 needs to choose between hierarchical-statistical, ML, or vendor SaaS approaches.',
      format: 'spreadsheet',
      neededAt: 'baseline',
    },
    {
      id: 'sop-cadence-calendar',
      label: 'S&OP cadence calendar + meeting cadence',
      rationale:
        'Names who consumes the forecast and when; without it, P2 cannot design the consumption path along with the model path and the program risks shipping a more accurate forecast that S&OP still ignores.',
      format: 'PDF',
      neededAt: 'data-discovery',
    },
    {
      id: 'sop-decision-adherence-sample',
      label: 'Decision-adherence sample — last 12 weeks of S&OP decisions vs. forecast recommendations',
      rationale:
        'Tests whether the current forecast is actually consumed; low adherence is a finding that reframes the program from "improve accuracy" to "earn S&OP trust," and the absence of this artifact is itself a contradiction to log.',
      format: 'spreadsheet',
      neededAt: 'synthesis-prep',
    },
    {
      id: 'inventory-and-stockout-baseline',
      label: 'Inventory turn / stockout / fill-rate baseline at proposed granularity',
      rationale:
        'Anchors the value mechanism — accuracy improvement only matters insofar as it moves inventory turn, stockout cost, or fill rate; the Finance Partner attests this so the OKR baseline is decision-grade for P5.',
      format: 'spreadsheet',
      neededAt: 'baseline',
    },
  ],

  prepChecklist: [
    {
      id: 'confirm-day-1-granularity-attendees',
      label: 'Confirm Demand Planner + Supply Chain VP commit to the Day 1 granularity workshop',
      rationale:
        'Day 1 is the gating workshop — without operator + sponsor in the room the granularity decision either does not happen or gets reopened at P2. Calendar lead-time on a Supply Chain VP is the single largest risk to the P1 schedule.',
    },
    {
      id: 'request-historical-forecast-pull',
      label: 'Request historical demand and forecast-error pull from Data Engineer five business days before Day 1',
      rationale:
        'Forecast-trace extracts from planning systems (SAP IBP, o9, Blue Yonder, custom) have real lead time and often require a vendor ticket; requesting at P1 kickoff (not Day 2) is the difference between a measured baseline and a hand-waved one.',
    },
    {
      id: 'identify-sop-lead-and-confirm-attestation',
      label: 'Identify the S&OP Lead and confirm willingness to attest cadence + decision adherence',
      rationale:
        'Without an S&OP consumption commitment in P1, the program kills at the P2 kill-criterion ("S&OP refuses to consume"). If no S&OP Lead exists, that gap is itself the contradiction to log — but P1 cannot start blind to it.',
    },
    {
      id: 'author-falsifiable-granularity-hypothesis',
      label: 'Author the falsifiable hypothesis: which granularity will produce the largest accuracy-improvement opportunity, and what evidence would change the answer?',
      rationale:
        'Anti-confirmation discipline. Without a stated hypothesis and falsifiers entering Day 1, the granularity workshop becomes a confirmation of the planner\'s priors rather than a discovery — and the bias-distribution analysis on Day 2 inherits that confirmation bias.',
    },
    {
      id: 'circulate-p0-hypothesis-and-falsifiers',
      label: 'Circulate the P0 value hypothesis (accuracy → inventory / stockout) and its falsifiers to all Day 1 attendees',
      rationale:
        'Workshops that begin without the value hypothesis on the table devolve into model-architecture debates; the falsifiers are what keep the granularity decision tied to the value mechanism rather than to modeling-team preference.',
    },
    {
      id: 'identify-sop-dissenter',
      label: 'Identify at least one S&OP-side dissenter or skeptical operator to interview on Day 3',
      rationale:
        'Stakeholder maps without an S&OP-side dissenter become department-RACIs; consumption-side skepticism is the leading indicator of P5 adoption failure and the P1 anti-pattern detector will flag the absence at the gate.',
    },
  ],
};
