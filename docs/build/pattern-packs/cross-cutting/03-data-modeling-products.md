# Pattern Pack 03 · Data Modeling & Products

**Pack code:** `MODEL`
**Layer:** Cross-cutting (horizontal · reusable across all domains)
**Covers:** How raw ingested data becomes governed, reusable **data products** on the lakehouse — the Silver/Gold modeling layer that sits between ingestion (`INGEST`) and AI/analytics (`MLOPS`, domain packs).

---

## What this pack is for

Ingestion lands raw, fidelity-preserving copies of source systems (see `INGEST`). This pack governs everything that happens *after* the raw landing: conforming, integrating, resolving identity, dimensionalizing, certifying, and publishing data so that downstream Moves — risk stratification, measure marts, financial models — compose from **trusted, owned, reusable products** rather than from one-off SQL against raw tables.

The through-line is the README's first principle: **OWN-IT, never RENT.** The modeling layer is exactly where lock-in is created or avoided. Modeling to **open standards** (OMOP, FHIR R4, US Core) and resolving identity with **open-source engines** (Zingg, Splink) keeps the data products, the models, and the matching logic in the client's estate. Modeling directly to a vendor's proprietary schema, or renting a SaaS MPI, surrenders that IP. Every pattern below carries the own-it posture explicitly.

**Composition note:** patterns here are cited by ID (e.g. `MODEL-05`) inside Move artifacts, and combine with domain patterns (`POPH`, `CLIN`, `PAYER`) and other cross-cutting packs. See README composition model.

---

## Pattern index

| ID | Name | Maturity |
|---|---|---|
| MODEL-01 | Medallion architecture (Bronze/Silver/Gold) | production-ready |
| MODEL-02 | Common Data Model selection — OMOP vs FHIR-native vs both | production-ready |
| MODEL-03 | OMOP CDM on the lakehouse | production-ready |
| MODEL-04 | FHIR-native Delta schema via dbignite | emerging |
| MODEL-05 | Patient identity / Master Patient Index — own-it (Zingg / Splink) | production-ready |
| MODEL-06 | Entity resolution / record linkage — deterministic vs probabilistic vs ML | production-ready |
| MODEL-07 | Reference & master data management on the lakehouse | production-ready |
| MODEL-08 | Dimensional modeling in Gold (star schema, SCD, fact/dim) | production-ready |
| MODEL-09 | Data Vault 2.0 on the lakehouse | production-ready |
| MODEL-10 | Longitudinal patient record / clinical event timeline | emerging |
| MODEL-11 | Measure marts (HEDIS / Stars / quality) — the modeling pattern | production-ready |
| MODEL-12 | Semantic / metrics layer (Unity Catalog metric views, dbt semantic layer) | emerging |
| MODEL-13 | Data product thinking / data mesh on the lakehouse | production-ready |
| MODEL-14 | Schema evolution & data contracts | production-ready |
| MODEL-15 | Feature store / feature engineering tables (UC Feature Engineering) | production-ready |
| MODEL-16 | Lineage & cataloging (Unity Catalog lineage, OpenLineage, tags) | production-ready |
| MODEL-17 | Reusable transformation patterns — dbt vs DLT/Lakeflow | production-ready |

---

### PATTERN MODEL-01 · Medallion architecture (Bronze / Silver / Gold)

**Intent** — Impose a canonical, auditable progression from raw to refined so data quality is a layer property, not a per-query accident.

**Applies to** — Every domain; the spine that all other `MODEL` patterns sit inside. Architecture and Mobilization phases.

**Solution shape** — Three Delta Lake layers in the client's lakehouse:
- **Bronze** — raw, append-only, fidelity-preserving landing of each source (Epic Clarity/Caboodle tables, FHIR bundles, claims files, flat extracts). Schema mirrors the source. Add ingest metadata columns (`_ingest_ts`, `_source_file`, `_batch_id`). Never overwrite; this is the replay/audit floor.
- **Silver** — cleansed, conformed, deduplicated, type-cast, identity-resolved. This is where `MODEL-05`/`MODEL-06` (MPI/ER) and the chosen CDM (`MODEL-03`/`MODEL-04`) live. Tables are conformed to standards, not to source quirks. Validated against data-quality expectations.
- **Gold** — business-level aggregates and serving models: dimensional marts (`MODEL-08`), measure marts (`MODEL-11`), feature tables (`MODEL-15`), certified semantic measures (`MODEL-12`). Consumption-optimized; this is what dashboards, BI, and ML read.

Each table is a Delta table registered in Unity Catalog with a `medallion_layer` tag. Promotion between layers is via declarative pipelines (`MODEL-17`).

**Own-it vs rent** — **OWN.** Delta Lake is open (Linux Foundation), the layering is an architectural convention, and every table lives in the client's Unity Catalog. No vendor holds the refined data. This is the structural opposite of renting Innovaccer/Health Catalyst/Arcadia, where refinement happens on the vendor's side and you get back dashboards only (README, own-it example).

**Where it sits** — Spans Bronze → Silver → Gold; data plane. Lifecycle: Architecture (target-state layering), Mobilization (foundation milestone).

**Evidence anchors** — Medallion is Databricks' canonical reference architecture (https://www.databricks.com/glossary/medallion-architecture). Delta Lake protocol is open-source (https://github.com/delta-io/delta). Layer counts/latency are design choices, not benchmarks — *estimate; confirm with client data*.

**Anti-patterns** — (1) "Copy raw Clarity tables into Gold and call them data products" — skipping the conform/integrate work; Gold then inherits every source quirk and is not reusable. (2) Mutating Bronze (losing the replay floor). (3) Putting business logic in Bronze. (4) Treating medallion as folder names without Unity Catalog governance or DQ gates.

**Feeds artifacts** — Architecture target-state diagram; Mobilization foundation milestone; data-quality plan.

