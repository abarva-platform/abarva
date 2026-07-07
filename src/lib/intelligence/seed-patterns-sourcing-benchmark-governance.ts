import type { PatternSeed, PricingModel } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

const BENCHMARK_DATA_GAP = {
  type: "founder-data-gap" as const,
  label:
    "Numeric benchmark requires licensed analyst source, approved internal deal data, buyer evidence, or sourced public rate basis.",
  note: "Do not invent market ranges, medians, day rates, discounts, or savings from corpus guidance alone.",
};

const BENCHMARKS: Array<{
  id: string;
  slug: string;
  title: string;
  metric: string;
  model: PricingModel;
  category: NonNullable<PatternSeed["category"]>;
  thesis: string;
  evidence: string[];
}> = [
  {
    id: "AMS-FTE-RATE-CARD",
    slug: "ams-fte-rate-card-benchmark-governance",
    title: "AMS FTE Rate Card Benchmark Governance",
    metric: "role/location/tier day or month rate",
    model: "time-and-materials",
    category: "pricing_intelligence",
    thesis:
      "AMS labor-rate benchmarks are useful only when role, seniority, location, shift, tower, and delivery responsibility are normalized.",
    evidence: [
      "role taxonomy",
      "location",
      "seniority",
      "shift model",
      "tower scope",
      "rate card",
      "licensed or approved benchmark",
    ],
  },
  {
    id: "TICKET-COST",
    slug: "ticket-cost-by-severity-benchmark-governance",
    title: "Ticket Cost by Severity Benchmark Governance",
    metric: "cost per ticket by severity and complexity",
    model: "usage-based",
    category: "pricing_intelligence",
    thesis:
      "Ticket-cost benchmarks must normalize severity, resolution ownership, automation, language coverage, and support window before comparison.",
    evidence: [
      "ticket history",
      "severity mix",
      "resolution ownership",
      "support hours",
      "automation baseline",
      "benchmark cohort",
    ],
  },
  {
    id: "APPLICATION-SUPPORT",
    slug: "application-support-unit-cost-governance",
    title: "Application Support Unit Cost Governance",
    metric: "cost per application or application tier",
    model: "hybrid",
    category: "pricing_intelligence",
    thesis:
      "Application support cost is not comparable until application tier, complexity, integration density, criticality, and release load are normalized.",
    evidence: [
      "application inventory",
      "tiering",
      "integration count",
      "criticality",
      "release load",
      "incident baseline",
    ],
  },
  {
    id: "TRANSITION-COST",
    slug: "transition-cost-benchmark-governance",
    title: "Transition Cost Benchmark Governance",
    metric: "transition cost as percentage of annual run cost",
    model: "fixed-fee",
    category: "pricing_intelligence",
    thesis:
      "Transition-cost benchmarks need scope, incumbent cooperation, documentation quality, tooling handback, and stabilization duration before they can guide award economics.",
    evidence: [
      "transition plan",
      "incumbent cooperation",
      "documentation inventory",
      "tooling handback",
      "stabilization period",
    ],
  },
  {
    id: "SLA-CREDIT",
    slug: "sla-credit-benchmark-governance",
    title: "SLA Credit Benchmark Governance",
    metric: "fee at risk and service credit percentage",
    model: "hybrid",
    category: "contract_intelligence",
    thesis:
      "SLA credit benchmarks must distinguish ordinary misses from critical-system, repeat, peak-window, and chronic-failure remedies.",
    evidence: [
      "SLA schedule",
      "critical systems",
      "peak windows",
      "repeat miss rule",
      "fee-at-risk clause",
    ],
  },
  {
    id: "CLOUD-COMMIT",
    slug: "cloud-commit-benchmark-governance",
    title: "Cloud Commit Benchmark Governance",
    metric: "committed spend, discount, and drawdown utilization",
    model: "usage-based",
    category: "pricing_intelligence",
    thesis:
      "Cloud discounts are not comparable without workload forecast, drawdown risk, support charges, marketplace spend treatment, and exit flexibility.",
    evidence: [
      "usage forecast",
      "commit schedule",
      "support pricing",
      "marketplace treatment",
      "drawdown history",
      "exit flexibility",
    ],
  },
  {
    id: "SAAS-SEAT",
    slug: "saas-seat-benchmark-governance",
    title: "SaaS Seat Benchmark Governance",
    metric: "net price per entitled and active user",
    model: "subscription",
    category: "enterprise_saas",
    thesis:
      "SaaS seat benchmarks must separate list price, net price, entitled users, active users, modules, support, and renewal protections.",
    evidence: [
      "order form",
      "invoice",
      "admin usage export",
      "module list",
      "support tier",
      "renewal notice",
    ],
  },
  {
    id: "ERP-SI",
    slug: "erp-si-implementation-benchmark-governance",
    title: "ERP SI Implementation Benchmark Governance",
    metric: "implementation fee by scope, wave, and complexity",
    model: "fixed-fee",
    category: "services",
    thesis:
      "ERP implementation benchmarks need process scope, country count, integration count, data migration complexity, and testing ownership before pricing can be compared.",
    evidence: [
      "scope statement",
      "process map",
      "country count",
      "integration inventory",
      "data migration profile",
      "testing plan",
    ],
  },
  {
    id: "DATA-MIGRATION",
    slug: "data-migration-benchmark-governance",
    title: "Data Migration Benchmark Governance",
    metric: "migration cost by source, object, and quality state",
    model: "hybrid",
    category: "data_analytics",
    thesis:
      "Data migration benchmarks are unsafe unless source count, object complexity, data quality, reconciliation, and cutover requirements are normalized.",
    evidence: [
      "source inventory",
      "object inventory",
      "data-quality profile",
      "reconciliation rules",
      "cutover plan",
    ],
  },
  {
    id: "SERVICE-DESK",
    slug: "service-desk-cost-benchmark-governance",
    title: "Service Desk Cost Benchmark Governance",
    metric: "cost per contact or resolved ticket",
    model: "usage-based",
    category: "services",
    thesis:
      "Service desk benchmarks must normalize contact channel, language, hours, resolution responsibility, knowledge maturity, and automation deflection.",
    evidence: [
      "contact baseline",
      "channel mix",
      "language coverage",
      "support hours",
      "resolution tiers",
      "knowledge base maturity",
    ],
  },
  {
    id: "CYBER-MDR",
    slug: "cyber-mdr-benchmark-governance",
    title: "Cyber MDR Benchmark Governance",
    metric: "managed detection and response price by telemetry scope",
    model: "subscription",
    category: "security_identity",
    thesis:
      "MDR benchmarks are not comparable without endpoint, cloud, identity, network, log-volume, response, and retention scope.",
    evidence: [
      "endpoint count",
      "log volume",
      "telemetry scope",
      "retention period",
      "response responsibility",
      "SLA",
    ],
  },
  {
    id: "CONTACT-CENTER",
    slug: "contact-center-bpo-benchmark-governance",
    title: "Contact Center BPO Benchmark Governance",
    metric: "cost per contact, FTE, or outcome",
    model: "hybrid",
    category: "services",
    thesis:
      "Contact-center benchmarks must normalize channel mix, language, hours, handle time, QA scope, seasonality, and escalation ownership.",
    evidence: [
      "contact volume",
      "channel mix",
      "AHT",
      "language coverage",
      "seasonality",
      "QA model",
    ],
  },
  {
    id: "PAYMENTS",
    slug: "payments-effective-rate-benchmark-governance",
    title: "Payments Effective Rate Benchmark Governance",
    metric: "effective payment cost by method, geography, and channel",
    model: "usage-based",
    category: "customer_facing",
    thesis:
      "Payment benchmarks require payment-method mix, channel, geography, authorization, refunds, disputes, and fee pass-through treatment.",
    evidence: [
      "settlement reports",
      "method mix",
      "channel mix",
      "geography",
      "refunds",
      "chargebacks",
      "agreement",
    ],
  },
  {
    id: "POS-STORE",
    slug: "pos-store-support-benchmark-governance",
    title: "POS Store Support Benchmark Governance",
    metric: "store-system support cost by store, lane, or device",
    model: "hybrid",
    category: "customer_facing",
    thesis:
      "POS support benchmarks must normalize store count, lane/device estate, trading hours, payment scope, release freeze, and peak support model.",
    evidence: [
      "store count",
      "device inventory",
      "trading hours",
      "payment scope",
      "freeze calendar",
      "peak model",
    ],
  },
  {
    id: "WMS-OPS",
    slug: "wms-operations-support-benchmark-governance",
    title: "WMS Operations Support Benchmark Governance",
    metric: "warehouse support cost by facility, process, and integration",
    model: "hybrid",
    category: "customer_facing",
    thesis:
      "WMS support benchmarks need facility count, process scope, automation, labor model, integration density, and peak fulfillment profile.",
    evidence: [
      "facility count",
      "process scope",
      "automation level",
      "labor model",
      "integration inventory",
      "peak profile",
    ],
  },
  {
    id: "EXIT-ASSIST",
    slug: "exit-assistance-rate-benchmark-governance",
    title: "Exit Assistance Rate Benchmark Governance",
    metric: "transition-out rate and support package",
    model: "time-and-materials",
    category: "contract_intelligence",
    thesis:
      "Exit-assistance benchmarks require pre-priced roles, tooling/data handback scope, knowledge-transfer artifacts, and transition-out duration.",
    evidence: [
      "exit scope",
      "role rate card",
      "tooling handback",
      "data return",
      "knowledge artifacts",
      "duration",
    ],
  },
];

