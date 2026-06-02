import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

const GOVERNANCE_SOURCE_BASIS = {
  type: "abarva-observed" as const,
  label: "AbarVa Source corpus governance doctrine",
  note: "Shared sourcing doctrine may be global; tenant evidence, vendor posture, and numeric benchmarks require scoped evidence.",
};

const GOVERNANCE_PATTERNS: Array<{
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  riskId: string;
  riskLabel: string;
  mitigation: string;
}> = [
  {
    id: "GLOBAL-SOURCING-DOCTRINE",
    slug: "global-sourcing-doctrine-visibility",
    title: "Global Sourcing Doctrine Visibility",
    thesis:
      "Reusable sourcing methods, gate structures, and negotiation playbooks should be visible across clients when they contain no tenant facts or vendor-specific assertions.",
    applicability:
      "Apply when a pattern describes how to run a sourcing process, normalize a template, or structure a decision without using client evidence.",
    riskId: "risk-global-doctrine-confused-with-client-fact",
    riskLabel: "Global doctrine mistaken for tenant evidence",
    mitigation:
      "Label output as sourcing doctrine and require tenant evidence before claiming event-specific value, vendor behavior, or savings.",
  },
  {
    id: "TENANT-EVIDENCE-SCOPING",
    slug: "tenant-evidence-scoping",
    title: "Tenant Evidence Scoping",
    thesis:
      "Contracts, invoices, pricing, performance, tickets, BAFO submissions, and approval logs must stay tenant-scoped even when the interpretation pattern is global.",
    applicability:
      "Apply whenever Source retrieves buyer artifacts or explains why a sourcing recommendation is grounded in tenant evidence.",
    riskId: "risk-tenant-evidence-overexposure",
    riskLabel: "Tenant evidence overexposure",
    mitigation:
      "Keep evidence retrieval scoped to active client identity and show anti-enumeration responses for cross-tenant event IDs.",
  },
  {
    id: "LICENSED-BENCHMARK-SCOPING",
    slug: "licensed-benchmark-scope-and-license",
    title: "Licensed Benchmark Scope and License",
    thesis:
      "Analyst and benchmark content should be treated as licensed evidence with explicit visibility, validity date, source owner, and redistribution constraints.",
    applicability:
      "Apply before exposing rate cards, benchmark medians, quartiles, discount ranges, or analyst-derived vendor comparisons.",
    riskId: "risk-benchmark-license-leak",
    riskLabel: "Benchmark license leakage",
    mitigation:
      "Store licensed benchmark sourceBasis, expiry, and audience rules; suppress numeric output when license scope is unknown.",
  },
  {
    id: "VENDOR-POSTURE-EVIDENCE",
    slug: "vendor-posture-evidence-required",
    title: "Vendor Posture Evidence Required",
    thesis:
      "Vendor pricing posture, delivery quality, clause strength, and negotiation behavior should never be inferred from vendor name alone.",
    applicability:
      "Apply when Source is asked whether a named vendor is strong, expensive, risky, aggressive, flexible, or likely to discount.",
    riskId: "risk-vendor-name-hallucination",
    riskLabel: "Vendor-name hallucination",
    mitigation:
      "Downgrade to pattern-level questions unless public, buyer, event, or licensed vendor evidence is attached.",
  },
  {
    id: "PUBLIC-FACT-SEPARATION",
    slug: "public-facts-versus-buyer-facts",
    title: "Public Facts Versus Buyer Facts",
    thesis:
      "Public vendor facts can support context, but they cannot substitute for buyer-specific contract, pricing, performance, and approval evidence.",
    applicability:
      "Apply when Source combines public disclosures with client artifacts in an event memo, scorecard, or executive decision brief.",
    riskId: "risk-public-fact-overweight",
    riskLabel: "Public fact overweighting",
    mitigation:
      "Separate public context citations from buyer evidence citations and mark the decision impact of each source class.",
  },
  {
    id: "RETAIL-OVERLAY-SCOPING",
    slug: "retail-overlay-not-retail-fact",
    title: "Retail Overlay Is Not Retail Fact",
    thesis:
      "Retail-specific patterns such as Q4 freeze, POS support, and omnichannel peaks should be used as prompts to inspect evidence, not as claims about a specific retailer.",
    applicability:
      "Apply when a retail-cpg sourcing event lacks actual ticket, incident, change, store, or channel-volume evidence.",
    riskId: "risk-retail-overlay-overclaim",
    riskLabel: "Retail overlay overclaim",
    mitigation:
      "Phrase retail guidance as what to check until tenant-specific store, order, ticket, or change data is loaded.",
  },
  {
    id: "CROSS-INDUSTRY-DEFAULT",
    slug: "cross-industry-default-with-vertical-variants",
    title: "Cross-Industry Default With Vertical Variants",
    thesis:
      "Most sourcing doctrine should default to cross-industry, with industry variants layered only where the operating evidence materially changes the sourcing question.",
    applicability:
      "Apply when deciding whether a new corpus pattern belongs in the global pack, a vertical overlay, or a tenant-only evidence ledger.",
    riskId: "risk-unnecessary-vertical-fragmentation",
    riskLabel: "Unnecessary vertical fragmentation",
    mitigation:
      "Keep the base pattern global and attach healthcare, retail, finance, or public-sector variants only where evidence handling differs.",
  },
  {
    id: "PROMPT-TIME-EVIDENCE-RANKING",
    slug: "prompt-time-evidence-ranking",
    title: "Prompt-Time Evidence Ranking",
    thesis:
      "Source answers should rank buyer evidence above global patterns, and global patterns above unsupported general language.",
    applicability:
      "Apply to Sentinel chat, stage summaries, pricing findings, BAFO asks, and CXO report synthesis.",
    riskId: "risk-pattern-outvotes-evidence",
    riskLabel: "Pattern outvotes evidence",
    mitigation:
      "Require answer assembly to show evidence-backed facts first, then pattern interpretation, then open evidence gaps.",
  },
  {
    id: "CITATION-GAP-DOWNGRADE",
    slug: "citation-gap-output-downgrade",
    title: "Citation Gap Output Downgrade",
    thesis:
      "When a sourcing answer lacks citations, the output should become a checklist or hypothesis rather than a recommendation.",
    applicability:
      "Apply when Sentinel can explain a sourcing method but cannot attach event evidence, vendor evidence, or benchmark evidence.",
    riskId: "risk-uncited-recommendation",
    riskLabel: "Uncited recommendation",
    mitigation:
      "Show citation-gap warning and phrase the output as questions to validate before action.",
  },
  {
    id: "SAVINGS-CLAIM-GATE",
    slug: "savings-claim-evidence-gate",
    title: "Savings Claim Evidence Gate",
    thesis:
      "Savings claims must remain provisional until baseline, normalized vendor pricing, BAFO delta, contract terms, and value-ledger state are linked.",
    applicability:
      "Apply to pricing pages, BAFO summaries, CXO reports, deal packs, and value proof pages.",
    riskId: "risk-pattern-generated-savings",
    riskLabel: "Pattern-generated savings claim",
    mitigation:
      "Block numeric savings claims from corpus patterns alone and require tenant evidence chain references.",
  },
  {
    id: "CONTRACT-CLAUSE-VARIANT-VISIBILITY",
    slug: "contract-clause-variant-visibility",
    title: "Contract Clause Variant Visibility",
    thesis:
      "Clause libraries can be shared globally as drafting variants, but negotiated clauses and redlines must remain tenant-scoped.",
    applicability:
      "Apply when Source suggests audit rights, benchmarking, termination, exit, IP, data, or change-control language.",
    riskId: "risk-client-redline-leakage",
    riskLabel: "Client redline leakage",
    mitigation:
      "Use generic clause variants globally; retrieve buyer-specific redlines only from tenant evidence.",
  },
  {
    id: "VENDOR-GAMING-DETECTOR-GLOBAL",
    slug: "vendor-gaming-detectors-global",
    title: "Vendor Gaming Detectors Are Global",
    thesis:
      "Common vendor gaming patterns can be globally visible because they describe inspection methods, not claims that a named vendor behaved badly.",
    applicability:
      "Apply when Source flags scope burial, transition-cost shifting, volume-band traps, pass-through ambiguity, or benchmark theater.",
    riskId: "risk-detector-as-accusation",
    riskLabel: "Detector phrased as accusation",
    mitigation:
      "Phrase detector output as a probe until event evidence confirms the behavior.",
  },
  {
    id: "CORPUS-FRESHNESS-OWNER",
    slug: "corpus-freshness-owner",
    title: "Corpus Freshness Owner",
    thesis:
      "Every benchmark, vendor profile, and industry overlay needs an owner and refresh cadence before it can be treated as production-grade guidance.",
    applicability:
      "Apply when promoting draft corpus content into production retrieval or executive-facing answers.",
    riskId: "risk-stale-corpus-guidance",
    riskLabel: "Stale corpus guidance",
    mitigation:
      "Attach owner, refresh frequency, and last-reviewed date; downgrade stale content to hypothesis language.",
  },
  {
    id: "CLIENT-PRIVATE-LEARNING",
    slug: "client-private-learning-boundary",
    title: "Client Private Learning Boundary",
    thesis:
      "Lessons learned from one client can become global doctrine only after tenant identifiers, prices, counterparties, and confidential facts are removed.",
    applicability:
      "Apply when converting prior engagement experience into reusable Source patterns.",
    riskId: "risk-private-learning-leak",
    riskLabel: "Private learning leak",
    mitigation:
      "Anonymize and abstract the decision shape; keep source artifacts in tenant evidence, not global corpus.",
  },
  {
    id: "APPROVAL-ACTION-NOT-CORPUS",
    slug: "approval-action-not-corpus",
    title: "Approval Action Is Not Corpus",
    thesis:
      "Corpus guidance can inform an approval, but the approval record must come from a named human action with reason and timestamp.",
    applicability:
      "Apply when Source uses patterns to recommend stage promotion, gate completion, vendor downselect, or award readiness.",
    riskId: "risk-corpus-implied-approval",
    riskLabel: "Corpus-implied approval",
    mitigation:
      "Require activity-log entries for approval actions and never treat pattern confidence as human approval.",
  },
  {
    id: "EXPORT-CAVEAT-PRESERVATION",
    slug: "export-caveat-preservation",
    title: "Export Caveat Preservation",
    thesis:
      "Reports, deal packs, and PPTX exports must preserve evidence gaps, AI draft labels, and provisional savings caveats from the Source canvas.",
    applicability:
      "Apply to CXO reports, deal packs, outcome reports, and printable evidence bundles.",
    riskId: "risk-export-caveat-loss",
    riskLabel: "Export caveat loss",
    mitigation:
      "Treat missing caveats in exports as a governance failure even when the canvas showed them correctly.",
  },
];

