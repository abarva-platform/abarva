import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
  "docs/source-material/tenant-overlays/apex-intelligence-layer-overlay.md",
];

function pattern(input: {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  body: string;
  confidence?: number;
  relatedPatternIds?: string[];
  negotiationLevers?: PatternSeed["negotiationLevers"];
  standardClauses?: PatternSeed["standardClauses"];
  riskFactors?: PatternSeed["riskFactors"];
}): PatternSeed {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: input.thesis,
    applicability: input.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: input.confidence ?? 0.82,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: input.relatedPatternIds ?? [
      "PAT-SRC-001",
      "PAT-SRC-PNG-009",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "contract_intelligence",
    vendorClass: "service",
    negotiationLevers: input.negotiationLevers,
    standardClauses: input.standardClauses,
    riskFactors: input.riskFactors,
    body: input.body,
  };
}

export const SOURCING_BAFO_CONTRACT_PATTERNS: PatternSeed[] = [
  pattern({
    id: "PAT-SRC-BAFO-001",
    slug: "payment-terms-discount-envelope",
    title: "Payment Terms Discount Envelope",
    thesis:
      "Payment-term concessions should be priced as explicit trade envelopes so the buyer can compare cash-flow give against run-rate or implementation discounts.",
    applicability:
      "Apply when vendors request accelerated payment, upfront fees, or milestone prepayment in exchange for commercial concessions.",
    negotiationLevers: [
      {
        lever: "Payment terms for discount",
        whenToUse:
          "Use when a vendor asks for earlier cash or implementation prepayment.",
        buyerAsk:
          "Quantify the exact run-rate or implementation discount received for any payment-term concession.",
        vendorGive:
          "Discounted recurring price, waived setup fee, or stronger transition warranty.",
        tradeoffs: [
          "Improved vendor cash flow can reduce buyer leverage if acceptance criteria are weak.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Payment and acceptance",
        buyerPosition:
          "Payment acceleration is allowed only after acceptance milestones, service commencement evidence, and creditable transition deliverables are complete.",
        fallbackPosition:
          "Permit limited acceleration only with an equal or greater discount, milestone holdback, and refund right for failed acceptance.",
        vendorPosition:
          "Vendor may request earlier cash flow but must tie it to measurable buyer economics.",
        walkawayTriggers: [
          "Discount is not quantified.",
          "Payment is due before acceptance or service-readiness evidence.",
        ],
      },
    ],
    body: `## Summary
Payment terms are not a housekeeping item in BAFO. Vendors may trade price for cash-flow certainty, but the buyer needs to know the economic value of the concession.

## Detection
Flag upfront payment, accelerated payment, or implementation prepayment that is not tied to a quantified discount and acceptance evidence.

## Evidence required
Payment schedule, acceptance milestones, discount math, transition deliverables, and remedy if acceptance fails.

## CXO language
"We can trade payment timing, but only if finance can see the price of the trade."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-002",
    slug: "sla-credit-step-up-envelope",
    title: "SLA Credit Step-Up Envelope",
    thesis:
      "SLA credits should escalate with business impact and repeated failure; flat credits let vendors absorb chronic underperformance as a cost of doing business.",
    applicability:
      "Apply to AMS, infrastructure, BPO, and SaaS events where operational uptime, response time, or incident recovery is material.",
    negotiationLevers: [
      {
        lever: "SLA credits for operational risk",
        whenToUse:
          "Use when a vendor is commercially attractive but delivery risk remains.",
        buyerAsk:
          "Step-up credits for repeat misses, peak-window incidents, and critical-system failures.",
        vendorGive: "Clear measurement exclusions and remediation process.",
      },
    ],
    standardClauses: [
      {
        clauseArea: "Service levels",
        buyerPosition:
          "SLA credits step up for repeat misses, business-critical incidents, and peak-window failures, with root-cause remediation and termination trigger for chronic failure.",
        fallbackPosition:
          "If step-up credits are capped, require executive remediation review and fee-at-risk holdback.",
        vendorPosition:
          "Vendor can define reasonable exclusions but cannot neutralize repeated failure remedies.",
        walkawayTriggers: [
          "No chronic-failure remedy.",
          "Peak-window failures treated the same as normal incidents.",
        ],
      },
    ],
    body: `## Summary
SLA credits must match operational stakes. A single flat credit table is often too weak for critical retail, healthcare, or financial workflows.

## Detection
Flag credit tables that do not escalate for repeated misses, severity, peak windows, or business-critical systems.

## Evidence required
SLA table, severity definitions, incident history, peak windows, exclusions, and chronic-failure remedy.

## CXO language
"The remedy should hurt more when the business impact is higher."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-003",
    slug: "transition-holdback-and-warranty",
    title: "Transition Holdback and Warranty",
    thesis:
      "Transition-heavy deals need a commercial holdback and stabilization warranty so vendors cannot underprice transition and move failure cost back to the buyer.",
    applicability:
      "Apply when switching suppliers, consolidating incumbents, or moving critical operational scope to a new delivery model.",
    negotiationLevers: [
      {
        lever: "Transition holdback",
        whenToUse:
          "Use when transition risk is high or incumbent knowledge transfer is material.",
        buyerAsk:
          "Hold back a portion of transition or early run fees until stabilization criteria are met.",
        vendorGive: "Clear acceptance criteria and remediation window.",
      },
    ],
    standardClauses: [
      {
        clauseArea: "Transition and stabilization",
        buyerPosition:
          "A transition holdback releases only after knowledge transfer, service-readiness, cutover, and stabilization criteria are accepted by the buyer.",
        fallbackPosition:
          "If holdback is refused, require liquidated transition remedies and extended warranty support.",
        vendorPosition:
          "Vendor may request objective acceptance criteria and cure period.",
        walkawayTriggers: [
          "No transition acceptance criteria.",
          "No remedy for failed stabilization.",
        ],
      },
    ],
    body: `## Summary
Transition failure is one of the fastest ways for promised savings to disappear. BAFO should convert transition risk into acceptance criteria, holdback, and warranty.

## Detection
Flag deals with supplier switch, consolidation, or major knowledge transfer and no commercial holdback.

## Evidence required
Transition plan, cutover criteria, stabilization period, service-readiness evidence, and warranty remedy.

## CXO language
"Do not pay full price for a transition until the business is actually stable."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-004",
    slug: "volume-commitment-downside-protection",
    title: "Volume Commitment Downside Protection",
    thesis:
      "Volume commitments can buy price concessions, but the buyer needs downside protection if demand falls, scope changes, or transformation reduces volumes.",
    applicability:
      "Apply when vendors offer discounts tied to minimum volumes, application counts, seats, tickets, calls, transactions, or term commitments.",
    negotiationLevers: [
      {
        lever: "Volume for price",
        whenToUse: "Use when vendor economics improve with committed demand.",
        buyerAsk:
          "Lower rates with ramp-down, reopener, and transformation adjustment rights.",
        vendorGive: "Minimum baseline or forecast visibility.",
        tradeoffs: [
          "Bigger discounts can create stranded spend if volume drops.",
        ],
      },
    ],
    body: `## Summary
Volume commitments are useful but dangerous. The buyer should not lock demand assumptions that may fall because of transformation, automation, divestiture, or scope rationalization.

## Detection
Flag minimum commitments without ramp-down rights, reopener rights, or transformation adjustment.

## Evidence required
Volume baseline, forecast, transformation roadmap, price bands, minimums, ramp-down rules, and reopener logic.

## CXO language
"Take the volume discount only if the contract can flex when the business changes."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-005",
    slug: "fx-indexation-and-inflation-caps",
    title: "FX, Indexation, and Inflation Caps",
    thesis:
      "FX and indexation clauses can quietly unwind negotiated savings unless caps, floors, baskets, and reopener rules are explicit.",
    applicability:
      "Apply when pricing includes offshore delivery, multi-currency cost bases, CPI/indexation, COLA, or annual rate adjustments.",
    standardClauses: [
      {
        clauseArea: "Indexation",
        buyerPosition:
          "Rate increases are capped, tied to named indices, net of productivity commitments, and subject to buyer audit of affected cost categories.",
        fallbackPosition:
          "Allow indexation only above a materiality threshold and with a reciprocal downward adjustment.",
        vendorPosition:
          "Vendor can recover exceptional cost shocks only with evidence and capped pass-through.",
        walkawayTriggers: [
          "Uncapped CPI or FX pass-through.",
          "No downward adjustment mechanism.",
        ],
      },
    ],
    body: `## Summary
Savings can disappear in year two through inflation and FX pass-through. Indexation needs a named index, cap, floor, and evidence rule.

## Detection
Flag uncapped annual increases, vague COLA clauses, offshore FX pass-through, or no downward adjustment.

## Evidence required
Currency mix, location mix, index name, cap, floor, threshold, productivity offset, and audit right.

## CXO language
"The year-one price is not enough; show me how the price moves."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-006",
    slug: "governance-cadence-with-remedy",
    title: "Governance Cadence With Remedy",
    thesis:
      "Governance meetings create little value unless escalation rights, decision latency, issue aging, and remedy triggers are connected to the cadence.",
    applicability:
      "Apply to strategic vendor awards, managed services, transformation partners, and multi-tower outsourcing.",
    standardClauses: [
      {
        clauseArea: "Governance",
        buyerPosition:
          "Governance includes weekly operational review, monthly commercial review, quarterly executive steering, issue-aging thresholds, escalation rights, and remediation triggers.",
        fallbackPosition:
          "If executive cadence is reduced, require named escalation owners and issue-aging reporting.",
        vendorPosition:
          "Vendor can align cadence to deal size but must preserve escalation and remedy path.",
        walkawayTriggers: [
          "No named escalation owner.",
          "Governance has no remedy for aged issues.",
        ],
      },
    ],
    body: `## Summary
Governance is often oversold as a relationship layer. For sourcing, it should be a control system with escalation and remedy.

## Detection
Flag governance language that lists meetings but not decision rights, issue aging, or escalation path.

## Evidence required
Governance calendar, named roles, issue-aging thresholds, escalation path, decision rights, and remedy triggers.

## CXO language
"A meeting cadence is not governance unless it changes what happens when performance slips."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-007",
    slug: "exit-assistance-rate-card",
    title: "Exit Assistance Rate Card",
    thesis:
      "Exit assistance must be pre-priced before award; otherwise the vendor can turn transition-out into a hostage point when leverage is lowest.",
    applicability:
      "Apply to any multi-year service contract where operational continuity depends on vendor cooperation at exit.",
    standardClauses: [
      {
        clauseArea: "Exit assistance",
        buyerPosition:
          "Exit assistance scope, rate card, tooling handback, knowledge transfer, data return, and transition-out timeline are pre-agreed and survive termination.",
        fallbackPosition:
          "If scope cannot be fully defined, require capped T&M rates and cooperation obligations.",
        vendorPosition:
          "Vendor can charge for incremental exit work only at pre-agreed rates.",
        walkawayTriggers: [
          "No exit-assistance rate card.",
          "No tooling or data handback obligation.",
        ],
      },
    ],
    body: `## Summary
Exit terms are negotiated when no one expects to use them. That is exactly when they matter most.

## Detection
Flag strategic service deals without transition-out scope, rate card, data/tooling handback, and survival language.

## Evidence required
Exit scope, rate card, data/tooling inventory, knowledge-transfer artifacts, survival clause, and termination triggers.

## CXO language
"If we cannot exit cleanly, the savings are not durable."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-008",
    slug: "benchmark-remedy-not-just-right",
    title: "Benchmark Remedy, Not Just Benchmark Right",
    thesis:
      "Benchmark rights are weak unless the contract states what happens when pricing is out of market.",
    applicability:
      "Apply to multi-year outsourcing, managed services, SaaS enterprise agreements, and large renewals.",
    standardClauses: [
      {
        clauseArea: "Benchmarking",
        buyerPosition:
          "Buyer has periodic benchmark rights and an adjustment remedy if pricing, service level, or productivity is materially out of market.",
        fallbackPosition:
          "If automatic adjustment is refused, require reopener negotiation and termination right after failed cure.",
        vendorPosition:
          "Vendor may limit benchmark providers and frequency but not remove remedy.",
        walkawayTriggers: [
          "Benchmark right has no price remedy.",
          "Vendor controls benchmark provider unilaterally.",
        ],
      },
    ],
    body: `## Summary
A benchmark right without remedy is a report, not leverage. The contract should say what changes if the benchmark proves price or productivity is out of market.

## Detection
Flag benchmark language that allows analysis but no adjustment, reopener, or termination right.

## Evidence required
Benchmark frequency, permitted providers, cohort definition, materiality threshold, adjustment method, and cure period.

## CXO language
"Do not buy a benchmark study; buy a market correction mechanism."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-009",
    slug: "subcontractor-and-location-transparency",
    title: "Subcontractor and Location Transparency",
    thesis:
      "Vendor economics and risk change materially when subcontractors, offshore locations, or delivery centers are not transparent and approval-controlled.",
    applicability:
      "Apply when vendors use offshore delivery, subcontractors, hyperscaler partners, niche specialists, or tiered delivery centers.",
    standardClauses: [
      {
        clauseArea: "Subcontractors and delivery location",
        buyerPosition:
          "Vendor must disclose subcontractors, delivery locations, data access, role scope, replacement rules, and buyer approval rights for material changes.",
        fallbackPosition:
          "Allow pre-approved subcontractors only with audit rights and no degradation of service or compliance responsibility.",
        vendorPosition:
          "Vendor remains fully liable for subcontractor performance and compliance.",
        walkawayTriggers: [
          "No subcontractor disclosure.",
          "No buyer approval right for material delivery-location change.",
        ],
      },
    ],
    body: `## Summary
Subcontractor opacity can hide cost, compliance, continuity, and quality risks. Delivery location is also a commercial term.

## Detection
Flag proposals with vague "global delivery" language, unnamed partners, or no approval right for location/subcontractor changes.

## Evidence required
Subcontractor list, location list, data access, role scope, audit rights, and change approval rules.

## CXO language
"Apex should know who is doing the work and where before calling the price comparable."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-010",
    slug: "ip-tooling-and-knowledge-handback",
    title: "IP, Tooling, and Knowledge Handback",
    thesis:
      "Vendor-created runbooks, scripts, automations, dashboards, and knowledge artifacts can become hidden lock-in unless ownership and handback are explicit.",
    applicability:
      "Apply to AMS, cloud operations, data operations, automation, and custom implementation services.",
    standardClauses: [
      {
        clauseArea: "IP and tooling handback",
        buyerPosition:
          "Buyer owns or receives perpetual rights to runbooks, configurations, automations, dashboards, knowledge artifacts, and operational documentation created for the service.",
        fallbackPosition:
          "If vendor retains platform IP, buyer receives operational-use license and transition-out access.",
        vendorPosition:
          "Vendor retains pre-existing tools but must separate them from buyer-specific artifacts.",
        walkawayTriggers: [
          "No handback of buyer-specific operational artifacts.",
          "Vendor can withhold runbooks at exit.",
        ],
      },
    ],
    body: `## Summary
Operational knowledge can become vendor lock-in. BAFO should make handback rights explicit before award.

## Detection
Flag proposals where automation, runbooks, dashboards, or scripts are created but ownership is vague.

## Evidence required
Artifact inventory, IP ownership terms, license terms, exit handback, documentation standards, and access rights.

## CXO language
"Do not let the vendor turn our operating knowledge into their switching moat."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-011",
    slug: "most-favored-customer-and-price-protection",
    title: "Most-Favored Customer and Price Protection",
    thesis:
      "Large strategic buyers need price-protection language that prevents materially worse economics than comparable customers or later vendor offers.",
    applicability:
      "Apply to high-spend strategic sourcing, enterprise SaaS, managed services, and renewals with substantial committed spend.",
    standardClauses: [
      {
        clauseArea: "Price protection",
        buyerPosition:
          "Buyer receives price protection for materially similar scope, term, volume, and service levels, with audit or certification rights.",
        fallbackPosition:
          "If full most-favored-customer language is refused, require market check, renewal price cap, and discount preservation.",
        vendorPosition:
          "Vendor may narrow comparison to materially similar deals.",
        walkawayTriggers: [
          "No renewal price cap.",
          "Discounts reset or disappear on renewal without benchmark right.",
        ],
      },
    ],
    body: `## Summary
Price protection is not always appropriate, but high-spend buyers should not lose negotiated economics silently over term or renewal.

## Detection
Flag large awards with no renewal price cap, no discount preservation, and no market check.

## Evidence required
Scope, volume, term, discount schedule, renewal rules, price-protection clause, and audit/certification right.

## CXO language
"If we are a strategic customer, the contract should preserve strategic economics."`,
  }),
  pattern({
    id: "PAT-SRC-BAFO-012",
    slug: "bafo-no-extension-discipline",
    title: "BAFO No-Extension Discipline",
    thesis:
      "BAFO rounds lose leverage when deadlines are soft; no-extension discipline protects competitive tension and committee decision quality.",
    applicability:
      "Apply when finalists are invited to BAFO and the buyer needs comparable submissions by a fixed decision date.",
    riskFactors: [
      {
        id: "risk-bafo-soft-deadline",
        label: "BAFO soft deadline",
        severity: "medium",
        detectionSignals: [
          "Finalists receive different response windows.",
          "Deadline extensions are handled informally.",
          "Committee date is not tied to BAFO receipt.",
        ],
        mitigations: [
          "Publish one response deadline and no-extension rule.",
          "Document exceptions as committee-approved governance decisions.",
        ],
      },
    ],
    body: `## Summary
BAFO deadlines create leverage only when they are credible. A soft BAFO round becomes another sales cycle.

## Detection
Flag missing due dates, vendor-specific extensions, or BAFO submissions not tied to committee schedule.

## Evidence required
BAFO invitation, response deadline, exception policy, committee calendar, and submission log.

## CXO language
"If the deadline is negotiable, the commercial tension is negotiable too."`,
  }),
];
