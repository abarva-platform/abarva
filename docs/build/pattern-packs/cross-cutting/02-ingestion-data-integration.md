# INGEST · Ingestion & Data Integration Pattern Pack

**Pack code:** `INGEST`
**Layer:** Cross-cutting (horizontal · reusable across all domains)
**Created:** 2026-06-06
**Research basis:** Deep-research run 2026-06-06 — 25 claims confirmed 3-0 on adversarial verification, predominantly primary Databricks documentation. Sources cited inline per pattern.

---

## What this pack is for

This pack is the reference menu for **how data gets from a source system into the client's own lakehouse**, and how new sources are onboarded over time. It is the single most consequential pack for the OWN-IT mandate, because ingestion is where two expensive mistakes happen:

1. **Re-inventing the wheel.** Teams propose "build a metadata-driven ingestion framework from scratch" when mature, Apache-licensed, own-it metadata frameworks already exist (DLT-META) and Databricks itself publishes a config-driven reference architecture you can fork. Building bespoke metaprogramming is *months* of undifferentiated work that a hardened open framework gives you in days.
2. **Renting the destination.** Teams propose outsourced SaaS data platforms (Innovaccer, Health Catalyst, Arcadia) that ingest the client's data onto the *vendor's* cloud, run the *vendor's* models, and hand back dashboards. This violates the own-it mandate at its root: the client never owns the pipelines or the intelligence layer.

**Both errors are disqualified by this pack.** The default is always: own-it metadata-driven frameworks deployed into the client's own Databricks workspace and Unity Catalog, hardened by an SI whose contract assigns the accelerator IP to the client.

### The own-it ladder for ingestion

```
OWN ──────────────────────────────────────────────► RENT
DLT-META / four-config        Lakeflow Connect          Innovaccer /
reference / dlt / dbignite    (managed pipeline,         Health Catalyst /
(client owns pipelines,       client-owned destination   Arcadia
metadata, AND data)           in Unity Catalog)          (vendor owns
   │                              │                        pipelines, data
   │                              │                        residence, models,
OWN                          MANAGED-OWN-DESTINATION       intelligence layer)
                                                            DISQUALIFIED
```

The three ownership postures used throughout this pack:

- **OWN** — pipelines, orchestration metadata, AND data all live in the client estate. Client (or its SI under IP-assignment) owns the code.
- **MANAGED-OWN-DESTINATION** — the *pipeline runtime* is a managed Databricks service (e.g., Lakeflow Connect serverless connectors), but the **data lands in the client's own Unity Catalog Delta tables**. The client owns the data product even though they don't operate the connector internals. Acceptable under the own-it mandate because the destination and the intelligence built on it stay client-owned.
- **RENT** — the destination platform, the data residence, and/or the intelligence layer live on a vendor's cloud. Disqualified by default; requires explicit surfaced rationale to adopt.

---

## Pattern index

| ID | Name | Posture | Maturity |
|---|---|---|---|
| INGEST-01 | Control-table / metadata-driven ingestion framework (canonical pattern) | OWN | production-ready |
| INGEST-02 | DLT-META as the own-it framework choice | OWN | production-ready (labs, no-SLA) |
| INGEST-03 | Databricks four-config-table reference framework | OWN | production-ready (reference to fork) |
| INGEST-04 | dlt (dlthub) for REST / API / long-tail sources | OWN | production-ready |
| INGEST-05 | Lakeflow Connect for SaaS + DB CDC | MANAGED-OWN-DESTINATION | GA / Preview (varies) |
| INGEST-06 | Auto Loader / cloudFiles file-based incremental ingestion | OWN | production-ready |
| INGEST-07 | Change Data Capture — log-based CDC + APPLY CHANGES / AUTO CDC | OWN | production-ready |
| INGEST-08 | SCD1 vs SCD2 history handling at the Silver layer | OWN | production-ready |
| INGEST-09 | Epic Clarity / Caboodle source ingestion (SQL Server warehouse → Bronze) | MANAGED-OWN-DESTINATION / OWN | production-ready (no off-the-shelf template) |
| INGEST-10 | Epic real-time via Epic-on-FHIR → dbignite (FHIR R4 → Delta) | OWN | emerging |
| INGEST-11 | ERP ingestion — SAP / Oracle / Workday | MANAGED-OWN-DESTINATION / OWN | GA / Preview (varies) |
| INGEST-12 | Streaming ingestion — Kafka/Confluent + Kinesis | OWN | production-ready |
| INGEST-13 | Data quality enforcement at ingestion (DLT expectations + Great Expectations) | OWN | production-ready |
| INGEST-14 | Schema evolution & contracts (Auto Loader schema hints + dlt schema contracts) | OWN | production-ready |
| INGEST-15 | Ingestion framework SELECTION DECISION MATRIX | n/a (composition) | production-ready |
| INGEST-16 | SI IP-transfer pattern for ingestion accelerators | n/a (contractual) | production-ready |
| INGEST-17 | The RENT anti-pattern — outsourced platforms (Innovaccer/Health Catalyst/Arcadia) | RENT (disqualified) | reference-only |
| INGEST-18 | Medallion landing discipline — raw fidelity at Bronze | OWN | production-ready |

---

### PATTERN INGEST-01 · Control-table / metadata-driven ingestion framework (canonical pattern)

**Intent** — Onboard the Nth source without writing the Nth pipeline. A metadata/control table (or a JSON/YAML spec compiled into a Delta control table) parameterizes the source → Bronze → Silver flow, so adding a source means inserting/editing config rows, not authoring new code.

**Applies to** — Every domain, every client. The foundational pattern that all the framework-choice patterns (INGEST-02, INGEST-03) implement. Most relevant in Architecture and Mobilization phases when standing up the data platform.

**Solution shape** — A single **generic, parameterized pipeline** reads a **control table** that describes each source. The control table rows carry, at minimum:

- `source_id` / `dataset_name` — logical identity of the feed
- `source_type` / `source_format` — `cloudFiles` (file), `kafka`, `jdbc`, `lakeflow_connector`, `delta`, etc.
- `source_path` / connection ref — landing-zone path, topic, JDBC URL, connector handle (secret-scoped)
- `target_catalog.schema.table` — Bronze (and Silver) destination in Unity Catalog
- `load_mode` — `append` / `merge` / `overwrite`
- `cdc_keys` / `sequence_by` — primary keys and ordering column for CDC merges
- `scd_type` — 1 or 2 for the Silver layer
- `dq_rules_ref` — pointer to the data-quality expectations for this feed
- `schedule` / `trigger` — continuous vs triggered, cron
- `enabled` flag and `version` for audit

The pattern's power: **one generic pipeline serves N sources.** Onboarding source N+1 = one INSERT into the control table (plus a DQ-rules row), no new Spark code. This is what makes "migrate legacy systems with 1000s of pipelines" tractable — the framework codegen reads the control tables and emits/parameterizes the medallion pipelines.

**How onboarding actually works, step by step:**

1. **Inventory the source** (Discovery output): identity, format, connection, primary keys, update/sequence column, history requirement, DQ rules, PHI/sensitivity, cadence.
2. **Write the config rows** — one onboarding row (Bronze landing) + one Silver-transform row + one DQ-rules row. No notebook authored.
3. **Compile** — the framework reads the config (JSON/YAML spec or native config tables) and either materializes "DataflowSpec" Delta tables (DLT-META) or runs a codegen notebook that emits the pipeline notebooks (four-config reference).
4. **Run the generic pipeline** — the single parameterized pipeline reads the compiled spec and ingests source N+1 alongside all prior sources; Bronze lands raw (INGEST-18), Silver applies CDC/SCD/DQ from the config.
5. **Validate + version** — DQ metrics surface; the config row is versioned and the `enabled` flag governs activation.

