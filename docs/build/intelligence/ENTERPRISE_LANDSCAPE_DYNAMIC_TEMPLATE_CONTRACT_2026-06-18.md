# Enterprise Landscape Dynamic Template Contract

Date: 2026-06-18

Reference design: `/Users/anand/Downloads/AbarVa Enterprise Landscape (standalone).html`

## Decision

The Enterprise Landscape design should become the Home page pattern.

It is the clearest separation of concerns:

- Home: current-state consulting assessment of the enterprise landscape.
- Intelligence: advisory board for decisions before investment.
- Tower: command center for approved spend, value, risk, vendors, and execution.

The standalone file should not be used as runtime source because it is a packed HTML artifact with embedded assets. The app should recreate the same layout as a clean data-driven component.

## Template Shape

The page has four stable zones:

1. Top product navigation
2. Sentinel ask/search bar
3. Left assessment navigation
4. Center report canvas plus right leadership panel

The layout stays stable. The content changes by client, selected section, and available evidence.

## Dynamic Data Contract

```ts
export type EnterpriseLandscapeViewModel = {
  tenant: {
    key: string;
    name: string;
    industry: string;
    assessmentDate: string;
    refreshStatus: "current" | "stale" | "partial" | "missing";
  };
  askBar: {
    placeholder: string;
    suggestedQuestions: string[];
  };
  navGroups: Array<{
    label: string;
    sections: Array<{
      id: string;
      label: string;
      status: "strong" | "partial" | "thin" | "missing";
      evidenceCount?: number;
      sourceCount?: number;
    }>;
  }>;
  selectedSection: {
    id: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    metadata: Array<{ label: string; value: string }>;
    executiveSummary: {
      heading: string;
      body: string;
    };
    currentState: Array<{
      area: string;
      maturity: "leading" | "mature" | "developing" | "fragmented" | "unknown";
      assessment: string;
      sourceIds: string[];
    }>;
    leadershipImplications: Array<{
      theme: string;
      whatItMeans: string;
      whyItMatters: string;
      whatCouldGoWrong: string;
      recommendedInspection: string;
      sourceIds: string[];
    }>;
    maturityReadiness: Array<{
      capability: string;
      score: number;
      label: string;
      rationale: string;
    }>;
    recommendedFocus: Array<{
      priority: number;
      recommendation: string;
      ownerHint?: string;
      timeHorizon?: "now" | "30 days" | "60 days" | "90 days" | "later";
    }>;
    exhibits: Array<
      | {
          type: "executive_table";
          title: string;
          interpretation: string;
          columns: string[];
          rows: Array<Record<string, string | number>>;
          sourceIds: string[];
        }
      | {
          type: "bar_chart" | "line_chart" | "stacked_bar" | "scatterplot" | "heatmap";
          title: string;
          interpretation: string;
          metricLabel: string;
          data: Array<Record<string, string | number>>;
          sourceIds: string[];
        }
      | {
          type: "architecture_diagram" | "capability_map" | "dependency_map" | "value_chain";
          title: string;
          interpretation: string;
          nodes: Array<{ id: string; label: string; group?: string; risk?: string }>;
          edges: Array<{ from: string; to: string; label?: string; strength?: string }>;
          sourceIds: string[];
        }
      | {
          type: "maturity_matrix" | "risk_matrix" | "benchmark_comparison";
          title: string;
          interpretation: string;
          dimensions: Array<Record<string, string | number>>;
          sourceIds: string[];
        }
    >;
  };
  leadershipPanel: {
    headline: string;
    snapshot: Array<{ label: string; value: string; tone?: "good" | "watch" | "risk" }>;
    primaryAction: string;
    secondaryAction: string;
  };
  sourceTrail: {
    sectionId: string;
    sources: Array<{
      id: string;
      title: string;
      type: "csv" | "yaml" | "jsonl" | "pdf" | "pptx" | "docx" | "xlsx" | "md";
      location: string;
      citationLabel: string;
      confidence: "high" | "medium" | "review_required";
    }>;
    missingEvidence: string[];
  };
};
```

## Client Generation Rules

The left navigation should be generated from what the client actually has loaded.

Baseline groups:

- The Enterprise: enterprise profile, business model, org/functions, workforce/personas.
- The Estate: applications, core systems, infrastructure/cloud, data/analytics, integrations/APIs.
- Money & Partners: vendors/contracts, IT budget, run cost, initiatives.
- AI & Risk: AI footprint, governance, security, model risk, reliability.
- Outside-In: industry benchmarks, competitor patterns, corporate policies.

Do not show an empty section as if it is loaded. If the data is thin, show the section with a plain-language status such as `limited evidence`, not an internal status like `0 chunks`.

