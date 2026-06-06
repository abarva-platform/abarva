# AbarVa Pattern Packs — The Move Artifact Bible

**Created:** 2026-06-06
**Purpose:** The reference layer that makes Move artifacts excellent. Not templates — a **discipline + a reference menu**. Patterns are the citable unit of provenance: every claim in a Move artifact should trace to a pattern ID here, plus a benchmark, plus a human input.

---

## Why this exists

Each AI use case is different — population-health risk stratification shares almost nothing at the solution level with Kyriba treasury forecasting. So we cannot mandate one standard artifact template. What we *can* mandate is:

1. **A required scaffold per artifact category** (the questions every architecture artifact must answer, regardless of domain)
2. **A reference menu per solution category** (the named, vetted options — with an own-vs-rent classification on each)
3. **A provenance discipline** (every claim cites a pattern + benchmark + human input)

The pattern packs are that scaffold + menu + provenance source. They are domain-general reference material — reusable across PHS, Lakeshore, and every future client.

---

## The first principle — OWN-IT, never RENT

```
BUILD-YOU-OWN  ◄─────────────────────────────────►  BUY-OUTSOURCED
(open frameworks, accelerators                       (closed SaaS platform;
 deployed into the client estate;                     vendor holds the data,
 IP transfers to the client)                          models, and IP)
        ▲                                                    ▲
   QUALIFIES for an                              DISQUALIFIED by default for an
   "architect a platform                        "architect a platform the client
   the client owns" mandate                     owns" mandate — flag explicitly,
                                                 require surfaced rationale
```

**The test for any solution recommendation:** *After this is built, who owns the data products, the models, and the IP — the client, or the vendor?* If the answer isn't the client, it is disqualified for an own-it mandate unless an explicit, surfaced rationale exists.

Every pattern in every pack carries an **Own-it vs rent** field. A recommendation on the rent side without surfaced justification is an anti-pattern.

Worked example of the distinction (verified 2026-06-06):
- **Own-it:** DLT-META (`databrickslabs/dlt-meta`, Apache-licensed) deploys metadata-driven Lakeflow Declarative Pipelines into the client's own workspace; metadata lives in the client's Unity Catalog. Client owns the pipelines and data.
- **Rent:** Innovaccer / Health Catalyst / Arcadia ingest the client's data onto the *vendor's* cloud, run the *vendor's* models, hand back dashboards. If you adopt one, you don't need a lakehouse — the intelligence layer lives on the vendor's side. Disqualified for an own-it mandate.

---

## The taxonomy

### Cross-cutting packs (horizontal · reusable across all domains)

| # | Pack | File |
|---|---|---|
| 01 | Architecture & Platform | `cross-cutting/01-architecture-platform.md` |
| 02 | Ingestion & Data Integration | `cross-cutting/02-ingestion-data-integration.md` |
| 03 | Data Modeling & Products | `cross-cutting/03-data-modeling-products.md` |
| 04 | MLOps & AI Engineering | `cross-cutting/04-mlops-ai-engineering.md` |
| 05 | Governance, Security & Compliance | `cross-cutting/05-governance-security-compliance.md` |
| 06 | FinOps & Value Engineering | `cross-cutting/06-finops-value-engineering.md` |
| 07 | Responsible AI & Clinical Ops | `cross-cutting/07-responsible-ai-clinical-ops.md` |
| 08 | Source / SI Databricks Implementation | `cross-cutting/08-source-si-databricks-implementation.md` |

### Domain packs (vertical · solution patterns)

| # | Pack | File |
|---|---|---|
| 01 | Population Health | `domains/01-population-health.md` |
| 02 | Clinical Performance | `domains/02-clinical-performance.md` |
| 03 | Payer / Health Plan | `domains/03-payer-health-plan.md` |
| 04 | Finance / Treasury | `domains/04-finance-treasury.md` |
| 05 | Cost Reduction / Vendor | `domains/05-cost-reduction-vendor.md` |

### The Move Artifact Contract

The common "what good looks like" bar every Move artifact must satisfy (not a rigid template): `MOVE_ARTIFACT_CONTRACT.md`. It defines the universal artifact dimensions (evidence · assumptions · options · architecture · economics · governance · roadmap · sourcing), the per-phase contract, the provenance contract, and how the kernel enforces it.

---

## The pattern schema

Every pattern in every pack follows this exact shape so patterns are queryable, citable, and composable:

```
### PATTERN [PACK-CODE]-[NN] · [Name]

**Intent** — one line: the problem this pattern solves.

**Applies to** — which domains / use cases / Move lifecycle phases.

**Solution shape** — the reference approach, named and specific. Real
technologies, real standards, real sequence. Not "a framework" — the
named framework. Not "a model" — the named modeling approach.

**Own-it vs rent** — classification (OWN / MANAGED-OWN-DESTINATION / RENT)
plus the named technology options with their ownership posture. State who
owns the data, models, and IP after the build.

**Where it sits** — medallion layer (Bronze/Silver/Gold) and/or lifecycle
phase (Discovery/Strategy/Architecture/Business Case/Mobilization) and/or
architecture tier (landing zone / data plane / serving / governance).

**Evidence anchors** — benchmark ranges, citations (URL or corpus ref),
reference engagements ("what best-in-class produced here"). Every
quantitative claim gets a source or is flagged as an estimate to confirm.

**Anti-patterns** — the named trap(s). What teams get wrong here, and why.

**Feeds artifacts** — which Move artifacts this pattern grounds (e.g.,
"Architecture target state; Business case investment line; Mobilization
foundation milestone").

**Maturity** — production-ready / emerging / reference-only.
```

