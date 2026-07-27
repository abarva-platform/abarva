/**
 * FIXTURE-ONLY pack: "Airline Demo New" — a synthetic global network airline.
 *
 * All values are invented for demonstration. This pack contains NO real airline
 * information, no hidden truth, and is not derived from any legacy Home pack,
 * V6/V7 demo pack, or existing SkyHarbor fixture. Synthetic namespace only.
 *
 * The "normal" baseline below deliberately includes at least one of every
 * availability state so the default view exercises them; scenario transforms
 * (scenarios.ts) drive whole-envelope states for the other conditions.
 */

import type { FixturePack } from "./types";
import {
  benchmark,
  domain,
  edge,
  entity,
  evidence,
  field,
  gap,
  metric,
  node,
  perspective,
  searchHit,
  stance,
  suggested,
  target,
} from "./builders";

const BASELINE = "kb-airline-demo-new-2026-07-01";
const PUBS = {
  enterprise: "pub-enterprise-2026-07-01",
  technology: "pub-technology-2026-07-01",
  data: "pub-data-2026-06-15",
  vendors: "pub-vendors-2026-07-01",
  risks: "pub-risks-2026-06-30",
  programs: "pub-programs-2026-07-01",
};

export const AIRLINE_DEMO_NEW: FixturePack = {
  meta: {
    fixtureOnly: true,
    tenantKey: "fixture-airline-demo-new",
    displayName: "Airline Demo New",
    industry: "Global network airline",
    knowledgeBaselineRef: BASELINE,
    domainPublicationVersions: PUBS,
    cubeSemanticModelVersion: "sem-airline-2026-07-01",
  },

  brief: {
    identity: {
      organizationId: "org-airline-demo-new",
      displayName: "Airline Demo New",
      industry: "Global network airline",
      revenue: metric("enterprise.revenue", "Revenue", 48200, "USD_millions", {
        evidenceRefs: ["ev-annual-report"],
        semanticModelVersion: "sem-airline-2026-07-01",
        metricQueryHash: "mqh-rev-001",
      }),
      employees: metric("enterprise.employees", "Employees", 92000, "count", {
        evidenceRefs: ["ev-annual-report"],
      }),
      footprint: "6 hubs, 280 destinations, 54 countries",
      footprintState: "available",
    },
    headlineMetrics: [
      metric("enterprise.apps", "Applications in portfolio", 214, "count", {
        evidenceRefs: ["ev-cmdb-export"],
      }),
      metric("enterprise.it_spend", "Annual IT spend", 1820, "USD_millions", {
        evidenceRefs: ["ev-finance-ledger"],
        semanticModelVersion: "sem-airline-2026-07-01",
        metricQueryHash: "mqh-itspend-004",
      }),
      // not_measured demonstrated in the normal view — never rendered as 0
      metric("enterprise.cloud_pct", "Cloud-hosted workloads", null, "percent", {
        availabilityState: "not_measured",
      }),
      metric("enterprise.initiatives", "Active initiatives", 41, "count", {
        evidenceRefs: ["ev-pmo-register"],
      }),
    ],
    interpretation: {
      id: "interp-airline-1",
      contentClass: "abarva_interpretation",
      availabilityState: "accepted",
      evidenceRefs: ["ev-annual-report", "ev-cmdb-export"],
      absenceReason: null,
      headline:
        "Fleet-wide operations resilience depends on a small set of aging crew and dispatch systems.",
      body:
        "The portfolio concentrates operational risk in crew scheduling and dispatch. Modernizing these before the next network expansion is the highest-leverage move, but three of the four supporting evidence sources are still pending confirmation.",
      pinnedBaselineRef: BASELINE,
    },
    perspectives: [
      perspective(
        "persp-airline-cio",
        "We cannot grow the network faster than we can modernize crew scheduling.",
        "Chief Information Officer",
        stance(
          ["ev-cio-interview", "ev-ops-incident-log"],
          ["ev-vendor-roadmap"],
          ["ev-capacity-model"],
        ),
        { evidenceRefs: ["ev-cio-interview"], attribution: "CIO (interview)" },
      ),
      perspective(
        "persp-airline-coo",
        "Dispatch reliability is the single number the board watches every week.",
        "Chief Operating Officer",
        stance(["ev-ops-incident-log"], [], ["ev-capacity-model"]),
        { evidenceRefs: ["ev-coo-interview"], attribution: "COO (interview)" },
      ),
    ],
    benchmarks: [
      benchmark(
        "bm-airline-cloud",
        "Peer cloud adoption",
        metric("bm.cloud", "Peer median cloud adoption", 63, "percent", {
          evidenceRefs: ["ev-industry-benchmark"],
        }),
        "Network carriers, 2026 peer set",
      ),
      benchmark(
        "bm-airline-pattern",
        "Common failure pattern",
        null,
        "Carriers that expand before modernizing dispatch see a 2–3x rise in irregular-operations cost.",
        { contentClass: "industry_pattern" },
      ),
    ],
    targets: [
      target(
        "tgt-airline-cloud",
        "Cloud-hosted workloads",
        metric("tgt.cloud", "Target", 70, "percent"),
        metric("cur.cloud", "Current", null, "percent", {
          availabilityState: "not_measured",
        }),
        "By FY2028",
        { contentClass: "proposed_target" },
      ),
    ],
    domains: [
      domain("enterprise", "Enterprise", "available", 0.82, 12, 1, "Identity, footprint and financials are well evidenced."),
      domain("technology", "Technology estate", "available", 0.74, 214, 3, "Applications and hosting largely mapped."),
      domain("data", "Data & analytics", "stale", 0.58, 36, 4, "Last data-domain publication is aging."),
      domain("vendors", "Vendors & contracts", "available", 0.69, 48, 2, "Key contracts loaded; renewal exposure partial."),
      domain("risks", "Risk & controls", "conflicting", 0.4, 18, 5, "Two sources disagree on top operational risks."),
      domain("programs", "Programs", "not_loaded", 0, null, 0, "Program-domain publication not yet built."),
    ],
    topGapRefs: ["gap-airline-cloud", "gap-airline-risk-conflict", "gap-airline-programs"],
  },

  exploreLanding: {
    domainKey: null,
    domains: [
      domain("technology", "Technology estate", "available", 0.74, 214, 3, null),
      domain("vendors", "Vendors & contracts", "available", 0.69, 48, 2, null),
      domain("data", "Data & analytics", "stale", 0.58, 36, 4, null),
      domain("risks", "Risk & controls", "conflicting", 0.4, 18, 5, null),
    ],
    entities: [
      entity("app-crew-sched", "application", "Crew Scheduling System", "technology", [
        field("owner", "Owner", "Flight Operations", "available", ["ev-cmdb-export"]),
        field("hosting", "Hosting", "on_prem", "available", ["ev-cmdb-export"]),
        field("criticality", "Criticality", "tier_1", "available"),
        field("annual_cost", "Annual cost", null, "withheld", []),
      ], { evidenceRefs: ["ev-cmdb-export"] }),
      entity("app-dispatch", "application", "Dispatch & Load Planning", "technology", [
        field("owner", "Owner", "Flight Operations", "available"),
        field("hosting", "Hosting", "private_cloud", "available"),
        field("criticality", "Criticality", "tier_1", "available"),
        field("annual_cost", "Annual cost", 14.2, "available", ["ev-finance-ledger"]),
      ]),
      entity("app-loyalty", "application", "Loyalty Platform", "technology", [
        field("owner", "Owner", "Commercial", "available"),
        field("hosting", "Hosting", "saas", "available"),
        field("criticality", "Criticality", "tier_2", "available"),
        field("annual_cost", "Annual cost", 8.7, "available"),
      ]),
      entity("vendor-gds", "vendor", "Global Distribution Vendor", "vendors", [
        field("category", "Category", "Distribution", "available"),
        field("renewal", "Renewal date", null, "not_loaded", []),
        field("spend", "Annual spend", 22.5, "available", ["ev-finance-ledger"]),
      ]),
    ],
    totalCount: 214,
    page: 1,
    pageSize: 25,
  },

  entityDetails: {
    "app-crew-sched": {
      entity: entity("app-crew-sched", "application", "Crew Scheduling System", "technology", [
        field("owner", "Owner", "Flight Operations", "available", ["ev-cmdb-export"]),
        field("hosting", "Hosting", "on_prem", "available", ["ev-cmdb-export"]),
        field("criticality", "Criticality", "tier_1", "available"),
        field("annual_cost", "Annual cost", null, "withheld", []),
        field("age_years", "Age (years)", 14, "available", ["ev-cmdb-export"]),
        field("users", "Named users", 3400, "available"),
      ], { evidenceRefs: ["ev-cmdb-export"] }),
      fields: [
        field("owner", "Owner", "Flight Operations", "available", ["ev-cmdb-export"]),
        field("hosting", "Hosting", "on_prem", "available", ["ev-cmdb-export"]),
        field("criticality", "Criticality", "tier_1", "available"),
        field("annual_cost", "Annual cost", null, "withheld", []),
        field("age_years", "Age (years)", 14, "available", ["ev-cmdb-export"]),
        field("vendor", "Vendor", "Internal build", "available"),
      ],
      perspectives: [
        perspective(
          "persp-crew-1",
          "The crew system is the one everyone is afraid to touch.",
          "VP Flight Operations",
          stance(["ev-ops-incident-log"], [], ["ev-capacity-model"]),
          { evidenceRefs: ["ev-vpops-interview"] },
        ),
      ],
      benchmarks: [],
      relatedEntityRefs: ["app-dispatch", "vendor-gds"],
      gapRefs: ["gap-airline-cloud"],
    },
  },

  relationships: {
    focalEntityRefs: ["app-crew-sched"],
    nodes: [
      node("app-crew-sched", "application", "Crew Scheduling System", 0, { evidenceRefs: ["ev-cmdb-export"] }),
      node("app-dispatch", "application", "Dispatch & Load Planning", 1),
      node("vendor-gds", "vendor", "Global Distribution Vendor", 1),
      node("team-flightops", "team", "Flight Operations", 1),
      node("risk-irrops", "risk", "Irregular Operations Exposure", 1, { evidenceRefs: ["ev-ops-incident-log"] }),
      node("app-loyalty", "application", "Loyalty Platform", 2),
    ],
    edges: [
      edge("e1", "app-crew-sched", "app-dispatch", "feeds", { evidenceRefs: ["ev-integration-map"] }),
      edge("e2", "team-flightops", "app-crew-sched", "owns"),
      edge("e3", "app-crew-sched", "risk-irrops", "contributes_to", { evidenceRefs: ["ev-ops-incident-log"] }),
      edge("e4", "app-dispatch", "vendor-gds", "depends_on", { authorityState: "candidate", availabilityState: "candidate" }),
      edge("e5", "app-dispatch", "app-loyalty", "shares_data_with", { scope: "target", authorityState: "candidate", availabilityState: "candidate" }),
    ],
    evidenceByEdge: {
      e1: [{ ...evidence("ev-integration-map", "Integration Map", "architecture_doc", { citation: "p.12" }), edgeId: "e1" }],
      e3: [{ ...evidence("ev-ops-incident-log", "Operations Incident Log", "operational_record"), edgeId: "e3" }],
    },
    truncated: false,
    aggregationApplied: false,
    omittedNodeCount: 0,
    acceptedEdgeCount: 3,
    candidateEdgeCount: 2,
    openGapCount: 1,
  },

  evidence: {
    domainKey: null,
    gaps: [
      gap("gap-airline-cloud", "high", "technology", "Cloud hosting percentage not measured", "Without a measured cloud ratio, modernization targets cannot be sized or tracked.", "Infrastructure inventory export", "not_measured"),
      gap("gap-airline-risk-conflict", "critical", "risks", "Top operational risks conflict across sources", "The risk register and the incident log disagree on the top-three operational risks, blocking a single board view.", "Reconciled risk register", "conflicting"),
      gap("gap-airline-programs", "medium", "programs", "Program domain not loaded", "No program-level view is available until the program publication is built.", "Program register publication", "not_loaded"),
      gap("gap-airline-crew-cost", "medium", "technology", "Crew system annual cost withheld", "Cost is restricted pending finance approval, limiting business-case precision.", "Finance approval to disclose", "withheld"),
    ],
    overallEvidenceCoverage: 0.63,
    severityCounts: { low: 0, medium: 2, high: 1, critical: 1 },
  },

  searchDocs: [
    searchHit("sd-1", "Crew Scheduling System", "Tier-1 on-prem application owned by Flight Operations; 14 years old.", "technology", "app-crew-sched", ["ev-cmdb-export"]),
    searchHit("sd-2", "Dispatch & Load Planning", "Tier-1 private-cloud application; feeds crew scheduling.", "technology", "app-dispatch"),
    searchHit("sd-3", "Global Distribution Vendor", "Distribution vendor; $22.5M annual spend.", "vendors", "vendor-gds", ["ev-finance-ledger"]),
  ],

  suggestedQuestions: [
    suggested("sq-1", "Which tier-1 systems carry the most operational risk?", "brief", false),
    suggested("sq-2", "What would it take to measure cloud adoption?", "evidence", true),
    suggested("sq-3", "Show what depends on the crew scheduling system.", "relationships", false),
    suggested("sq-4", "Compare our cloud adoption to peers.", "brief", true),
  ],

  handoffPreviews: {
    source: {
      receivingModule: "source",
      scope: "Vendor consolidation review for distribution and loyalty vendors",
      selectedEntityRefs: ["vendor-gds", "app-loyalty"],
      filters: { domain: ["vendors"] },
      lens: "vendor_consolidation",
      insightRef: "interp-airline-1",
      knowledgeBaselineRef: BASELINE,
      domainPublicationVersions: PUBS,
      evidenceRefs: ["ev-finance-ledger"],
      knownGapRefs: ["gap-airline-cloud"],
      readinessState: "ready",
      readinessDetail: null,
    },
    moves: {
      receivingModule: "moves",
      scope: "Crew & dispatch modernization move",
      selectedEntityRefs: ["app-crew-sched", "app-dispatch"],
      filters: {},
      lens: "risk_resilience",
      insightRef: "interp-airline-1",
      knowledgeBaselineRef: BASELINE,
      domainPublicationVersions: PUBS,
      evidenceRefs: ["ev-ops-incident-log"],
      knownGapRefs: ["gap-airline-crew-cost"],
      readinessState: "blocked_missing_evidence",
      readinessDetail: "Crew system annual cost is withheld; business case cannot be sized until disclosed.",
    },
  },

  evidenceDescriptors: {
    "ev-annual-report": evidence("ev-annual-report", "Annual Report FY2026", "financial_filing", { citation: "p.40", confidence: 0.95 }),
    "ev-cmdb-export": evidence("ev-cmdb-export", "CMDB Export", "system_inventory", { citation: "2026-06 snapshot", confidence: 0.85 }),
    "ev-finance-ledger": evidence("ev-finance-ledger", "Finance Ledger Extract", "financial_record", { confidence: 0.9 }),
    "ev-cio-interview": evidence("ev-cio-interview", "CIO Interview", "executive_interview", { authorityState: "accepted", confidence: 0.7, effectivePeriod: "2026-Q2" }),
    "ev-coo-interview": evidence("ev-coo-interview", "COO Interview", "executive_interview", { confidence: 0.7 }),
    "ev-vpops-interview": evidence("ev-vpops-interview", "VP Flight Ops Interview", "executive_interview", { confidence: 0.65 }),
    "ev-ops-incident-log": evidence("ev-ops-incident-log", "Operations Incident Log", "operational_record", { confidence: 0.8 }),
    "ev-industry-benchmark": evidence("ev-industry-benchmark", "Industry Benchmark 2026", "benchmark_dataset", { confidence: 0.75 }),
    "ev-integration-map": evidence("ev-integration-map", "Integration Map", "architecture_doc", { citation: "p.12", confidence: 0.7 }),
    // A withheld/restricted evidence descriptor — content stays withheld, never leaked
    "ev-crew-cost": evidence("ev-crew-cost", "Crew System Cost (restricted)", null, {
      accessRestriction: "withheld",
      availabilityState: "withheld",
      confidence: null,
      citation: null,
    }),
  },
};
