/**
 * FIXTURE-ONLY pack: "Healthcare Demo New" — a synthetic integrated health system.
 *
 * All values are invented. No real patient, provider, or client information; no
 * hidden truth; not derived from any legacy Home pack, V6/V7 demo pack, or
 * existing tenant fixture. Synthetic namespace only.
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

const BASELINE = "kb-healthcare-demo-new-2026-07-10";
const PUBS = {
  enterprise: "pub-enterprise-2026-07-10",
  technology: "pub-technology-2026-07-10",
  data: "pub-data-2026-07-05",
  vendors: "pub-vendors-2026-07-10",
  risks: "pub-risks-2026-07-08",
  programs: "pub-programs-2026-07-10",
};

export const HEALTHCARE_DEMO_NEW: FixturePack = {
  meta: {
    fixtureOnly: true,
    tenantKey: "fixture-healthcare-demo-new",
    displayName: "Healthcare Demo New",
    industry: "Integrated health system",
    knowledgeBaselineRef: BASELINE,
    domainPublicationVersions: PUBS,
    cubeSemanticModelVersion: "sem-healthcare-2026-07-10",
  },

  brief: {
    identity: {
      organizationId: "org-healthcare-demo-new",
      displayName: "Healthcare Demo New",
      industry: "Integrated health system",
      revenue: metric("enterprise.revenue", "Net patient revenue", 9800, "USD_millions", {
        evidenceRefs: ["ev-audited-financials"],
        semanticModelVersion: "sem-healthcare-2026-07-10",
        metricQueryHash: "mqh-rev-hc-001",
      }),
      employees: metric("enterprise.employees", "Employees", 34000, "count", {
        evidenceRefs: ["ev-audited-financials"],
      }),
      footprint: "9 hospitals, 140 clinics, 1 health plan",
      footprintState: "available",
    },
    headlineMetrics: [
      metric("enterprise.apps", "Applications in portfolio", 187, "count", { evidenceRefs: ["ev-app-inventory"] }),
      metric("enterprise.it_spend", "Annual IT spend", 640, "USD_millions", {
        evidenceRefs: ["ev-finance-ledger"],
        semanticModelVersion: "sem-healthcare-2026-07-10",
        metricQueryHash: "mqh-itspend-hc-004",
      }),
      metric("enterprise.ehr_uptime", "EHR uptime", 99.4, "percent", { evidenceRefs: ["ev-ops-dashboard"] }),
      // conflicting demonstrated in the normal view
      metric("enterprise.security_score", "Security posture score", null, "index", {
        availabilityState: "conflicting",
        unavailableReason: "Two assessments report materially different scores; not reconciled.",
      }),
    ],
    interpretation: {
      id: "interp-hc-1",
      contentClass: "abarva_interpretation",
      availabilityState: "accepted",
      evidenceRefs: ["ev-audited-financials", "ev-app-inventory"],
      absenceReason: null,
      headline:
        "EHR consolidation is largely complete; the remaining risk is fragmented clinical data downstream of it.",
      body:
        "The estate has standardized on a single EHR, but analytics and reporting pull from several downstream copies with inconsistent definitions. Reconciling those before expanding value-based-care programs is the priority move.",
      pinnedBaselineRef: BASELINE,
    },
    perspectives: [
      perspective(
        "persp-hc-cmio",
        "Clinicians trust the EHR; they do not trust the reports that come out of it.",
        "Chief Medical Information Officer",
        stance(["ev-cmio-interview", "ev-data-quality-audit"], ["ev-analytics-roadmap"], []),
        { evidenceRefs: ["ev-cmio-interview"], attribution: "CMIO (interview)" },
      ),
      perspective(
        "persp-hc-ciso",
        "Our biggest exposure is the number of vendors touching clinical data.",
        "Chief Information Security Officer",
        stance(["ev-vendor-register"], [], ["ev-security-assessment-a", "ev-security-assessment-b"]),
        { evidenceRefs: ["ev-ciso-interview"], attribution: "CISO (interview)" },
      ),
    ],
    benchmarks: [
      benchmark(
        "bm-hc-ehr",
        "Peer EHR consolidation",
        metric("bm.ehr", "Peer median single-EHR adoption", 71, "percent", { evidenceRefs: ["ev-industry-benchmark"] }),
        "US integrated delivery networks, 2026",
      ),
    ],
    targets: [
      target(
        "tgt-hc-data",
        "Reconciled clinical data definitions",
        metric("tgt.data", "Target", 95, "percent"),
        metric("cur.data", "Current", 62, "percent", { evidenceRefs: ["ev-data-quality-audit"] }),
        "By FY2027",
        { contentClass: "approved_target", availabilityState: "accepted" },
      ),
    ],
    domains: [
      domain("enterprise", "Enterprise", "available", 0.88, 10, 0, "Financials and footprint well evidenced."),
      domain("technology", "Technology estate", "available", 0.8, 187, 2, "Applications mapped; EHR standardized."),
      domain("data", "Data & analytics", "available", 0.66, 44, 3, "Downstream copies inconsistent."),
      domain("vendors", "Vendors & contracts", "available", 0.72, 61, 2, "Clinical-data vendors elevated for review."),
      domain("risks", "Risk & controls", "conflicting", 0.5, 22, 4, "Security assessments disagree."),
      domain("programs", "Programs", "available", 0.6, 15, 1, "Value-based-care programs in flight."),
    ],
    topGapRefs: ["gap-hc-security-conflict", "gap-hc-data-defs"],
  },

  exploreLanding: {
    domainKey: null,
    domains: [
      domain("technology", "Technology estate", "available", 0.8, 187, 2, null),
      domain("data", "Data & analytics", "available", 0.66, 44, 3, null),
      domain("vendors", "Vendors & contracts", "available", 0.72, 61, 2, null),
      domain("risks", "Risk & controls", "conflicting", 0.5, 22, 4, null),
    ],
    entities: [
      entity("app-ehr", "application", "Enterprise EHR", "technology", [
        field("owner", "Owner", "Clinical Informatics", "available", ["ev-app-inventory"]),
        field("hosting", "Hosting", "private_cloud", "available"),
        field("criticality", "Criticality", "tier_1", "available"),
        field("annual_cost", "Annual cost", 58, "available", ["ev-finance-ledger"]),
      ], { evidenceRefs: ["ev-app-inventory"] }),
      entity("app-analytics", "application", "Clinical Analytics Warehouse", "data", [
        field("owner", "Owner", "Data & Analytics", "available"),
        field("hosting", "Hosting", "azure", "available"),
        field("criticality", "Criticality", "tier_2", "available"),
        field("data_quality", "Definition consistency", 62, "available", ["ev-data-quality-audit"]),
      ]),
      entity("vendor-lab", "vendor", "Reference Lab Vendor", "vendors", [
        field("category", "Category", "Clinical services", "available"),
        field("renewal", "Renewal date", "2027-03-31", "available", ["ev-vendor-register"]),
        field("data_access", "Clinical data access", "yes", "available"),
      ]),
    ],
    totalCount: 187,
    page: 1,
    pageSize: 25,
  },

  entityDetails: {
    "app-analytics": {
      entity: entity("app-analytics", "application", "Clinical Analytics Warehouse", "data", [
        field("owner", "Owner", "Data & Analytics", "available"),
        field("hosting", "Hosting", "azure", "available"),
        field("criticality", "Criticality", "tier_2", "available"),
        field("data_quality", "Definition consistency", 62, "available", ["ev-data-quality-audit"]),
      ]),
      fields: [
        field("owner", "Owner", "Data & Analytics", "available"),
        field("hosting", "Hosting", "azure", "available"),
        field("criticality", "Criticality", "tier_2", "available"),
        field("data_quality", "Definition consistency", 62, "available", ["ev-data-quality-audit"]),
        field("sources", "Upstream sources", 6, "available"),
        field("owner_confirmed", "Owner confirmed", null, "not_measured"),
      ],
      perspectives: [
        perspective(
          "persp-analytics-1",
          "Every service line has its own definition of a readmission.",
          "Director of Analytics",
          stance(["ev-data-quality-audit"], [], []),
          { evidenceRefs: ["ev-analytics-interview"] },
        ),
      ],
      benchmarks: [],
      relatedEntityRefs: ["app-ehr", "vendor-lab"],
      gapRefs: ["gap-hc-data-defs"],
    },
  },

  relationships: {
    focalEntityRefs: ["app-ehr"],
    nodes: [
      node("app-ehr", "application", "Enterprise EHR", 0, { evidenceRefs: ["ev-app-inventory"] }),
      node("app-analytics", "application", "Clinical Analytics Warehouse", 1),
      node("vendor-lab", "vendor", "Reference Lab Vendor", 1),
      node("team-clinformatics", "team", "Clinical Informatics", 1),
      node("risk-datafrag", "risk", "Clinical Data Fragmentation", 1, { evidenceRefs: ["ev-data-quality-audit"] }),
    ],
    edges: [
      edge("h1", "app-ehr", "app-analytics", "feeds", { evidenceRefs: ["ev-integration-map-hc"] }),
      edge("h2", "team-clinformatics", "app-ehr", "owns"),
      edge("h3", "app-analytics", "risk-datafrag", "contributes_to", { evidenceRefs: ["ev-data-quality-audit"] }),
      edge("h4", "app-ehr", "vendor-lab", "shares_data_with", { authorityState: "candidate", availabilityState: "candidate" }),
    ],
    evidenceByEdge: {
      h1: [{ ...evidence("ev-integration-map-hc", "Integration Map", "architecture_doc", { citation: "p.8" }), edgeId: "h1" }],
      h3: [{ ...evidence("ev-data-quality-audit", "Data Quality Audit", "assessment"), edgeId: "h3" }],
    },
    truncated: false,
    aggregationApplied: false,
    omittedNodeCount: 0,
    acceptedEdgeCount: 3,
    candidateEdgeCount: 1,
    openGapCount: 1,
  },

  evidence: {
    domainKey: null,
    gaps: [
      gap("gap-hc-security-conflict", "critical", "risks", "Security posture score conflicts", "Two security assessments report materially different scores, preventing a single risk view for the board.", "Reconciled security assessment", "conflicting"),
      gap("gap-hc-data-defs", "high", "data", "Clinical data definitions inconsistent", "Inconsistent definitions across the warehouse undermine value-based-care reporting.", "Governed metric definitions", "available"),
      gap("gap-hc-owner", "low", "data", "Analytics owner confirmation missing", "Ownership is unconfirmed, slowing change approvals.", "Owner attestation", "not_measured"),
    ],
    overallEvidenceCoverage: 0.71,
    severityCounts: { low: 1, medium: 0, high: 1, critical: 1 },
  },

  searchDocs: [
    searchHit("hsd-1", "Enterprise EHR", "Tier-1 private-cloud EHR owned by Clinical Informatics; $58M annual cost.", "technology", "app-ehr", ["ev-app-inventory"]),
    searchHit("hsd-2", "Clinical Analytics Warehouse", "Azure-hosted warehouse; 62% definition consistency.", "data", "app-analytics", ["ev-data-quality-audit"]),
    searchHit("hsd-3", "Reference Lab Vendor", "Clinical-services vendor with clinical data access; renews 2027-03-31.", "vendors", "vendor-lab", ["ev-vendor-register"]),
  ],

  suggestedQuestions: [
    suggested("hsq-1", "Where is clinical data most fragmented?", "brief", false),
    suggested("hsq-2", "Which vendors can access clinical data?", "explore", false),
    suggested("hsq-3", "Why do the two security scores disagree?", "evidence", true),
    suggested("hsq-4", "Show what the EHR feeds downstream.", "relationships", false),
  ],

  handoffPreviews: {
    moves: {
      receivingModule: "moves",
      scope: "Clinical data reconciliation move",
      selectedEntityRefs: ["app-analytics", "app-ehr"],
      filters: { domain: ["data"] },
      lens: "data_ai_readiness",
      insightRef: "interp-hc-1",
      knowledgeBaselineRef: BASELINE,
      domainPublicationVersions: PUBS,
      evidenceRefs: ["ev-data-quality-audit"],
      knownGapRefs: ["gap-hc-data-defs"],
      readinessState: "ready",
      readinessDetail: null,
    },
    source: {
      receivingModule: "source",
      scope: "Clinical-data vendor risk review",
      selectedEntityRefs: ["vendor-lab"],
      filters: { domain: ["vendors"] },
      lens: "risk_resilience",
      insightRef: null,
      knowledgeBaselineRef: BASELINE,
      domainPublicationVersions: PUBS,
      evidenceRefs: ["ev-vendor-register"],
      knownGapRefs: ["gap-hc-security-conflict"],
      readinessState: "blocked_conflicting",
      readinessDetail: "Security posture is conflicting; resolve before a vendor risk decision.",
    },
  },

  evidenceDescriptors: {
    "ev-audited-financials": evidence("ev-audited-financials", "Audited Financials FY2026", "financial_filing", { confidence: 0.95 }),
    "ev-app-inventory": evidence("ev-app-inventory", "Application Inventory", "system_inventory", { confidence: 0.85 }),
    "ev-finance-ledger": evidence("ev-finance-ledger", "Finance Ledger Extract", "financial_record", { confidence: 0.9 }),
    "ev-cmio-interview": evidence("ev-cmio-interview", "CMIO Interview", "executive_interview", { confidence: 0.7 }),
    "ev-ciso-interview": evidence("ev-ciso-interview", "CISO Interview", "executive_interview", { confidence: 0.7 }),
    "ev-analytics-interview": evidence("ev-analytics-interview", "Analytics Director Interview", "executive_interview", { confidence: 0.65 }),
    "ev-data-quality-audit": evidence("ev-data-quality-audit", "Data Quality Audit", "assessment", { confidence: 0.8 }),
    "ev-vendor-register": evidence("ev-vendor-register", "Vendor Register", "contract_record", { confidence: 0.85 }),
    "ev-industry-benchmark": evidence("ev-industry-benchmark", "Industry Benchmark 2026", "benchmark_dataset", { confidence: 0.75 }),
    "ev-ops-dashboard": evidence("ev-ops-dashboard", "Operations Dashboard", "operational_record", { confidence: 0.8 }),
    // Two conflicting assessments — surfaced as related conflicts, neither treated as truth
    "ev-security-assessment-a": evidence("ev-security-assessment-a", "Security Assessment A", "assessment", { confidence: 0.6, availabilityState: "conflicting", relatedConflicts: ["ev-security-assessment-b"] }),
    "ev-security-assessment-b": evidence("ev-security-assessment-b", "Security Assessment B", "assessment", { confidence: 0.6, availabilityState: "conflicting", relatedConflicts: ["ev-security-assessment-a"] }),
  },
};
