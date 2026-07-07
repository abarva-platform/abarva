import type { PatternSeed, PricingModel } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

const VALUE_SOURCE_BASIS = {
  type: "abarva-observed" as const,
  label: "AbarVa Source value-proof doctrine",
  note: "Value proof requires buyer baseline, vendor pricing, BAFO delta, contract, and realized ledger evidence before savings can be claimed.",
};

const VALUE_PROOF_PATTERNS: Array<{
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  model: PricingModel;
  riskId: string;
  riskLabel: string;
  evidence: string[];
}> = [
  {
    id: "BASELINE-SOURCE-CHAIN",
    slug: "baseline-source-chain",
    title: "Baseline Source Chain",
    thesis:
      "A savings claim starts with a traceable baseline, not with the event header value or an analyst estimate.",
    applicability:
      "Apply when Source shows baseline exposure, run-rate spend, incumbent spend, or value-at-stake for a sourcing event.",
    model: "hybrid",
    riskId: "risk-baseline-asserted-not-sourced",
    riskLabel: "Baseline asserted without source",
    evidence: [
      "contract",
      "invoice",
      "purchase order",
      "spend export",
      "scope schedule",
    ],
  },
  {
    id: "SCOPE-NORMALIZED-BASELINE",
    slug: "scope-normalized-baseline",
    title: "Scope-Normalized Baseline",
    thesis:
      "Baseline spend must be normalized to the same scope being sourced or savings will include work that was removed, deferred, or moved elsewhere.",
    applicability:
      "Apply when incumbent scope differs from RFP scope, BAFO scope, selected scope, or retained-client responsibility.",
    model: "hybrid",
    riskId: "risk-scope-normalization-gap",
    riskLabel: "Scope normalization gap",
    evidence: [
      "incumbent scope",
      "RFP scope",
      "retained-role matrix",
      "exclusion log",
    ],
  },
  {
    id: "BID-COMPARABILITY-BRIDGE",
    slug: "bid-comparability-bridge",
    title: "Bid Comparability Bridge",
    thesis:
      "Vendor bids are not savings evidence until they are bridged to common volumes, towers, locations, transition assumptions, and pass-through treatment.",
    applicability:
      "Apply when Source compares vendor price sheets, TCO, rate cards, or commercial scorecards.",
    model: "hybrid",
    riskId: "risk-bid-apples-oranges",
    riskLabel: "Bid comparison is not apples-to-apples",
    evidence: [
      "pricing template",
      "volume assumptions",
      "tower map",
      "transition assumptions",
      "pass-through schedule",
    ],
  },
  {
    id: "TRANSITION-INCLUSIVE-TCO",
    slug: "transition-inclusive-tco",
    title: "Transition-Inclusive TCO",
    thesis:
      "Switching economics require transition, stabilization, dual-run, knowledge transfer, tooling, and exit costs before award value can be trusted.",
    applicability:
      "Apply when a challenger appears cheaper than the incumbent or when transition risk is material.",
    model: "fixed-fee",
    riskId: "risk-transition-excluded-from-tco",
    riskLabel: "Transition cost excluded from TCO",
    evidence: [
      "transition plan",
      "dual-run estimate",
      "knowledge-transfer plan",
      "tooling handback",
      "exit-assist clause",
    ],
  },
  {
    id: "RUN-RATE-VERSUS-ONE-TIME",
    slug: "run-rate-versus-one-time-value",
    title: "Run-Rate Versus One-Time Value",
    thesis:
      "Recurring run-rate savings and one-time concessions must be separated or the executive value story will overstate durable savings.",
    applicability:
      "Apply when BAFO includes credits, migration funding, free months, rebates, price holidays, or transformation funds.",
    model: "hybrid",
    riskId: "risk-one-time-counted-as-run-rate",
    riskLabel: "One-time value counted as run-rate",
    evidence: [
      "BAFO response",
      "commercial summary",
      "contract pricing schedule",
      "invoice credit terms",
    ],
  },
  {
    id: "BAFO-DELTA-LEDGER",
    slug: "bafo-delta-ledger",
    title: "BAFO Delta Ledger",
    thesis:
      "BAFO value should be shown as a delta from initial bid to final offer with each change tied to price, scope, term, SLA, risk, or clause movement.",
    applicability:
      "Apply when Source claims negotiation impact or BAFO-improved value.",
    model: "hybrid",
    riskId: "risk-bafo-delta-unattributed",
    riskLabel: "BAFO delta unattributed",
    evidence: [
      "initial bid",
      "BAFO response",
      "negotiation log",
      "redline",
      "pricing bridge",
    ],
  },
  {
    id: "CONTRACTED-VERSUS-NEGOTIATED",
    slug: "contracted-versus-negotiated-value",
    title: "Contracted Versus Negotiated Value",
    thesis:
      "Negotiated value is not bankable until the term appears in the executed contract, order form, SOW, or pricing schedule.",
    applicability:
      "Apply when Source converts BAFO outcomes into award, selection memo, deal pack, or value ledger entries.",
    model: "hybrid",
    riskId: "risk-negotiated-not-contracted",
    riskLabel: "Negotiated value not contracted",
    evidence: [
      "executed contract",
      "order form",
      "SOW",
      "pricing schedule",
      "redline disposition",
    ],
  },
  {
    id: "REALIZED-VALUE-STATE",
    slug: "realized-value-state",
    title: "Realized Value State",
    thesis:
      "Savings move from contracted to realized only when invoices, consumption, service credits, or finance sign-off confirm the value occurred.",
    applicability:
      "Apply to value-ledger states after transition, renewal, award, or consumption true-up.",
    model: "hybrid",
    riskId: "risk-contracted-treated-as-realized",
    riskLabel: "Contracted value treated as realized",
    evidence: [
      "invoice",
      "finance sign-off",
      "usage report",
      "credit memo",
      "value ledger state",
    ],
  },
  {
    id: "RETAINED-COST-OFFSET",
    slug: "retained-cost-offset",
    title: "Retained Cost Offset",
    thesis:
      "Vendor savings must be offset by retained-client cost, governance overhead, tooling, and transition-office effort.",
    applicability:
      "Apply when outsourcing, managed services, or SI awards shift work from vendor to client teams.",
    model: "hybrid",
    riskId: "risk-retained-cost-hidden",
    riskLabel: "Retained cost hidden",
    evidence: [
      "retained role matrix",
      "governance model",
      "tooling plan",
      "internal labor estimate",
    ],
  },
  {
    id: "SERVICE-CREDIT-VALUE",
    slug: "service-credit-value-proof",
    title: "Service Credit Value Proof",
    thesis:
      "Service credits should be reported as contractual protection unless actual credits are earned, applied, and visible in invoice or credit evidence.",
    applicability:
      "Apply when SLA remedies are used to support value claims or risk mitigation.",
    model: "hybrid",
    riskId: "risk-service-credit-overclaim",
    riskLabel: "Service credit overclaim",
    evidence: ["SLA schedule", "service report", "credit memo", "invoice"],
  },
  {
    id: "AUTOMATION-VALUE-ATTESTATION",
    slug: "automation-value-attestation",
    title: "Automation Value Attestation",
    thesis:
      "Automation commitments create value only when the contract defines baseline work, automation milestone, benefit owner, and benefit measurement.",
    applicability:
      "Apply when vendors promise ticket deflection, productivity, automation savings, AI operations, or self-healing improvements.",
    model: "outcome-based",
    riskId: "risk-automation-promise-unmeasured",
    riskLabel: "Automation promise unmeasured",
    evidence: [
      "automation roadmap",
      "baseline tickets",
      "contract milestone",
      "benefit owner",
      "measurement method",
    ],
  },
  {
    id: "INDEXATION-VALUE-LOCK",
    slug: "indexation-value-lock",
    title: "Indexation Value Lock",
    thesis:
      "Savings can evaporate when indexation, FX, COLA, or annual uplift clauses are not modeled across the contract term.",
    applicability:
      "Apply to multi-year contracts, offshore delivery, cloud commits, SaaS renewals, and managed services awards.",
    model: "hybrid",
    riskId: "risk-indexation-erodes-savings",
    riskLabel: "Indexation erodes savings",
    evidence: [
      "pricing schedule",
      "indexation clause",
      "FX clause",
      "term sheet",
    ],
  },
  {
    id: "CHANGE-CONTROL-LEAKAGE",
    slug: "change-control-leakage-proof",
    title: "Change-Control Leakage Proof",
    thesis:
      "Low award price is fragile when change-control pricing, excluded services, and rate-card fallback are not modeled.",
    applicability:
      "Apply when vendor bid is aggressive, scope is immature, or retained/client responsibilities are ambiguous.",
    model: "hybrid",
    riskId: "risk-change-control-leakage",
    riskLabel: "Change-control leakage",
    evidence: [
      "change-control clause",
      "excluded scope",
      "rate card",
      "assumption log",
    ],
  },
  {
    id: "VOLUME-COMMIT-DRAWDOWN",
    slug: "volume-commit-drawdown-proof",
    title: "Volume Commit Drawdown Proof",
    thesis:
      "Commit discounts are value only when forecast, drawdown, shortfall remedy, and unused-credit treatment are explicit.",
    applicability:
      "Apply to SaaS, cloud, BPO, contact center, transaction, or device-based pricing.",
    model: "usage-based",
    riskId: "risk-commit-discount-overstated",
    riskLabel: "Commit discount overstated",
    evidence: [
      "usage forecast",
      "commit schedule",
      "drawdown report",
      "shortfall clause",
    ],
  },
  {
    id: "TAX-AND-PASS-THROUGH",
    slug: "tax-and-pass-through-value-treatment",
    title: "Tax and Pass-Through Value Treatment",
    thesis:
      "Taxes, third-party pass-throughs, travel, tooling, and subcontractor charges must be separated from controllable vendor economics.",
    applicability:
      "Apply when comparing bids or explaining why apparent savings differ from invoice-level value.",
    model: "hybrid",
    riskId: "risk-pass-through-masks-value",
    riskLabel: "Pass-through masks value",
    evidence: [
      "pricing template",
      "pass-through schedule",
      "tax treatment",
      "invoice sample",
    ],
  },
  {
    id: "PAYMENT-TERMS-CASH-VALUE",
    slug: "payment-terms-cash-value",
    title: "Payment Terms Cash Value",
    thesis:
      "Payment-term changes are finance value, not run-rate savings, and should be labeled separately in executive reporting.",
    applicability:
      "Apply when vendors offer early-pay discounts, deferred payments, milestone changes, or working-capital concessions.",
    model: "hybrid",
    riskId: "risk-payment-terms-misclassified",
    riskLabel: "Payment terms misclassified",
    evidence: [
      "payment terms",
      "treasury sign-off",
      "discount schedule",
      "contract",
    ],
  },
  {
    id: "RISK-ADJUSTED-VALUE",
    slug: "risk-adjusted-value-bridge",
    title: "Risk-Adjusted Value Bridge",
    thesis:
      "Executive decisions need a value bridge that shows price savings beside transition, service, cyber, compliance, and operational risk adjustments.",
    applicability:
      "Apply to executive decision briefs, Atlas decision reports, and board-level sourcing recommendations.",
    model: "hybrid",
    riskId: "risk-price-only-recommendation",
    riskLabel: "Price-only recommendation",
    evidence: ["risk register", "TCO bridge", "scorecard", "risk attestation"],
  },
  {
    id: "VALUE-OWNER-ATTESTATION",
    slug: "value-owner-attestation",
    title: "Value Owner Attestation",
    thesis:
      "The value owner, not the AI agent, must attest which savings are claimed, provisional, contracted, or realized.",
    applicability:
      "Apply to value target briefs, executive decisions, value ledgers, and post-award checkpoint logs.",
    model: "hybrid",
    riskId: "risk-ai-claimed-value",
    riskLabel: "AI claimed value",
    evidence: [
      "human approval log",
      "value owner sign-off",
      "timestamp",
      "reason",
    ],
  },
  {
    id: "DISPUTE-READY-VALUE-PACK",
    slug: "dispute-ready-value-pack",
    title: "Dispute-Ready Value Pack",
    thesis:
      "A value claim is dispute-ready only when a CFO, vendor, or auditor can inspect the exact evidence chain and reproduce the math.",
    applicability:
      "Apply to deal packs, CXO reports, PPTX exports, audit bundles, and value proof pages.",
    model: "hybrid",
    riskId: "risk-value-pack-not-reproducible",
    riskLabel: "Value pack not reproducible",
    evidence: [
      "baseline",
      "pricing bridge",
      "BAFO delta",
      "contract",
      "invoice",
      "calculation notes",
    ],
  },
  {
    id: "NO-EVIDENCE-NO-NUMBER",
    slug: "no-evidence-no-number",
    title: "No Evidence, No Number",
    thesis:
      "When Source lacks the evidence chain for value, the correct output is a proof checklist and open gaps, not a placeholder savings number.",
    applicability:
      "Apply whenever an event has missing pricing, contract, BAFO, invoice, or value-ledger evidence.",
    model: "unknown",
    riskId: "risk-placeholder-number",
    riskLabel: "Placeholder number",
    evidence: [
      "evidence inventory",
      "pricing workbook",
      "value ledger",
      "approval log",
    ],
  },
];