**Maturity** — production-ready.

---

### PATTERN MODEL-02 · Common Data Model selection — OMOP vs FHIR-native vs both

**Intent** — Choose the conformed clinical data model *deliberately*, matched to the analytic purpose, rather than defaulting to source schema or a vendor model.

**Applies to** — All healthcare domains (`POPH`, `CLIN`, `PAYER`). Strategy and Architecture phases. The decision this pattern records is one of the highest-leverage architecture choices in a healthcare Move.

**Solution shape** — A decision matrix between two open standards (and the both-paths option):

| Dimension | **OMOP CDM (OHDSI)** | **FHIR-native Delta (via dbignite, MODEL-04)** |
|---|---|---|
| Primary purpose | Population analytics, research, cohort definition, observational studies | Clinical interoperability, real-time/near-real-time exchange, app integration |
| Shape | Standardized **relational** tables (person, observation_period, condition_occurrence, drug_exposure, visit_occurrence, measurement…) | **Resource-oriented** (Patient, Encounter, Observation, Condition…) flattened to Delta |
| Vocabularies | Standardized concepts via OMOP Standardized Vocabularies (SNOMED, RxNorm, LOINC mapped to OMOP concept_ids) | FHIR + terminology bindings; US Core profiles for US data |
| Best for | HCC risk, rising-risk cohorts, quality measures at population scale, OHDSI analytics tools (ATLAS, HADES) | Care-gap apps, SMART-on-FHIR, payer-provider exchange, real-time clinical events |
| Tooling ecosystem | OHDSI open-source stack (ATLAS, Achilles, HADES) | FHIR servers, dbignite, US Core validators |

**Decision rule:** OMOP for population analytics / research / cohorts; FHIR for clinical interoperability / real-time exchange. **Both** is a legitimate and common answer at enterprise scale: land FHIR-native in Silver for interoperability and event timelines (`MODEL-10`), then transform a conformed slice into OMOP for population analytics. They are not mutually exclusive — OMOP can be populated *from* FHIR. Record the chosen path and the rationale as a Move architecture decision.

**Own-it vs rent** — **OWN (both options).** OMOP CDM and FHIR R4 are both open, royalty-free standards; modeling to either keeps the IP in the client estate and avoids the proprietary-schema lock-in anti-pattern. Choosing either is squarely own-it. The rent alternative — modeling to a vendor's proprietary analytics schema — is the disqualified path.

**Where it sits** — Silver (the conformed model lives here); decided in Strategy/Architecture.

