import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
];

function pattern(input: {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  category: NonNullable<PatternSeed["category"]>;
  body: string;
  confidence?: number;
  vendorClass?: PatternSeed["vendorClass"];
  relatedPatternIds?: string[];
  riskFactors?: PatternSeed["riskFactors"];
  negotiationLevers?: PatternSeed["negotiationLevers"];
  standardClauses?: PatternSeed["standardClauses"];
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
    category: input.category,
    vendorClass: input.vendorClass,
    riskFactors: input.riskFactors,
    negotiationLevers: input.negotiationLevers,
    standardClauses: input.standardClauses,
    body: input.body,
  };
}

export const SOURCING_ARCHETYPE_FAILURE_MODE_PATTERNS: PatternSeed[] = [
  pattern({
    id: "PAT-SRC-AFM-001",
    slug: "incumbent-renegotiation-fact-base",
    title: "Incumbent Renegotiation Fact Base",
    category: "process_methodology",
    vendorClass: "direct-tech",
    thesis:
      "Incumbent renegotiation becomes defensible only when the buyer separates renewal pressure from a tested fact base on usage, service quality, market alternatives, and exit feasibility.",
    applicability:
      "Apply when the business prefers continuity but sourcing still needs leverage, auditability, and a credible alternative path before agreeing to a new term.",
    riskFactors: [
      {
        id: "risk-incumbent-continuity-premium",
        label: "Continuity premium hidden as inevitability",
        severity: "high",
        detectionSignals: [
          "Stakeholders describe the incumbent as the only viable path without exit evidence.",
          "Renewal pricing is compared only to the expiring contract, not to usage, service levels, or alternatives.",
        ],
        mitigations: [
          "Build a renegotiation pack with usage, service, issue, and market-alternative evidence.",
          "Document what the buyer gives up if continuity is chosen.",
        ],
      },
    ],
    body: `## Summary
Incumbent renegotiation is a sourcing archetype, not a shortcut around sourcing. The buyer may choose continuity, but the decision should be based on a visible fact base: current entitlements, actual usage, invoice history, SLA performance, unresolved issues, exit cost, replacement feasibility, and the business consequence of delay.

## Failure mode
The common failure is treating incumbent knowledge as proof of irreplaceability. That lets the vendor price continuity as inevitability.

## Evidence required
The minimum packet is a usage and spend baseline, performance history, open-risk register, exit or transition estimate, and a clear list of commercial asks before negotiation starts.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-002",
    slug: "competitive-rfp-normalization-control",
    title: "Competitive RFP Normalization Control",
    category: "process_methodology",
    vendorClass: "professional-services",
    thesis:
      "Competitive RFPs produce reliable decisions when proposal variance is normalized before scoring instead of being debated informally after preferred vendors emerge.",
    applicability:
      "Apply to multi-vendor events where pricing models, assumptions, staffing, scope inclusions, service levels, or implementation responsibilities differ materially across responses.",
    riskFactors: [
      {
        id: "risk-un-normalized-rfp-ranking",
        label: "Un-normalized RFP ranking",
        severity: "high",
        detectionSignals: [
          "One vendor appears cheaper because major assumptions are excluded or optional.",
          "Scorecard reviewers compensate for missing data through narrative comments.",
        ],
        mitigations: [
          "Run a normalization pass before committee scoring.",
          "Require vendor clarification for excluded scope, assumptions, staffing, and one-time costs.",
        ],
      },
    ],
    body: `## Summary
The RFP archetype depends on comparability. If proposals arrive with different pricing structures, delivery assumptions, transition models, or SLA definitions, a raw scorecard can reward formatting rather than value.

## Failure mode
Reviewers often try to solve non-comparable bids inside subjective scoring. That creates an approval trail that looks governed but is not decision-grade.

## Evidence required
Maintain a normalization bridge that shows what changed, why it changed, who approved the adjustment, and how the adjusted view affects price, risk, and score.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-003",
    slug: "sole-source-exception-evidence-standard",
    title: "Sole-Source Exception Evidence Standard",
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    thesis:
      "A sole-source exception is governable when it documents the business reason competition is not practical and preserves compensating controls for price, scope, risk, and renewal leverage.",
    applicability:
      "Apply when only one vendor is being advanced because of proprietary capability, urgent continuity, technical dependency, regulatory constraint, or documented market scarcity.",
    standardClauses: [
      {
        clauseArea: "Sole-source compensating controls",
        buyerPosition:
          "Require price-protection, usage evidence, renewal notice, exit assistance, and auditability because competitive tension is absent.",
        fallbackPosition:
          "If the vendor rejects broad protections, require at least benchmarkable unit pricing, documented scope, and renewal opt-out rights.",
        walkawayTriggers: [
          "The exception memo has no evidence for why competition is impractical.",
          "The vendor seeks sole-source award plus weak exit, renewal, or price protections.",
        ],
      },
    ],
    body: `## Summary
Sole-source sourcing is sometimes legitimate, but the burden of proof shifts. The buyer must explain why competition is impractical and what controls replace competitive pressure.

## Failure mode
The event fails when "preferred vendor" is relabeled as "sole source" without technical, commercial, timing, or risk evidence.

## Evidence required
The exception packet should include the exception reason, alternatives considered, price-control method, approval owner, exit path, and the next date when competition can be reopened.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-004",
    slug: "renewal-rescue-clock-recovery",
    title: "Renewal Rescue Clock Recovery",
    category: "process_methodology",
    vendorClass: "direct-tech",
    thesis:
      "A late renewal can still be controlled when the sourcing team triages the clock, blocks auto-renewal drift, and narrows the event to the few decisions that can realistically change before signature.",
    applicability:
      "Apply when a renewal is inside the vendor notice window, near expiry, or already at risk of default rollover and the buyer must preserve leverage quickly.",
    negotiationLevers: [
      {
        lever: "Bridge term instead of rushed full renewal",
        whenToUse:
          "Use when the buyer lacks enough time to run a quality event but cannot safely let service lapse.",
        buyerAsk:
          "Short bridge term, no punitive uplift, preserved termination rights, and a schedule for full competitive review.",
        vendorGive:
          "Continuity while the buyer completes usage, scope, and market testing.",
        tradeoffs: [
          "A bridge protects time but may cost more than a fully competed renewal if the buyer does not use the recovered window.",
        ],
      },
    ],
    body: `## Summary
Renewal rescue is a time-boxed control pattern. The objective is not to run a perfect sourcing event in an impossible window. It is to stop avoidable rollover, capture critical facts, and decide whether to negotiate, bridge, terminate, or defer.

## Failure mode
Vendors can use the clock to collapse review into a binary choice: sign now or accept disruption. That framing should be challenged with explicit options.

## Evidence required
Track expiry date, notice deadline, auto-renewal terms, business criticality, usage baseline, minimum legal blockers, and whether a bridge term is available.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-005",
    slug: "multi-tower-outsourcing-boundary-control",
    title: "Multi-Tower Outsourcing Boundary Control",
    category: "process_methodology",
    vendorClass: "service",
    thesis:
      "Multi-tower outsourcing events need explicit tower boundaries, retained-client obligations, and cross-tower handoffs before price or accountability can be compared.",
    applicability:
      "Apply to AMS, infrastructure, workplace, service desk, finance operations, HR operations, BPO, or hybrid outsourcing events with multiple service towers.",
    riskFactors: [
      {
        id: "risk-cross-tower-accountability-gap",
        label: "Cross-tower accountability gap",
        severity: "critical",
        detectionSignals: [
          "Vendors price towers separately but shared governance, incident ownership, or tooling is left open.",
          "Retained-client duties are not separated from vendor-run obligations.",
        ],
        mitigations: [
          "Create a tower boundary matrix before BAFO.",
          "Normalize retained-client effort and shared tooling costs into TCO.",
        ],
      },
    ],
    body: `## Summary
Multi-tower outsourcing can look attractive because scope is bundled, but bundling can hide accountability gaps. The buyer needs a tower-by-tower view of included work, excluded work, handoffs, retained obligations, shared tooling, and governance.

## Failure mode
The event fails when vendors price the towers but not the seams between them: incident ownership, reporting, demand intake, security approvals, service integration, and retained-client work.

## Evidence required
Require a tower boundary matrix, RACI, retained-effort estimate, tooling model, transition plan, governance cadence, and issue-escalation model before award.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-006",
    slug: "systems-integrator-delivery-proof",
    title: "Systems Integrator Delivery Proof",
    category: "process_methodology",
    vendorClass: "professional-services",
    thesis:
      "SI selection should test delivery proof, staffing reality, and integration accountability rather than ranking vendors mainly on methodology language and partner badges.",
    applicability:
      "Apply to ERP, CRM, data platform, cloud migration, AI program, customer platform, or workflow transformation events that depend on implementation quality.",
    riskFactors: [
      {
        id: "risk-si-methodology-over-proof",
        label: "Methodology over proof",
        severity: "high",
        detectionSignals: [
          "Proposal emphasizes generic delivery methodology but names few committed delivery roles.",
          "Reference stories do not match the buyer's scope, complexity, or industry constraints.",
        ],
        mitigations: [
          "Score committed team, relevant delivery evidence, and integration ownership separately.",
          "Require named key-personnel commitments and replacement controls.",
        ],
      },
    ],
    body: `## Summary
SI selection is not only vendor selection; it is delivery-risk allocation. A polished proposal can still leave the buyer exposed if named personnel, integration responsibilities, acceptance criteria, and transition-to-run ownership are vague.

## Failure mode
The failure mode is buying the brand or methodology while the actual delivery team, subcontracting model, and risk ownership remain movable.

## Evidence required
Require named key roles, comparable delivery references, workstream ownership, acceptance criteria, dependency register, escalation model, and transition-to-run plan.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-007",
    slug: "software-consolidation-entitlement-rationalization",
    title: "Software Consolidation Entitlement Rationalization",
    category: "enterprise_saas",
    vendorClass: "direct-tech",
    thesis:
      "Software consolidation succeeds when redundant tools, unused entitlements, overlapping modules, migration costs, and business exceptions are reconciled before the buyer commits to a new platform footprint.",
    applicability:
      "Apply when the sourcing event aims to reduce vendors, consolidate modules, standardize platforms, or move spend from fragmented tools into an enterprise agreement.",
    riskFactors: [
      {
        id: "risk-consolidation-savings-overclaim",
        label: "Consolidation savings overclaim",
        severity: "high",
        detectionSignals: [
          "Savings case assumes every overlapping tool can be retired immediately.",
          "Migration, exception, retraining, or parallel-run costs are absent from the business case.",
        ],
        mitigations: [
          "Map entitlements, active usage, business owner exceptions, and retirement dates.",
          "Separate negotiated savings from realized decommission savings.",
        ],
      },
    ],
    body: `## Summary
Software consolidation is often sold as a clean vendor-count reduction, but the operational work is messier. The buyer has to reconcile entitlements, actual usage, overlapping functionality, contractual end dates, data migration, integrations, user adoption, and exceptions.

## Failure mode
The event fails when a target platform is selected before the organization proves which tools can actually be retired.

## Evidence required
Build an entitlement and usage map, overlap matrix, retirement plan, migration estimate, exception register, and realized-savings tracker.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-008",
    slug: "cloud-commit-drawdown-governance",
    title: "Cloud Commit Drawdown Governance",
    category: "infrastructure",
    vendorClass: "direct-tech",
    thesis:
      "Cloud commit negotiations need drawdown governance, workload realism, discount math, and exit exposure analysis before committed spend can be treated as savings.",
    applicability:
      "Apply to cloud platform, marketplace, consumption, committed-use, enterprise-discount, or multi-year infrastructure agreements.",
    riskFactors: [
      {
        id: "risk-cloud-commit-shelfware",
        label: "Cloud commit shelfware",
        severity: "high",
        detectionSignals: [
          "Commit value exceeds documented workload demand or migration readiness.",
          "Discount is highlighted without a drawdown plan, owner, or under-consumption remedy.",
        ],
        mitigations: [
          "Tie commit to workload roadmap, forecast owners, and quarterly drawdown reviews.",
          "Model under-consumption, overage, marketplace eligibility, and exit constraints.",
        ],
      },
    ],
    body: `## Summary
Cloud commits convert future demand into a commercial obligation. The buyer needs to know which workloads will draw down the commitment, when consumption will occur, who owns forecast accuracy, and what happens if plans change.

## Failure mode
The vendor frames a discount as savings while the buyer absorbs under-consumption, workload delay, migration risk, or architectural lock-in.

## Evidence required
Maintain workload forecast, eligible-spend rules, drawdown cadence, discount bridge, under-consumption exposure, overage pricing, and exit or portability assumptions.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-009",
    slug: "transition-risk-rebid-control",
    title: "Transition-Risk Rebid Control",
    category: "process_methodology",
    vendorClass: "service",
    thesis:
      "A rebid that changes operators must evaluate transition risk as a first-class decision input, not as a post-award mobilization detail.",
    applicability:
      "Apply when a buyer rebids incumbent-run services, managed operations, outsourcing towers, critical platforms, or business processes where handover quality affects continuity.",
    riskFactors: [
      {
        id: "risk-rebid-transition-underpricing",
        label: "Rebid transition underpricing",
        severity: "critical",
        detectionSignals: [
          "Challenger proposal has low run price but thin knowledge-transfer, reverse-shadow, or cutover detail.",
          "Incumbent exit obligations are not confirmed before challenger award.",
        ],
        mitigations: [
          "Score transition separately from run operations.",
          "Require exit cooperation, knowledge-transfer artifacts, and transition acceptance gates.",
        ],
      },
    ],
    body: `## Summary
Transition-risk rebid events carry two decisions: who should run the service, and whether the buyer can safely move from current operator to future operator. Those decisions are related but not identical.

## Failure mode
The failure mode is awarding to the better commercial bid while transition obligations, incumbent cooperation, retained-team workload, and cutover risk remain unresolved.

## Evidence required
Require transition plan, incumbent-exit dependency map, retained-team estimate, knowledge-transfer artifacts, service-readiness gates, and fallback plan before final recommendation.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-010",
    slug: "lowball-change-order-trap",
    title: "Lowball Change-Order Trap",
    category: "pricing_intelligence",
    vendorClass: "professional-services",
    thesis:
      "A low initial bid is a risk signal when the vendor can recover margin through ambiguous scope, rate-card adders, dependency exclusions, or change-order discretion.",
    applicability:
      "Apply to services, SI, managed operations, implementation, and complex SaaS deployment events where a proposal is materially cheaper than comparable bids.",
    riskFactors: [
      {
        id: "risk-lowball-change-order",
        label: "Lowball then change-order",
        severity: "critical",
        detectionSignals: [
          "Bid is low but assumptions, exclusions, or client responsibilities are broad.",
          "Change-order triggers are vendor-controlled or poorly defined.",
        ],
        mitigations: [
          "Normalize excluded work into evaluated TCO.",
          "Define change-control triggers, rate caps, approval rights, and included assumptions.",
        ],
      },
    ],
    body: `## Summary
A low bid can be real, but it can also be a commercial entry tactic. The buyer should test whether the vendor can later monetize ambiguity through change orders, optional services, rate-card escalation, or dependency disputes.

## Failure mode
The vendor wins on headline price and then moves normal delivery obligations into paid change requests.

## Evidence required
Require assumption log, inclusion and exclusion schedule, change-control clause, rate-card cap, dependency owner map, and a TCO bridge for likely adders.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-011",
    slug: "staffing-bait-and-switch-control",
    title: "Staffing Bait-and-Switch Control",
    category: "contract_intelligence",
    vendorClass: "professional-services",
    thesis:
      "Staffing quality must be contracted and governed when vendor evaluation depends on named experts, scarce skills, delivery seniority, or location mix.",
    applicability:
      "Apply to SI, advisory, implementation, managed service, BPO, AI, cloud, security, or transformation events where the proposed team materially affects delivery confidence.",
    standardClauses: [
      {
        clauseArea: "Key personnel and replacement control",
        buyerPosition:
          "Named key personnel require buyer approval for replacement, transition overlap, equal-or-better qualifications, and remedy for unapproved substitution.",
        fallbackPosition:
          "If names cannot be committed, require role-level credentials, staffing ramp dates, location mix, and replacement SLAs.",
        walkawayTriggers: [
          "Vendor refuses to bind named personnel or equivalent replacement standards.",
          "Proposal team and delivery team are explicitly different with no buyer approval right.",
        ],
      },
    ],
    body: `## Summary
Staffing bait-and-switch occurs when the buyer evaluates one team and receives another. The risk is highest when expert credibility, niche skills, senior delivery oversight, or location mix drove the score.

## Failure mode
The vendor uses senior sellers or specialists during selection, then assigns lower-seniority or different-location resources after signature.

## Evidence required
Require named personnel, key-role definitions, start dates, allocation percentages, replacement approval rights, location mix, onboarding plan, and delivery governance.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-012",
    slug: "benchmark-theater-guardrail",
    title: "Benchmark Theater Guardrail",
    category: "pricing_intelligence",
    vendorClass: "direct-tech",
    thesis:
      "Benchmarks are useful only when the buyer can inspect the comparator basis, scope fit, unit definition, and confidence level behind the benchmark claim.",
    applicability:
      "Apply whenever a vendor, advisor, or internal sponsor uses benchmark language to justify price, savings, staffing, SLA, or contract terms.",
    riskFactors: [
      {
        id: "risk-benchmark-theater",
        label: "Benchmark theater",
        severity: "high",
        detectionSignals: [
          "Benchmark is cited without comparator scope, date, unit basis, or confidence.",
          "Benchmark ignores buyer-specific volume, service level, region, complexity, or transition state.",
        ],
        mitigations: [
          "Require benchmark source basis and comparator fit before using it in negotiation.",
          "Treat vague benchmarks as directional context, not decision evidence.",
        ],
      },
    ],
    body: `## Summary
Benchmarking can create leverage, but vague benchmarks can create false confidence. The buyer should know what was benchmarked, against whom, when, under which unit definition, and how close those conditions are to the current event.

## Failure mode
Benchmark theater uses authoritative language while hiding comparator weakness.

## Evidence required
Capture comparator scope, date, geography, volume, service level, unit definition, percentile or range, exclusions, and confidence before the benchmark affects award or negotiation.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-013",
    slug: "sla-carveout-normalization",
    title: "SLA Carveout Normalization",
    category: "contract_intelligence",
    vendorClass: "service",
    thesis:
      "SLA commitments must be normalized for exclusions, measurement windows, dependencies, remedies, and chronic-failure treatment before vendors can be compared.",
    applicability:
      "Apply to managed services, SaaS, infrastructure, support, outsourcing, and operational platform events where service levels influence award or risk posture.",
    riskFactors: [
      {
        id: "risk-sla-carveout",
        label: "SLA carveout dilution",
        severity: "high",
        detectionSignals: [
          "SLA looks strong but excludes peak periods, third-party dependencies, planned maintenance, or buyer-controlled causes broadly.",
          "Credits are capped so low that chronic failure becomes economically tolerable.",
        ],
        mitigations: [
          "Normalize SLA inclusions, exclusions, credit caps, and chronic-failure remedies.",
          "Require business-critical service windows and measurement methods in the contract.",
        ],
      },
    ],
    body: `## Summary
SLA tables can look comparable while the legal and operational carveouts differ sharply. The buyer needs to inspect what counts, what is excluded, when the clock starts, how credits are calculated, and what happens after repeated failure.

## Failure mode
The vendor advertises high service levels but carves out enough scenarios that the operational promise is weaker than the headline.

## Evidence required
Require SLA definition, measurement source, reporting cadence, exclusions, credit formula, chronic-failure escalation, termination right, and dependency map.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-014",
    slug: "tooling-lock-in-exit-rights",
    title: "Tooling Lock-In Exit Rights",
    category: "contract_intelligence",
    vendorClass: "service",
    thesis:
      "Buyer leverage erodes when service delivery depends on vendor-owned tooling without data export, configuration handback, transition support, and post-termination access rights.",
    applicability:
      "Apply to managed service, outsourcing, security, observability, ITSM, data platform, and SaaS-enabled services where vendor tooling becomes operational infrastructure.",
    standardClauses: [
      {
        clauseArea: "Tooling exit and evidence rights",
        buyerPosition:
          "Require export rights for operational data, configuration documentation, runbooks, integration details, ticket history, and transition access after termination.",
        fallbackPosition:
          "If vendor-owned tooling cannot be transferred, require a handback package, transition workspace, and fixed-fee exit support.",
        walkawayTriggers: [
          "Operational records cannot be exported in a usable format.",
          "Exit support is discretionary, uncapped, or unavailable after termination notice.",
        ],
      },
    ],
    body: `## Summary
Tooling can improve delivery, but vendor-owned tooling can also become lock-in. The buyer should decide early which data, configurations, reports, runbooks, and integrations must remain usable if the vendor changes.

## Failure mode
The service works during the term but becomes hard to exit because operational knowledge is embedded in vendor tooling.

## Evidence required
Require tooling inventory, data-export rights, configuration handback, runbook access, integration documentation, transition support, and post-termination access period.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-015",
    slug: "weak-audit-rights-evidence-gap",
    title: "Weak Audit Rights Evidence Gap",
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    thesis:
      "Audit rights are weak when they sound broad but do not define the evidence, cadence, scope, and escalation path the buyer can actually use during the contract term.",
    applicability:
      "Apply to SaaS, cloud, managed services, outsourcing, AI services, data platforms, security tooling, and regulated workflows where post-signature verification matters.",
    relatedPatternIds: ["PAT-SRC-CON-007", "PAT-SRC-001", "PAT-SRC-002"],
    standardClauses: [
      {
        clauseArea: "Practical audit evidence",
        buyerPosition:
          "Define exportable evidence, report cadence, retention, trust-portal access, exception handling, and escalation rights rather than relying on generic audit language.",
        fallbackPosition:
          "Accept standard audit language only if paired with a named evidence schedule and support path.",
        walkawayTriggers: [
          "Vendor can satisfy audit obligations with generic summaries that do not match the purchased service.",
          "Usage, security, performance, or invoice evidence is unavailable until dispute escalation.",
        ],
      },
    ],
    body: `## Summary
Audit rights often fail at the practical layer. A clause may sound protective, but if it does not identify usable evidence, cadence, retention, owner, and escalation, the buyer may not be able to verify usage, billing, controls, or performance.

## Failure mode
The vendor accepts broad words while limiting practical access to generic reports or support-controlled disclosures.

## Evidence required
Require evidence catalog, report cadence, export method, retention period, service scope, exception process, escalation owner, and dispute support.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-016",
    slug: "late-legal-redline-containment",
    title: "Late Legal Redline Containment",
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    thesis:
      "Late legal redlines should be treated as decision-impacting changes when they alter risk allocation, remedies, pricing assumptions, data rights, or exit leverage after commercial selection.",
    applicability:
      "Apply when a vendor introduces material legal changes after finalist selection, BAFO close, approval routing, or business commitment.",
    riskFactors: [
      {
        id: "risk-late-redline-selection-drift",
        label: "Late redline selection drift",
        severity: "high",
        detectionSignals: [
          "Vendor changes liability, indemnity, SLA, termination, data, audit, or payment terms after commercial award.",
          "Business sponsor treats legal changes as cleanup rather than a change to the evaluated offer.",
        ],
        mitigations: [
          "Map redlines to scorecard and business-case impact.",
          "Reopen commercial decision if risk, cost, or exit leverage materially changes.",
        ],
      },
    ],
    body: `## Summary
Late redlines are not paperwork if they change the economics or risk profile that led to selection. The sourcing team should route material changes back through decision owners, not let them disappear inside legal negotiation.

## Failure mode
The vendor wins on one offer and contracts on another.

## Evidence required
Maintain a redline impact log covering changed clause, business impact, scorecard impact, owner, accepted fallback, unresolved risk, and whether approval must be refreshed.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-017",
    slug: "incumbent-data-advantage-equalization",
    title: "Incumbent Data Advantage Equalization",
    category: "process_methodology",
    vendorClass: "service",
    thesis:
      "A rebid is more credible when the buyer equalizes operational data access so challengers are not forced to price uncertainty while the incumbent prices known reality.",
    applicability:
      "Apply to rebids, recompetes, outsourcing changes, managed service renewals, and platform support events where the incumbent has materially better operational knowledge.",
    riskFactors: [
      {
        id: "risk-incumbent-data-asymmetry",
        label: "Incumbent data asymmetry",
        severity: "high",
        detectionSignals: [
          "Challengers qualify price with broad discovery or transition assumptions.",
          "Incumbent proposal relies on operational facts that were not shared with other bidders.",
        ],
        mitigations: [
          "Provide a bidder data room with service volumes, incidents, inventory, runbooks, and dependency facts.",
          "Normalize uncertainty premiums before award.",
        ],
      },
    ],
    body: `## Summary
Incumbents often know the service better than the buyer does. In a rebid, that knowledge can become an unfair pricing advantage unless the buyer creates a common fact base for all bidders.

## Failure mode
Challengers price uncertainty, the incumbent prices familiarity, and the scorecard mistakes asymmetry for value.

## Evidence required
Publish a controlled data room with volume, inventory, ticket, incident, asset, integration, runbook, SLA, and dependency evidence available to every eligible bidder.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-018",
    slug: "reference-stacking-theater-control",
    title: "Reference Stacking Theater Control",
    category: "process_methodology",
    vendorClass: "professional-services",
    thesis:
      "Vendor references should be treated as scoped evidence only when the buyer can match them to comparable complexity, scope, delivery team, geography, and operating constraints.",
    applicability:
      "Apply when references, case studies, customer logos, partner awards, or analyst positioning are used to justify confidence in a vendor selection.",
    riskFactors: [
      {
        id: "risk-reference-stacking",
        label: "Reference stacking theater",
        severity: "medium",
        detectionSignals: [
          "References are impressive but not comparable to the buyer's scope or complexity.",
          "Reference success predates current product, delivery team, geography, or support model.",
        ],
        mitigations: [
          "Score references for scope fit, recency, delivery-team relevance, and measurable outcome.",
          "Ask references about failure handling, change orders, staffing substitutions, and post-go-live support.",
        ],
      },
    ],
    body: `## Summary
References are useful, but customer logos are not proof. The buyer should test whether each reference actually maps to the event being sourced.

## Failure mode
The vendor stacks attractive stories that create confidence without proving delivery under comparable constraints.

## Evidence required
Capture reference scope, date, industry, scale, modules, geography, delivery team, implementation model, measured outcome, and unresolved issues.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-019",
    slug: "option-value-decoy-control",
    title: "Option Value Decoy Control",
    category: "pricing_intelligence",
    vendorClass: "direct-tech",
    thesis:
      "Optional modules, credits, bundles, and future discounts should be separated from current required value so decoy option value does not distort award economics.",
    applicability:
      "Apply to SaaS, cloud, data, AI, security, and platform agreements where vendors add optional scope, credits, roadmap promises, or bundles during negotiation.",
    riskFactors: [
      {
        id: "risk-option-value-decoy",
        label: "Option value decoy",
        severity: "medium",
        detectionSignals: [
          "Vendor adds credits, modules, or future discounts that are not tied to current approved demand.",
          "Scorecard treats optional value as equivalent to required savings or risk reduction.",
        ],
        mitigations: [
          "Score required scope separately from optional value.",
          "Require expiry dates, eligibility rules, and owner for every credit or option.",
        ],
      },
    ],
    body: `## Summary
Optional value can be useful, but it can also distract from the economics of required scope. Credits, extra modules, roadmap access, and future discounts should not inflate the evaluated value unless the buyer has a real adoption plan.

## Failure mode
The vendor adds attractive but low-probability options that make the offer look stronger than the contracted need.

## Evidence required
Track each option's use case, owner, eligibility, expiry, implementation cost, adoption dependency, and whether it affects award or remains supplemental.`,
  }),
  pattern({
    id: "PAT-SRC-AFM-020",
    slug: "outcome-pricing-evidence-guardrail",
    title: "Outcome Pricing Evidence Guardrail",
    category: "pricing_intelligence",
    vendorClass: "professional-services",
    thesis:
      "Outcome pricing works only when baseline, attribution, measurement cadence, exclusions, and dispute mechanics are defined before the buyer treats the model as risk transfer.",
    applicability:
      "Apply to gainshare, value-based, performance-based, savings-linked, adoption-linked, or outcome-priced services and technology agreements.",
    riskFactors: [
      {
        id: "risk-outcome-pricing-attribution-gap",
        label: "Outcome pricing attribution gap",
        severity: "high",
        detectionSignals: [
          "Outcome fee is proposed without a baseline or measurement source.",
          "Vendor claims upside for outcomes influenced by buyer actions, market conditions, or other programs.",
        ],
        mitigations: [
          "Define baseline, attribution model, measurement cadence, exclusions, and dispute process.",
          "Cap upside where vendor control is partial or measurement confidence is low.",
        ],
      },
    ],
    body: `## Summary
Outcome pricing can align incentives, but it does not remove governance. The buyer needs a baseline, measurement method, attribution rules, exclusions, and dispute mechanics before value-based fees can be trusted.

## Failure mode
The vendor presents outcome pricing as risk transfer while measurement ambiguity lets the vendor claim value the buyer cannot verify.

## Evidence required
Require baseline, metric owner, data source, measurement cadence, attribution method, exclusions, upside cap, downside remedy, and dispute process.`,
  }),
];