export const SOURCING_VALUE_PROOF_PATTERNS: PatternSeed[] =
  VALUE_PROOF_PATTERNS.map((entry) => ({
    id: `PAT-SRC-VPF-${entry.id}`,
    slug: entry.slug,
    title: entry.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: entry.thesis,
    applicability: entry.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.84,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-PNG-002", "PAT-SRC-BAFO-003"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "pricing_intelligence",
    vendorClass: "service",
    pricingBenchmarks: [
      {
        label: `${entry.title}: value evidence method`,
        model: entry.model,
        sourceBasis: [VALUE_SOURCE_BASIS],
        confidence: 0.55,
        notes:
          "This pattern defines the evidence chain for value proof and intentionally contains no numeric savings range.",
      },
    ],
    riskFactors: [
      {
        id: entry.riskId,
        label: entry.riskLabel,
        severity: "high",
        detectionSignals: [
          "Source output claims value without the required evidence chain.",
          "Savings number is not reproducible from cited artifacts.",
        ],
        mitigations: [
          "Downgrade claim to provisional or not proven.",
          `Require evidence: ${entry.evidence.join(", ")}.`,
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Evidence-backed value proof",
        whenToUse:
          "Use when Source is asked to turn commercial movement into a savings, value, or negotiation-impact claim.",
        buyerAsk:
          "Turn negotiated terms into reproducible, finance-auditable value only when evidence supports the claim.",
        vendorGive:
          "Baseline, normalized bid, BAFO delta, contract term, and realized ledger state linked before claiming savings.",
        tradeoffs: [
          "May delay executive reporting until evidence is loaded.",
          "Prevents unsupported savings claims from reaching CXO artifacts.",
        ],
        evidenceBasis: [VALUE_SOURCE_BASIS],
      },
    ],
    body: `## Summary
${entry.thesis}

## Evidence required
${entry.evidence.join(", ")}.

## CXO language
"The value method is defined, but the number should stay provisional until this evidence chain is attached."`,
  }));
