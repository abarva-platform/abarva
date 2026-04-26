# Architecture Page Blueprint
**Route:** /platform/admin/architecture
**Surface:** admin
**Primary user:** Founder / CTO / Enterprise architect / Platform operator
**Primary question:** "How does AbarVa work end to end, and how does it support SaaS plus private data plane?"
**Primary agent:** Atlas
**Supporting agents:** Steward
**Demo data readiness:** rich (ARCH5 manifest — Wave 17)

## Job-to-be-Done
The Architecture page is the end-to-end technical blueprint surface. It gives the founder, CTO, or enterprise architect a clear, honest picture of how AbarVa is built — what is live, what is deferred, and how the system supports both a Vercel SaaS control plane and an Azure private data plane. Built vs deferred must be explicitly stated throughout.

**First 10 seconds:** User sees: (1) the 9 architecture planes overview, (2) what is built vs deferred, (3) the SaaS control plane / private data plane boundary, (4) the Azure reference target, (5) Atlas brief naming the key architectural decision for this tenant.

## Data Contract
**Required:** 9 architecture planes (app/agent/context/knowledge/data/model-gateway/tool/governance/deployment), request-to-context flow, data/evidence flow, model gateway status (deferred), tool registry status (deferred), SaaS control plane + private data plane architecture, Azure reference target, built vs deferred table, next architecture actions.
**Available today:** ARCH5 manifest (Wave 17):
  - App plane: built (Next.js, Vercel, Clerk, 16 routes)
  - Agent plane: contract-only (Nexus/Sentinel/Steward/Atlas contracts landed)
  - Context plane: built (S0-S9 context bundle, CTX2-4)
  - Knowledge plane: built (deterministic seed, evidence ledger contracts)
  - Data plane: built (Supabase Postgres, deterministic seeds, TRUST1-3)
  - Model gateway: deferred (contract only — no live routing)
  - Tool registry: deferred (contract only — no live tool calls)
  - Governance plane: partial (policy contracts landed, enforcement deferred)
  - Deployment plane: partial (Vercel SaaS live, Azure private lab blueprint)
  - SaaS control plane: live (Vercel prod)
  - Private data plane: blueprint only (Azure VNet lab, AZLAB1-5)
  - Azure reference target: documented (Container Apps, PostgreSQL Flexible Server, Key Vault, ACA)
**Missing:** Live model gateway routing, live tool execution, live Azure deployment.
**Evidence basis:** ARCH5 manifest. Wave 17 deterministic.
**Must not claim:** Live model gateway, live tool execution, Azure private lab is live.

## Layout

```
+-----------------------------------------------------------------------+
| AbarVa Nav [Platform Admin] [Architecture]                             |
+-----------------------------------------------------------------------+
| ATLAS BRIEF                                                            |
| "AbarVa uses a 9-plane architecture supporting Vercel SaaS (live) and |
|  Azure private data plane (blueprint). Model gateway and tool registry |
|  are contract-only — live routing is deferred."                        |
| [deterministic caveat — ARCH5 manifest, not live topology]             |
+-----------------------------------------------------------------------+
| 9 PLANES OVERVIEW STRIP                                                |
| [App:built] [Agent:contract] [Context:built] [Knowledge:built]        |
| [Data:built] [ModelGW:deferred] [Tool:deferred] [Gov:partial]         |
| [Deploy:partial]                                                       |
+-----------------------------------------------------------------------+
| ARCHITECTURE SECTION TABS                                              |
| [Overview] [Request Flow] [Data Flow] [SaaS vs Private] [Built vs Deferred] |
+-----------------------------------------------------------------------+
|                                                                        |
| [TAB: Overview — default]                                              |
|  9-plane diagram (text/ASCII representation).                          |
|  Each plane: name, built status, key components.                       |
|  Atlas narrative on architectural intent.                              |
|                                                                        |
| [TAB: Request Flow]                                                    |
|  User request → Next.js → Clerk auth → route handler →                |
|  Context builder (S0-S9) → Agent context → Agent response →           |
|  Component render. Model gateway: deferred (not in live path).         |
|                                                                        |
| [TAB: Data Flow]                                                       |
|  Seed data → Supabase Postgres → Read model / transformers →           |
|  Component view models → Agent context → Agent evidence.               |
|  Evidence ledger: contract-only ingestion. Live ingestion: deferred.  |
|                                                                        |
| [TAB: SaaS vs Private]                                                 |
|  SaaS control plane: Vercel (live). Components: Next.js, Clerk, Supabase.|
|  Private data plane: Azure VNet blueprint (AZLAB1-5).                  |
|  Components: ACA, PostgreSQL Flexible Server, Key Vault, APIM.         |
|  Boundary: control plane lives in Vercel SaaS. Data plane customer-   |
|  owned. Separation contracts: CLOUD1-5, TEN1-3.                       |
|  Azure reference target named.                                         |
|                                                                        |
| [TAB: Built vs Deferred]                                               |
|  Explicit table: every component → Built / Contract-only / Deferred    |
|  No component shown as built unless it is actually built.              |
|  Deferred items: model gateway, tool registry, live connectors,        |
|  governance enforcement, live Azure deployment, DORA pipeline.         |
|                                                                        |
+-----------------------------------------------------------------------+
| NEXT ARCHITECTURE ACTIONS                                              |
| 1. Wire model gateway (contract → live routing)                        |
| 2. Activate first connector integration                                 |
| 3. Deploy Azure private data plane lab (AZLAB1-5)                      |
| 4. Wire live evidence ingestion                                         |
| 5. Activate tool registry with first real tool                         |
+-----------------------------------------------------------------------+
```

