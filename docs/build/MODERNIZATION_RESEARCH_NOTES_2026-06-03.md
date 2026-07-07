# Modernization Pattern Pack Research Notes — Phase 2 spine

## Purpose

This note strengthens the modernization pattern-pack brief before implementation. It separates
source-backed methodology from AbarVa heuristics so the platform can produce a credible CDAO
comparator without pretending to be the SI's final estimate.

The core rule is the same as the rate-card work: every automation assumption, disposition premium,
scorecard standard, and effort band must carry source, as-of, and confidence. Where public evidence
does not support a precise percentage, the engine must show a planning range and the reason for the
range.

## Source Ledger

| Source family                                     | Use in modernization pack                                                       | Evidence captured                                                                                                                                                                                                                                                                                                                                                                                                             | Confidence posture                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Databricks Lakebridge                             | Analyzer-inventory intake, SQL migration phase model, reconciliation vocabulary | Databricks Labs describes Lakebridge as a toolkit spanning survey/assessment, translation, and final data reconciliation for SQL migration. Source: `https://databrickslabs.github.io/lakebridge/docs/overview/`.                                                                                                                                                                                                             | High for capability taxonomy; medium for automation percentages until source-type-specific benchmarks are captured. |
| Lakebridge Analyzer                               | Input schema and complexity signal                                              | Analyzer docs state that the Analyzer scans/interprets metadata from ETL pipelines and SQL assets and feeds metrics into a conversion calculator for licensing and engineering-hour estimates. Source: `https://databrickslabs.github.io/lakebridge/docs/assessment/analyzer/`.                                                                                                                                               | High for intake direction; medium until sample exports are mapped.                                                  |
| Databricks BladeBridge acquisition/community post | Databricks-native migration positioning and supported legacy estate framing     | Databricks describes BladeBridge as AI-powered migration support that provides scope insight, configurable code transpiling, LLM-powered conversion, and validation for legacy warehouse migration. Source: `https://community.databricks.com/t5/announcements/welcoming-bladebridge-to-databricks-accelerating-data-warehouse/td-p/109062`.                                                                                  | Medium/high: official community post, but marketing copy requires conservative translation into planning ranges.    |
| Databricks Well-Architected Lakehouse             | Standards framework and SI scorecard pillars                                    | Official docs say the well-architected lakehouse has seven pillars covering operational excellence, security/privacy/compliance, reliability, performance efficiency, cost optimization, data and AI governance, and interoperability/usability. Source: `https://docs.databricks.com/aws/en/lakehouse-architecture/well-architected`.                                                                                        | High for scorecard structure.                                                                                       |
| Databricks CI/CD / Bundles                        | Operational-excellence control                                                  | Databricks docs describe bundles as a way to define, deploy, and run jobs, pipelines, and MLOps assets using CI/CD practices. Source: `https://docs.databricks.com/en/dev-tools/bundles/ci-cd-bundles.html`.                                                                                                                                                                                                                  | High for CI/CD requirement; cost/effort impact remains AbarVa heuristic.                                            |
| AWS Prescriptive Guidance 7 Rs                    | Disposition taxonomy                                                            | AWS defines the seven migration strategies: retire, retain, rehost, relocate, repurchase, replatform, and refactor/re-architect. Source: `https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html`.                                                                                                                                                                          | High for taxonomy; premium percentages require AbarVa calibration and SI evidence.                                  |
| IBM 7 Rs explanation                              | Plain-English explanation for buyer-facing docs                                 | IBM describes the 7 Rs as strategic approaches to balance speed, cost efficiency, and long-term value. Source: `https://www.ibm.com/think/insights/7-rs-cloud-migration`.                                                                                                                                                                                                                                                     | Medium/high as explanatory source; AWS remains the primary taxonomy anchor.                                         |
| FAR / GSA best-value tradeoff                     | Source RFP scorecard and BAFO evaluation posture                                | FAR Subpart 15.1 explains tradeoff source selection; non-price factors may dominate when risk/development work is higher, and award may go to other than lowest price. GSA source-selection guide similarly frames best-value tradeoff and price premium analysis. Sources: `https://origin-www.acquisition.gov/far/subpart-15.1`, `https://www.gsa.gov/system/files/LDG-Chapter-13_Source_Selection_FINAL_9-27-11_508c.pdf`. | High for procurement logic; use as scorecard discipline, not as federal-only UI language.                           |

## Methodology Decisions

### 1. AbarVa consumes Analyzer output; it does not re-scan code

The implementation should model a Lakebridge/Analyzer-style intake: sources, tables, views, ETL
jobs, SQL scripts/stored procedures, reports, complexity flags, lineage hints, row/volume signals,
conversion status, and reconciliation status. AbarVa estimates and scores from that inventory; it
does not duplicate Databricks conversion tooling.

### 2. Automation leverage is range-based by archetype

Public Databricks materials support the direction that SQL/ETL conversion can be automated, but
they do not justify one universal percentage for every legacy estate. Use ranges:

| Archetype                            | Initial automation posture         | Human residual drivers                                                             |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Source to landing                    | Medium/high after framework exists | CDC semantics, PHI/PII quarantine, source auth, reconciliation.                    |
| DataStage ETL                        | Medium/high                        | Custom routines, stage patterns, orchestration side effects, data-quality parity.  |
| Stored procedures / SQL Server logic | Medium                             | Cursors, temp tables, procedural branching, performance rewrite, semantic testing. |
| SQL Server marts                     | Medium/high                        | Conformed-dimension compatibility, downstream dependencies, cutover sequencing.    |
| SAS workloads                        | Low/medium                         | Macro density, PROC/statistical semantics, governed validation, user acceptance.   |
| Tableau / BusinessObjects            | Medium                             | Embedded SQL, calc logic, usage-based retirement, semantic layer drift.            |

