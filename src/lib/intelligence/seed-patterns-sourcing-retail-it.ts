import type { PatternSeed } from "./seed-types";

const CREATED_AT = "2026-06-02";
const SOURCE_DOCS = [
  "docs/source-material/build-specs/abarva-source-build-spec.md",
  "docs/standards/DEPTH_STANDARD.md",
  "docs/build/SOURCING_CORPUS_BUILD_KICKOFF_V1.md",
];

function pattern(input: {
  id: string;
  slug: string;
  title: string;
  thesis: string;
  applicability: string;
  category: PatternSeed["category"];
  body: string;
  confidence?: number;
  regulatoryChips?: string[];
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
    vertical: "retail-cpg",
    thesis: input.thesis,
    applicability: input.applicability,
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: input.confidence ?? 0.81,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: CREATED_AT,
    instanceCount: 0,
    sourceDocuments: SOURCE_DOCS,
    regulatoryChips: input.regulatoryChips ?? [],
    relatedPatternIds: input.relatedPatternIds ?? [
      "PAT-SRC-001",
      "PAT-SRC-002",
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: input.category,
    vendorClass: "service",
    riskFactors: input.riskFactors,
    negotiationLevers: input.negotiationLevers,
    standardClauses: input.standardClauses,
    industryVariants: input.industryVariants ?? [
      {
        industry: "retail_cpg",
        modifier:
          "Retail sourcing evaluation must account for store calendars, omnichannel order flows, promotion cycles, PCI exposure, inventory accuracy, and peak trading windows.",
      },
    ],
    body: input.body,
  };
}

export const SOURCING_RETAIL_IT_PATTERNS: PatternSeed[] = [
  pattern({
    id: "PAT-SRC-RIT-001",
    slug: "pos-peak-freeze-readiness",
    title: "POS Peak Freeze Readiness",
    category: "customer_facing",
    thesis:
      "POS sourcing must evaluate holiday and promotion freeze readiness as an operating commitment, not only as implementation methodology.",
    applicability:
      "Apply to POS replacement, POS managed services, payment terminal refresh, and store release support events that may touch Q4, back-to-school, or major promotion windows.",
    riskFactors: [
      {
        id: "risk-pos-peak-freeze-gap",
        label: "POS release freeze exposure",
        severity: "critical",
        detectionSignals: [
          "Implementation plan overlaps a named retail freeze period.",
          "Vendor proposal lacks peak-window incident command and rollback evidence.",
        ],
        mitigations: [
          "Require a blackout-calendar overlay before award.",
          "Add peak-window hypercare, rollback, and executive incident command commitments.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Peak trading protection",
        buyerPosition:
          "Vendor cannot deploy POS, payment, tax, promotion, or store network changes during buyer-defined freeze windows without written emergency approval and rollback proof.",
        fallbackPosition:
          "Permit emergency releases only with business-owner approval, tested rollback, and named incident command coverage.",
        walkawayTriggers: [
          "Vendor refuses buyer-defined freeze windows.",
          "No rollback evidence for POS or payment changes.",
        ],
      },
    ],
    body: `## Summary
Retail POS work is not judged only by whether the software goes live. It is judged by whether stores can trade during the busiest periods of the year. Sourcing should force vendors to show how delivery, support, release management, and rollback behave inside peak retail calendars.

## Detection
Flag the pattern when a POS or store technology proposal has a deployment plan, conversion wave, payment terminal refresh, or integration release that overlaps Q4, back-to-school, major promotions, fiscal close, or regional trading peaks.

## Evidence required
Require a retail calendar overlay, release-freeze rules, rollback plan, store pilot exit criteria, incident command roster, and hypercare coverage model.

## CXO language
"The cheapest POS plan is not acceptable if it puts peak trading at risk."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-002",
    slug: "oms-bopis-sla-chain",
    title: "OMS BOPIS SLA Chain",
    category: "customer_facing",
    thesis:
      "BOPIS experience depends on the full OMS-to-store execution chain, so sourcing must evaluate promise, pick, substitution, handoff, and exception SLAs together.",
    applicability:
      "Apply to order management, store fulfillment, curbside pickup, and omnichannel orchestration sourcing events.",
    riskFactors: [
      {
        id: "risk-bopis-sla-fragmentation",
        label: "BOPIS SLA fragmentation",
        severity: "high",
        detectionSignals: [
          "Vendor commits to OMS uptime but not store pick execution or customer handoff timing.",
          "Proposal treats substitutions, shorts, and cancellation events as out of scope.",
        ],
        mitigations: [
          "Map each customer promise state to an accountable system and support owner.",
          "Require exception workflow SLAs for substitutions, shorts, failed pick, and abandoned pickup.",
        ],
      },
    ],
    body: `## Summary
BOPIS is a chain, not a module. The customer promise can fail in availability, allocation, pick tasking, substitution approval, staging, notification, handoff, or cancellation handling.

## Detection
Flag proposals that show strong OMS functionality but vague store execution accountability, weak exception workflows, or no shared SLA model across OMS, WMS, POS, loyalty, and store labor systems.

## Evidence required
Ask for state diagrams, owner map by order state, exception catalog, store pilot scripts, integration monitoring, and customer notification failure handling.

## CXO language
"Do not buy an OMS promise if the store handoff is still an orphaned process."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-003",
    slug: "ship-from-store-cost-to-serve",
    title: "Ship-from-Store Cost-to-Serve Guardrail",
    category: "pricing_intelligence",
    thesis:
      "Ship-from-store sourcing should expose labor, packaging, carrier, split-shipment, inventory, and exception costs before comparing platform or integrator price.",
    applicability:
      "Apply when sourcing order routing, store fulfillment, last-mile, carrier integration, or omnichannel operations services.",
    riskFactors: [
      {
        id: "risk-ship-from-store-cost-blindness",
        label: "Ship-from-store cost blindness",
        severity: "high",
        detectionSignals: [
          "Business case counts incremental sales but omits store labor and exception handling.",
          "Vendor pricing excludes carrier integration, label generation, cartonization, or support for split orders.",
        ],
        mitigations: [
          "Require cost-to-serve scenarios for full order, split order, cancellation, and failed pickup conversions.",
          "Normalize vendor comparison across software, integration, store labor, packaging, and carrier support.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Operational cost-to-serve disclosure",
        whenToUse:
          "Use when vendor value claims rely on enabling store fulfillment volume.",
        buyerAsk:
          "Provide scenario-level assumptions for labor, exception handling, carrier integration, and support burden before BAFO.",
        vendorGive:
          "Implementation scope clarity, integration inclusions, or capped change-order exposure for routing and carrier workflows.",
      },
    ],
    body: `## Summary
Ship-from-store can unlock inventory but can also move fulfillment cost into the store. The sourcing event should make cost-to-serve visible before a platform decision is framed as pure revenue enablement.

## Detection
Flag vendor claims that emphasize order-routing sophistication while omitting store labor, packaging, label, split-shipment, carrier, fraud review, or return-handling assumptions.

## Evidence required
Require representative order scenarios, cost owner map, integration scope, exception volumes if available, and clear commercial treatment for carrier and label-provider changes.

## CXO language
"Omnichannel value is real only after we price the operational work it creates."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-004",
    slug: "returns-platform-exception-ownership",
    title: "Returns Platform Exception Ownership",
    category: "customer_facing",
    thesis:
      "Returns sourcing must pin ownership for refund timing, inventory disposition, fraud review, tax, loyalty reversal, and marketplace exceptions.",
    applicability:
      "Apply to returns management, customer service, OMS, POS, marketplace, reverse logistics, and refund orchestration events.",
    riskFactors: [
      {
        id: "risk-returns-exception-orphaning",
        label: "Returns exception orphaning",
        severity: "high",
        detectionSignals: [
          "Vendor handles standard returns but excludes refund disputes, partial returns, marketplace returns, or loyalty reversal.",
          "Integration scope does not cover POS, OMS, tax, payment, fraud, and WMS disposition events.",
        ],
        mitigations: [
          "Create an exception ownership matrix before award.",
          "Require refund, reversal, disposition, and dispute workflows in demo scripts.",
        ],
      },
    ],
    body: `## Summary
Returns are where customer experience, inventory accuracy, payments, tax, fraud, and loyalty all collide. A vendor can look strong on standard return initiation while leaving the hard exceptions outside the evaluated scope.

## Detection
Flag when returns demos skip partial returns, gift returns, marketplace returns, cross-channel returns, refund disputes, loyalty reversals, and damaged or quarantine disposition.

## Evidence required
Require exception scripts, integration map, refund timing rules, inventory status updates, loyalty reversal logic, and dispute ownership.

## CXO language
"The returns platform must own the exceptions customers actually feel."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-005",
    slug: "wms-store-inventory-truth",
    title: "WMS and Store Inventory Truth",
    category: "data_analytics",
    thesis:
      "Inventory accuracy sourcing must define which system is authoritative by state, channel, location, and exception before vendors promise availability or allocation improvements.",
    applicability:
      "Apply to WMS, inventory visibility, allocation, RFID, cycle count, store fulfillment, and enterprise inventory platform sourcing.",
    riskFactors: [
      {
        id: "risk-inventory-authority-ambiguity",
        label: "Inventory authority ambiguity",
        severity: "critical",
        detectionSignals: [
          "Proposal references real-time inventory without naming authoritative system by inventory state.",
          "Store, DC, in-transit, damaged, reserved, and returned inventory states lack reconciliation rules.",
        ],
        mitigations: [
          "Define authority by inventory state and location before scoring vendors.",
          "Require reconciliation, latency, and exception evidence in the RFP response.",
        ],
      },
    ],
    body: `## Summary
Retail inventory accuracy is a systems-of-record problem before it is an analytics problem. WMS, OMS, POS, ERP, RFID, store tasking, and marketplace systems may all hold a version of inventory truth.

## Detection
Flag proposals that claim better availability, fewer cancellations, or improved allocation without naming authoritative state, reconciliation cadence, latency expectations, and exception handling.

## Evidence required
Require inventory state taxonomy, system authority map, reconciliation process, latency target, shrink and damage treatment, and operational owner for inventory exceptions.

## CXO language
"We cannot improve availability until we know which system is allowed to be true."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-006",
    slug: "price-file-promotion-change-control",
    title: "Price File and Promotion Change Control",
    category: "process_methodology",
    thesis:
      "Price-file and promotion changes need sourcing gates that prove timing, channel consistency, rollback, and auditability before store-impacting releases.",
    applicability:
      "Apply to pricing engines, promotion platforms, POS, ecommerce, tax, loyalty, and managed-services support events.",
    riskFactors: [
      {
        id: "risk-price-promotion-release-error",
        label: "Price or promotion release error",
        severity: "critical",
        detectionSignals: [
          "Vendor can update pricing or promotion files without four-eyes approval.",
          "Rollback and channel parity checks are not included in support scope.",
        ],
        mitigations: [
          "Require approval, pre-prod validation, rollback, and post-release audit trail.",
          "Add channel parity checks for POS, ecommerce, app, marketplace, and loyalty offers.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Change control and audit",
        buyerPosition:
          "Price, promotion, tax, and loyalty changes require named approval, timestamped audit trail, channel parity validation, and documented rollback procedure.",
        fallbackPosition:
          "Emergency changes may proceed only under incident command with after-action audit and business-owner signoff.",
        walkawayTriggers: [
          "No auditable change trail.",
          "No rollback procedure for price or promotion defects.",
        ],
      },
    ],
    body: `## Summary
Retail price and promotion releases are operationally sensitive because errors become visible to customers, stores, finance, and regulators at the same time. Sourcing should treat change control as a scored operating capability.

## Detection
Flag vendor responses that describe configuration flexibility without approval workflow, channel parity evidence, rollback plan, or audit trail.

## Evidence required
Require sample change logs, approval workflow, release calendar, rollback evidence, promotion test scripts, and exception handling for mispriced transactions.

## CXO language
"Speed to promotion is useful only if the controls prevent a bad price from becoming a public incident."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-007",
    slug: "pci-channel-data-minimization",
    title: "PCI Channel Data Minimization",
    category: "regulatory_compliance",
    thesis:
      "Retail IT sourcing should prefer vendors that reduce cardholder-data exposure across POS, ecommerce, call center, store network, and analytics integrations.",
    applicability:
      "Apply to payment, POS, ecommerce, fraud, loyalty, call center, integration, and data-platform events where cardholder or tokenized payment data may traverse vendor systems.",
    regulatoryChips: ["PCI DSS"],
    riskFactors: [
      {
        id: "risk-pci-scope-expansion",
        label: "PCI scope expansion",
        severity: "critical",
        detectionSignals: [
          "Vendor architecture stores, logs, enriches, or forwards payment data unnecessarily.",
          "Tokenization, encryption, and data retention responsibilities are unclear.",
        ],
        mitigations: [
          "Score data minimization and tokenization architecture separately from functional fit.",
          "Require data-flow diagrams, retention rules, and audit support obligations.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Payment data security",
        buyerPosition:
          "Vendor must minimize cardholder-data exposure, document data flows, support PCI evidence requests, and prohibit unnecessary storage or logging of payment data.",
        fallbackPosition:
          "If vendor touches sensitive payment data, require compensating controls, audit evidence, incident notice, and retention limits.",
        walkawayTriggers: [
          "Vendor cannot produce payment data-flow diagrams.",
          "Vendor reserves broad rights to store or reuse payment data.",
        ],
      },
    ],
    body: `## Summary
Retail payment architecture can expand PCI scope quietly through integrations, logs, analytics feeds, call-center workflows, and support tooling. Sourcing should reward designs that reduce sensitive data movement.

## Detection
Flag any vendor whose architecture touches payment data without a clear minimization, tokenization, retention, and logging posture.

## Evidence required
Require payment data-flow diagrams, PCI responsibility matrix, tokenization approach, retention policy, log-scrubbing controls, audit support, and incident notification terms.

## CXO language
"The best payment vendor is not just compliant; it keeps us out of unnecessary scope."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-008",
    slug: "store-labor-support-window-fit",
    title: "Store Labor Support Window Fit",
    category: "services",
    thesis:
      "Store systems support must match retail labor windows, not generic corporate help-desk hours.",
    applicability:
      "Apply to POS, store network, handheld, workforce management, self-checkout, digital signage, and store operations support sourcing.",
    riskFactors: [
      {
        id: "risk-support-window-mismatch",
        label: "Store support window mismatch",
        severity: "high",
        detectionSignals: [
          "Vendor support hours do not cover store open, close, truck, inventory, or promotion setup windows.",
          "Severity definitions do not account for single-store trading disruption.",
        ],
        mitigations: [
          "Map support coverage to store operating calendars by region and format.",
          "Require escalation paths for opening, closing, inventory, and promotion events.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Store-calendar-aligned support",
        whenToUse:
          "Use when vendor support model defaults to business hours or centralized IT queues.",
        buyerAsk:
          "Commit coverage for store open, close, peak, truck, inventory, and promotion setup windows with clear severity mapping.",
        vendorGive:
          "Named escalation model, regional coverage calendar, or priced extended-support option.",
      },
    ],
    body: `## Summary
Retail support windows are shaped by store work: opening registers, receiving trucks, executing promotions, closing cash, and handling peak traffic. A generic IT support model can miss the exact hours when failures hurt most.

## Detection
Flag support proposals that define coverage by corporate hours, leave weekends vague, or ignore regional holidays, store format differences, truck schedules, and inventory events.

## Evidence required
Require store calendar mapping, severity definitions, escalation tree, support location model, after-hours process, and named owner for store-impacting incidents.

## CXO language
"A support SLA that misses store reality is not a retail SLA."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-009",
    slug: "fraud-loyalty-integration-boundary",
    title: "Fraud and Loyalty Integration Boundary",
    category: "security_identity",
    thesis:
      "Fraud and loyalty sourcing must clarify where decisioning, customer identity, offer eligibility, reward reversal, and dispute evidence live.",
    applicability:
      "Apply to loyalty platforms, promotion engines, fraud tools, customer identity, POS, ecommerce, marketplace, and payment orchestration sourcing.",
    riskFactors: [
      {
        id: "risk-fraud-loyalty-boundary-gap",
        label: "Fraud and loyalty boundary gap",
        severity: "high",
        detectionSignals: [
          "Vendor owns fraud scoring but not loyalty reversal or customer dispute evidence.",
          "Identity matching, householding, and offer eligibility rules are split across systems without governance.",
        ],
        mitigations: [
          "Define decision rights across fraud, loyalty, identity, and customer service workflows.",
          "Require event-level evidence for earn, burn, reversal, dispute, and account takeover scenarios.",
        ],
      },
    ],
    body: `## Summary
Fraud and loyalty systems often meet at the worst moment: account takeover, suspicious redemption, refund abuse, disputed rewards, or promotion misuse. Sourcing needs a boundary map before a vendor is selected.

## Detection
Flag proposals that show fraud or loyalty capability in isolation but do not explain identity matching, decisioning authority, reversal logic, dispute evidence, and customer service handoff.

## Evidence required
Require journey scripts for account takeover, reward redemption, refund reversal, promotion abuse, and dispute handling, plus an event schema and data retention rules.

## CXO language
"Do not let loyalty growth and fraud control become two disconnected decisions."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-010",
    slug: "retail-ma-divestiture-system-separation",
    title: "Retail M&A and Divestiture System Separation",
    category: "process_methodology",
    thesis:
      "Retail M&A and divestiture sourcing should score vendors on store, channel, data, TSA, license, and brand-separation constraints before transition cost is accepted.",
    applicability:
      "Apply to transition services, carve-out, acquisition integration, store systems separation, ecommerce split, and shared-services replacement events.",
    riskFactors: [
      {
        id: "risk-retail-separation-understatement",
        label: "Retail separation understatement",
        severity: "critical",
        detectionSignals: [
          "Vendor plan treats separation as application migration but omits store operations and channel data.",
          "TSA exit dependencies are not mapped to POS, OMS, WMS, loyalty, tax, payment, or workforce systems.",
        ],
        mitigations: [
          "Require separation dependency map and TSA exit evidence before award.",
          "Score brand, data, store, and channel separation independently from implementation price.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Separation and TSA exit",
        buyerPosition:
          "Vendor must maintain a TSA dependency map, separation cutover plan, license assignment view, and business-readiness criteria for store and channel operations.",
        fallbackPosition:
          "If full separation scope is uncertain, require discovery milestone pricing and no-fault replanning rights.",
        walkawayTriggers: [
          "No TSA dependency map.",
          "Vendor excludes store cutover, channel data, or license separation from scope.",
        ],
      },
    ],
    body: `## Summary
Retail carve-outs and acquisitions are messy because store operations, ecommerce, loyalty, payments, inventory, workforce systems, and brand data are deeply connected. A vendor that prices only application migration can understate the real separation work.

## Detection
Flag proposals that do not map TSA dependencies, license assignment, shared master data, store cutover, customer data, payment flows, and channel integrations.

## Evidence required
Require TSA dependency map, system boundary inventory, license treatment, data separation plan, cutover calendar, and Day 1 / Day 2 readiness criteria.

## CXO language
"The separation plan has to protect trading continuity, not just move applications."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-011",
    slug: "last-mile-integration-accountability",
    title: "Last-Mile Integration Accountability",
    category: "customer_facing",
    thesis:
      "Last-mile sourcing must allocate accountability for dispatch, carrier status, customer notification, proof of delivery, failed delivery, and exception rebooking.",
    applicability:
      "Apply to delivery orchestration, same-day delivery, carrier aggregator, marketplace fulfillment, and customer notification platform events.",
    riskFactors: [
      {
        id: "risk-last-mile-exception-gap",
        label: "Last-mile exception gap",
        severity: "high",
        detectionSignals: [
          "Vendor covers carrier connection but excludes failed delivery, proof of delivery, or rebooking workflows.",
          "Customer notification, order status, and support evidence are split across vendors.",
        ],
        mitigations: [
          "Define owner by delivery state and exception.",
          "Require integration monitoring and customer-service evidence for failed delivery scenarios.",
        ],
      },
    ],
    body: `## Summary
Last-mile integration is a customer experience surface. The hard work is not just dispatching an order; it is keeping order status, customer notification, carrier events, proof of delivery, and exception recovery aligned.

## Detection
Flag proposals that price carrier connectivity while leaving rebooking, failed delivery, damage, proof of delivery, refund, and customer-service evidence outside the evaluated scope.

## Evidence required
Require state model, carrier event map, customer notification scripts, failed-delivery workflow, monitoring responsibilities, and support handoff evidence.

## CXO language
"Carrier integration is not enough; the customer needs one coherent delivery promise."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-012",
    slug: "store-device-refresh-deployment-risk",
    title: "Store Device Refresh Deployment Risk",
    category: "hardware_capital",
    thesis:
      "Store hardware sourcing should evaluate deployment choreography, spare pools, imaging, network readiness, and field support as core scope.",
    applicability:
      "Apply to payment terminals, POS lanes, handhelds, scanners, printers, kiosks, digital signage, and store network refresh events.",
    riskFactors: [
      {
        id: "risk-store-device-rollout-disruption",
        label: "Store device rollout disruption",
        severity: "high",
        detectionSignals: [
          "Hardware price is evaluated without field rollout and spares model.",
          "Proposal lacks imaging, staging, network readiness, and store labor assumptions.",
        ],
        mitigations: [
          "Require rollout wave plan, pilot exit criteria, spare pool, field support, and store readiness checklist.",
          "Normalize hardware, deployment, support, warranty, and reverse logistics costs.",
        ],
      },
    ],
    body: `## Summary
Store device refreshes fail in choreography: shipping, staging, imaging, installation, network readiness, store labor, and return logistics. A low unit price can be misleading if deployment scope is vague.

## Detection
Flag proposals that quote devices without a credible wave plan, pilot criteria, field support model, spare pool, warranty process, and old-device recovery approach.

## Evidence required
Require BOM, rollout plan, store readiness checklist, imaging process, install script, field escalation path, spare and warranty model, and reverse logistics plan.

## CXO language
"The hardware price matters, but the rollout plan determines whether stores can use it."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-013",
    slug: "workforce-management-integration-fit",
    title: "Workforce Management Integration Fit",
    category: "enterprise_saas",
    thesis:
      "Workforce management sourcing must test schedule, demand, task, payroll, timeclock, and store operations integration before accepting labor-productivity claims.",
    applicability:
      "Apply to workforce management, task management, time and attendance, scheduling, labor forecasting, and store operations platform sourcing.",
    riskFactors: [
      {
        id: "risk-labor-productivity-unsupported",
        label: "Labor productivity claim without integration proof",
        severity: "medium",
        detectionSignals: [
          "Vendor claims labor optimization without showing demand signals and payroll/timeclock integration.",
          "Store task workload is not included in forecasting or schedule constraints.",
        ],
        mitigations: [
          "Require integration proof for demand, timeclock, payroll, store tasks, and compliance rules.",
          "Keep productivity value provisional until baseline and measurement method are agreed.",
        ],
      },
    ],
    body: `## Summary
Retail workforce tools promise labor productivity, but the promise depends on data from sales, traffic, promotions, truck schedules, store tasks, time clocks, and payroll rules. Sourcing should test the operating model, not just scheduling screens.

## Detection
Flag proposals that separate scheduling from task workload, time capture, payroll, labor rules, and demand signals.

## Evidence required
Require integration architecture, demand-signal list, timeclock and payroll flow, store task treatment, labor-rule configuration, and measurement method.

## CXO language
"Labor optimization is not a screen; it is a connected operating model."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-014",
    slug: "marketplace-channel-data-rights",
    title: "Marketplace Channel Data Rights",
    category: "contract_intelligence",
    thesis:
      "Marketplace and social commerce sourcing must secure rights to order, customer, seller, promotion, returns, and dispute data needed for operations and analytics.",
    applicability:
      "Apply to marketplace platforms, third-party seller programs, social commerce, dropship, affiliate, and channel integration sourcing.",
    riskFactors: [
      {
        id: "risk-channel-data-rights-gap",
        label: "Channel data rights gap",
        severity: "high",
        detectionSignals: [
          "Vendor contract restricts export or reuse of order, customer, seller, or dispute data.",
          "Analytics and operations teams cannot access returns, cancellation, promotion, or service event data.",
        ],
        mitigations: [
          "Require a data rights schedule and integration export commitments.",
          "Define retention, portability, deletion, and dispute evidence rights before award.",
        ],
      },
    ],
    standardClauses: [
      {
        clauseArea: "Channel data rights",
        buyerPosition:
          "Buyer retains operational and analytical rights to order, customer, seller, promotion, returns, service, and dispute data generated through the channel.",
        fallbackPosition:
          "If vendor limits raw export, require agreed operational feeds, audit extracts, retention commitments, and exit portability.",
        walkawayTriggers: [
          "No usable order or dispute data export.",
          "Vendor claims broad ownership over buyer channel data.",
        ],
      },
    ],
    body: `## Summary
Marketplace and social commerce channels can create data blind spots. The buyer may need channel data for customer service, fraud, seller management, analytics, returns, tax, and dispute resolution.

## Detection
Flag contracts that give the platform broad control over channel data or do not specify export, retention, deletion, dispute evidence, and operational feed rights.

## Evidence required
Require data rights schedule, feed catalog, retention terms, exit portability, privacy responsibilities, and operational owner map.

## CXO language
"Do not launch a channel we cannot operate, audit, or exit."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-015",
    slug: "tax-engine-channel-parity",
    title: "Tax Engine Channel Parity",
    category: "regulatory_compliance",
    thesis:
      "Tax engine sourcing must prove parity across POS, ecommerce, marketplace, returns, gift card, promotion, and shipping scenarios.",
    applicability:
      "Apply to tax engine, POS, ecommerce, order management, marketplace, returns, and payment platform events.",
    regulatoryChips: ["sales tax"],
    riskFactors: [
      {
        id: "risk-tax-channel-parity-gap",
        label: "Tax channel parity gap",
        severity: "critical",
        detectionSignals: [
          "Vendor demonstrates ecommerce tax but not POS, returns, gift card, shipping, marketplace, or exemption scenarios.",
          "Tax calculation owner differs by channel without reconciliation and audit rules.",
        ],
        mitigations: [
          "Require scenario testing across all selling and return channels.",
          "Define tax evidence, audit support, correction workflow, and owner by channel.",
        ],
      },
    ],
    body: `## Summary
Retail tax defects can emerge when POS, ecommerce, marketplace, returns, gift cards, shipping, and promotions use different logic or evidence trails. Sourcing should test parity across real scenarios.

## Detection
Flag proposals that treat tax integration as a simple API without channel scenario coverage, audit evidence, exemption handling, and correction workflow.

## Evidence required
Require scenario matrix, integration map, audit extract support, exemption treatment, returns handling, and owner map for corrections.

## CXO language
"Tax compliance has to follow the customer journey, not the org chart."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-016",
    slug: "store-network-observability-obligation",
    title: "Store Network Observability Obligation",
    category: "infrastructure",
    thesis:
      "Store network sourcing must include observability, remote diagnostics, outage triage, and business-impact routing for lane, Wi-Fi, payment, and back-office failures.",
    applicability:
      "Apply to SD-WAN, store network, managed network, Wi-Fi, edge, payment connectivity, and network operations sourcing.",
    riskFactors: [
      {
        id: "risk-store-network-black-box",
        label: "Store network black box",
        severity: "high",
        detectionSignals: [
          "Vendor provides uptime SLA but weak remote diagnostics and store-impact visibility.",
          "POS, payment, Wi-Fi, back-office, and handheld failures are not mapped to business impact.",
        ],
        mitigations: [
          "Require observability feeds, runbooks, remote diagnostics, and business-impact severity mapping.",
          "Include peak-window escalation for lane and payment connectivity incidents.",
        ],
      },
    ],
    body: `## Summary
Store network failures are business failures when lanes, payments, handhelds, Wi-Fi, or back-office systems go down. Sourcing should evaluate how quickly the vendor can see, diagnose, route, and resolve store-impacting incidents.

## Detection
Flag managed network proposals that state availability without showing telemetry, remote diagnostics, store severity mapping, and operational handoff.

## Evidence required
Require monitoring architecture, alert samples, diagnostic runbooks, incident severity rules, escalation path, and evidence feeds for store operations.

## CXO language
"Network uptime is not enough; we need to know when a store cannot trade."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-017",
    slug: "assortment-and-planogram-data-handoff",
    title: "Assortment and Planogram Data Handoff",
    category: "data_analytics",
    thesis:
      "Assortment and planogram sourcing should verify product, location, fixture, replenishment, and execution data handoffs before vendor workflow claims are accepted.",
    applicability:
      "Apply to assortment planning, merchandising, planogram, space planning, replenishment, store tasking, and execution compliance sourcing.",
    riskFactors: [
      {
        id: "risk-merch-data-handoff-gap",
        label: "Merchandising data handoff gap",
        severity: "medium",
        detectionSignals: [
          "Vendor workflow depends on product-location-fixture data not owned by the project.",
          "Store execution feedback does not flow back to replenishment, inventory, or merchandising systems.",
        ],
        mitigations: [
          "Map product, location, fixture, replenishment, and execution data ownership.",
          "Require closed-loop proof from planogram assignment to store execution and exception feedback.",
        ],
      },
    ],
    body: `## Summary
Planogram and assortment tools only work when product, location, fixture, replenishment, and store execution data are aligned. Sourcing should expose the data handoffs that make the workflow real.

## Detection
Flag proposals that show attractive planning workflow but do not specify master data ownership, fixture data, execution feedback, exception capture, and replenishment integration.

## Evidence required
Require data ownership map, fixture and location data requirements, workflow scripts, store execution feedback, and integration responsibilities.

## CXO language
"A better planogram tool does not help if stores cannot execute and feed back the truth."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-018",
    slug: "vendor-managed-inventory-control-boundary",
    title: "Vendor-Managed Inventory Control Boundary",
    category: "risk",
    thesis:
      "Vendor-managed inventory and dropship sourcing must define forecast, substitution, allocation, ownership, service, and dispute boundaries before operational risk shifts outside the retailer.",
    applicability:
      "Apply to VMI, dropship, supplier portal, marketplace seller operations, replenishment, and external fulfillment sourcing.",
    riskFactors: [
      {
        id: "risk-vmi-control-boundary",
        label: "Vendor-managed inventory control boundary",
        severity: "high",
        detectionSignals: [
          "Supplier or vendor controls inventory actions without clear exception and dispute ownership.",
          "Forecast, substitution, service-level, and cancellation rules are not contract-backed.",
        ],
        mitigations: [
          "Require control boundary matrix for forecast, allocation, substitution, cancellation, and service recovery.",
          "Add audit, data access, and dispute resolution obligations.",
        ],
      },
    ],
    body: `## Summary
Vendor-managed inventory and dropship models can improve assortment and availability, but they move operational control outside the retailer. The sourcing event should define the control boundary explicitly.

## Detection
Flag proposals that give suppliers or partners operational control without clear rules for forecast input, substitution, allocation, cancellation, service recovery, and disputes.

## Evidence required
Require control matrix, data feed catalog, SLA model, exception workflow, audit rights, and dispute resolution terms.

## CXO language
"Outsourcing inventory execution does not outsource accountability to the customer."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-019",
    slug: "q4-code-freeze-exception-governance",
    title: "Q4 Code Freeze Exception Governance",
    category: "process_methodology",
    thesis:
      "Q4 retail freezes need exception governance that distinguishes emergency fixes from discretionary scope, with evidence required before vendor work proceeds.",
    applicability:
      "Apply to any retail IT managed service, platform implementation, release management, or integration event that may operate during Q4 or other peak trading periods.",
    riskFactors: [
      {
        id: "risk-q4-exception-creep",
        label: "Q4 freeze exception creep",
        severity: "high",
        detectionSignals: [
          "Vendor requests freeze exceptions for convenience, backlog pressure, or non-critical enhancements.",
          "Emergency release criteria, approval, rollback, and after-action review are not documented.",
        ],
        mitigations: [
          "Define freeze exception taxonomy and approval authority before award.",
          "Require rollback proof and after-action evidence for each approved exception.",
        ],
      },
    ],
    body: `## Summary
Retail freeze windows fail when every delayed enhancement becomes an exception. Sourcing should require governance that protects trading continuity while still allowing genuine emergency fixes.

## Detection
Flag support or implementation proposals that reference Q4 flexibility without defining emergency criteria, approval rights, rollback, testing, and after-action review.

## Evidence required
Require freeze calendar, exception taxonomy, approval workflow, rollback plan, test evidence, communication plan, and after-action template.

## CXO language
"Peak-period exceptions should be rare, evidence-backed, and owned by the business."`,
  }),
  pattern({
    id: "PAT-SRC-RIT-020",
    slug: "omnichannel-integration-runbook-ownership",
    title: "Omnichannel Integration Runbook Ownership",
    category: "process_methodology",
    thesis:
      "Retail IT sourcing should require runbook ownership across POS, OMS, WMS, ecommerce, payments, loyalty, fraud, tax, and last-mile integrations before go-live.",
    applicability:
      "Apply to multi-vendor retail programs where customer journeys cross store, digital, fulfillment, payment, promotion, and support systems.",
    riskFactors: [
      {
        id: "risk-omnichannel-runbook-gap",
        label: "Omnichannel runbook gap",
        severity: "critical",
        detectionSignals: [
          "Multiple vendors each own their module but no party owns cross-system incident runbooks.",
          "Go-live criteria do not include integration monitoring, replay, reconciliation, and customer-impact triage.",
        ],
        mitigations: [
          "Require cross-vendor runbooks and named incident commander before go-live.",
          "Test order, return, payment, loyalty, inventory, and delivery exception scenarios end to end.",
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Cross-vendor go-live readiness",
        whenToUse:
          "Use when multiple vendors are required to deliver a customer-facing retail journey.",
        buyerAsk:
          "Require named ownership for integration monitoring, incident command, replay, reconciliation, and customer-impact triage.",
        vendorGive:
          "Joint readiness plan, shared runbooks, integration test evidence, or launch holdback tied to end-to-end scenarios.",
      },
    ],
    body: `## Summary
Retail customer journeys cross many systems. A single order can touch ecommerce, OMS, payment, fraud, tax, loyalty, inventory, WMS, store tasking, last-mile delivery, customer service, and finance reconciliation.

## Detection
Flag programs where every vendor has a module-level plan but no one owns cross-system monitoring, incident command, replay, reconciliation, and customer-impact triage.

## Evidence required
Require end-to-end runbooks, integration monitoring, replay and reconciliation procedures, scenario test results, and named cross-vendor incident command.

## CXO language
"The customer does not experience our vendor boundaries, so our runbooks cannot stop at them."`,
  }),
];

export default SOURCING_RETAIL_IT_PATTERNS;
