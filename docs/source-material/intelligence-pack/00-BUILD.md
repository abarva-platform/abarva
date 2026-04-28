# AbarVa Intelligence Layer · Pattern Design Pack · BUILD INDEX

**Version:** 1.0 · April 22, 2026
**Status:** ✅ COMPLETE — all 15 files delivered. Ready for assembly.
**Assembly:** concatenate files in the order below to produce the full Intelligence Layer Pattern Design Pack.

## Assembly order

| # | File | Contents | Status |
|---|---|---|---|
| 0 | `../intelligence-layer-pattern-design-pack.md` | Part 1 Architecture + Part 2.1 Analytics Modernization | ✅ Written |
| 1 | `02-ai-led-pdlc.md` | Part 2.2 AI-Led PDLC (umbrella + 4 children) | ✅ Written |
| 2 | `03-ai-governance-operating-model.md` | Part 2.3 AI Governance Operating Model | ✅ Written |
| 3 | `04-vendor-sprawl-ai-tool-rationalization.md` | Part 2.4 Vendor Sprawl & AI Tool Rationalization | ✅ Written |
| 4 | `05-ai-use-case-portfolio-management.md` | Part 2.5 AI Use Case Portfolio Management | ✅ Written |
| 5 | `06-ambient-clinical-value-chain.md` | Part 3.1a Ambient Intelligence & Clinical Value Chain Automation (healthcare) | ✅ Written |
| 6 | `07-prior-authorization-automation.md` | Part 3.1b Prior Authorization Automation (healthcare) | ✅ Written |
| 7 | `08-owned-brand-margin-recovery.md` | Part 3.2a Owned Brand Margin Recovery (retail) | ✅ Written |
| 8 | `09-demand-forecasting-inventory-ai.md` | Part 3.2b Demand Forecasting & Inventory AI (retail) | ✅ Written |
| 9 | `10-fraud-detection-modernization.md` | Part 3.3a Fraud Detection Modernization (finserv) | ✅ Written |
| 10 | `11-customer-onboarding-kyc-ai.md` | Part 3.3b Customer Onboarding & KYC AI (finserv) | ✅ Written |
| 11 | `12-predictive-maintenance-modernization.md` | Part 3.4a Predictive Maintenance Modernization (energy) | ✅ Written |
| 12 | `13-commodity-trading-ai.md` | Part 3.4b Commodity Trading AI (energy) | ✅ Written |
| 13 | `14-persistence-design.md` | Part 4 Persistence Design (Postgres/Pinecone/AGE+Neo4j, migrations, sync worker) | ✅ Written |
| 14 | `15-operationalization.md` | Part 5 Operationalization (ingestion pipeline, prompt library, runtime contract, quality monitoring) | ✅ Written |
| 15 | `16-delivery-order.md` | Part 6 Delivery Order (demo-critical path, post-demo, seed, Series A, dependencies) | ✅ Written |

## To assemble into single doc

```bash
cd /mnt/user-data/outputs/intelligence-pack

cat ../intelligence-layer-pattern-design-pack.md \
    02-ai-led-pdlc.md \
    03-ai-governance-operating-model.md \
    04-vendor-sprawl-ai-tool-rationalization.md \
    05-ai-use-case-portfolio-management.md \
    06-ambient-clinical-value-chain.md \
    07-prior-authorization-automation.md \
    08-owned-brand-margin-recovery.md \
    09-demand-forecasting-inventory-ai.md \
    10-fraud-detection-modernization.md \
    11-customer-onboarding-kyc-ai.md \
    12-predictive-maintenance-modernization.md \
    13-commodity-trading-ai.md \
    14-persistence-design.md \
    15-operationalization.md \
    16-delivery-order.md \
    > ../intelligence-layer-pattern-design-pack-FULL.md

echo "Full pack assembled: $(wc -l < ../intelligence-layer-pattern-design-pack-FULL.md) lines"
```

## Pattern depth convention