**Evidence anchors** — OMOP CDM spec: OHDSI (https://ohdsi.github.io/CommonDataModel/). HL7 FHIR R4: https://hl7.org/fhir/R4/. US Core profiles: https://hl7.org/fhir/us/core/. dbignite: https://github.com/databrickslabs/dbignite. The OMOP-vs-FHIR purpose split is the standard framing in the OHDSI and HL7 communities — *qualitative, not a benchmark*.

**Anti-patterns** — (1) Modeling directly to a vendor's proprietary schema, creating lock-in (README disqualified path). (2) Defaulting to OMOP for a real-time interoperability use case (wrong shape — research model for a streaming problem). (3) Defaulting to FHIR-flattened tables for population cohort analytics (resource sprawl, no standardized vocab joins). (4) Picking one without recording *why*, leaving the next Move to re-litigate.

**Feeds artifacts** — Architecture target-state (canonical model decision); Discovery brief (standard-fit assessment); Business case (reuse/leverage rationale).

**Maturity** — production-ready.

---

### PATTERN MODEL-03 · OMOP CDM on the lakehouse

**Intent** — Stand up the OMOP Common Data Model as governed Delta tables so population analytics and the OHDSI tool stack run natively on the client's lakehouse.

**Applies to** — Population Health (`POPH`), research/observational analytics, cohort-driven Clinical Performance. Architecture/Mobilization.

**Solution shape** — In Silver, materialize the OMOP CDM clinical tables as Delta tables in Unity Catalog: `person`, `observation_period`, `visit_occurrence`, `condition_occurrence`, `drug_exposure`, `procedure_occurrence`, `measurement`, `observation`, `death`, plus the vocabulary tables (`concept`, `concept_relationship`, `concept_ancestor`). ETL maps source codes (ICD-10, CPT, NDC, local) to OMOP standard `concept_id`s using the OMOP Standardized Vocabularies. Identity resolution (`MODEL-05`) produces the `person_id`. Run OHDSI **Achilles** for data characterization and DQ, and expose **ATLAS** / **HADES** against the Delta-backed CDM for cohort definition and analytics. Vocabularies are downloaded from OHDSI Athena and loaded as governed reference data (`MODEL-07`).

**Own-it vs rent** — **OWN.** OMOP CDM and the OHDSI tool stack (ATLAS, Achilles, HADES) are open-source (Apache-style licensing). The CDM tables and vocabulary mappings live in the client's Unity Catalog; cohort definitions are client IP. No vendor intermediation.

**Where it sits** — Silver (conformed CDM). Reference vocab is governed reference data. Architecture/Mobilization.

**Evidence anchors** — OMOP CDM v5.4 spec and DDL: https://ohdsi.github.io/CommonDataModel/. OHDSI tool stack: https://www.ohdsi.org/software-tools/. Athena vocabularies: https://athena.ohdsi.org/. Vocabulary mapping completeness varies by source system — *estimate; confirm with client data and run Achilles DQ*.

**Anti-patterns** — (1) Loading source codes into OMOP without mapping to standard concept_ids (defeats the standardization purpose — joins and cohorts break). (2) Treating OMOP as a dumping ground for non-conformed data. (3) Re-implementing cohort logic in bespoke SQL instead of using ATLAS/HADES (loses provenance and reuse). (4) Hardcoding vocabulary versions instead of governing them as versioned reference data.

**Feeds artifacts** — Architecture target-state; `POPH` cohort/risk patterns' data foundation; Business case (analytics-reuse leverage).

**Maturity** — production-ready.

---

### PATTERN MODEL-04 · FHIR-native Delta schema via dbignite

**Intent** — Turn FHIR R4 bundles into queryable, governed Delta tables so clinical interoperability data is analyzable on the lakehouse without bespoke parsing.

**Applies to** — Clinical interoperability, real-time/near-real-time clinical events, SMART-on-FHIR app data, payer-provider exchange. `CLIN`, `PAYER`, and the source for longitudinal timelines (`MODEL-10`).

**Solution shape** — Use **dbignite** (Databricks Labs open-source FHIR R4 → Delta framework, https://github.com/databrickslabs/dbignite). dbignite reads FHIR R4 bundles (NDJSON/JSON), interprets the bundle, and writes resources into a queryable schema — exposing a person-dashboard / patient-centric view and the ability to round-trip back to FHIR. Land FHIR bundles in Bronze, run dbignite in Silver to flatten Patient/Encounter/Observation/Condition/etc. into Delta tables conformed to US Core profiles where applicable. From this FHIR-native Silver you can (a) serve interoperability/event-timeline use cases directly (`MODEL-10`) and (b) optionally transform a slice into OMOP (`MODEL-03`) for population analytics — the "both" path of `MODEL-02`.

**Own-it vs rent** — **OWN.** dbignite is open-source (Databricks Labs); FHIR R4 and US Core are open HL7 standards. The flattened Delta tables and transformation logic live in the client's Unity Catalog. No vendor FHIR-SaaS holds the data.

**Where it sits** — Bronze (raw FHIR bundles) → Silver (flattened FHIR Delta). Architecture/Mobilization.

**Evidence anchors** — dbignite: https://github.com/databrickslabs/dbignite (Databricks Labs FHIR R4 → Delta). HL7 FHIR R4: https://hl7.org/fhir/R4/. US Core: https://hl7.org/fhir/us/core/. dbignite is a Databricks Labs project (community-supported, not a hardened product) — flag **emerging** maturity; validate against the client's FHIR profile and dbignite release. *Confirm current dbignite support matrix against the repo at engagement time.*

**Anti-patterns** — (1) Hand-rolling a bespoke FHIR JSON parser per resource type instead of using dbignite (brittle, unmaintained). (2) Flattening FHIR without preserving the raw bundle in Bronze (loses round-trip and audit). (3) Using flattened FHIR tables for large-scale population cohort analytics where OMOP is the right shape (`MODEL-02` anti-pattern). (4) Ignoring US Core profile validation, so downstream apps can't trust the data.

**Feeds artifacts** — Architecture target-state (interoperability path); `MODEL-10` timeline foundation; Discovery brief (FHIR readiness).

**Maturity** — emerging (open standard FHIR R4 is mature; dbignite as a framework is Labs-grade — call it out).

---

### PATTERN MODEL-05 · Patient identity / Master Patient Index — own-it (Zingg / Splink)

**Intent** — Resolve which records across sources refer to the same patient (the enterprise/master patient index) using engines the client owns and runs, so the matching logic and the resulting identity graph are client IP — **not** a rented SaaS black box.

**Applies to** — Every healthcare domain. Identity is a Silver-layer prerequisite for OMOP `person_id` (`MODEL-03`), longitudinal records (`MODEL-10`), and any cross-source analytics. Architecture/Mobilization. **This is one of the most consequential own-it decisions in a healthcare Move.**

**Solution shape** — Run open-source **ML / probabilistic entity-resolution** natively on Spark/Databricks:
- **Zingg** (https://github.com/zinggAI/zingg) — open-source ML-based entity resolution; learns a matching model from labeled examples, runs distributed on Spark, scales to large patient populations, supports incremental/active-learning labeling.
- **Splink** (https://github.com/moj-analytical-services/splink) — open-source probabilistic record-linkage library implementing the Fellegi–Sunter model with Expectation-Maximization to learn match weights *without* large labeled sets; runs on Spark (and DuckDB) with strong explainability (match-weight waterfalls).

Output is a Silver identity-crosswalk table mapping every source record to a stable enterprise `patient_id` (the MPI), plus match scores and decision thresholds for review queues. This `patient_id` keys all downstream conformed models.

**Own-it vs rent** —
- **OWN-IT (recommended default):** **Zingg** and **Splink** run *in the client's lakehouse*; the client owns the matching model, the thresholds, the training labels, and the resulting identity graph. The logic is inspectable and tunable. **For an own-it mandate this is the answer unless a surfaced rationale says otherwise.**
- **RENT (disqualified by default):** **Verato**, **Reltio** — SaaS MPI/MDM platforms. The vendor holds the matching algorithm and (typically) processes the identity data on the vendor's cloud. You get a resolved ID back, but the matching IP and often the reference-matching data live with the vendor. Adopting one requires explicit, surfaced rationale per the README first principle.

Choose Splink when labeled training data is scarce and explainability is paramount (Fellegi–Sunter is transparent); choose Zingg when you can label examples and want a learned ML matcher with active learning. Both are valid own-it choices.

**Where it sits** — Silver (identity crosswalk feeds all conformed models). Governance tier for the review queue. Architecture/Mobilization (identity is a foundation milestone).

**Evidence anchors** — Zingg: https://github.com/zinggAI/zingg (open-source ML entity resolution on Spark). Splink: https://github.com/moj-analytical-services/splink (probabilistic linkage, Fellegi–Sunter + EM, runs on Spark). Verato and Reltio are commercial SaaS MPI/MDM vendors (vendor sites) — classified RENT here on architecture grounds. Match precision/recall is data-dependent — *estimate; must be measured on the client's data and reviewed by a steward; do not assert a fixed accuracy*.

**Anti-patterns** — (1) **"Build a bespoke MPI from SQL fuzzy-matching"** (SOUNDEX/Levenshtein joins hand-coded in SQL) instead of Zingg/Splink — does not scale, has no principled probabilistic model, no learnable thresholds, no explainability, and silently mismatches patients (a patient-safety and compliance hazard). (2) Defaulting to Verato/Reltio under an own-it mandate without surfaced rationale (rents the single most sensitive piece of IP). (3) Treating MPI as a one-time batch with no incremental matching or review queue for ambiguous pairs. (4) No human-in-the-loop steward review of borderline matches.

**Feeds artifacts** — Architecture target-state (identity layer + own-it posture); Mobilization foundation milestone; Business case (own-it IP value); Governance (match-review control).

**Maturity** — production-ready (Zingg and Splink are both mature, widely deployed OSS).

---

### PATTERN MODEL-06 · Entity resolution / record linkage — deterministic vs probabilistic vs ML

**Intent** — Pick the right record-linkage technique for the data and risk profile, beyond patient identity (providers, organizations, facilities, members, vendors).

**Applies to** — Any cross-source integration: provider directories, payer member matching, facility/org masters, vendor masters (`FINOPS` adjacency). Silver. Architecture/Mobilization.

**Solution shape** — Three-tier technique selection:
- **Deterministic** — exact / rule-based matching on stable keys (NPI, tax ID, MRN within a system, normalized identifiers). Highest precision when a reliable key exists; cheapest. Use as the first pass.
- **Probabilistic** — Fellegi–Sunter weighted matching (e.g. **Splink**) when no single reliable key exists; computes match weights per field with EM-learned parameters and explainable thresholds.
- **ML-based** — learned matchers (e.g. **Zingg**) when you have labeled examples and complex feature interactions; supports active learning to expand labels.

Layer them: deterministic pass to capture clean matches cheaply, then probabilistic/ML on the residual. Persist match scores, thresholds, and a review queue for the ambiguous band.

**Own-it vs rent** — **OWN.** Deterministic rules are client SQL; Splink and Zingg are OSS running in the estate (per `MODEL-05`). Avoid SaaS matching services for the same reason as MPI.

**Where it sits** — Silver. Architecture/Mobilization.

**Evidence anchors** — Splink (probabilistic, Fellegi–Sunter): https://github.com/moj-analytical-services/splink. Zingg (ML): https://github.com/zinggAI/zingg. Fellegi–Sunter is the foundational 1969 record-linkage model (JASA, Fellegi & Sunter) — standard, not a benchmark. Match rates are data-dependent — *estimate; measure on client data*.

**Anti-patterns** — (1) Using probabilistic/ML where a reliable deterministic key exists (over-engineering, false-merge risk). (2) Using deterministic-only where keys are dirty/missing (silent under-matching). (3) No review queue for the ambiguous band (auto-accepting low-confidence merges). (4) Reinventing linkage in bespoke SQL instead of Splink/Zingg.

**Feeds artifacts** — Architecture target-state; Discovery (source-key quality assessment); Governance (match-review control).

**Maturity** — production-ready.

---

### PATTERN MODEL-07 · Reference & master data management on the lakehouse

**Intent** — Govern reference and master data (code sets, vocabularies, provider/org masters, value sets) as versioned, owned data products rather than as scattered lookups or a rented MDM platform.

**Applies to** — All domains. Underpins OMOP vocab (`MODEL-03`), measure value sets (`MODEL-11`), dimensions (`MODEL-08`). Silver/Gold. Architecture/Mobilization.

**Solution shape** — Maintain reference data as governed Delta tables in Unity Catalog with explicit versioning: terminology (SNOMED, ICD-10, CPT, RxNorm, LOINC), OMOP vocabularies (Athena), measure value sets (e.g. NCQA/VSAC value sets — defer the measure logic to `CLIN`/`PAYER`), and master entities (provider, facility, org, payer). Version every load (`valid_from`/`valid_to` or snapshot tables), tag as reference data, and treat as a published data product with an owner. Master entities are produced via `MODEL-06` resolution. For organizational masters, run MDM stewardship workflows (survivorship rules, golden-record selection) as owned Spark/SQL logic.

**Own-it vs rent** — **OWN.** Reference/master data lives in the client's Unity Catalog as versioned Delta; survivorship and golden-record logic are client-authored. Contrast **RENT** vendor MDM (e.g. Reltio, Informatica MDM SaaS) where master records and survivorship rules live with the vendor — disqualified for an own-it mandate absent surfaced rationale (same logic as `MODEL-05`).

**Where it sits** — Silver (reference + master tables); consumed in Gold. Governance tier (ownership, versioning).

**Evidence anchors** — OMOP/Athena vocabularies: https://athena.ohdsi.org/. Standard terminologies are externally governed (SNOMED Intl, AMA CPT, NLM RxNorm/LOINC, CMS ICD-10) — licensing terms vary, *confirm terminology licensing with client*. VSAC value sets: https://vsac.nlm.nih.gov/. Vendor MDM platforms are commercial SaaS — RENT.

**Anti-patterns** — (1) Hardcoding code lists in transformation SQL (impossible to version or audit). (2) No versioning on terminology (silent measure drift when a code set changes). (3) Renting an MDM platform for master data the client must own. (4) Treating reference data as throwaway lookups rather than owned products.

**Feeds artifacts** — Architecture target-state; Governance (data-product ownership); measure-mart foundation.

**Maturity** — production-ready.

---

### PATTERN MODEL-08 · Dimensional modeling in Gold (star schema, SCD, fact/dim)

**Intent** — Shape Gold consumption models as dimensional stars so BI, dashboards, and analysts get fast, intuitive, conformed access.

**Applies to** — All domains' analytics/BI serving. Gold. Architecture/Mobilization. The default Gold modeling style for analytics consumption.

**Solution shape** — Kimball-style dimensional models in Gold as Delta tables:
- **Fact tables** — grain-defined measures (e.g. `fact_encounter`, `fact_claim_line`, `fact_lab_result`), keyed by dimension surrogate keys, additive/semi-additive measures.
- **Dimension tables** — descriptive context (`dim_patient`, `dim_provider`, `dim_date`, `dim_facility`, `dim_diagnosis`), conformed across facts.
- **Slowly Changing Dimensions** — Type 1 (overwrite) for corrections; **Type 2** (versioned rows with `valid_from`/`valid_to`/`is_current`) for attributes whose history matters (provider affiliation, patient address, plan enrollment). Delta MERGE implements SCD-2 cleanly.
- **Surrogate keys**, conformed dimensions shared across stars, and a generated `dim_date`.

Source conformed Silver (CDM + resolved identity) feeds these stars via declarative pipelines (`MODEL-17`).

**Own-it vs rent** — **OWN.** Dimensional modeling is a technique; the stars are Delta tables in the client's Unity Catalog. No vendor dependency.

**Where it sits** — Gold. Architecture/Mobilization.

**Evidence anchors** — Kimball dimensional modeling (*The Data Warehouse Toolkit*, Kimball & Ross) — the canonical reference. Databricks SCD-2 via Delta MERGE and DLT `APPLY CHANGES` (https://docs.databricks.com/). No numeric benchmark — design discipline.

**Anti-patterns** — (1) Exposing normalized Silver/OMOP directly to BI users (too many joins, slow, unintuitive). (2) Type-1 overwriting attributes whose history is needed (silently destroying audit/trend). (3) Undefined fact grain (mixing grains → wrong aggregates). (4) Non-conformed dimensions (every star with its own `dim_patient` → inconsistent metrics).

**Feeds artifacts** — Architecture target-state (serving layer); semantic-layer foundation (`MODEL-12`); BI/analytics scope in Business case.

**Maturity** — production-ready.

---

### PATTERN MODEL-09 · Data Vault 2.0 on the lakehouse

**Intent** — Provide a highly auditable, source-agnostic integration model for complex multi-source enterprise data where load patterns and lineage matter more than query ergonomics.

**Applies to** — Large enterprise integration with many volatile sources, strong audit/lineage requirements (payer enterprise data, multi-system provider orgs). Sits *between* Silver and dimensional Gold. Architecture.

**Solution shape** — Data Vault 2.0 modeled as Delta tables: **Hubs** (business keys), **Links** (relationships between keys), **Satellites** (descriptive, time-stamped attributes). Hash keys for joins, load-date and record-source metadata on every row, insert-only loads (highly parallel, audit-friendly). Use Data Vault as the *integration/raw-vault* layer for many sources, then build dimensional **business-vault**/Gold marts (`MODEL-08`) on top for consumption.

**Decision rule (vs `MODEL-08`):** Use **dimensional** when sources are few/stable and consumption ergonomics dominate (most analytics Moves). Use **Data Vault** when you have many sources, frequent schema/source change, and stringent audit/lineage/traceability needs — i.e. highly-integrated multi-source enterprise models. They compose: Data Vault for integration, dimensional Gold for serving. Do not put Data Vault in front of analysts as the consumption model.

**Own-it vs rent** — **OWN.** Data Vault 2.0 is a public methodology; the hubs/links/satellites are Delta tables in the client's Unity Catalog.

**Where it sits** — Silver→Gold integration layer (raw/business vault), feeding dimensional Gold. Architecture.

**Evidence anchors** — Data Vault 2.0 (Dan Linstedt, *Building a Scalable Data Warehouse with Data Vault 2.0*). Databricks Data Vault guidance: https://www.databricks.com/glossary/data-vault. Methodology, not a benchmark.

**Anti-patterns** — (1) Using Data Vault for a simple two-source mart (massive over-engineering — explosion of hubs/links/satellites for no audit benefit). (2) Exposing raw vault directly to BI (unusable join complexity). (3) Skipping the business-vault/dimensional consumption layer (analysts drown). (4) Treating Data Vault and dimensional as either/or rather than integration-vs-serving.

**Feeds artifacts** — Architecture target-state (integration layer choice + rationale); Business case (multi-source integration scope).

**Maturity** — production-ready.

---

### PATTERN MODEL-10 · Longitudinal patient record / clinical event timeline

**Intent** — Assemble a per-patient, time-ordered record of clinical events so care-gap, risk, and journey analytics have a coherent timeline rather than disjoint source rows.

**Applies to** — Population Health, Clinical Performance, care-gap and journey use cases. Silver/Gold. Built on resolved identity + conformed model.

**Solution shape** — Using the resolved enterprise `patient_id` (`MODEL-05`), union and time-order clinical events from the conformed model — encounters, conditions, medications, labs, procedures, observations — into a longitudinal event-timeline table (event type, timestamp, source, coded value). Build it on the FHIR-native model (`MODEL-04`, dbignite's patient-centric view is a natural source) or OMOP (`MODEL-03`, via `observation_period` + occurrence tables). Persist as a Gold serving model partitioned by patient, optimized for "all events for this patient in window" reads. This timeline is the substrate for `MODEL-15` feature tables and domain risk/care-gap patterns.

**Own-it vs rent** — **OWN.** Built entirely from owned conformed models in Delta/Unity Catalog.

**Where it sits** — Silver (assembly) → Gold (serving). Architecture/Mobilization.

**Evidence anchors** — dbignite person-centric view: https://github.com/databrickslabs/dbignite. OMOP `observation_period`/occurrence tables: https://ohdsi.github.io/CommonDataModel/. Timeline grain/retention are design choices — *confirm with client*.

**Anti-patterns** — (1) Assembling a timeline before identity is resolved (events for the same patient scatter across IDs). (2) Mixing source-coded and standard-coded events without normalization. (3) No event-type taxonomy (un-queryable). (4) Rebuilding the timeline per use case instead of publishing one reusable product.

**Feeds artifacts** — `POPH`/`CLIN` risk and care-gap foundations; feature-store source (`MODEL-15`); Architecture serving layer.

**Maturity** — emerging (pattern is well understood; productionizing depends on identity + CDM maturity).

---

### PATTERN MODEL-11 · Measure marts (HEDIS / Stars / quality) — the modeling pattern

**Intent** — Structure Gold marts that compute and serve quality measures (HEDIS, CMS Stars, internal quality) so measure results are consistent, auditable, and reusable — covering the *modeling* pattern, not the measure logic itself.

**Applies to** — Clinical Performance (`CLIN`), Payer (`PAYER`), Population Health. Gold. The measure *logic/specs* live in the domain packs; this pattern is how the mart is shaped.

**Solution shape** — A Gold measure mart built on conformed Silver + resolved identity + versioned value sets (`MODEL-07`):
- **Denominator / eligible-population** tables (who qualifies for the measure, by spec).
- **Numerator / compliance** tables (who met the measure).
- **Exclusion** tables (spec-defined exclusions).
- A **member-measure fact** at `(patient_id, measure_id, measurement_period)` grain with compliance flag, plus a measure-rate aggregate.
- Value sets versioned as reference data (`MODEL-07`); measure spec version tagged on every row for auditability.

The measure *definitions* (HEDIS technical specs, Stars cut points, internal quality) are deferred to `CLIN`/`PAYER`/`POPH`; this pattern guarantees the mart shape, the value-set governance, and the auditability that make those definitions trustworthy and reusable.

**Own-it vs rent** — **OWN.** The mart, the denominator/numerator/exclusion logic, and the value-set governance live in the client's lakehouse. Contrast renting a quality-measurement SaaS (e.g. a vendor "Stars platform") that holds the measure logic and results — disqualified for an own-it mandate.

**Where it sits** — Gold. Architecture/Mobilization. Logic sourced from domain packs.

**Evidence anchors** — HEDIS is NCQA's measure set (https://www.ncqa.org/hedis/); CMS Star Ratings (https://www.cms.gov/). Measure value sets via VSAC (https://vsac.nlm.nih.gov/). **Defer all measure-rate benchmarks to the domain packs (`CLIN`/`PAYER`)** — do not assert measure thresholds here.

**Anti-patterns** — (1) Computing measures inline in dashboards (every BI tool gets a different rate). (2) Not versioning measure specs/value sets (silent year-over-year drift, un-auditable results). (3) Hardcoding value sets instead of governing them (`MODEL-07`). (4) Building a one-off mart per report instead of one reusable member-measure product.

**Feeds artifacts** — `CLIN`/`PAYER` quality-measure patterns (logic); Architecture serving layer; Business case (quality-improvement value, sourced from domain benchmarks).

**Maturity** — production-ready.

---

### PATTERN MODEL-12 · Semantic / metrics layer (Unity Catalog metric views, dbt semantic layer)

**Intent** — Define business measures once, centrally and certified, so every consumer (BI, AI, apps) computes the same number — a single source of truth for metrics.

**Applies to** — All domains' consumption. Gold/serving. Architecture/Mobilization.

**Solution shape** — Two viable own-it approaches:
- **Unity Catalog metric views** — define dimensions and measures declaratively over Gold tables in Unity Catalog; consumers query the metric view and get consistent, governed measures with lineage and access control native to UC.
- **dbt Semantic Layer (MetricFlow)** — define metrics in dbt; consumers query through the semantic layer for consistent measures across tools.

Plus **certified Gold marts** — published, owner-stamped, contract-bound marts (`MODEL-13`/`MODEL-14`) as the de facto semantic source for measures not yet in a metric layer. Pick one canonical approach per estate; certify the definitions; expose lineage. This layer makes `MODEL-11` measure rates and dimensional aggregates singular and trustworthy.

**Own-it vs rent** — **OWN.** UC metric views live in the client's catalog; dbt is open-source (dbt-core) with the semantic layer defined in client-owned dbt projects. Metric definitions are client IP. (Note: dbt Cloud's hosted semantic layer is a managed service — prefer dbt-core + MetricFlow defined in the client repo for full own-it; flag if hosted.)

**Where it sits** — Gold/serving + governance. Architecture/Mobilization.

**Evidence anchors** — Unity Catalog metric views: Databricks docs (https://docs.databricks.com/) — relatively new capability, **emerging**; confirm GA/feature status at engagement time. dbt Semantic Layer / MetricFlow: https://docs.getdbt.com/docs/build/about-metricflow. Capability maturity is evolving — *confirm current feature support*.

**Anti-patterns** — (1) Re-defining the same metric in every dashboard/notebook (the canonical "different number in every report" failure). (2) No certification/ownership on measures. (3) Renting a hosted metrics SaaS that holds the definitions when an own-it metric layer is available. (4) A semantic layer with no lineage back to Gold.

**Feeds artifacts** — Architecture serving/semantic layer; Governance (certified-measure ownership); Business case (decision-trust value).

**Maturity** — emerging (metric-layer tooling is maturing fast; certified-marts fallback is production-ready).

---

### PATTERN MODEL-13 · Data product thinking / data mesh on the lakehouse

**Intent** — Treat curated data as **products** — domain-owned, discoverable, contract-bound, SLO-backed — rather than as anonymous tables, so reuse and trust compound across Moves.

**Applies to** — All domains; the organizing principle for Gold (and certified Silver). Architecture/Operating-model. Strategy/Architecture.

**Solution shape** — Apply data-product principles (per Dehghani's data-mesh): each Gold data product (e.g. "longitudinal patient record", "member-measure mart", "provider master") has a **named owner/domain**, a **contract** (`MODEL-14`), documented **semantics**, **discoverability** via Unity Catalog (catalog/schema layout, tags, descriptions, search), **quality SLOs**, and **lineage** (`MODEL-16`). Organize the Unity Catalog namespace by domain. Publish products to a catalog/marketplace surface so other Moves discover and reuse them rather than rebuilding from raw. Data mesh is an *operating-model overlay* on the medallion lakehouse — not a separate platform.

**Own-it vs rent** — **OWN.** Data products live in the client's Unity Catalog; ownership, contracts, and discoverability are client-governed. The mesh concept reinforces own-it: the client owns and operates its product portfolio.

**Where it sits** — Gold (and certified Silver); governance tier (ownership, discovery). Architecture/Operating-model.

**Evidence anchors** — Data Mesh (Zhamak Dehghani, *Data Mesh: Delivering Data-Driven Value at Scale*; martinfowler.com/articles/data-mesh-principles.html). Unity Catalog discoverability: Databricks docs. Organizational pattern — no numeric benchmark.

**Anti-patterns** — (1) Publishing tables with no owner, contract, or docs and calling them "products". (2) Adopting data-mesh org structure without the lakehouse governance substrate (mesh-washing). (3) Over-fragmenting into micro-products with no shared dimensions (`MODEL-08` conformance breaks). (4) No discoverability surface, so teams rebuild from raw (defeats reuse — and recreates the `MODEL-01` "raw-as-product" anti-pattern).

**Feeds artifacts** — Architecture operating-model; Governance (product ownership/discovery); Business case (reuse leverage across Moves).

**Maturity** — production-ready (as a discipline on the lakehouse).

---

### PATTERN MODEL-14 · Schema evolution & data contracts

**Intent** — Let schemas change safely over time and make producer/consumer expectations explicit, so downstream products don't break silently.

**Applies to** — All domains; every published data product. Silver/Gold. Architecture/Mobilization + ongoing operations.

**Solution shape** — Two coupled mechanisms:
- **Schema evolution** — use Delta Lake schema evolution (additive `mergeSchema`, explicit `ALTER TABLE`) with discipline: additive-by-default, deprecate-then-remove, never silent type changes. Delta enforces schema on write (schema enforcement) so bad writes fail loudly.
- **Data contracts** — a versioned, machine-readable agreement per data product: schema, semantics, quality expectations (not-null, ranges, referential integrity), freshness SLO, and a change/deprecation policy. Enforce expectations in the pipeline (DLT/Lakeflow expectations, or a contract test). Tie the contract to the product owner (`MODEL-13`).

Versioning + contracts make `MODEL-13` products trustworthy and `MODEL-12` measures stable.

**Own-it vs rent** — **OWN.** Delta schema enforcement/evolution is native; contracts are client-authored artifacts in the repo. No vendor dependency.

**Where it sits** — Silver/Gold + governance. Architecture/Mobilization + ops.

**Evidence anchors** — Delta Lake schema enforcement & evolution: https://docs.delta.io/ and Databricks docs. DLT/Lakeflow expectations: Databricks docs. Data-contract practice is an emerging industry discipline (e.g. open data-contract specifications) — *confirm chosen contract format with client*.

**Anti-patterns** — (1) `overwriteSchema` / silent type changes that break consumers. (2) No deprecation policy (rip-out breaks downstream). (3) Contracts as prose docs that drift from the actual schema (must be enforced). (4) No freshness/quality SLO, so consumers can't trust the product.

**Feeds artifacts** — Architecture (contract policy); Governance (change management); Mobilization (DQ/contract gates).

**Maturity** — production-ready (Delta mechanics; data-contract tooling maturing).

---

### PATTERN MODEL-15 · Feature store / feature engineering tables (Unity Catalog Feature Engineering)

**Intent** — Engineer and publish reusable, governed feature tables so ML models train and serve on consistent, lineage-tracked features — the bridge from the modeling layer to `MLOPS`.

**Applies to** — Any ML-backed domain use case (risk stratification, propensity, forecasting). Gold/feature tier. Architecture/Mobilization. **Hand-off point to the `MLOPS` pack.**

**Solution shape** — Use **Databricks Feature Engineering in Unity Catalog**: feature tables are governed Delta tables in UC with primary keys; models log feature lookups so training and inference use the *same* feature computation (eliminating training/serving skew); features get UC lineage and access control. Source features from conformed Silver, the longitudinal timeline (`MODEL-10`), and Gold marts. Publish feature tables as data products (`MODEL-13`) with contracts (`MODEL-14`). For low-latency serving, sync to online stores per `MLOPS`.

**Own-it vs rent** — **OWN.** Feature tables are Delta in the client's Unity Catalog; feature logic is client IP. UC Feature Engineering is part of the client's lakehouse, not an external feature-SaaS.

**Where it sits** — Gold/feature tier. Architecture/Mobilization. Bridges to `MLOPS`.

**Evidence anchors** — Databricks Feature Engineering in Unity Catalog: https://docs.databricks.com/en/machine-learning/feature-store/. Training/serving-skew elimination is the documented purpose of feature-lookup logging — capability claim, not a benchmark.

**Anti-patterns** — (1) Recomputing features differently in training vs serving (training/serving skew — the core failure a feature store prevents). (2) Features as scattered notebook code with no governed table (no reuse, no lineage). (3) No PK/lineage on feature tables. (4) Building features off raw Bronze instead of conformed Silver/timeline (inherits source quirks).

**Feeds artifacts** — `MLOPS` model-training/serving patterns; Architecture (feature tier); Business case (model-reuse leverage).

**Maturity** — production-ready.

---

### PATTERN MODEL-16 · Lineage & cataloging (Unity Catalog lineage, OpenLineage, tags)

**Intent** — Make every data product's origins, transformations, and consumers visible and queryable so trust, impact analysis, and compliance are mechanical, not archaeological.

**Applies to** — All domains; foundational governance for every other `MODEL` pattern. Spans all layers. Governance tier. Architecture/Mobilization + ops.

**Solution shape** — Layered cataloging on Unity Catalog:
- **Automatic lineage** — Unity Catalog captures table- and column-level lineage across notebooks, pipelines, and queries within the lakehouse.
- **OpenLineage** — the open standard (https://openlineage.io/) for emitting lineage events; use it to extend lineage *beyond* the lakehouse (orchestrators, external tools) into a unified graph, avoiding a proprietary lineage silo.
- **Tags & classifications** — apply UC tags for `medallion_layer`, data sensitivity (PII/PHI), data-product ownership (`MODEL-13`), and measure/value-set versions. Drive access policy and discovery from tags.

Lineage + tags make impact analysis ("what breaks if this column changes?") and compliance evidence (PHI flow) queryable.

**Own-it vs rent** — **OWN.** UC lineage is native to the client's catalog; OpenLineage is an open standard (LF AI & Data) that keeps lineage portable rather than locked to one vendor's catalog. Tags are client-governed metadata.

**Where it sits** — Governance tier, spanning Bronze→Gold. Architecture/Mobilization + ops.

**Evidence anchors** — Unity Catalog lineage: https://docs.databricks.com/data-governance/unity-catalog/data-lineage.html. OpenLineage (open standard, LF AI & Data): https://openlineage.io/. Capability claims, not benchmarks.

**Anti-patterns** — (1) No lineage, so impact analysis and PHI-flow evidence are manual archaeology. (2) Proprietary-only lineage with no OpenLineage export (silo; can't unify with non-lakehouse tools). (3) No sensitivity/ownership tags (access policy and discovery can't key off metadata). (4) Lineage captured but never used for impact analysis or audit.

**Feeds artifacts** — Governance (lineage/PHI-flow evidence); Architecture; Mobilization (catalog setup milestone); audit evidence.

**Maturity** — production-ready.

---

### PATTERN MODEL-17 · Reusable transformation patterns — dbt vs DLT/Lakeflow

**Intent** — Standardize *how* transformations are authored and run between layers so pipelines are testable, declarative, and reusable — not bespoke per dataset.

**Applies to** — All domains; the engine behind Bronze→Silver→Gold promotion. Spans layers. Architecture/Mobilization.

**Solution shape** — Two owned, complementary approaches:
- **dbt** (dbt-core) — SQL-first, modular models with refs, built-in tests, documentation, and the semantic layer (`MODEL-12`). Best where the team is SQL-centric, wants version-controlled analytics engineering, and targets the warehouse/SQL surface. Open-source, models live in the client repo.
- **DLT / Lakeflow Declarative Pipelines** — Databricks' declarative pipeline framework (streaming + batch) with built-in **expectations** (DQ), `APPLY CHANGES` for CDC/SCD (`MODEL-08`), and automatic orchestration/lineage. Best for streaming/incremental ingestion-to-Silver, CDC, and when you want declarative DQ enforcement inline. Pairs with metadata-driven frameworks like DLT-META (`INGEST`, README own-it example).

**Decision rule:** DLT/Lakeflow for incremental/streaming promotion, CDC/SCD, and inline expectations (especially Bronze→Silver); dbt for SQL-centric analytics-engineering of Gold marts and the semantic layer. They compose: DLT to conform Silver, dbt to model Gold. Don't hand-roll bespoke notebook ETL where a declarative framework applies.

**Own-it vs rent** — **OWN.** dbt-core is open-source and models live in the client repo; DLT/Lakeflow runs in the client's Databricks workspace with pipelines and metadata in the client's Unity Catalog. Logic is client IP. (Note: dbt Cloud is a managed service — prefer dbt-core in the client repo for full own-it; flag if hosted.)

**Where it sits** — Spans Bronze→Gold; data plane. Architecture/Mobilization.

**Evidence anchors** — dbt: https://docs.getdbt.com/. DLT / Lakeflow Declarative Pipelines & expectations: Databricks docs (https://docs.databricks.com/). DLT-META: https://github.com/databrickslabs/dlt-meta (Apache-licensed, README own-it example). No numeric benchmark — engineering-discipline choice.

**Anti-patterns** — (1) Bespoke notebook ETL per dataset where a declarative framework applies (unmaintainable, untested). (2) No transformation tests/expectations (silent data-quality regressions). (3) Choosing one engine dogmatically where the other fits the workload (streaming CDC in dbt; or SQL marts forced into imperative DLT). (4) Hosted dbt Cloud under a strict own-it mandate without surfaced rationale.

**Feeds artifacts** — Architecture (transformation framework choice + rationale); Mobilization (pipeline build milestone); Business case (engineering-reuse leverage).

**Maturity** — production-ready.

---

## How this pack composes (worked snippet)

A `POPH` "risk stratification" Move's modeling spine:

```
MODEL-01 (medallion)            — the layered spine
  × MODEL-02 → MODEL-03         — chose OMOP for population analytics
  × MODEL-05 (Zingg/Splink MPI) — own-it identity → person_id
  × MODEL-10 (longitudinal record)
  × MODEL-15 (feature tables)   — bridge to MLOPS
  × MODEL-16 (lineage/tags)     — governance evidence
  × MODEL-17 (DLT + dbt)        — how it's built
```

Every selected ID becomes a provenance citation in the Move artifact; the own-it posture of each (notably `MODEL-05` Zingg/Splink) guarantees the architecture's own-it claim per the README first principle.

---

*Pack `MODEL` · 17 patterns · cross-cutting. Quantitative claims are sourced or flagged "estimate — confirm with client data." Rent-side options (Verato, Reltio, vendor MDM, hosted dbt Cloud) are flagged as disqualified-by-default for own-it mandates absent surfaced rationale.*
