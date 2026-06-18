# Data-Platform Modernization Pattern Pack — Spec v2 (2026-06-03)

Corpus pattern pack that lets AbarVa give a CDAO, modernizing a legacy analytics estate to the
Databricks Lakehouse, the **rules of the game** for an SI selection: a principled reference
architecture, a **standards framework the SIs must adhere to**, an **independent baseline estimate**
(the comparator), and a **weighted evaluation scorecard** to score and pick the right bidder.
Calibrated to Databricks' own published methodology so it is credible to the CDAO *and* the bidders.

Anchor client: **PHS** (DB2 landing from Epic + DataStage + SQL Server stored procs/marts + Tableau
+ BusinessObjects + SAS → Azure Data Lake + Databricks medallion). Reusable for any legacy-EDW →
Lakehouse modernization.

---

## 0. Positioning — AbarVa sets the rules and scores; the SIs own the solution

The CDAO hands the **workload inventory + foundation needs** to 3 SIs (Deloitte/Accenture/PwC-class).
**The SIs propose the solution, approach, and effort estimate — that is their job, not AbarVa's.**
AbarVa's job is to make the CDAO the smartest buyer in the room. It produces four things — each a
*comparator / guardrail*, never the deliverable the SI must copy:

1. **Reference architecture + approach** — a principled target (medallion, Unity Catalog, metadata-
   driven ingestion) the SIs design *against*, not a prescriptive build.
2. **Standards & principles framework** — the non-negotiables the SIs must adhere to and respond to
   (the Databricks Well-Architected pillars + disposition policy; §3).
3. **Independent baseline estimate** — AbarVa's house number, so the CDAO can sanity-check and
   normalize every SI bid (§4).
4. **Weighted evaluation scorecard** — the instrument to score and pick (§5).

This de-risks AbarVa's position: the baseline is explicitly the *yardstick*, so we are never "wrong
vs the winning SI" — we are the lens that judged them. AbarVa **never re-scans or converts code**:
Databricks already ships that (BladeBridge/Lakebridge Analyzer auto-inventories every object with
complexity; the Converter automates up to ~80% of SQL/ETL conversion across DataStage, Informatica,
SAS, Teradata, SQL Server, Synapse, Oracle → Databricks SQL/PySpark/DLT). AbarVa **consumes that
Analyzer inventory as an input** and adds the decision/value/cost/evaluation layer on top.

> Honesty rule: where the client has run Lakebridge/Analyzer, AbarVa ingests the real inventory.
> Where not, it estimates from the archetype heuristics and labels it a planning range. Never a
> fabricated precise number.

---

## 1. Legacy estate taxonomy (workload archetypes + disposition)

Each workload gets an archetype **and a disposition (7 R's)** — the disposition is the single biggest
driver of effort and of SI estimate divergence (re-platform/re-architect runs +20–50% over lift-
shift). Each archetype carries target medallion mapping, conversion approach, automation leverage
(calibrated to BladeBridge/Lakebridge), complexity drivers, and an effort heuristic (tuned in the
research pass).

| # | Legacy archetype | Default disposition | Target (medallion) | Automation leverage | Complexity drivers |
|---|---|---|---|---|---|
| A | **Source → landing** (Epic, others → DB2) | Re-architect | Bronze (Auto Loader + CDC/CDF) | High once framework exists | # sources, change-data semantics, PHI scope |
| B | **DataStage ETL jobs** | Replatform → re-architect | Bronze→Silver (DLT/PySpark) | High (BladeBridge ETL refactor) | # jobs, transform density, custom routines |
| C | **Stored procs / SQL Server logic** | Rationalize (not lift-shift) | Silver/Gold (Spark SQL / PySpark) | Medium (variable) | # procs, SQL LOC, logic density, cursors/temp tables |
| D | **SQL Server marts** | Replatform (repoint) | Gold tables | Medium | # marts, # downstream hooks, conformed-dim complexity |
| E | **SAS workloads** | Re-architect (hardest) | Silver/Gold (PySpark) | Medium-low | # programs, PROC/statistical complexity, macro density |
| F | **Tableau / BusinessObjects** | Replatform (repoint) | Repoint to Gold (Power BI/Tableau) | Medium | # workbooks, calc complexity, embedded SQL, # consumers |

The **7 R's** taxonomy (rehost, replatform, re-architect/refactor, repurchase, retire, retain,
relocate) is applied per workload — including **retire** (dead reports/marts nobody uses — pure
savings) and **retain** (keep Clarity as the authoritative clinical source; §6).

---

## 2. Two streams + fixed/variable decomposition

- **Migration (like-for-like / repoint):** rebuild marts (D) + repoint Tableau/BO (F) + remediate
  downstream hooks. Mandatory "keep the business running"; low AI value, high political necessity.
- **Greenfield (new AI use cases on bronze):** from the Intelligence-generated healthcare use-case
  portfolio. Where the value + AI story live.

Decompose the estimate so it survives SI scrutiny:
- **Platform foundation (one-time, ~fixed):** environments (dev/preprod/prod), networking/security/
  connectivity, landing zone, Unity Catalog governance + security, CI/CD (Asset Bundles).
- **Metadata-driven ingestion framework:** `framework(fixed) + Σ per_source_onboarding` (Epic built
  once, amortized) — the biggest defensibility lever vs per-table guessing.
- **Per-workload variable:** archetypes B–F scored individually.

---

## 3. Standards & principles framework (what the SIs must adhere to)

Anchored on the **Databricks Well-Architected Lakehouse Framework — 7 pillars** (Databricks' own, so
unarguable). The CDAO mandates SIs design against these and respond pillar-by-pillar:

