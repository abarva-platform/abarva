import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

type LeverSeed = {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  lever: string;
  buyerAsk: string;
  vendorGive: string;
  clauseArea: string;
  buyerPosition: string;
  fallbackPosition: string;
  walkawayTriggers: string[];
};

const LEVERS: LeverSeed[] = [
  {
    id: "PAT-SRC-LEV-001",
    slug: "term-for-price-with-exit-safety",
    title: "Term-for-Price With Exit Safety",
    thesis:
      "Longer term can buy better price, but only when benchmark, termination, and exit-assistance rights preserve future leverage.",
    applicability:
      "Apply when a vendor offers discount for a longer term or renewal commitment.",
    lever: "Term for price",
    buyerAsk:
      "Lower recurring price while preserving benchmark, termination, and exit rights.",
    vendorGive: "Multi-year revenue certainty.",
    clauseArea: "Term and termination",
    buyerPosition:
      "Term extension is conditioned on benchmark remedy, convenience termination window, and exit assistance at pre-agreed rates.",
    fallbackPosition:
      "Accept a shorter initial term with renewal price cap if exit rights are weak.",
    walkawayTriggers: ["No benchmark remedy.", "No transition-out assistance."],
  },
  {
    id: "PAT-SRC-LEV-002",
    slug: "volume-for-unit-rate-with-rampdown",
    title: "Volume-for-Unit-Rate With Rampdown",
    thesis:
      "Volume commitments should lower unit rate without trapping the buyer in stranded demand after transformation, divestiture, or demand shifts.",
    applicability:
      "Apply to seats, tickets, calls, transactions, application counts, or cloud consumption commitments.",
    lever: "Volume for rate",
    buyerAsk:
      "Lower unit rates with rampdown, reopener, and transformation adjustment rights.",
    vendorGive: "Demand forecast and minimum baseline.",
    clauseArea: "Volume commitment",
    buyerPosition:
      "Committed volume includes rampdown rights for transformation, divestiture, automation, or decommissioned scope.",
    fallbackPosition: "Use tiered bands instead of a hard minimum.",
    walkawayTriggers: [
      "Hard minimum with no rampdown.",
      "Price bands punish demand reduction.",
    ],
  },
  {
    id: "PAT-SRC-LEV-003",
    slug: "payment-acceleration-for-acceptance-discount",
    title: "Payment Acceleration for Acceptance Discount",
    thesis:
      "Accelerated payment is valuable to vendors and must be exchanged for quantified discounts or stronger acceptance protection.",
    applicability:
      "Apply when vendors request upfront payment, annual prepay, or accelerated implementation milestones.",
    lever: "Payment timing",
    buyerAsk:
      "Quantified discount, waiver, or warranty for each payment acceleration.",
    vendorGive: "Earlier cash flow.",
    clauseArea: "Payment",
    buyerPosition:
      "Accelerated payment releases only after objective acceptance evidence and discount math are recorded.",
    fallbackPosition:
      "Use milestone holdback and refund right if prepayment is unavoidable.",
    walkawayTriggers: [
      "No discount math.",
      "Payment before acceptance evidence.",
    ],
  },
  {
    id: "PAT-SRC-LEV-004",
    slug: "sla-credit-at-risk-holdback",
    title: "SLA Credit At-Risk Holdback",
    thesis:
      "Service credits should create real at-risk economics, not a small accounting offset that vendors can absorb.",
    applicability:
      "Apply when uptime, incident response, recovery time, or operational throughput is material.",
    lever: "SLA at-risk economics",
    buyerAsk:
      "Step-up credits, fee-at-risk holdback, and chronic-failure termination trigger.",
    vendorGive: "Clear measurement rules and exclusions.",
    clauseArea: "Service levels",
    buyerPosition:
      "Critical SLA misses trigger step-up credits, remediation, and chronic-failure rights.",
    fallbackPosition:
      "Keep lower credits only with a separate executive remediation mechanism.",
    walkawayTriggers: [
      "Flat credits for critical misses.",
      "No chronic-failure remedy.",
    ],
  },
  {
    id: "PAT-SRC-LEV-005",
    slug: "transition-fee-holdback",
    title: "Transition Fee Holdback",
    thesis:
      "Transition-heavy awards need fee holdback tied to stabilization outcomes so vendors cannot underprice mobilization and externalize failure cost.",
    applicability:
      "Apply to supplier switches, outsourcing consolidation, AMS takeovers, and complex cutovers.",
    lever: "Transition risk transfer",
    buyerAsk:
      "Hold back transition or early-run fees until service readiness and stabilization criteria are met.",
    vendorGive: "Objective acceptance criteria and cure period.",
    clauseArea: "Transition",
    buyerPosition:
      "Holdback releases after knowledge transfer, cutover, early-life SLA performance, and runbook acceptance.",
    fallbackPosition:
      "Use liquidated transition remedies if holdback is refused.",
    walkawayTriggers: [
      "No stabilization warranty.",
      "No transition acceptance criteria.",
    ],
  },
  {
    id: "PAT-SRC-LEV-006",
    slug: "automation-gainshare-with-remedy",
    title: "Automation Gainshare With Remedy",
    thesis:
      "Automation upside should be commercialized through measurable milestones, gainshare rules, and downside remedies.",
    applicability:
      "Apply when vendors claim AI, automation, AIOps, self-healing, or productivity savings.",
    lever: "Automation value share",
    buyerAsk:
      "Baseline, milestone, measurement method, gainshare split, and failure remedy.",
    vendorGive: "Share of verified incremental value.",
    clauseArea: "Automation commitments",
    buyerPosition:
      "Automation value is paid only against measured baseline reduction or service improvement.",
    fallbackPosition:
      "Treat automation as upside-only until evidence proves value.",
    walkawayTriggers: [
      "No baseline.",
      "No remedy for missed automation milestones.",
    ],
  },
  {
    id: "PAT-SRC-LEV-007",
    slug: "change-control-rate-card-cap",
    title: "Change-Control Rate Card Cap",
    thesis:
      "Base-price concessions are fragile when change-control rates and approval thresholds are left open.",
    applicability:
      "Apply to services with enhancements, releases, integrations, transformation adjacency, or variable scope.",
    lever: "Change-control discipline",
    buyerAsk:
      "Pre-priced change-control rate card, approval thresholds, leakage reporting, and cap.",
    vendorGive: "Clear out-of-scope definition.",
    clauseArea: "Change control",
    buyerPosition:
      "Change-control rates are capped, benchmarkable, and reported monthly against scope leakage.",
    fallbackPosition:
      "Require CIO approval for any change above materiality threshold.",
    walkawayTriggers: ["No rate card.", "No leakage reporting."],
  },
  {
    id: "PAT-SRC-LEV-008",
    slug: "benchmark-remedy-envelope",
    title: "Benchmark Remedy Envelope",
    thesis:
      "Benchmarking only protects value when it includes adjustment, reopener, or termination remedy.",
    applicability:
      "Apply to multi-year managed services, SaaS, cloud, BPO, and renewals.",
    lever: "Market test",
    buyerAsk: "Benchmark right with price adjustment or reopener remedy.",
    vendorGive: "Reasonable benchmark frequency and peer cohort definition.",
    clauseArea: "Benchmarking",
    buyerPosition:
      "Out-of-market pricing triggers adjustment, cure negotiation, or termination right.",
    fallbackPosition:
      "Use mid-term market reopener if automatic adjustment is refused.",
    walkawayTriggers: [
      "Benchmark with no remedy.",
      "Vendor controls benchmark provider alone.",
    ],
  },
  {
    id: "PAT-SRC-LEV-009",
    slug: "exit-assistance-survival",
    title: "Exit Assistance Survival",
    thesis:
      "Exit-assistance obligations must survive termination and be pre-priced while the buyer still has leverage.",
    applicability:
      "Apply to service contracts where continuity depends on vendor cooperation at exit.",
    lever: "Exit leverage",
    buyerAsk:
      "Surviving exit assistance, data return, tooling handback, and rate card.",
    vendorGive: "Defined exit scope and reasonable cooperation window.",
    clauseArea: "Exit assistance",
    buyerPosition:
      "Exit assistance survives termination and includes pre-priced transition-out support.",
    fallbackPosition: "Use capped T&M rates with mandatory cooperation duties.",
    walkawayTriggers: ["No survival language.", "No handback obligation."],
  },
  {
    id: "PAT-SRC-LEV-010",
    slug: "audit-rights-with-data-access",
    title: "Audit Rights With Data Access",
    thesis:
      "Audit rights need data access, frequency, scope, and remediation rights; generic audit language is rarely enough.",
    applicability:
      "Apply where pricing, service levels, security, subcontractors, or compliance obligations must be verified.",
    lever: "Auditability",
    buyerAsk:
      "Audit access to pricing, performance, security, subcontractor, and compliance evidence.",
    vendorGive: "Notice period, confidentiality, and reasonable scope limits.",
    clauseArea: "Audit rights",
    buyerPosition:
      "Buyer can audit records needed to verify fees, service levels, compliance, and subcontractor performance.",
    fallbackPosition:
      "Use third-party audit with data extract rights if direct audit is limited.",
    walkawayTriggers: [
      "No access to fee records.",
      "Audit right excludes subcontractors.",
    ],
  },
  {
    id: "PAT-SRC-LEV-011",
    slug: "subcontractor-approval-control",
    title: "Subcontractor Approval Control",
    thesis:
      "Subcontractor and delivery-location changes can alter risk and economics and should require disclosure and buyer control.",
    applicability:
      "Apply to offshore delivery, managed services, security-sensitive work, and regulated operations.",
    lever: "Delivery transparency",
    buyerAsk:
      "Named subcontractors, delivery locations, access scope, and approval rights for material changes.",
    vendorGive: "Operational delivery flexibility inside approved boundaries.",
    clauseArea: "Subcontractors",
    buyerPosition:
      "Vendor remains liable and needs buyer approval for material subcontractor or location changes.",
    fallbackPosition:
      "Permit pre-approved subcontractor pool with audit rights.",
    walkawayTriggers: [
      "No disclosure.",
      "No approval right for material changes.",
    ],
  },
  {
    id: "PAT-SRC-LEV-012",
    slug: "ip-license-handback-control",
    title: "IP License and Handback Control",
    thesis:
      "Operational artifacts created during service delivery should not become hidden vendor lock-in.",
    applicability:
      "Apply to implementation, AMS, analytics, automation, runbooks, dashboards, and workflow configuration.",
    lever: "IP and tooling",
    buyerAsk:
      "Ownership or perpetual use rights for buyer-specific artifacts and handback at exit.",
    vendorGive: "Protection for pre-existing vendor tools.",
    clauseArea: "IP and tooling",
    buyerPosition:
      "Buyer-specific runbooks, automations, configurations, and documentation are owned or licensed for operational use.",
    fallbackPosition:
      "Separate vendor background IP from buyer-specific deliverables.",
    walkawayTriggers: [
      "Vendor can withhold operational artifacts.",
      "No transition-use license.",
    ],
  },
  {
    id: "PAT-SRC-LEV-013",
    slug: "data-return-and-destruction-proof",
    title: "Data Return and Destruction Proof",
    thesis:
      "Data return and destruction obligations need evidence, timing, and subcontractor coverage to be operationally meaningful.",
    applicability:
      "Apply to SaaS, BPO, managed services, analytics, customer data, employee data, and regulated data flows.",
    lever: "Data control",
    buyerAsk:
      "Return format, destruction certificate, subcontractor proof, and transition access.",
    vendorGive: "Reasonable export timing and secure destruction process.",
    clauseArea: "Data return",
    buyerPosition:
      "Vendor returns data in usable format and certifies destruction across subcontractors after exit.",
    fallbackPosition: "Require escrow or periodic exports for critical data.",
    walkawayTriggers: [
      "No usable export format.",
      "No subcontractor destruction proof.",
    ],
  },
  {
    id: "PAT-SRC-LEV-014",
    slug: "renewal-cap-and-discount-preservation",
    title: "Renewal Cap and Discount Preservation",
    thesis:
      "Renewals can erase negotiated value unless caps, notice, and discount preservation are explicit.",
    applicability:
      "Apply to SaaS renewals, managed services extensions, and multi-year agreements with optional renewal periods.",
    lever: "Renewal economics",
    buyerAsk:
      "Renewal price cap, discount preservation, and early notice of material changes.",
    vendorGive: "Renewal visibility and term certainty.",
    clauseArea: "Renewal",
    buyerPosition:
      "Renewal increases are capped and discounts persist unless scope materially changes.",
    fallbackPosition:
      "Use market reopener plus termination right if cap is refused.",
    walkawayTriggers: [
      "Discount resets at renewal.",
      "No renewal notice window.",
    ],
  },
  {
    id: "PAT-SRC-LEV-015",
    slug: "warranty-period-with-defect-remedy",
    title: "Warranty Period With Defect Remedy",
    thesis:
      "Warranty language should define defect, remedy, period, severity, and excluded causes before acceptance is signed.",
    applicability:
      "Apply to implementations, transitions, migrations, configuration, integrations, and custom deliverables.",
    lever: "Warranty protection",
    buyerAsk:
      "Warranty period, defect severity, remediation SLA, and no-fee correction obligation.",
    vendorGive:
      "Defined acceptance criteria and excluded buyer-caused defects.",
    clauseArea: "Warranty",
    buyerPosition:
      "Vendor corrects defects discovered during warranty at no additional fee within severity-based timelines.",
    fallbackPosition:
      "Use shorter warranty only with stronger acceptance testing.",
    walkawayTriggers: [
      "No post-acceptance warranty.",
      "Warranty excludes core deliverables.",
    ],
  },
  {
    id: "PAT-SRC-LEV-016",
    slug: "liability-cap-by-risk-bucket",
    title: "Liability Cap by Risk Bucket",
    thesis:
      "A single liability cap can underprice high-consequence risks; caps should vary by confidentiality, data, IP, fraud, and service failure buckets.",
    applicability:
      "Apply when vendor work touches sensitive data, critical operations, IP, regulated obligations, or financial exposure.",
    lever: "Risk allocation",
    buyerAsk:
      "Separate caps or uncapped carveouts for high-consequence risk categories.",
    vendorGive: "Predictable cap for ordinary commercial damages.",
    clauseArea: "Liability",
    buyerPosition:
      "Confidentiality, data breach, IP infringement, fraud, and willful misconduct receive higher or uncapped treatment.",
    fallbackPosition:
      "Use super-cap for named risk buckets if uncapped carveouts are refused.",
    walkawayTriggers: [
      "Single low cap for data/IP risk.",
      "No fraud or willful misconduct carveout.",
    ],
  },
  {
    id: "PAT-SRC-LEV-017",
    slug: "insurance-evidence-not-just-certificate",
    title: "Insurance Evidence, Not Just Certificate",
    thesis:
      "Insurance certificates do not prove coverage adequacy unless limits, exclusions, named insureds, and renewal evidence are checked.",
    applicability:
      "Apply to vendors with cyber, professional liability, E&O, D&O, crime, or operational risk exposure.",
    lever: "Insurance proof",
    buyerAsk:
      "Coverage limits, exclusions, renewal evidence, and additional insured status where appropriate.",
    vendorGive:
      "Certificate and broker letter with confidentiality constraints.",
    clauseArea: "Insurance",
    buyerPosition:
      "Vendor maintains required coverage and provides evidence of limits, renewal, and material exclusion changes.",
    fallbackPosition:
      "Use higher liability holdback if insurance evidence is weak.",
    walkawayTriggers: [
      "Coverage exclusions undermine key risk.",
      "No renewal evidence.",
    ],
  },
  {
    id: "PAT-SRC-LEV-018",
    slug: "late-redline-commercial-discipline",
    title: "Late Redline Commercial Discipline",
    thesis:
      "Late legal redlines can reverse BAFO economics and should be tracked as commercial deltas, not treated as legal cleanup.",
    applicability:
      "Apply from BAFO through contracting when vendors submit legal, security, or commercial redlines after pricing decisions.",
    lever: "Redline value control",
    buyerAsk:
      "Quantify value impact of late redlines and reopen price if risk allocation worsens.",
    vendorGive: "Commercial certainty if redlines stay within agreed envelope.",
    clauseArea: "Redline governance",
    buyerPosition:
      "Material redlines to liability, SLA, exit, audit, data, or change control reopen commercial evaluation.",
    fallbackPosition:
      "Escalate material redlines to selection committee before award.",
    walkawayTriggers: [
      "Risk-shifting redlines after BAFO.",
      "No commercial adjustment for weakened terms.",
    ],
  },
];