### Pack codes (for pattern IDs)

| Pack | Code |
|---|---|
| Architecture & Platform | `ARCH` |
| Ingestion & Data Integration | `INGEST` |
| Data Modeling & Products | `MODEL` |
| MLOps & AI Engineering | `MLOPS` |
| Governance, Security & Compliance | `GOV` |
| FinOps & Value Engineering | `FINOPS` |
| Responsible AI & Clinical Ops | `RAI` |
| Source / SI Databricks Implementation | `SISRC` |
| Population Health | `POPH` |
| Clinical Performance | `CLIN` |
| Payer / Health Plan | `PAYER` |
| Finance / Treasury | `TREAS` |
| Cost Reduction / Vendor | `COST` |

So a pattern is cited as e.g. `INGEST-03` (metadata-driven ingestion framework) or `POPH-05` (rising-risk stratification).

---

## How patterns feed Move artifacts (the composition model)

An excellent Move artifact composes horizontal + vertical patterns. Example — a PHS "Population Health Risk Stratification" use case:

```
DOMAIN pattern:      POPH-04 (HCC-based risk stratification)
                     POPH-07 (rising-risk identification)
   ×
CROSS-CUTTING:       ARCH-01 (AWS landing zone)
                     INGEST-03 (metadata-driven ingestion framework)
                     INGEST-06 (Epic Clarity/Caboodle source config)
                     MODEL-02 (OMOP CDM on lakehouse)
                     MODEL-05 (patient identity / MPI, own-it)
                     MLOPS-03 (model serving + monitoring)
                     GOV-02 (HITRUST control mapping)
                     FINOPS-01 (rate-card-driven effort model)
```

The artifact *selects and defends* a composition. Each selected pattern's ID becomes a provenance citation. The business case's value math is assembled from the domain patterns' Evidence anchors. The architecture's own-it posture is guaranteed by each pattern's Own-it field.

---

## Provenance / citation rules

1. **Every Move artifact claim cites a pattern ID** (or a loaded record, or a confirmed human input). No free-floating assertions.
2. **Every quantitative claim cites a benchmark source** or is explicitly flagged "estimate — confirm with client data."
3. **Every solution choice states its own-it posture.** Rent-side choices require surfaced rationale.
4. **Anti-patterns are cited too** — when an artifact rejects an option, it cites the pattern's anti-pattern field as the reason.

---

## Status

| Pack | State | Patterns |
|---|---|---|
| README + schema | ✓ Complete | — |
| 01 Architecture & Platform | ✓ Complete | 20 (`ARCH-01`…`ARCH-20`) |
| 02 Ingestion & Data Integration | ✓ Complete | 18 (`INGEST-01`…`INGEST-18`) |
| 03 Data Modeling & Products | ✓ Complete | 17 (`MODEL-01`…`MODEL-17`) |
| 04 MLOps & AI Engineering | ✓ Complete | 20 (`MLOPS-01`…`MLOPS-20`) |
| 05 Governance, Security & Compliance | ✓ Complete | 18 (`GOV-01`…`GOV-18`) |
| 06 FinOps & Value Engineering | ✓ Complete | 16 (`FINOPS-01`…`FINOPS-16`) |
| 07 Responsible AI & Clinical Ops | ✓ Complete | 17 (`RAI-01`…`RAI-17`) |
| 08 Source / SI Databricks Implementation | ✓ Complete | 16 (`SISRC-01`…`SISRC-16`) |
| Population Health | ✓ Complete | 19 (`POPH-01`…`POPH-19`) |
| Clinical Performance | ✓ Complete | 18 (`CLIN-01`…`CLIN-18`) |
| Payer / Health Plan | ✓ Complete | 19 (`PAYER-01`…`PAYER-19`) |
| Finance / Treasury | ✓ Complete | 19 (`TREAS-01`…`TREAS-19`) |
| Cost Reduction / Vendor | ✓ Complete | 18 (`COST-01`…`COST-18`) |
| Move Artifact Contract | ✓ Complete | — (the cross-artifact bar) |

**Total: 235 patterns across 13 packs + the Move Artifact Contract (~8,600 lines).** All patterns follow the locked schema and are cited as `[CODE]-[NN]`.

Healthcare domains (Population Health · Clinical Performance · Payer) are encoded into the typed expert-kernel function packs and proven grounded by the corpus grounding battery (140/140). Finance/Treasury and Cost-Reduction/Vendor (Lakeshore) are authored here and ready for the same kernel encoding.