## Workflow Sequence
1. User lands on Architecture — reads Atlas brief (9-plane summary, built vs deferred)
2. User scans 9 planes overview strip — identifies built vs deferred at a glance
3. User reads Overview tab — understands full architectural intent
4. User reviews Request Flow tab — follows a user request end to end
5. User reviews Data Flow tab — understands how data becomes agent evidence
6. User reviews SaaS vs Private tab — understands the two-plane deployment model
7. User reviews Built vs Deferred tab — gets the honest status of every component
8. User reads next architecture actions — knows what to build next

**Unlocks next step:** Model gateway live → context/evidence flow is complete.
**Blocks progress:** Model gateway deferred, tool registry deferred, live Azure deployment not yet executed.

## Agent-Centric Requirements
- Atlas brief: Names specific architectural fact — "AbarVa is a 9-plane system. App, context, knowledge, and data planes are built. Model gateway and tool registry are contract-only. Azure private data plane is blueprint."
- Context used: ARCH5 manifest, Wave 17 built status, CLOUD1-5, TEN1-3, AZLAB1-5 contracts.
- Confidence: "ARCH5 manifest — static documentation. Not live topology scan."
- Missing inputs: Live model gateway, live Azure deployment status.
- Recommended next action: "Wire model gateway for live agent routing. Deploy Azure private data plane lab."
- 3 choices + custom: Via Ask Atlas (if present as drawer — not hero). Main page = reference surface.
- Low-context disclosure: "Built vs deferred table is always the source of truth. Deferred items are not live."

## Visual Canon
- Warm off-white (#F8F7F4) base
- Georgia serif for Atlas brief and plane names
- DM Sans for tables, status labels, flow diagrams
- Plane status: green (built), amber (contract/partial), grey (deferred) — explicit and honest
- No teal, no full-page dark mode, no sparkles
- Built vs deferred table: always visible — not hidden or minimized
- Azure target: explicitly named — not generic "cloud provider"
- Above fold: Atlas brief + 9 planes overview strip + tab bar

## Interaction Model
- Tabs: 5 section tabs (Overview / Request Flow / Data Flow / SaaS vs Private / Built vs Deferred)
- Drawers: Component detail drawer (click component → detail with contracts and wave reference)
- Same-canvas updates: Tab switch updates content
- Drilldowns: Deployment plane → /platform/admin/production-readiness; Governance → admin governance tab
- Empty state: Not applicable — ARCH5 manifest always populates
- Blocked/deferred state: Deferred items in Built vs Deferred table show grey/deferred badge

## Acceptance Criteria
- [ ] Built vs deferred is explicit — deferred items must not be shown as built
- [ ] Model gateway shown as deferred (contract-only)
- [ ] Tool registry shown as deferred (contract-only)
- [ ] 9 planes listed with status
- [ ] Azure reference target named (Container Apps / PostgreSQL / Key Vault)
- [ ] SaaS control plane (Vercel, live) vs private data plane (Azure, blueprint) distinction clear
- [ ] Next architecture actions present (minimum 5)
- [ ] Atlas brief names specific architectural facts
- [ ] Deterministic/manifest caveat visible
- [ ] No live Azure deployment claimed

## Route Ownership
- Route file: src/app/(maestro)/platform/admin/architecture/page.tsx (expected)
- Expected shell: AdminCanonShell + AbarVaAppShell
- Expected components: AtlasBrief, ArchitecturePlanesStrip, ArchitectureSectionTabs, ArchitectureOverview, RequestFlowDiagram, DataFlowDiagram, SaaSPrivatePlaneView, BuiltVsDeferredTable, NextActionsPanel
- Legacy risk: Low — ARCH5 (Wave 17) established this page; ARCH4 (Wave 15) added it; verify no TopBar.tsx