Implementation consequence: the estimator should never show "80% automated" as a universal fact.
It should show `automation_range_low/mid/high`, evidence source, and manual-residual rationale.

### 3. Disposition is an effort multiplier, not a label

The 7 Rs drive effort:

| Disposition             | Planning treatment                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Retire                  | Near-zero migration effort; include discovery, stakeholder confirmation, and decommission audit.            |
| Retain                  | Keep as source of record; include integration and governance, not platform rebuild.                         |
| Rehost / relocate       | Lowest transformation premium; still needs testing and cutover controls.                                    |
| Replatform              | Moderate premium; retain business logic while moving runtime/platform.                                      |
| Re-architect / refactor | Highest premium; use for stored-proc rationalization, SAS rewrite, and target-state medallion design.       |
| Repurchase              | Treat as product/vendor transition; not a Databricks conversion workload unless data migration is in scope. |

Implementation consequence: disposition belongs on every workload row and must be mutable in the
what-if model. SI bids that choose a cheaper disposition than AbarVa's house view should appear in
the divergence report, not be silently averaged.

### 4. Scorecard is best-value, not lowest-price

The Source RFP evaluation lens should use price as one dimension, not the decision. FAR/GSA best-
value guidance is a useful neutral anchor because modernization work has high performance risk and
ill-defined residuals. The scorecard should therefore keep these dimensions explicit:

| Dimension                      | Default posture                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Architecture fit               | Highest weight; aligns to Databricks seven pillars and AbarVa reference principles.    |
| Automation and method          | Scores Lakebridge/BladeBridge use, source-type specificity, and manual residual plan.  |
| Normalized TCO                 | Uses rate-card kernel and common-scope normalization. Lowest price alone does not win. |
| Delivery risk and track record | Healthcare/Epic, retail, or airline evidence depending on profile.                     |
| Team and sourcing model        | Onshore/offshore mix, role transparency, named leads, rate-card consistency.           |
| Governance and security        | Unity Catalog, PHI/PCI/FAA-IATA posture, data quality, audit, lineage.                 |
| Timeline and phasing           | Foundation-first, migration/greenfield sequencing, cutover/reconciliation.             |
| Value and AI enablement        | Link to the industry AI use-case genome and measurable value streams.                  |

## Industry Profile Calibration

### Healthcare / Epic

- Treat Epic Clarity as authoritative clinical source unless the client explicitly says otherwise.
- Keep PHI handling, private connectivity, audit, lineage, and reconciliation as foundation lines.
- SAS and stored-procedure workloads should default to re-architect/refactor unless Analyzer evidence
  shows a safe replatform path.
- Greenfield stream should connect to clinical operations, revenue-cycle, quality, workforce, and
  access/capacity use cases.

### Retail

- POS, ERP, CDP, loyalty, ecommerce, store ops, and supply-chain feeds should be modeled as source
  families with different latency and quality expectations.
- PCI/CCPA and customer-identity governance belong in the foundation, not as optional SI add-ons.
- BI/report repointing should be usage-rationalized first; dead dashboards are retire candidates.

### Airline

- PSS, revenue management, loyalty, crew, maintenance, airport ops, and irregular-operations sources
  require clear system-of-record boundaries.
- Operational reliability, near-real-time ingestion, and regulatory/security controls should weigh
  more heavily than generic BI modernization.
- Reconciliation must call out flight/booking/revenue integrity because failure modes are more visible
  and operationally expensive than generic reporting gaps.

## Heuristic Calibration Table

These are initial build ranges for unit tests and seed examples. They are deliberately broad until
Lakebridge sample inventory and SI-response examples are added.

| Workload archetype           | Complexity S person-weeks | Complexity M person-weeks | Complexity L person-weeks | Automation range       | Confidence |
| ---------------------------- | ------------------------: | ------------------------: | ------------------------: | ---------------------- | ---------- |
| Source to landing onboarding |                       2-4 |                       4-8 |                      8-14 | 35-70% after framework | Medium     |
| DataStage ETL job family     |                       3-6 |                      6-12 |                     12-24 | 40-75%                 | Medium     |
| SQL stored procedure family  |                       2-5 |                      5-12 |                     12-28 | 25-60%                 | Medium     |
| SQL mart repoint/rebuild     |                       2-4 |                       4-9 |                      9-18 | 40-70%                 | Medium     |
| SAS program family           |                       4-8 |                      8-18 |                     18-40 | 15-45%                 | Low/medium |
| Tableau/BO report family     |                       1-3 |                       3-7 |                      7-14 | 30-65%                 | Medium     |

## Build Implications

1. Add a modernization source ledger next to the rate-card source ledger before seeding archetype
   coefficients.
2. Store every effort coefficient with `source_id`, `source_as_of`, `confidence`, and
   `rationale`.
3. Treat Lakebridge inventory as tenant data. Shared archetype defaults are fallbacks only.
4. Show planning ranges (`low/mid/high`) and confidence in the UI/API. Do not render a single exact
   cost without its range and assumptions.
5. RFP divergence should compare each SI response against the AbarVa baseline by scope, disposition,
   automation leverage, sourcing mix, and Databricks pillar adherence.

## Open Research Items

- Capture source-type-specific Lakebridge/BladeBridge automation benchmarks beyond product-level
  capability descriptions.
- Add second-source vendor/SI offshore and hybrid delivery rate evidence.
- Obtain or synthesize a Lakebridge-style sample inventory for healthcare, retail, and airline test
  tenants without using client confidential data.
- Confirm Databricks-on-Azure vs Databricks-on-AWS for the PHS anchor. The architecture and native
  service mapping change materially.