The unit of work shifts from "engineer authors a pipeline" to "analyst edits a governed config row" — which is the entire economic argument for the pattern.

Two ways to express the metadata:
1. **Spec files compiled to Delta** — author `onboarding.json` / `silver_transformations.json` / `dq_rules.json`, compile into "DataflowSpec" Delta tables a generic pipeline reads at runtime (DLT-META's model — INGEST-02).
2. **Native config Delta tables** — four config tables drive bronze-raw, bronze-childnodes, bronze, and silver; a code-gen notebook reads them and emits the pipeline notebooks (Databricks' published reference — INGEST-03).

**Own-it vs rent** — **OWN.** The control tables live in the client's Unity Catalog; the generic pipeline runs in the client's workspace; the metadata, the codegen, and the resulting Bronze/Silver tables are all client-owned. This is the gold standard posture for the own-it mandate.

**Where it sits** — Data plane. Spans Bronze (raw landing) and Silver (conformed). The control table itself is a governance/control artifact in Unity Catalog. Lifecycle: Architecture (design the schema) → Mobilization (stand up + onboard first sources).

**Evidence anchors** — Databricks Technical Blog, "Metadata-driven ETL framework in Databricks (Part 1)" — establishes the control-table-driven design pattern: a metadata/control table parameterizes source → Bronze → Silver so new sources are onboarded by editing config rather than writing code. https://community.databricks.com/t5/technical-blog/metadata-driven-etl-framework-in-databricks-part-1/ba-p/92666

**Anti-patterns** — (1) *Building a bespoke metadata framework from scratch.* DLT-META and the Databricks four-config reference already implement this pattern, Apache-licensed and forkable; hand-rolling the metaprogramming is months of undifferentiated engineering — see INGEST-02/INGEST-03. (2) *One pipeline per source.* The thing you are escaping. If onboarding a source requires a new notebook, you have not built the pattern. (3) *Config drift* — control table rows mutated by hand without versioning/audit; always carry `version` + an enabled flag and govern edits.

**Feeds artifacts** — Architecture target state (the ingestion tier); Mobilization foundation milestone (control-table stand-up + first-source onboarding); Business case (effort model: onboarding cost drops from per-pipeline to per-config-row).

**Maturity** — production-ready.

---

### PATTERN INGEST-02 · DLT-META as the own-it framework choice

**Intent** — Adopt the flagship open-source metadata-driven framework rather than building one, getting medallion Bronze/Silver pipeline generation from config out of the box.

**Applies to** — Every client building a Databricks lakehouse with more than a handful of sources. The default recommendation whenever INGEST-01's canonical pattern is selected.

**Solution shape** — **DLT-META** (`databrickslabs/dlt-meta`) is a metadata-driven **metaprogramming** framework that generates **Bronze/Silver Lakeflow Declarative Pipelines** (formerly Delta Live Tables) from onboarding configuration. You author:

- `onboarding.json` — declares each source, its format, Bronze target, CDC/append semantics
- `silver_transformations.json` — declares Silver transforms per dataset
- `dq_rules.json` — declares data-quality expectations per dataset

These are **compiled into "DataflowSpec" Delta tables** that a **single generic pipeline** reads at runtime — exactly the INGEST-01 canonical pattern, productized. Deployment is via the Databricks CLI:

```
databricks labs dlt-meta onboard      # compile specs → DataflowSpec Delta tables
databricks labs dlt-meta deploy       # deploy the generic pipeline into the client workspace
```

It deploys **into the client's own workspace**; the DataflowSpec metadata lives in the client's Unity Catalog. Apache-licensed. Active project: v0.0.10 (Sept 2025), 572 commits.

**The no-SLA caveat (must be surfaced).** DLT-META is a **Databricks Labs** project — labeled "for exploration purposes only," **no SLA, no support tickets.** This does NOT disqualify it for own-it (the opposite — it's Apache-licensed and you own the fork). It means the **SI hardens it**: pins the version, adds tests, productionizes error handling and observability, and the **client owns the hardened result** (see INGEST-16 for the IP-assignment contract clause). Posture: adopt-and-harden, never adopt-and-depend-on-vendor-support.

**Own-it vs rent** — **OWN.** Apache-licensed; deployed into client workspace; metadata in client Unity Catalog; client (via SI under IP assignment) owns the hardened fork, the pipelines, and the data. The no-SLA labs status is a *hardening obligation*, not an ownership compromise.

**Where it sits** — Data plane. Generates Bronze + Silver Lakeflow Declarative Pipelines. Lifecycle: Architecture (select it) → Mobilization (onboard/deploy + SI hardening).

**Evidence anchors** —
- GitHub source: https://github.com/databrickslabs/dlt-meta (Apache-licensed; v0.0.10, Sept 2025; 572 commits)
- Databricks docs: https://docs.databricks.com/aws/en/ldp/developer/dlt-meta
- Databricks blog, "Chaos to Scale: Templatizing Spark Declarative Pipelines with DLT-META": https://www.databricks.com/blog/chaos-scale-templatizing-spark-declarative-pipelines-dlt-meta
- Databricks Labs status ("exploration purposes only," no SLA, no support tickets) — per the Labs project disclaimer.

**Anti-patterns** — (1) *Building a bespoke equivalent from scratch* when DLT-META exists, Apache-licensed and forkable — the prior-artifact error this pack exists to kill. (2) *Treating the no-SLA label as a disqualifier* and reaching for a RENT platform instead — wrong direction; the answer to "no SLA" is "SI hardens, client owns," not "rent the destination." (3) *Running it unhardened in production* — adopt-and-harden is mandatory; pin the version, test, add observability.

**Feeds artifacts** — Architecture target state (named ingestion framework); Business case (build-vs-buy line: framework adoption + hardening effort vs. bespoke build months); Mobilization (onboard/deploy milestone + hardening backlog); Risk register (no-SLA → SI-hardening mitigation).

**Maturity** — production-ready (as a Labs project hardened by an SI; the framework itself is mature and actively maintained).

---

### PATTERN INGEST-03 · Databricks four-config-table reference framework

**Intent** — When the Labs no-SLA status of DLT-META is unacceptable to the client (e.g., procurement won't accept a "labs" dependency even hardened), build from Databricks' OWN published config-driven reference architecture instead.

**Applies to** — Clients with strict procurement/vendor-status gates who still want the own-it metadata pattern. The fallback-and-also-blueprint to INGEST-02.

**Solution shape** — Databricks publishes a **"Lakeflow Config-Driven Framework"** reference architecture (Technical Blog + public GitHub example). It uses **four config tables** to drive the full medallion:

1. `config_bronze_raw` — raw landing definitions
2. `config_bronze_childnodes_raw` — nested/child-node raw structures
3. `config_bronze` — Bronze conformed definitions
4. `config_silver` — Silver transform/merge definitions

A **code-generation notebook reads these config tables and emits the pipeline notebooks.** New sources are onboarded by **editing the config tables, not code** — Databricks frames it as making it "easy to migrate legacy systems with 1000s of pipelines." This is the same canonical pattern (INGEST-01) expressed in Databricks' own reference, which you **fork and own outright** — no Labs status attached.

Decision relative to INGEST-02: DLT-META is more turnkey (CLI onboard/deploy, DQ rules built in) but carries the Labs no-SLA flag; the four-config reference is more "build from blueprint" but has no vendor-status caveat because it's a reference you fork. Both are OWN.

**Own-it vs rent** — **OWN.** You fork Databricks' published reference into the client estate; the four config tables live in the client's Unity Catalog; the codegen notebook and emitted pipelines are client-owned with no Labs dependency.

**Where it sits** — Data plane. Drives the full Bronze/Silver medallion. Lifecycle: Architecture (select as alternative to DLT-META) → Mobilization (fork + adapt + onboard).

**Evidence anchors** —
- Databricks Technical Blog, "Lakeflow Config-Driven Framework: A Guide to Building Scalable [pipelines]": https://community.databricks.com/t5/technical-blog/lakeflow-config-driven-framework-a-guide-to-building-scalable/ba-p/116841
- Public GitHub example: https://github.com/databricks-solutions/databricks-blogposts/tree/main/2025-04-lakeflow-config-driven-framework

**Anti-patterns** — (1) *Building a metadata framework from scratch* when Databricks itself published one to fork — the same prior-artifact error. (2) *Picking this over DLT-META for the wrong reason* — only choose four-config over DLT-META if the Labs no-SLA status is a hard procurement blocker; otherwise DLT-META's turnkey onboard/deploy + built-in DQ is the lighter lift. (3) *Forking without an upgrade strategy* — track upstream changes to the reference.

**Feeds artifacts** — Architecture target state (alternative ingestion framework); Business case (build-from-reference effort line); Mobilization (fork + onboard milestone); Risk register (procurement vendor-status mitigation — "no Labs dependency").

**Maturity** — production-ready (as a reference architecture to fork; community-supported via the technical blog).

---

### PATTERN INGEST-04 · dlt (dlthub) for REST / API / long-tail sources

**Intent** — Ingest REST APIs, SaaS endpoints without a Lakeflow connector, and the long tail of bespoke sources, with automatic schema inference and incremental loading — in Python, anywhere Python runs.

**Applies to** — Every domain with API-shaped or long-tail sources (vendor REST APIs, internal microservice endpoints, niche SaaS with no managed connector). Complements DLT-META, which is strongest on file/DB/stream sources.

**Solution shape** — **dlt** (`dlt-hub/dlt`, Apache 2.0 Python library) provides:

- **Schema inference + normalization** — flattens nested JSON into typed relational tables automatically
- **Incremental loading** — cursor/state-based incremental extraction with persisted state
- **Schema contracts** — four enforcement modes: `evolve` (accept new columns), `freeze` (reject schema changes), `discard_row` (drop rows that violate), `discard_value` (drop offending values)

dlt **runs anywhere Python runs, including Databricks notebooks**, and offers **Direct Load into the client's Unity Catalog Delta tables — no external staging service required.** It is the right tool for REST/API and long-tail sources where authoring a per-API extractor in dlt is faster and cleaner than forcing it through a file-drop or connector path.

**Own-it vs rent** — **OWN.** Apache 2.0; runs in the client's Databricks workspace; Direct Load writes straight into the client's Unity Catalog Delta tables with no third-party staging. Client owns the extractor code and the data.

**Where it sits** — Data plane, Bronze landing (with dlt's normalization producing clean typed tables). Often feeds a DLT-META/four-config Silver pipeline downstream. Lifecycle: Architecture (designate for API/long-tail sources) → Mobilization (author extractors).

**Evidence anchors** —
- GitHub source: https://github.com/dlt-hub/dlt (Apache 2.0)
- Databricks destination (Direct Load to Unity Catalog Delta, no external staging): https://dlthub.com/docs/dlt-ecosystem/destinations/databricks

**Anti-patterns** — (1) *Forcing REST/API sources through a file-drop pattern* (export to CSV, land in storage, Auto Loader) when dlt extracts them directly with schema inference and incremental state. (2) *Using an external managed ELT SaaS (Fivetran/Airbyte Cloud) for the long tail* when dlt runs in-workspace and writes Direct Load to Unity Catalog — that adds a rented staging hop. (3) *Defaulting schema contract to `evolve` everywhere* — pick the mode per source; freeze contracts on regulated/critical feeds.

**Feeds artifacts** — Architecture target state (API/long-tail ingestion path); Mobilization (per-source extractor backlog); Data quality plan (schema-contract mode per source).

**Maturity** — production-ready.

---

### PATTERN INGEST-05 · Lakeflow Connect for SaaS + DB CDC

**Intent** — Land data from major SaaS apps and operational databases into the client's own Unity Catalog using fully-managed connectors, without building or operating extraction infrastructure.

**Applies to** — Clients with Salesforce, Workday, HubSpot, Jira and operational DBs (SQL Server, MySQL, PostgreSQL) needing CDC. Cross-domain — payer CRM, provider scheduling, finance ERP-adjacent SaaS.

**Solution shape** — **Lakeflow Connect** provides **fully-managed connectors** — Salesforce, Workday, HubSpot, Jira, and database CDC for SQL Server / MySQL / PostgreSQL — that **land data in the client's OWN Unity Catalog.** The pipeline **runs on Databricks serverless (managed)**, but **the data is client-owned** in the client's Delta tables. Connectors onboard through Databricks' UI/API with secret-scoped credentials; DB connectors use log-based CDC under the hood (see INGEST-07).

**Connector states vary** — some are GA, some Preview. Always check the current state for the specific connector at design time and flag Preview connectors in the risk register.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION.** This is the key nuance: the connector *runtime* is a managed Databricks service (you don't operate it), but **the destination is the client's own Unity Catalog Delta tables** — the data, and everything built on it, stays client-owned. Acceptable under the own-it mandate because ownership of the *data product and intelligence layer* is preserved. Contrast sharply with INGEST-17 (RENT), where the destination itself is the vendor's cloud.

**Where it sits** — Data plane, Bronze landing. Lands raw into Bronze; a DLT-META/four-config Silver pipeline conforms downstream. Lifecycle: Architecture (designate for SaaS/DB CDC sources) → Mobilization (connector config).

**Evidence anchors** —
- Lakeflow Connect docs (managed connectors landing in Unity Catalog; connector list Salesforce/Workday/HubSpot/Jira + SQL Server/MySQL/PostgreSQL CDC; states vary Preview/GA): https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/

**Anti-patterns** — (1) *Treating MANAGED-OWN-DESTINATION as RENT* and rejecting it for own-it — wrong; the data lands in the client's catalog, the client owns the product. (2) *Treating it as fully OWN* and ignoring that the connector runtime is a managed dependency — note it in the architecture honestly. (3) *Assuming every connector is GA* — check Preview/GA state per connector; a Preview connector is a pilot, not a production guarantee.

**Feeds artifacts** — Architecture target state (managed ingestion tier, ownership posture stated honestly); Business case (no extraction-infra build cost line); Mobilization (connector config milestone); Risk register (Preview-connector flags).

**Maturity** — GA / Preview varies by connector.

---

### PATTERN INGEST-06 · Auto Loader / cloudFiles file-based incremental ingestion

**Intent** — Incrementally ingest files as they land in cloud storage — exactly once, with schema inference and evolution — without re-scanning the whole directory.

**Applies to** — Every domain with file-drop feeds: vendor flat-file extracts, batch CSV/JSON/Parquet dumps, partner SFTP-to-blob landings, Clarity/Caboodle exports (see INGEST-09).

**Solution shape** — **Auto Loader** (the `cloudFiles` source in Structured Streaming / Lakeflow Declarative Pipelines) incrementally processes new files as they arrive in cloud object storage. It tracks processed files via a scalable file-notification or directory-listing mechanism (exactly-once), infers schema, and supports schema evolution and rescue (`_rescued_data`) for malformed/unexpected fields. Used as the Bronze landing source in a DLT-META/four-config pipeline (the control table row sets `source_format = cloudFiles` and the landing path).

**Own-it vs rent** — **OWN.** Native Databricks capability running in the client workspace, writing to the client's Bronze Delta tables. Client owns the ingestion and the data.

**Where it sits** — Data plane, Bronze landing. Lifecycle: Mobilization (configure per file-source control-table row).

**Evidence anchors** — Auto Loader / `cloudFiles` is the canonical Databricks file-incremental ingestion source referenced throughout the Lakeflow/DLT ingestion documentation set (https://docs.databricks.com/aws/en/ingestion/). Configured via the control-table `source_format` field in INGEST-01/02/03.

**Anti-patterns** — (1) *Full directory re-reads on each run* instead of `cloudFiles` incremental — wasteful and not exactly-once. (2) *Ignoring `_rescued_data`* — malformed rows silently lost; route rescued data and alert. (3) *Inferring schema in production without hints* on critical feeds — pin schema hints for regulated sources (see INGEST-14).

**Feeds artifacts** — Architecture target state (file-ingestion path); Mobilization (file-source onboarding); Data quality plan (rescue-data handling).

**Maturity** — production-ready.

---

### PATTERN INGEST-07 · Change Data Capture — log-based CDC + APPLY CHANGES / AUTO CDC

**Intent** — Keep Silver tables in sync with an operational source's inserts/updates/deletes, using the source's transaction log rather than full reloads or trigger-based polling.

**Applies to** — Every operational-DB source: Epic Clarity/Caboodle (SQL Server), ERP DBs (SAP/Oracle backing stores), MySQL/PostgreSQL OLTP. Core to INGEST-09 and INGEST-11.

**Solution shape** — Two layers:

1. **Log-based CDC at the source** — capture changes from the database's transaction log (SQL Server CDC, Oracle redo logs, PostgreSQL logical replication). Lakeflow Connect's DB connectors (INGEST-05) do this for SQL Server/MySQL/PostgreSQL; for other engines, a log-based CDC tool lands change events in Bronze.
2. **APPLY CHANGES INTO / AUTO CDC at Silver** — Lakeflow Declarative Pipelines' `APPLY CHANGES INTO` (now also surfaced as **AUTO CDC**) applies the change stream to the Silver target, handling out-of-order events via a `SEQUENCE BY` ordering column and the declared keys. The control-table `cdc_keys` and `sequence_by` fields (INGEST-01) drive this.

This produces a continuously-current Silver table from a change stream, without bespoke merge logic per source.

**Own-it vs rent** — **OWN.** `APPLY CHANGES INTO` / AUTO CDC runs in the client's pipelines writing to client Silver tables. (If the *capture* side uses a Lakeflow Connect managed DB connector, that hop is MANAGED-OWN-DESTINATION per INGEST-05; the Silver merge remains OWN.)

**Where it sits** — Data plane. Capture lands in Bronze; APPLY CHANGES / AUTO CDC conforms to Silver. Lifecycle: Architecture (CDC strategy per source) → Mobilization.

**Evidence anchors** — `APPLY CHANGES INTO` / AUTO CDC is the native CDC-application primitive in Lakeflow Declarative Pipelines (Databricks ingestion/LDP docs: https://docs.databricks.com/aws/en/ldp/ and https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/). Log-based DB CDC is provided by the Lakeflow Connect SQL Server/MySQL/PostgreSQL connectors (INGEST-05).

**Anti-patterns** — (1) *Full-table reloads* of large operational tables when log-based CDC + APPLY CHANGES gives incremental sync. (2) *Trigger-based polling* on the source DB — load and latency penalty; prefer log-based. (3) *Ignoring out-of-order events* — always declare `SEQUENCE BY`; without an ordering column, updates apply in arrival order and corrupt state. (4) *Forgetting deletes* — ensure the CDC stream carries and APPLY CHANGES honors deletes (and tombstones for SCD2).

**Feeds artifacts** — Architecture target state (CDC strategy); Mobilization (per-source CDC config); Data quality plan (out-of-order + delete handling).

**Maturity** — production-ready.

---

### PATTERN INGEST-08 · SCD1 vs SCD2 history handling at the Silver layer

**Intent** — Decide, per dataset, whether the Silver table keeps only the current state (SCD1) or full versioned history (SCD2), and implement it declaratively.

**Applies to** — Every dimension-like Silver table. Critical where history matters for audit/regulatory reasons (patient demographics over time, provider credentialing, employee/org hierarchy in ERP).

**Solution shape** — `APPLY CHANGES INTO` / AUTO CDC (INGEST-07) supports both:

- **SCD Type 1** — overwrite: the Silver row reflects only the latest values. Use for attributes where history is not needed (e.g., a corrected typo).
- **SCD Type 2** — versioned history: each change creates a new row with `__START_AT` / `__END_AT` (or equivalent effective-dating) and a current flag. Use where you must answer "what was true as of date X" — risk scores over time, eligibility spans, credentialing periods.

The choice is a control-table field (`scd_type`, INGEST-01) so it is declared, not hand-coded. Community frameworks like Delta-Live-Tables-Meta-Lean expose SCD1/SCD2 (plus Gold materialized views) as first-class metadata options.

**Own-it vs rent** — **OWN.** Declarative SCD in the client's Silver pipelines.

**Where it sits** — Data plane, Silver. Lifecycle: Architecture (history requirements per dataset) → Mobilization.

**Evidence anchors** —
- SCD1/SCD2 are native `APPLY CHANGES` / AUTO CDC modes (Databricks LDP docs).
- **Delta-Live-Tables-Meta-Lean** (Mmodarre) — Apache 2.0 community metadata framework exposing Bronze source/format/CDC/DQ + Silver SCD1/SCD2 + Gold MV as metadata: https://github.com/Mmodarre/Delta-Live-Tables-Meta-Lean — *Note: individual-dev project; the author has moved to a successor "Lakehouse_Plumber" for the renamed Lakeflow. Cite as evidence the metadata pattern exposes SCD1/SCD2; do NOT anchor a production dependency on it.*

**Anti-patterns** — (1) *Defaulting everything to SCD1* and discovering too late that audit needs history — decide per dataset up front. (2) *SCD2 on everything* — storage and query cost for history nobody queries. (3) *Hand-coding SCD2 merge logic* per table instead of declaring `scd_type` in the control table.

**Feeds artifacts** — Architecture target state (history strategy per Silver dataset); Governance/audit plan (which datasets retain history); Mobilization.

**Maturity** — production-ready (the SCD primitives; the Meta-Lean framework is reference-only — emerging/individual-dev).

---

### PATTERN INGEST-09 · Epic Clarity / Caboodle source ingestion (SQL Server warehouse → Bronze)

**Intent** — Ingest Epic's reporting databases — **Clarity** (normalized SQL Server reporting DB) and **Caboodle** (Epic's dimensional SQL Server data warehouse) — into the client's lakehouse Bronze layer. This is **real solution design: no off-the-shelf metadata template exists for Clarity/Caboodle**, so the source-config rows must be specified explicitly.

**Applies to** — Every Epic provider/health-system client. The single most common healthcare ingestion source. Domain composition with POPH/CLIN patterns.

**Solution shape** — Clarity and Caboodle are both **SQL Server** databases (Clarity = normalized operational-reporting; Caboodle = Kimball-style dimensional warehouse). Two viable ingestion paths:

1. **Lakeflow Connect SQL Server connector** (INGEST-05) — managed log-based CDC from the Clarity/Caboodle SQL Server instance into the client's Unity Catalog Bronze. MANAGED-OWN-DESTINATION.
2. **Log-based CDC** (INGEST-07) via SQL Server CDC where the connector isn't viable (network, version), landing change events into Bronze, then APPLY CHANGES to Silver. OWN.

**Because no off-the-shelf template exists, the control-table config rows are bespoke.** A Caboodle table onboarding row looks like:

```json
{
  "source_id": "caboodle.PatientDim",
  "source_type": "lakeflow_connector_sqlserver",   // or "sqlserver_cdc"
  "source_connection": "secret:caboodle-prod",
  "source_object": "dbo.PatientDim",
  "bronze_target": "client.bronze_epic.caboodle_patientdim",
  "load_mode": "merge",
  "cdc_keys": ["PatientDurableKey"],
  "sequence_by": "_SystemModifiedDate",            // Caboodle modify-timestamp
  "scd_type": 2,                                    // history on patient dim
  "dq_rules_ref": "dq.epic.caboodle_patientdim",
  "phi": true,                                      // drives Unity Catalog governance
  "schedule": "hourly"
}
```

A Clarity table row is analogous against Clarity's normalized tables (e.g., `PATIENT`, `PAT_ENC`), keying on Clarity's `*_ID` columns and using the source's update timestamp as `sequence_by`. Caboodle is generally preferred where its dimensional model already conforms the data; Clarity where you need the granular normalized source.

Design notes that make this real: (a) **PHI flag** on every row drives Unity Catalog masking/row-filter governance (hand off to GOV pack); (b) **incremental key + sequence column** must be chosen from actual Clarity/Caboodle metadata, not assumed; (c) **volume** — Caboodle/Clarity are large; use CDC, never full reloads (INGEST-07 anti-pattern); (d) **Epic version drift** — Clarity/Caboodle schemas change across Epic upgrades, so schema evolution (INGEST-14) and a Bronze raw-fidelity landing (INGEST-18) matter.

**Own-it vs rent** — **MANAGED-OWN-DESTINATION** (via the Lakeflow Connect SQL Server connector) or **OWN** (via log-based CDC). Either way the Epic data lands in the client's own Unity Catalog and the client owns the resulting Bronze/Silver tables and everything built on them. Contrast INGEST-17: an Innovaccer/Health Catalyst path would land Epic data on the *vendor's* cloud — disqualified.

**Where it sits** — Data plane, Bronze (raw Epic landing) → Silver (conformed). Lifecycle: Architecture (Clarity vs Caboodle decision, CDC strategy) → Mobilization (per-table config). PHI governance threads to GOV pack.

**Evidence anchors** —
- Path 1 connector: Lakeflow Connect SQL Server connector — https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/ (INGEST-05)
- Path 2: log-based SQL Server CDC + APPLY CHANGES (INGEST-07)
- *No off-the-shelf Clarity/Caboodle metadata template exists* — confirmed by the research; the config schema above is original solution design to be validated against the client's Epic instance metadata. Flag as **estimate — confirm keys/sequence columns against client's actual Clarity/Caboodle catalog.**

**Anti-patterns** — (1) *Assuming a turnkey Epic template* — there isn't one; this is real config design. (2) *Full reloads of Caboodle/Clarity* — use CDC. (3) *Routing Epic data through Innovaccer/Health Catalyst/Arcadia* — RENT, disqualified (INGEST-17); the client wouldn't own the pipelines or the intelligence layer. (4) *Guessing incremental keys* — derive from the actual Epic instance metadata. (5) *Skipping the PHI flag* — every Epic row is PHI-governed.

**Feeds artifacts** — Architecture target state (Epic ingestion design — the centerpiece for any Epic client); Business case (own-it Epic pipeline vs rented platform comparison); Mobilization (Clarity/Caboodle onboarding milestone); Governance plan (PHI handling); Risk register (Epic version drift, Preview-connector status).

**Maturity** — production-ready (the ingestion mechanics); the specific config schema is reference design to confirm against the client's instance.

---

### PATTERN INGEST-10 · Epic real-time via Epic-on-FHIR → dbignite (FHIR R4 → Delta)

**Intent** — Bring near-real-time Epic clinical data (not the batch Clarity/Caboodle reporting copy) into the lakehouse via Epic's FHIR API, landing structured FHIR R4 resources as Delta tables.

**Applies to** — Epic clients needing real-time or near-real-time clinical signals (e.g., live risk flags, ADT-driven workflows) rather than the hourly/daily Clarity/Caboodle reporting cadence. Composes with clinical/population-health domain patterns.

**Solution shape** — **Epic-on-FHIR** exposes Epic clinical data over the **HL7 FHIR R4** API. **dbignite** is an **open-source framework that transforms FHIR R4 bundles into Delta tables** on Databricks — parsing FHIR resources (Patient, Encounter, Observation, Condition, etc.) into queryable Delta schemas in the client's Unity Catalog. This gives a real-time/near-real-time Epic path alongside the batch INGEST-09 path; many clients run both (batch reporting copy + FHIR real-time for specific signals).

**Own-it vs rent** — **OWN.** dbignite is open-source, runs in the client's workspace, lands FHIR resources as Delta in the client's Unity Catalog. Client owns the FHIR-to-Delta pipeline and the data. (Epic-on-FHIR access itself is the client's existing Epic entitlement.)

**Where it sits** — Data plane, Bronze (FHIR resource landing) → Silver (conformed clinical model; often feeds an OMOP CDM build in the MODEL pack). Lifecycle: Architecture (real-time clinical strategy) → Mobilization.

**Evidence anchors** — dbignite is the open-source FHIR R4 → Delta framework for Databricks (publicly available on GitHub as a Databricks-ecosystem open project). Epic-on-FHIR is Epic's standards-based FHIR R4 API. *Flag dbignite maturity as emerging — open-source, validate activity and fit before committing.*

**Anti-patterns** — (1) *Using FHIR real-time for bulk historical loads* — FHIR APIs are poor for backfill; use Clarity/Caboodle (INGEST-09) for history, FHIR for real-time deltas. (2) *Hand-parsing FHIR JSON* when dbignite gives a tested resource→Delta mapping. (3) *Renting an FHIR-ingestion SaaS* when an own-it open framework exists.

**Feeds artifacts** — Architecture target state (real-time clinical path); Mobilization (FHIR pipeline milestone); composes with MODEL (OMOP CDM) and clinical domain patterns.

**Maturity** — emerging (dbignite open-source; validate before production commitment).

---

### PATTERN INGEST-11 · ERP ingestion — SAP / Oracle / Workday

**Intent** — Ingest enterprise ERP data (SAP, Oracle EBS/Fusion, Workday) into the client's lakehouse, choosing between managed connectors and log-based CDC per system.

**Applies to** — Finance, supply-chain, HR domains; cost-reduction and vendor-spend use cases. Workday HR/finance, SAP finance/logistics, Oracle financials.

**Solution shape** — Per-ERP path selection:

- **Workday** — **Lakeflow Connect** has a managed Workday connector (INGEST-05) landing into Unity Catalog. MANAGED-OWN-DESTINATION. Preferred where the connector covers the needed objects.
- **Oracle** — log-based CDC from Oracle (redo logs) into Bronze, then APPLY CHANGES to Silver (INGEST-07). OWN. (Check Lakeflow Connect connector availability/state at design time.)
- **SAP** — the special case. SAP's licensing and data model make direct table extraction contractually and technically fraught (the well-known SAP data-extraction licensing considerations around third-party access to SAP tables). Options: SAP's own sanctioned extraction/OData/Datasphere egress paths, or a Lakeflow Connect SAP path where available — but **always surface SAP licensing/extraction constraints in the architecture and risk register.** Do not assume raw table-level CDC against SAP is permissible without checking the client's SAP agreement.

All paths land in the client's own Unity Catalog; Silver conformance via the metadata framework (INGEST-02/03).

**Own-it vs rent** — **MANAGED-OWN-DESTINATION** (Workday connector, any managed ERP connector) or **OWN** (log-based CDC). Data lands in the client's Unity Catalog either way; client owns the products. SAP egress may route through SAP-sanctioned paths but the lakehouse destination remains client-owned.

**Where it sits** — Data plane, Bronze → Silver. Lifecycle: Architecture (per-ERP path + SAP licensing review) → Mobilization.

**Evidence anchors** —
- Workday connector + DB CDC: Lakeflow Connect — https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/ (INGEST-05)
- Oracle/other DB CDC: log-based CDC + APPLY CHANGES (INGEST-07)
- *SAP-specific licensing/extraction constraints* — flag as a known SAP consideration to validate against the client's SAP contract; **estimate — confirm with client SAP agreement.**

**Anti-patterns** — (1) *Assuming raw SAP table CDC is allowed* — SAP licensing may prohibit; check the agreement, surface in risk register. (2) *Building a bespoke ERP extractor* when a Lakeflow Connect connector covers it. (3) *Renting an ERP-analytics SaaS* that holds the data — RENT (INGEST-17).

**Feeds artifacts** — Architecture target state (ERP ingestion paths); Business case (ERP-data own-it line); Mobilization; Risk register (SAP licensing, connector states).

**Maturity** — GA / Preview varies by connector; SAP path is engagement-specific.

---

### PATTERN INGEST-12 · Streaming ingestion — Kafka/Confluent + Kinesis

**Intent** — Ingest event streams (Kafka/Confluent, AWS Kinesis) into the lakehouse continuously, landing them in Bronze for downstream Silver conformance.

**Applies to** — Real-time use cases: clinical device/ADT event streams, transaction/fraud streams, IoT/telemetry, clickstream. Any domain with an event backbone.

**Solution shape** — Two paths:

- **Kafka / Confluent → Databricks** — Structured Streaming / Lakeflow Declarative Pipelines read directly from Kafka topics into Bronze Delta tables. The control-table row sets `source_type = kafka`, the topic, and secret-scoped credentials.
- **Kinesis → Auto Loader** — Kinesis streams land to cloud storage and are picked up incrementally by Auto Loader (`cloudFiles`, INGEST-06), or read via the Structured Streaming Kinesis source. Control-table row points at the landing path/stream.

Either way, the stream lands in Bronze with exactly-once semantics; Silver conformance and CDC handling follow the metadata framework.

**Own-it vs rent** — **OWN.** Streaming reads run in the client's workspace into client Bronze tables. (Kafka/Confluent and Kinesis are the client's existing event infrastructure; the lakehouse ingestion of them is OWN.)

**Where it sits** — Data plane, Bronze landing (streaming) → Silver. Lifecycle: Architecture (streaming strategy) → Mobilization.

**Evidence anchors** — Kafka/Confluent and Kinesis are standard Structured Streaming / Lakeflow ingestion sources (Databricks ingestion docs: https://docs.databricks.com/aws/en/ingestion/). Kinesis-via-Auto-Loader composes with INGEST-06.

**Anti-patterns** — (1) *Micro-batch file dumps* of streams when direct streaming ingestion gives lower latency. (2) *No checkpoint/exactly-once discipline* — duplicate or lost events. (3) *Streaming everything* — if the use case is hourly, a batch path is cheaper than always-on streaming.

**Feeds artifacts** — Architecture target state (streaming tier); Mobilization (stream onboarding); FinOps (always-on streaming cost vs batch).

**Maturity** — production-ready.

---

### PATTERN INGEST-13 · Data quality enforcement at ingestion (DLT expectations + Great Expectations)

**Intent** — Enforce data-quality rules *as data is ingested*, quarantining or dropping bad records and surfacing DQ metrics, rather than discovering quality problems downstream.

**Applies to** — Every source, every domain. Regulated data (PHI, financial) especially.

**Solution shape** — Two complementary, open mechanisms:

- **DLT / Lakeflow expectations** — declarative `EXPECT` constraints attached to Bronze/Silver tables in Lakeflow Declarative Pipelines, with actions: **warn** (log + metric), **drop** (quarantine the row), or **fail** (halt the pipeline). In the metadata frameworks these are the `dq_rules.json` / `dq_rules_ref` rows (INGEST-02, INGEST-01) — DQ is declared per dataset, not hand-coded.
- **Great Expectations** — open-source DQ framework for richer expectation suites and data docs where DLT expectations aren't expressive enough; runs in the client workspace.

DQ runs *at ingestion*, so bad data is caught at Bronze/Silver boundaries with metrics emitted for monitoring.

**Own-it vs rent** — **OWN.** DLT expectations are native; Great Expectations is open-source (Apache 2.0). Both run in the client workspace; DQ rules and metrics are client-owned.

**Where it sits** — Data plane, at Bronze → Silver boundaries. Lifecycle: Architecture (DQ strategy) → Mobilization (per-dataset rules). Threads to GOV (data-quality controls) and MLOPS (data monitoring).

**Evidence anchors** — DLT/Lakeflow expectations (warn/drop/fail) are native to Lakeflow Declarative Pipelines and are the DQ mechanism in DLT-META's `dq_rules.json` (INGEST-02; https://github.com/databrickslabs/dlt-meta). Great Expectations is the standard open-source DQ framework (Apache 2.0).

**Anti-patterns** — (1) *DQ checks only downstream* — bad data already propagated; enforce at ingestion. (2) *Drop without quarantine + alert* — silent data loss. (3) *Hand-coded validation per pipeline* instead of declared `dq_rules` rows. (4) *Renting a DQ SaaS* that holds the rules/metrics when open mechanisms run in-workspace.

**Feeds artifacts** — Architecture target state (DQ tier); Data quality plan; Mobilization (per-dataset DQ backlog); Governance plan; MLOps monitoring.

**Maturity** — production-ready.

---

### PATTERN INGEST-14 · Schema evolution & contracts (Auto Loader schema hints + dlt schema contracts)

**Intent** — Handle source schema changes gracefully — accept benign additions, reject breaking changes on critical feeds — so upstream drift doesn't silently corrupt or halt the lakehouse.

**Applies to** — Every source that can change shape: Epic upgrades changing Clarity/Caboodle schemas (INGEST-09), SaaS API changes, ERP customizations. All domains.

**Solution shape** — Layer the controls:

- **Auto Loader** — schema inference, schema hints (pin types for known columns), schema evolution modes, and `_rescued_data` for unexpected fields (INGEST-06).
- **dlt schema contracts** — four modes per source: `evolve` (accept new columns), `freeze` (reject any schema change), `discard_row`, `discard_value` (INGEST-04). Choose per source: `freeze` on regulated/critical feeds, `evolve` on exploratory/long-tail.
- **Unity Catalog** as the schema-of-record so changes are visible and governed.

The mode is a deliberate per-source decision, recorded in the control table / contract config.

**Own-it vs rent** — **OWN.** Native Auto Loader + open-source dlt, both in the client workspace; schemas and contracts client-owned.

**Where it sits** — Data plane, Bronze landing (where drift first hits). Lifecycle: Architecture (contract mode per source) → Mobilization.

**Evidence anchors** —
- dlt schema contracts — four modes evolve/freeze/discard_row/discard_value: https://github.com/dlt-hub/dlt (INGEST-04)
- Auto Loader schema hints/evolution/`_rescued_data`: Databricks ingestion docs (INGEST-06)

**Anti-patterns** — (1) *`evolve` everywhere* — a breaking upstream change silently reshapes a regulated table; freeze critical feeds. (2) *`freeze` everywhere* — benign additions needlessly halt pipelines. (3) *Ignoring `_rescued_data`* — drift hides there unmonitored.

**Feeds artifacts** — Architecture target state (schema-governance posture); Data quality plan; Risk register (Epic version drift, API changes).

**Maturity** — production-ready.

---

### PATTERN INGEST-15 · Ingestion framework SELECTION DECISION MATRIX

**Intent** — Given a real mixed source estate (e.g., Epic + SAP + Salesforce + legacy DBs + REST APIs), choose the right *combination* of frameworks and define how they interoperate. Directly answers the open question the research flagged: "which framework, when, and how do they compose."

**Applies to** — Every engagement's Architecture phase. The composition decision that makes or breaks the ingestion design.

**Solution shape** — Map each source class to its default tool, all landing in the client's Unity Catalog and converging on a single metadata-driven Silver framework:

| Source class | Default ingestion path | Pattern | Posture |
|---|---|---|---|
| Epic Clarity/Caboodle (SQL Server) | Lakeflow Connect SQL Server connector → Bronze (or log-based CDC) | INGEST-09, 05, 07 | MANAGED-OWN-DEST / OWN |
| Epic real-time clinical | Epic-on-FHIR → dbignite → Delta | INGEST-10 | OWN |
| Salesforce / Workday / HubSpot / Jira | Lakeflow Connect managed connector → Bronze | INGEST-05 | MANAGED-OWN-DEST |
| SQL Server / MySQL / PostgreSQL OLTP | Lakeflow Connect DB CDC, or log-based CDC | INGEST-05, 07 | MANAGED-OWN-DEST / OWN |
| SAP / Oracle ERP | Connector where available, else log-based CDC; **SAP licensing review** | INGEST-11 | MANAGED-OWN-DEST / OWN |
| REST / API / long-tail SaaS | dlt extractors → Direct Load to Unity Catalog | INGEST-04 | OWN |
| File drops (CSV/JSON/Parquet) | Auto Loader (`cloudFiles`) → Bronze | INGEST-06 | OWN |
| Event streams (Kafka/Confluent/Kinesis) | Structured Streaming / Auto Loader → Bronze | INGEST-12 | OWN |

**How they compose (the key architecture decision):** all of the above land *raw* into **Bronze** in the client's Unity Catalog. A **single metadata-driven framework — DLT-META (INGEST-02) or the Databricks four-config reference (INGEST-03) — generates the Bronze-conform and Silver pipelines** that read those landed tables, applying CDC (INGEST-07), SCD (INGEST-08), and DQ (INGEST-13) declaratively from control-table config. So:

> **Lakeflow Connect / dlt / Auto Loader / streaming do the *landing* per source class; DLT-META (or the four-config reference) does the *generation of conform + Silver* for all of them uniformly.**

The connectors are the front door per source; the metadata framework is the uniform factory behind it. This is the default architecture for any mixed estate.

**Worked default for "Epic + SAP + Salesforce + legacy DBs":**
- Epic → Lakeflow Connect SQL Server connector (Caboodle/Clarity) + Epic-on-FHIR/dbignite for real-time
- SAP → SAP-sanctioned egress or log-based CDC (with licensing review)
- Salesforce → Lakeflow Connect Salesforce connector
- legacy DBs → Lakeflow Connect DB CDC where supported, else log-based CDC
- *all* → land in Bronze; **DLT-META generates the Silver pipelines** for the whole estate; dlt picks up any REST APIs.

**Own-it vs rent** — Composition spans OWN and MANAGED-OWN-DESTINATION; **no source class routes to RENT.** The convergence on a client-owned metadata framework + client-owned Unity Catalog destination guarantees the own-it posture across the whole estate.

**Where it sits** — Architecture phase, data-plane design. The defining ingestion-architecture artifact.

**Evidence anchors** — Composes INGEST-02 through INGEST-12; each row cites its source pattern. The convergence-on-metadata-framework model is the canonical Databricks pattern (INGEST-01; https://community.databricks.com/t5/technical-blog/metadata-driven-etl-framework-in-databricks-part-1/ba-p/92666).

**Anti-patterns** — (1) *Picking one tool for everything* — no single tool is best across files, APIs, DB CDC, and SaaS; compose. (2) *Letting each connector define its own Silver logic* — defeats uniformity; converge on one metadata framework for conform/Silver. (3) *Any row routing to a RENT platform* (INGEST-17). (4) *No SAP licensing review* in the matrix (INGEST-11).

**Feeds artifacts** — Architecture target state (THE ingestion-architecture decision); Business case (framework + connector effort model); Mobilization (sequenced onboarding plan by source class); Discovery (source-estate inventory feeds this matrix).

**Maturity** — production-ready.

---

### PATTERN INGEST-16 · SI IP-transfer pattern for ingestion accelerators

**Intent** — Ensure that when an SI builds or hardens a metadata-driven ingestion framework (e.g., hardens DLT-META, or forks the four-config reference), the **accelerator IP is assigned to the client**, not retained by the SI — so the own-it mandate holds contractually, not just technically.

**Applies to** — Every engagement where an SI delivers ingestion accelerators/frameworks. Contractual/Mobilization concern; feeds the business case.

**Solution shape** — The technical posture (open frameworks deployed in the client estate) is necessary but **not sufficient** for own-it — the *contract* must close the loop. The SI's statement of work must include an **IP-assignment clause** stating that:

- The **hardened framework, codegen, control-table schemas, and onboarding accelerators** built during the engagement are **assigned to (owned by) the client** — not licensed-back, not SI-retained.
- Where the SI brings a pre-existing proprietary accelerator, it must be either (a) replaced with the open own-it framework (preferred), or (b) explicitly carved out and surfaced as a RENT dependency requiring justification — never silently embedded.
- The client receives the **source, the deployment automation, and the runbook** so they can operate and extend it without the SI.

This is the contractual mirror of INGEST-02's "SI hardens, client owns" posture: the no-SLA Labs status is handled by SI hardening, and the IP-assignment clause guarantees the hardened result is the client's.

**Own-it vs rent** — This pattern *enforces* OWN. Its absence is how an engagement that looks own-it technically becomes RENT contractually (SI retains the accelerator and re-licenses it).

**Where it sits** — Contractual / Mobilization phase; feeds Business case. Not a data-plane pattern — a governance-of-the-engagement pattern.

**Evidence anchors** — Derives from the OWN-IT first principle (README): "after this is built, who owns the data products, the models, *and the IP*?" The frameworks are Apache-licensed (DLT-META, dlt, four-config reference — INGEST-02/03/04), so nothing blocks client ownership of derivatives; the IP-assignment clause makes ownership explicit.

**Anti-patterns** — (1) *SI retains the hardened framework* and re-licenses it back — the contractual RENT trap; the client paid to build IP they don't own. (2) *Proprietary SI accelerator embedded silently* — surfaces as lock-in later. (3) *No source/runbook handover* — client can't operate it without the SI, a soft form of rent.

**Feeds artifacts** — Business case (IP-ownership term as a value driver); Mobilization (SOW IP-assignment clause, handover deliverables); Governance (engagement-IP posture); Risk register (lock-in risk if absent).

**Maturity** — production-ready (contractual pattern).

---

### PATTERN INGEST-17 · The RENT anti-pattern — outsourced data platforms (disqualified)

**Intent** — Name, explicitly, the disqualified path so it can be cited as a rejected option in any artifact: adopting an outsourced SaaS data platform as the *destination* for the client's data.

**Applies to** — Especially healthcare (Innovaccer, Health Catalyst, Arcadia), but the pattern generalizes to any "we ingest your data onto our cloud and hand back insights" platform.

**Solution shape (what NOT to do)** — Platforms like **Innovaccer, Health Catalyst, and Arcadia** ingest the client's source data **onto the vendor's cloud**, run the **vendor's models**, and **hand back dashboards/insights.** The consequence, stated plainly (README worked example): *if you adopt one of these, you don't need a lakehouse — because the intelligence layer lives on the vendor's side.* The client does **not own the pipelines, the data residence, or the intelligence layer.**

This is the **opposite of MANAGED-OWN-DESTINATION** (INGEST-05): with Lakeflow Connect the *runtime* is managed but the *data lands in the client's own Unity Catalog* and the client owns everything built on it. With Innovaccer/Health Catalyst/Arcadia the *destination itself* is the vendor's platform — the data and intelligence leave the client estate.

**Own-it vs rent** — **RENT. Disqualified by default for an own-it mandate.** Adopting one requires an explicit, surfaced rationale (and even then, it forecloses the own-it lakehouse mandate, so it's typically a different engagement entirely).

**Where it sits** — A rejected option to cite in Architecture and Business-case artifacts, not a tier to build.

**Evidence anchors** — README OWN-IT first principle and worked example (lines 38–40): "Innovaccer / Health Catalyst / Arcadia ingest the client's data onto the *vendor's* cloud, run the *vendor's* models, hand back dashboards. … Disqualified for an own-it mandate."

**Anti-patterns** — This pattern *is* the named anti-pattern. The trap: a platform is pitched as "faster time to value," and the team adopts it without surfacing that it forecloses ownership of the pipelines and intelligence layer. Cite this pattern ID whenever an artifact rejects an outsourced-platform option.

**Feeds artifacts** — Architecture target state (rejected-options section, cited reason); Business case (own-it-vs-rent decision, TCO-plus-ownership argument); Discovery (flag if incumbent platform is one of these — migration scope).

**Maturity** — reference-only (a disqualified option, documented so it's citably rejected).

---

### PATTERN INGEST-18 · Medallion landing discipline — raw fidelity at Bronze

**Intent** — Land source data into Bronze with full raw fidelity (append-only, schema-faithful, with ingestion metadata) so Silver/Gold can always be rebuilt and source drift is recoverable.

**Applies to** — Every source, every domain. The discipline that makes all the other ingestion patterns auditable and replayable.

**Solution shape** — **Bronze** captures source data as-landed: append-only history, original schema (plus `_rescued_data` for unexpected fields), and ingestion metadata (`_ingest_timestamp`, `_source_file`/offset, `_batch_id`). No business transformation at Bronze — that belongs at **Silver** (conform, CDC-apply, SCD, DQ) and **Gold** (business aggregates / serving). This separation means:

- Silver/Gold are **always rebuildable** from Bronze (replay).
- Source **schema drift** (INGEST-14) lands non-destructively and is recoverable.
- **Audit/lineage** trace back to raw landed data (critical for PHI/regulated — threads to GOV).

The metadata frameworks (INGEST-02/03) enforce this Bronze→Silver→Gold separation structurally — the control table distinguishes Bronze vs Silver targets.

**Own-it vs rent** — **OWN.** Bronze/Silver/Gold are Delta tables in the client's Unity Catalog. Client owns the raw landing and every layer built on it.

**Where it sits** — Data plane; defines the Bronze layer and its boundary with Silver/Gold. Lifecycle: Architecture (medallion design) → Mobilization.

**Evidence anchors** — The medallion Bronze/Silver/Gold separation is the foundational Databricks lakehouse pattern that DLT-META and the four-config reference implement (INGEST-02/03). Raw-fidelity Bronze is what enables CDC replay (INGEST-07) and schema-drift recovery (INGEST-14).

**Anti-patterns** — (1) *Transforming at Bronze* — destroys replayability and audit trail. (2) *No ingestion metadata* — can't trace lineage or debug. (3) *Overwriting Bronze* — loses raw history; Bronze should be append-only/raw-faithful. (4) *Skipping Bronze* (landing straight to Silver) — no recoverable raw copy when a Silver transform turns out wrong.

**Feeds artifacts** — Architecture target state (medallion design); Governance/audit plan (lineage to raw); Mobilization; Data quality plan (rescue + replay).

**Maturity** — production-ready.

---

## How this pack composes with the others

A typical Epic + ERP + SaaS client ingestion design composes:

```
INGEST-15 (selection matrix — the spine)
   ├── INGEST-09 Epic Clarity/Caboodle  ─┐
   ├── INGEST-10 Epic real-time FHIR     │
   ├── INGEST-11 SAP/Oracle/Workday      ├─ land raw → Bronze (INGEST-18)
   ├── INGEST-05 Salesforce connector    │
   ├── INGEST-04 dlt REST/API            │
   ├── INGEST-06 Auto Loader files       │
   └── INGEST-12 Kafka/Kinesis streams  ─┘
              ▼
   INGEST-02 DLT-META (or INGEST-03 four-config)
      generates Bronze-conform + Silver, applying:
      INGEST-07 CDC · INGEST-08 SCD · INGEST-13 DQ · INGEST-14 schema contracts
              ▼
   INGEST-16 SI IP-assignment  → client owns the hardened framework
   (INGEST-17 RENT platforms explicitly rejected)
```

- → **ARCH** pack: the ingestion tier sits on the landing zone / data plane defined there.
- → **MODEL** pack: Silver feeds canonical models (e.g., OMOP CDM, MPI); INGEST-10 FHIR → MODEL OMOP.
- → **GOV** pack: PHI flags (INGEST-09), Unity Catalog governance, lineage from Bronze (INGEST-18).
- → **MLOPS** pack: DQ metrics (INGEST-13) feed data monitoring.
- → **FINOPS** pack: per-config-row onboarding effort model (INGEST-01) and streaming-vs-batch cost (INGEST-12).

---

## Provenance summary — every framework claim is sourced

| Claim | Source |
|---|---|
| DLT-META metaprogramming, onboarding.json/silver_transformations.json/dq_rules.json → DataflowSpec Delta, CLI onboard/deploy, Apache, v0.0.10/572 commits, Labs no-SLA | https://github.com/databrickslabs/dlt-meta · https://docs.databricks.com/aws/en/ldp/developer/dlt-meta · https://www.databricks.com/blog/chaos-scale-templatizing-spark-declarative-pipelines-dlt-meta |
| Four-config-table reference framework, codegen notebook, "1000s of pipelines" | https://community.databricks.com/t5/technical-blog/lakeflow-config-driven-framework-a-guide-to-building-scalable/ba-p/116841 · https://github.com/databricks-solutions/databricks-blogposts/tree/main/2025-04-lakeflow-config-driven-framework |
| dlt — schema inference/normalization, incremental, 4 schema-contract modes, runs in Databricks, Direct Load to Unity Catalog | https://github.com/dlt-hub/dlt · https://dlthub.com/docs/dlt-ecosystem/destinations/databricks |
| Delta-Live-Tables-Meta-Lean — Bronze CDC/DQ + Silver SCD1/SCD2 + Gold MV (individual-dev; successor Lakehouse_Plumber) | https://github.com/Mmodarre/Delta-Live-Tables-Meta-Lean |
| Lakeflow Connect — Salesforce/Workday/HubSpot/Jira + SQL Server/MySQL/PostgreSQL CDC into Unity Catalog, serverless, states vary | https://docs.databricks.com/aws/en/ingestion/lakeflow-connect/ |
| Control-table / metadata-table-driven design pattern | https://community.databricks.com/t5/technical-blog/metadata-driven-etl-framework-in-databricks-part-1/ba-p/92666 |
| RENT disqualification (Innovaccer/Health Catalyst/Arcadia) | pattern-packs/README.md OWN-IT first principle (lines 38–40) |

*Estimates flagged to confirm with client data:* INGEST-09 Clarity/Caboodle config keys/sequence columns (no off-the-shelf template — confirm against client's Epic instance); INGEST-11 SAP licensing/extraction constraints (confirm against client SAP agreement); INGEST-10 dbignite maturity (emerging — validate before production commit).