export const SOURCING_CORPUS_GOVERNANCE_PATTERNS: PatternSeed[] =
  GOVERNANCE_PATTERNS.map((entry) => ({
    id: `PAT-SRC-CGV-${entry.id}`,
    slug: entry.slug,
    title: entry.title,
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis: entry.thesis,
    applicability: entry.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.82,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: [],
    relatedPatternIds: ["PAT-SRC-VPR-WIPRO", "PAT-SRC-BEN-AMS-FTE-RATE-CARD"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "process_methodology",
    vendorClass: "service",
    riskFactors: [
      {
        id: entry.riskId,
        label: entry.riskLabel,
        severity: "high",
        detectionSignals: [
          "Source output blurs global doctrine with tenant evidence.",
          "Answer omits visibility, source-basis, or citation-gap treatment.",
        ],
        mitigations: [entry.mitigation],
      },
    ],
    industryVariants: [
      {
        industry: "cross_industry",
        modifier:
          "Default sourcing doctrine may be shared when it contains no private tenant facts, unsupported vendor posture, or numeric benchmark values.",
        additionalRequirements: [
          "Pattern source document",
          "Visibility classification",
          "Source-basis label",
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: `${entry.title}: evidence scope control`,
        model: "unknown",
        sourceBasis: [GOVERNANCE_SOURCE_BASIS],
        confidence: 0.5,
        notes:
          "This governance pattern does not contain numeric benchmarks; it defines when benchmark output must be suppressed or caveated.",
      },
    ],
    body: `## Summary
${entry.thesis}

## Runtime rule
${entry.mitigation}

## CXO language
"This is reusable sourcing doctrine unless Source shows client evidence, vendor evidence, or benchmark evidence for this event."`,
  }));