export const SOURCING_BENCHMARK_GOVERNANCE_PATTERNS: PatternSeed[] =
  BENCHMARKS.map((entry) => ({
    id: `PAT-SRC-BEN-${entry.id}`,
    slug: entry.slug,
    title: entry.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: entry.thesis,
    applicability: `Apply when Source is asked to benchmark ${entry.metric} and no approved numeric benchmark evidence is attached.`,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.78,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-PNG-002", "PAT-SRC-LEV-008"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: entry.category,
    vendorClass:
      entry.category === "enterprise_saas" ? "direct-tech" : "service",
    pricingBenchmarks: [
      {
        label: `${entry.title}: numeric evidence required`,
        model: entry.model,
        metric: entry.metric,
        sourceBasis: [BENCHMARK_DATA_GAP],
        confidence: 0.3,
        notes:
          "This pattern defines benchmark evidence requirements only. Numeric rangeLow, rangeHigh, and median must remain empty until approved evidence is loaded.",
      },
    ],
    riskFactors: [
      {
        id: `risk-${entry.id.toLowerCase()}-unsupported-benchmark`,
        label: "Unsupported numeric benchmark",
        severity: "high",
        detectionSignals: [
          "Source answer shows a numeric rate, discount, median, or savings value without approved sourceBasis.",
          "Benchmark cohort is not defined or does not match the event scope.",
        ],
        mitigations: [
          "Request approved benchmark evidence before numeric guidance.",
          "Show pattern-level normalization requirements instead of invented ranges.",
        ],
      },
    ],
    body: `## Summary
${entry.thesis}

## Evidence required
Minimum evidence: ${entry.evidence.join(", ")}. Numeric ranges must come from licensed analyst content, approved internal deal data, buyer artifacts, or sourced public rates with validity dates.

## CXO language
"Source can define the benchmark method now, but should not show a number until the evidence is loaded."`,
  }));
