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
  riskFactors?: PatternSeed["riskFactors"];
  negotiationLevers?: PatternSeed["negotiationLevers"];
  standardClauses?: PatternSeed["standardClauses"];
  industryVariants?: PatternSeed["industryVariants"];
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
      "PAT-SRC-002",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "pricing_intelligence",
    vendorClass: "service",
    riskFactors: input.riskFactors,
    negotiationLevers: input.negotiationLevers,
    standardClauses: input.standardClauses,
    industryVariants: input.industryVariants,
    body: input.body,
  };
}

export const SOURCING_PRICING_GAMING_PATTERNS: PatternSeed[] = [
  pattern({
    id: "PAT-SRC-PNG-001",
    slug: "ams-transition-cost-burial",
    title: "AMS Transition Cost Burial",
    thesis:
      "AMS vendors often move first-year transition, reverse-shadowing, tooling handback, and knowledge-transfer cost outside the base run price; normalization must pull those costs back into year-one TCO before ranking vendors.",
    applicability:
      "Apply to AMS, IMS, and managed-services events whenever the proposal separates run cost from transition, mobilization, tooling, retained-client, or one-time setup charges.",
    riskFactors: [
      {
        id: "risk-transition-cost-burial",
        label: "Transition cost burial",
        severity: "high",
        detectionSignals: [
          "Base run price excludes transition, reverse shadow, tooling, or knowledge transfer.",
          "Vendor response prices transition as optional, capped, or time-and-materials.",
        ],
        mitigations: [
          "Normalize year-one TCO with transition-inclusive cost before scorecard ranking.",
          "Require a transition inclusions schedule and retained-client effort estimate.",
        ],
      },
    ],
    body: `## Summary
The first AMS price a vendor advertises is rarely the full year-one commercial exposure. Transition, reverse-shadowing, tooling transfer, service desk integration, application knowledge capture, and retained-client work often sit outside the base run fee.

## Detection
Flag the pattern when a proposal has a low run-rate but one-time setup, transition, optional tooling, or retained-team assumptions are separated from the evaluated price.

## Evidence required
Require vendor line items for transition, one-time setup, tooling, retained-client staffing, and exit/handback. Without those line items the comparison is not CFO-auditable.

## CXO language
"Do not rank this vendor on run price alone. Normalize year-one TCO first, or the savings number will be a procurement artifact rather than an economic result."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-002",
    slug: "run-rate-vs-realized-savings-separation",
    title: "Run-Rate vs Realized Savings Separation",
    thesis:
      "A sourcing event should separate quoted run-rate savings, negotiated contract savings, and realized savings; collapsing them lets provisional value become a board claim too early.",
    applicability:
      "Apply whenever Source emits dollar savings before a signed contract and measurement-window evidence exist.",
    riskFactors: [
      {
        id: "risk-premature-savings-claim",
        label: "Premature savings claim",
        severity: "critical",
        detectionSignals: [
          "Executive report claims savings before BAFO or contract evidence is loaded.",
          "Value ledger lacks baseline, negotiated, and realized states.",
        ],
        mitigations: [
          "Mark savings as provisional until contract evidence exists.",
          "Keep realized value at zero until a measurement window closes.",
        ],
      },
    ],
    body: `## Summary
Quoted savings, negotiated savings, and realized savings are different claims. A board-ready savings number needs baseline evidence, vendor commercial evidence, contract evidence, and realized measurement evidence.

## Detection
Flag when a deck uses "savings" without indicating whether the number is projected, negotiated, or realized.

## Evidence required
Baseline run cost, normalized vendor bid, accepted BAFO, signed contract, and realized ledger measurement.

## CXO language
"The CFO can hear the value hypothesis today, but cannot book realized savings until the value ledger has measurement evidence."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-003",
    slug: "scope-exclusion-recapture",
    title: "Scope Exclusion Recapture",
    thesis:
      "Low AMS bids often recover margin through excluded release support, minor enhancements, tooling, security remediation, or third-party API support.",
    applicability:
      "Apply when vendor exclusions or optional services are material relative to annual run cost.",
    riskFactors: [
      {
        id: "risk-scope-exclusion-recapture",
        label: "Scope exclusion recapture",
        severity: "high",
        detectionSignals: [
          "Proposal excludes release support, minor enhancements, tooling, or API support.",
          "Excluded-services value exceeds 20 percent of annual run cost.",
        ],
        mitigations: [
          "Price all exclusions in the TCO bridge.",
          "Require inclusion, capped adder, or signed waiver before BAFO close.",
        ],
      },
    ],
    body: `## Summary
Scope exclusions make a bid look clean while moving future spend into change orders. For AMS, release support and minor enhancements are common leakage points.

## Detection
Flag any excluded or optional service tied to normal application operations, release cadence, tooling, or API stability.

## Evidence required
Inclusion matrix, excluded-service pricing, historical change-order spend, and approval waiver if the buyer accepts residual leakage.

## CXO language
"This is not savings until we price the excluded work or decide who owns it."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-004",
    slug: "offshore-mix-transition-quality-discount",
    title: "Offshore Mix Transition Quality Discount",
    thesis:
      "A heavily offshore AMS delivery mix can be economically attractive but needs transition-quality safeguards for critical retail systems and peak-period support.",
    applicability:
      "Apply when offshore delivery exceeds 60 percent or when critical applications depend on tacit incumbent knowledge.",
    riskFactors: [
      {
        id: "risk-offshore-transition-quality",
        label: "Offshore transition quality",
        severity: "medium",
        detectionSignals: [
          "Offshore mix exceeds 60 percent for critical applications.",
          "Proposal lacks named key staff, shadow period, or peak-period coverage model.",
        ],
        mitigations: [
          "Require key-staff retention, transition milestones, and peak support commitments.",
          "Score delivery risk separately from cost.",
        ],
      },
    ],
    body: `## Summary
Offshore-heavy AMS can lower run cost while increasing transition risk. The right question is not whether offshore is acceptable; it is whether the vendor has priced quality protection.

## Detection
Flag offshore-heavy proposals without named transition owners, knowledge-transfer plan, and peak support coverage.

## Evidence required
Role mix, location mix, named transition leads, shadow/reverse-shadow plan, and SLA performance during stabilization.

## CXO language
"Take the labor-arbitrage benefit only if the contract also buys transition assurance."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-005",
    slug: "automation-savings-without-commitment",
    title: "Automation Savings Without Commitment",
    thesis:
      "AMS proposals often use automation-productivity claims to justify savings without binding those claims to milestones, baselines, or service-credit remedies.",
    applicability:
      "Apply when a proposal claims productivity, automation, or AI-enabled support savings.",
    riskFactors: [
      {
        id: "risk-automation-savings-without-commitment",
        label: "Automation savings without commitment",
        severity: "high",
        detectionSignals: [
          "Automation percentage is stated but not tied to volume baseline.",
          "Roadmap lacks dates, KPIs, remedies, or dependency ownership.",
        ],
        mitigations: [
          "Require automation milestones, ticket-deflection baseline, and commercial holdback.",
          "Keep savings provisional until milestones are contract-backed.",
        ],
      },
    ],
    body: `## Summary
Automation language can be a savings mirage. A vendor can promise reduced tickets or faster resolution while leaving the commercial obligation non-binding.

## Detection
Flag any automation claim without baseline, milestone, measurement method, and remedy.

## Evidence required
Ticket baseline, automated-resolution definition, timeline, value owner, contractual holdback, and failure remedy.

## CXO language
"Automation is not value until the contract says what will happen, by when, and what happens if it does not."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-006",
    slug: "volume-band-gaming",
    title: "Volume Band Gaming",
    thesis:
      "Vendors can price a favorable ticket or application volume band and later recover margin when actual demand exceeds assumptions.",
    applicability:
      "Apply when pricing relies on ticket count, application count, severity mix, or support-hour bands.",
    riskFactors: [
      {
        id: "risk-volume-band-gaming",
        label: "Volume band gaming",
        severity: "medium",
        detectionSignals: [
          "Proposal assumes lower ticket volume than baseline.",
          "Unit economics change materially across bands without reopener controls.",
        ],
        mitigations: [
          "Normalize against historical and peak volume.",
          "Require banded pricing and reopener rules.",
        ],
      },
    ],
    body: `## Summary
Volume assumptions are one of the easiest ways to make an AMS bid look cheaper than it is. The comparison must test historical, peak, and downside volumes.

## Detection
Flag low ticket volume, narrow support-hour assumptions, and missing severity mix.

## Evidence required
12-month incident/request/change baseline, application count, severity mix, and seasonal peak profile.

## CXO language
"If the bid only wins at the vendor's volume band, it has not won the event."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-007",
    slug: "retail-q4-support-peak-normalization",
    title: "Retail Q4 Support Peak Normalization",
    thesis:
      "Retail AMS pricing must normalize for holiday peak load, code-freeze windows, and store-system incident severity; average monthly ticket baselines understate Q4 operating risk.",
    applicability:
      "Apply to retail AMS events covering POS, OMS, WMS, eCommerce, loyalty, store systems, or supply-chain applications.",
    industryVariants: [
      {
        industry: "retail_cpg",
        modifier:
          "Normalize support model against holiday peak, promotion cadence, store operating hours, and change-freeze windows before accepting run-rate savings.",
        additionalRequirements: [
          "Q4 ticket-volume profile",
          "Change-freeze support model",
          "POS/OMS/WMS severity mapping",
          "Peak staffing plan",
        ],
        affectedStages: ["scope", "rfp_rfi_package", "orals_bafo"],
      },
    ],
    riskFactors: [
      {
        id: "risk-retail-q4-underpricing",
        label: "Retail Q4 underpricing",
        severity: "high",
        detectionSignals: [
          "Proposal uses annual average volume without holiday peak scenario.",
          "Vendor does not price change-freeze coverage or peak incident response.",
        ],
        mitigations: [
          "Require Q4 support scenario in pricing template.",
          "Add holiday blackout and emergency-change clauses.",
        ],
      },
    ],
    body: `## Summary
Retail AMS is not an average-month support problem. Holiday peak, promotion events, code freezes, and store uptime can change incident volume and business impact materially.

## Detection
Flag retail AMS pricing that does not include a Q4 or peak-event support scenario.

## Evidence required
Ticket-volume seasonality, store-hour coverage, code-freeze calendar, POS/OMS/WMS criticality, and incident severity by channel.

## CXO language
"Apex should not accept AMS savings that only work outside the holiday operating model."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-008",
    slug: "bopis-returns-omnichannel-scope-leakage",
    title: "BOPIS / Returns Omnichannel Scope Leakage",
    thesis:
      "Omnichannel flows such as BOPIS, ship-from-store, and returns create cross-application support obligations that vendors can omit unless the RFP defines end-to-end incident ownership.",
    applicability:
      "Apply to retail AMS scopes involving OMS, WMS, POS, eCommerce, store inventory, returns, or customer service integrations.",
    industryVariants: [
      {
        industry: "retail_cpg",
        modifier:
          "Treat omnichannel flows as cross-system service journeys, not separate application tickets, or vendors will push incidents across tower boundaries.",
        additionalRequirements: [
          "BOPIS incident ownership",
          "Returns flow support matrix",
          "Cross-application SLA definitions",
        ],
        affectedStages: ["scope", "rfp_rfi_package", "evaluation"],
      },
    ],
    body: `## Summary
Retail incidents often cross POS, OMS, WMS, inventory, and customer-service systems. If the RFP prices each application in isolation, vendors can avoid end-to-end accountability.

## Detection
Flag scopes that list applications but not customer/channel journeys.

## Evidence required
Critical omnichannel flows, integration map, incident routing, and business-impact severity.

## CXO language
"The event should buy support for the retail journey, not only support for named systems."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-009",
    slug: "bafo-price-term-sla-trade-envelope",
    title: "BAFO Price / Term / SLA Trade Envelope",
    thesis:
      "BAFO negotiation works best when each concession is expressed as a trade envelope: buyer ask, target range, walk-away range, evidence required, and contract clause affected.",
    applicability:
      "Apply to finalist BAFO rounds where price, term, SLA, governance, exit, benchmarking, or change-control levers are negotiated together.",
    negotiationLevers: [
      {
        lever: "Price for term",
        whenToUse:
          "Use when vendor can lower run-rate in exchange for a longer commitment.",
        buyerAsk:
          "Reduce run-rate while preserving exit and benchmarking rights.",
        vendorGive: "Multi-year volume or term certainty.",
        tradeoffs: [
          "Lower price can increase lock-in if exit and benchmark rights are weak.",
        ],
      },
      {
        lever: "SLA for governance",
        whenToUse:
          "Use when delivery risk remains but vendor is commercially attractive.",
        buyerAsk:
          "Increase SLA credits, peak-period coverage, and executive governance cadence.",
        vendorGive: "Clearer measurement exclusions and escalation rules.",
      },
    ],
    body: `## Summary
BAFO should not be a discount request. It is a controlled exchange across price, term, volume, SLA, governance, exit, benchmarking, indexation, IP, and change-control.

## Detection
Flag BAFO packs that ask for "better pricing" without target ranges, walk-away posture, or clause mapping.

## Evidence required
Normalized TCO, risk-adjusted vendor position, target range, walk-away range, and affected contract clauses.

## CXO language
"Every BAFO ask needs a commercial envelope: what we want, what we will trade, and what we will not give up."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-010",
    slug: "change-control-margin-recapture",
    title: "Change-Control Margin Recapture",
    thesis:
      "Vendors can concede base run price while preserving margin through unpriced change-control rates, minor enhancement exclusions, and weak threshold language.",
    applicability:
      "Apply when the scope includes application support, enhancements, releases, integration changes, or transformation adjacency.",
    standardClauses: [
      {
        clauseArea: "Change control",
        buyerPosition:
          "All standard release, minor enhancement, defect remediation, and integration-stability work must be included or pre-priced; change-control rates are capped and benchmarkable.",
        fallbackPosition:
          "Excluded changes require a rate card, approval threshold, and monthly leakage report.",
        vendorPosition:
          "Vendor may propose T&M change control only for net-new scope outside the agreed service catalogue.",
        walkawayTriggers: [
          "No rate card for change-control work.",
          "Vendor refuses leakage reporting or approval thresholds.",
        ],
      },
    ],
    body: `## Summary
Base-price concessions can be neutralized by weak change-control language. For AMS, the boundary between support, release, minor enhancement, and change can decide the economics.

## Detection
Flag proposals with unpriced change-control rates, broad exclusions, or no leakage reporting.

## Evidence required
Service catalogue, rate card, enhancement threshold, historical change-order spend, and approval workflow.

## CXO language
"A low run price with unbounded change control is not a low-cost contract."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-011",
    slug: "benchmarking-and-exit-rights-value-protection",
    title: "Benchmarking and Exit Rights Value Protection",
    thesis:
      "AMS savings degrade when benchmarking, exit assistance, and termination rights are weak; the contract must preserve the buyer’s ability to reprice or exit without operational hostage risk.",
    applicability:
      "Apply to multi-year managed-services awards and incumbent renegotiations.",
    standardClauses: [
      {
        clauseArea: "Benchmarking and exit",
        buyerPosition:
          "Buyer retains annual benchmark rights, market-adjustment remedy, termination assistance, data/tooling handback, and transition support at pre-agreed rates.",
        fallbackPosition:
          "If annual benchmarking is refused, require a mid-term price reopener and capped exit-assistance pricing.",
        vendorPosition:
          "Vendor may limit benchmark providers but cannot remove adjustment remedy.",
        walkawayTriggers: [
          "No benchmark remedy.",
          "No exit assistance rate card.",
          "Tooling or knowledge artifacts cannot be transferred.",
        ],
      },
    ],
    body: `## Summary
The first-year savings number matters less if the buyer cannot benchmark, reprice, or exit in years two and three. Exit and benchmarking rights are value-protection controls.

## Detection
Flag contracts without annual benchmark rights, market-adjustment remedy, exit-assistance rate card, or tooling handback obligations.

## Evidence required
Benchmark clause, exit assistance clause, rate card, tooling ownership, and knowledge artifact handback.

## CXO language
"Savings are only durable if the contract keeps future leverage alive."`,
  }),
  pattern({
    id: "PAT-SRC-PNG-012",
    slug: "pci-channel-compliance-ams-overlay",
    title: "PCI / Channel Compliance AMS Overlay",
    thesis:
      "Retail AMS proposals touching POS, payment, loyalty, or customer-data channels require explicit PCI, privacy, incident, and subcontractor controls before price can be treated as comparable.",
    applicability:
      "Apply to retail AMS events involving POS, payments, loyalty, eCommerce, customer service, or channel data flows.",
    industryVariants: [
      {
        industry: "retail_cpg",
        modifier:
          "Price and score channel compliance obligations as part of AMS comparability, especially for POS/payment and customer-data support flows.",
        regulatoryRefs: ["PCI DSS", "GDPR-by-channel where applicable"],
        additionalRequirements: [
          "PCI responsibility matrix",
          "Subcontractor access list",
          "Incident escalation SLA",
          "Channel data handling obligations",
        ],
        affectedStages: [
          "rfp_rfi_package",
          "vendor_responses",
          "evaluation",
          "orals_bafo",
        ],
      },
    ],
    riskFactors: [
      {
        id: "risk-retail-channel-compliance-gap",
        label: "Retail channel compliance gap",
        severity: "high",
        detectionSignals: [
          "Vendor security response lacks POS/payment responsibilities.",
          "Subcontractor access and incident escalation obligations are missing.",
        ],
        mitigations: [
          "Require PCI responsibility matrix and channel incident SLA.",
          "Block final comparison until compliance obligations are priced and owned.",
        ],
      },
    ],
    body: `## Summary
Retail AMS that touches POS, payment, loyalty, or customer data carries channel compliance obligations that cannot be treated as generic security boilerplate.

## Detection
Flag missing PCI responsibility, channel incident response, privacy obligations, or subcontractor access controls.

## Evidence required
Security response, PCI responsibility matrix, data-flow ownership, subcontractor list, and incident escalation model.

## CXO language
"Do not call the cheaper bid comparable until channel compliance is priced and owned."`,
  }),
];