export const SOURCING_COMMERCIAL_LEVER_PATTERNS: PatternSeed[] = LEVERS.map(
  (entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: entry.thesis,
    applicability: entry.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.83,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-BAFO-001", "PAT-SRC-PNG-009"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category:
      entry.clauseArea === "Payment" || entry.clauseArea === "Volume commitment"
        ? "pricing_intelligence"
        : "contract_intelligence",
    vendorClass: "service",
    negotiationLevers: [
      {
        lever: entry.lever,
        whenToUse: entry.applicability,
        buyerAsk: entry.buyerAsk,
        vendorGive: entry.vendorGive,
      },
    ],
    standardClauses: [
      {
        clauseArea: entry.clauseArea,
        buyerPosition: entry.buyerPosition,
        fallbackPosition: entry.fallbackPosition,
        vendorPosition:
          "Vendor may narrow operational mechanics but should not remove buyer control, evidence, or remedy.",
        walkawayTriggers: entry.walkawayTriggers,
      },
    ],
    body: `## Summary
${entry.thesis}

## Detection
Flag this lever when the vendor offer includes ${entry.lever.toLowerCase()} but the proposal does not show the buyer ask, vendor give, evidence required, and contract clause affected.

## Evidence required
Commercial comparison, clause draft, approval owner, walk-away posture, and documented value/risk tradeoff.

## CXO language
"${entry.title} should be treated as a negotiated trade, not a side comment in legal or procurement."`,
  }),
);