| Pillar | Non-negotiable the SI must commit to |
|---|---|
| **Data & AI Governance** | Unity Catalog from day 1; lineage, access control, PHI handling, audit. |
| **Interoperability & Usability** | Medallion (Bronze/Silver/Gold); open formats (Delta); consistent across personas. |
| **Operational Excellence** | CI/CD via Asset Bundles; DLT/observability; environment promotion. |
| **Security** | HIPAA/HITRUST controls; encryption; private connectivity; least privilege. |
| **Reliability** | Recovery, data quality gates, reconciliation vs source. |
| **Performance Efficiency** | Photon; right-sized clusters; medallion incremental processing. |
| **Cost Optimization** | TCO model; serverless/auto-scaling; no always-on waste. |

Plus AbarVa disposition policy (where AbarVa holds a principled line): **metadata-driven ingestion
mandatory; stored procs rationalized not lift-shifted; automation leverage expected (cite Lakebridge
~80% for SQL/ETL); fixed-foundation separable from per-workload; retire dead workloads before
migrating them.** SIs may diverge — but they must *justify* divergence against these, which is the
scoring signal.

---

## 4. Independent baseline estimate (the comparator)

1. Ingest (or build) the workload inventory; score each by archetype × disposition × complexity.
2. Apply automation leverage → net **human** effort after Lakebridge/BladeBridge automation.
3. Convert to person-weeks per archetype band → apply the **rate-card kernel**
   (`MOVES_RATE_CARD_INGESTION_SPEC`): loaded rate × **sourcing mode** (in-house / SI onshore /
   offshore / hybrid) → cost bands (low/mid/high), 3-yr TCO, migration vs greenfield split.
4. Output = AbarVa's house baseline, labelled "planning range / comparator, not a quote."

---

## 5. Weighted evaluation scorecard (the instrument to score + pick)

Multi-dimensional weighted scorecard (lowest-cost never wins). Default weights (CDAO-tunable); each
SI maps its response to these so bids compare fast:

| Dimension | Default weight | What it scores |
|---|---|---|
| Technical approach & architecture fit | 25% | Adherence to the 7 pillars + reference architecture; disposition choices justified. |
| Automation leverage & method | 10% | Use of Lakebridge/BladeBridge; realistic % automated vs manual. |
| Total cost / 3-yr TCO | 20% | Normalized to common scope (reuse `pricing-normalization-model`); vs the baseline. |
| Delivery risk & track record | 15% | Healthcare/Epic + Databricks Brickbuilder credentials; references. |
| Team & sourcing model | 10% | Onshore/offshore mix; named leads; rate transparency. |
| Governance & security | 10% | HIPAA/HITRUST; Unity Catalog maturity; data-quality approach. |
| Timeline & phasing | 5% | Foundation-first; migration vs greenfield sequencing. |
| Value / AI enablement | 5% | How the platform unlocks the greenfield AI portfolio. |

Plus a **divergence report**: where each SI's solution/estimate diverges from the baseline + the 7
pillars, and the BAFO questions to ask (reuse `S5_bafo` walkaway/anti-pattern discipline). The CDAO
walks into the C-suite with a number and into the RFP with a scorecard — that is the wedge.

---

## 6. Healthcare / Epic specifics

- **Keep Clarity as the authoritative clinical source** (disposition: retain); the lakehouse handles
  scale, advanced analytics, cross-system integration. **Caboodle** → operational reporting/
  dashboards; **FHIR** → real-time + AI readiness.
- Epic → bronze ingestion pattern (Clarity/Caboodle extract — e.g., managed connectors; CDC).
  PHI handling + quarantine on restricted data per the existing upload guard.
- **HIPAA + HITRUST** controls on connectivity (private, encrypted). Data-governance program is
  itself a **3–6 month** effort — call it out as a foundation line, not an afterthought.
- Map the healthcare AI use-case genome (clinical ops, workforce, RCM…) to the greenfield stream so
  the use-case portfolio is value-ranked and grounded.

---

## 7. Corpus integration + wiring

- Author as a **pattern pack** in the corpus (alongside the sourcing/outsourcing packs), per-tenant
  loadable through Data Loads.
- Wire archetype + disposition heuristics into the **Moves estimator** (effort → rate-card →
  baseline), the **standards framework** + **scorecard** into the **Source RFP-evaluation**
  (normalize + score SI bids). Broker boundary respected.
- Provenance: cite Databricks' Well-Architected + Lakebridge + SAS-migration + Brickbuilder for
  every heuristic and standard; tag automation rates with source + as-of; calibrate, don't invent.

---

## 8. Calibration sources (verified 2026-06-03; Codex to confirm currency)

- Databricks — *Welcoming BladeBridge … Accelerating Data Warehouse Migrations to Lakehouse*; and
  *Introducing Lakebridge: Free, Open Data Migration to Databricks SQL* (Analyzer + ~80% automation).
- Databricks — *Introducing the Well-Architected Data Lakehouse* (7 pillars) + the Well-Architected
  framework docs (AWS/Azure).
- Databricks — *Four Steps to Migrate a SAS Data Warehouse to the Lakehouse*; *Brickbuilder
  Migration Solutions* (SI-delivered).
- IBM / AWS — the **7 R's** of cloud migration (disposition taxonomy); re-platform/re-architect
  effort premium (+20–50% over lift-shift).
- Epic on lakehouse — Clarity authoritative + Caboodle reporting + FHIR for AI; HIPAA/HITRUST;
  governance 3–6 months (Fivetran/Databricks Epic integration references).
- RFP evaluation — weighted multi-dimensional scorecard (fit / security / approach / experience /
  risk / TCO), lowest-cost-rarely-wins.