## Copy Rules

Use consulting-report language:

- Executive Summary
- Current State
- Leadership Implications
- What Could Go Wrong
- Maturity & Readiness
- Recommended Focus
- View Source Trail

Avoid engine language:

- facts
- chunks
- embeddings
- graph edges
- L1/L2/L3
- backed by
- inspect workloads
- build view

## Consulting Exhibits

Every assessment section should include 1-3 exhibits. An exhibit is not a decorative chart. It must make a management point.

Use this pattern:

1. Start with the question leadership would ask.
2. Choose the exhibit that best answers it.
3. Add a one-sentence interpretation above the exhibit.
4. Keep the source trail available, but not visually dominant.

Recommended exhibit types:

- Executive table: best for application inventory, vendor contracts, initiatives, risk register, source documents, KPI inventory.
- Bar or stacked bar: best for spend, run cost, vendor concentration, budget by tower, value by initiative.
- Line chart: best for trends such as incidents, adoption, spend over time, delivery velocity, close cycle time.
- Heatmap: best for risk by function/system, maturity by domain, evidence confidence by dimension, integration complexity.
- Architecture diagram: best for current-state systems, data flow, cloud/on-prem/mainframe, ERP/treasury/payment architecture.
- Dependency map: best for cross-domain relationships such as AI initiative to data product to system to control.
- Benchmark comparison: best for industry corpus patterns, peer maturity, cost/productivity norms, adoption ranges.
- Maturity matrix: best for leadership readouts where the main point is readiness, not raw volume.

Do not reuse the same exhibit layout for every section. The selected section determines the exhibit.

Examples:

- Data & Analytics: current-state architecture diagram, platform volumetrics table, lineage/readiness heatmap.
- Applications & Core Systems: system landscape table, business capability map, technical debt heatmap.
- Infrastructure & Cloud: hybrid architecture diagram, run-cost stacked bar, modernization dependency map.
- Vendors & Contracts: vendor concentration bar chart, renewal-risk table, value/spend scatterplot.
- IT Budget & Run Cost: opex/capex stacked bar, spend by tower table, run-vs-change trend.
- AI Footprint & Adoption: adoption funnel, agent outcome table, model-risk matrix.
- Risk & Model Governance: high-risk findings table, control maturity heatmap, evidence readiness matrix.
- Industry Benchmarks: peer comparison chart, best-practice playbook table, gap-to-north-star matrix.

## Per-Client Adaptation

SkyHarbor should emphasize airline complexity:

- mainframe and IBM Z
- Teradata Vantage on AWS
- AWS data lake and event streams
- SAS, DataStage, Informatica, Tableau, BusinessObjects
- SAP ERP
- Salesforce and Adobe without enterprise CDP
- IROPS, loyalty, customer experience, crew, maintenance, revenue management

First Capital should emphasize regulated financial services:

- core banking, lending, payments, wealth, risk, compliance
- SR 11-7, FINRA, AML, fair lending, restricted data
- AI adoption and value proof pressure
- vendor/contract and technology spend exposure

Meridian should emphasize payer/provider health:

- EMR, claims, pharmacy, call center, provider quality, HEDIS/STAR
- Databricks on AWS target state
- prior auth, coding, utilization management, payment integrity

Lakeshore should emphasize industrial treasury and finance:

- Kyriba rollout
- treasury operations, cash visibility, bank connectivity, ERP integration
- finance close, AP/AR, working capital, commodity and supply-chain exposure

Apex should emphasize retail:

- store operations, merchandising, supply chain, loyalty, pricing, contact center
- SaaS sprawl, cloud/data modernization, demand forecasting, inventory AI

## Implementation Path

1. Build a clean `EnterpriseLandscapeHome` component from the reference design.
2. Add a `getEnterpriseLandscapeViewModel(tenantKey)` adapter.
3. Source the view model from `derived-intelligence/enterprise-reads.json` first.
4. Fall back to DB-derived reads once the new context refresh is committed.
5. Add a source-trail drawer that resolves source IDs to files, rows, pages, sheets, or slides.
6. Wire the ask bar to Sentinel with the selected section as active context.
7. QA five clients: SkyHarbor, First Capital, Meridian, Lakeshore, Apex.

## QA Gates

For each client:

- Home renders without raw data-engine terms.
- Left nav sections match available data.
- Every selected section changes the report canvas.
- Source trail opens and shows human-readable evidence.
- Sentinel answers in the selected section context.
- Empty/thin areas are described honestly.
- Desktop uses full width without clutter.
- Mobile keeps the ask bar, nav, report, and leadership panel readable.