- **Umbrella / foundational patterns** (Analytics Modernization, AI-Led PDLC umbrella, AI Governance, Use Case Portfolio): full 18-section depth (Parts A-R)
- **Child patterns** (the 4 under AI-Led PDLC): Parts A-N at moderate depth (inherit structure from umbrella); Parts O-R complete (each child has its own graph/retrieval/prompting contribution)
- **Vertical patterns** (all 8): full 18-section depth with vertical-specific observations

## Pattern inventory (13 total)

**Universal (5):**
- 2.1 Analytics Modernization ✅
- 2.2 AI-Led PDLC [umbrella] ✅
  - 2.2.1 Specification Debt Multiplication [child] ✅
  - 2.2.2 Velocity Without Validation [child] ✅
  - 2.2.3 Context-as-Code Underinvestment [child] ✅
  - 2.2.4 Senior Bench Decay [child] ✅
- 2.3 AI Governance Operating Model ✅
- 2.4 Vendor Sprawl & AI Tool Rationalization ✅
- 2.5 AI Use Case Portfolio Management ✅

**Vertical (8):**
- **Healthcare:** 3.1a Ambient Clinical Value Chain ✅ · 3.1b Prior Authorization Automation ✅
- **Retail:** 3.2a Owned Brand Margin Recovery ✅ · 3.2b Demand Forecasting & Inventory AI ✅
- **Financial Services:** 3.3a Fraud Detection Modernization ✅ · 3.3b Customer Onboarding & KYC AI ✅
- **Energy:** 3.4a Predictive Maintenance Modernization ✅ · 3.4b Commodity Trading AI ✅

## Companion material (beyond pattern packs)

- **Part 4 · Persistence Design** ✅ — Postgres schema (all `intel_*` tables), Pinecone namespaces + metadata schemas, Apache AGE graph initialization, sync worker architecture, migration scripts, RLS policies, Neo4j migration trigger + path
- **Part 5 · Operationalization** ✅ — Ingestion pipeline (8 stages, markdown-first, idempotent), prompt library organization (detection/injection/diagnostic/rendering), runtime behavior contracts for all 4 agents (Nexus/Sentinel/Atlas/Steward), latency and cost budgets, quality monitoring (precision/recall/calibration/freshness/drift/isolation), content governance, incident response
- **Part 6 · Delivery Order** ✅ — Demo-critical path (4 patterns live for Prat demo, Morrison program as gravity center), post-demo ordering (complete 13-pattern library), seed build-out (50 patterns, cross-client intelligence), Series A predictive intelligence, pattern dependency graph, definition-of-done checklist

## Key decisions preserved across the pack

- **Three-layer anchor:** "Postgres holds the facts. Pinecone holds the meaning. The graph holds the wisdom."
- **v1 graph hosting:** Apache AGE on Postgres; migration to dedicated Neo4j when p99 traversal latency > 500ms or AGE CPU > 60% sustained.
- **Primary embeddings:** Voyage-3-large (1024-dim); OpenAI text-embedding-3-large fallback.
- **Namespace plan:** `global:patterns[:vertical]` + `client:{tenant_id}:*` with strict RLS + metadata enforcement.
- **Morrison as demo gravity center:** inside Apex Retail composite tenant, exercising Owned Brand Margin Recovery + Demand Forecasting + Analytics Modernization + AI Use Case Portfolio end-to-end for the Prat demo.
- **Composite organization labeling:** all tenant examples always described as "composite organization built from real-world data" — never implied to be real clients.
- **Content forbidden references:** never reference CADE, Accenture, Dell, McKinsey, Deloitte, BCG, Bain, Huron, Navigant, Presbyterian, PHS, MD Anderson, CommonSpirit, HP Inc. in AbarVa product/marketing contexts.

## What's next

With this design pack complete, the operating path is:

1. Claude Code and Codex agents pick up the implementation work against Part 4 (persistence migrations, sync worker) and Part 5 (ingestion pipeline, prompt library scaffolding).
2. Demo sprint execution begins on the four-pattern demo-critical path from Part 6.
3. Content authoring continues in parallel — Part 6 specifies post-demo ordering for the remaining 9 patterns.
4. Eval harness scaffolded early so content authoring can ship against measurable quality gates.
