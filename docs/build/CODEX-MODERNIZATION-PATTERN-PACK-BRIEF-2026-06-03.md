# Codex Brief — Data-Platform Modernization Pattern Pack (Research + Build)

**Owner:** Anand · **Date:** 2026-06-03 · **Mode:** multi-agent, parallel where independent
**Read first:** `docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md` (authoritative design) +
`docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md` (healthcare/retail/airline
estate profiles — same engine, three profiles).
**Coupled with:** `docs/build/MOVES_RATE_CARD_INGESTION_SPEC_2026-06-03.md` (the estimator the
modernization effort feeds). Treat the rate-card build and this pack as one program — the
modernization estimate is meaningless without the rate cards, and the rate cards need this pack's
effort archetypes to bite.

## Mission

Stand up a corpus **Data-Platform Modernization Pattern Pack** that lets AbarVa produce a CDAO's
independent house view (target architecture, approach, workload-level effort/complexity, cost
baseline) and an **RFP-evaluation lens** for SI bids — calibrated to Databricks' own
accelerated-migration methodology (BladeBridge/Lakebridge), so it is credible to the buyer and the
bidders. **AbarVa sits above the conversion tooling; it never re-scans or converts code.**

---

## TRACK A — Research (calibrate to reality; cite everything)

A1. **Databricks methodology currency.** Verify and capture (with URLs + as-of): Lakebridge/
BladeBridge Analyzer + Converter capabilities and **automation rates** by source type; the SAS→
Lakehouse blueprint; Brickbuilder Migration Solutions (which SIs, what they deliver); the
**Well-Architected Lakehouse 7 pillars** (the standards framework, spec §3); medallion + Unity
Catalog + DLT + Asset Bundle current guidance. Start from the sources in spec §8.

A1b. **Disposition + scorecard frameworks.** Capture the **7 R's** taxonomy + the re-platform/
re-architect effort premium over lift-shift, and standard **weighted RFP scorecard** dimensions/
weights for data-platform modernization (spec §1, §5). These drive the disposition policy and the
evaluation instrument.

A2. **Per-archetype conversion + automation benchmarks** (spec §1 A–F): for DataStage, stored
procs/SQL Server, SAS, marts, Tableau/BO — gather realistic automation % and the manual-residual
drivers. Note where third-party accelerators (LeapLogic, MigryX, LTIMindtree Scintilla, EXL) report
different numbers; record ranges, not single points.

A3. **SI approach divergence** — how Deloitte / Accenture / PwC-class firms typically frame an EDW→
Lakehouse modernization (lift-shift vs re-architect, automation leverage, onshore/offshore mix,
foundation vs build scoping). Feeds the RFP-evaluation lens (spec §5).

A4. **Effort heuristics** — convert the above into defensible T-shirt → person-week bands per
archetype × complexity (S/M/L) × automation leverage. Output a calibration table with sources.

**Track A acceptance:** a `MODERNIZATION_RESEARCH_NOTES.md` with cited benchmarks + the calibration
table; every heuristic traceable to a source + as-of; ranges where evidence varies; no invented
precision.

---

## TRACK B — Build (corpus pack + wiring)

Wire targets (verify in repo): corpus pattern packs (`docs/abarva-source/pattern-packs/` +
`docs/platform-design/pattern-operating-model/`), segment/template registries
(`src/lib/admin/setup-acts-registry.ts`, `src/lib/context-ingestion/template-registry.ts`), Moves
estimator (`src/lib/programs/expert-kernel/effort-estimator.ts`, `rate-card/*`), Source RFP/BAFO
(`src/lib/source/pricing-normalization-model.ts`, `stage-packs/S5_bafo.ts`), Data Loads ingestion
(`src/lib/admin/setup-data-broker.ts`).

B1. **Author the archetype library + the 3 industry estate profiles** (spec §1 + the profiles doc):
each archetype with target mapping, disposition (7 R's), conversion approach, automation leverage,
complexity drivers, effort heuristic + citations. Populate **healthcare (Epic/Clarity), retail
(POS/ERP/CDP), and airline (PSS/RM/ops)** estate profiles — same engine, industry-specific source
systems, dispositions, and compliance (HIPAA / PCI-CCPA / FAA-IATA). Each profile anchors its
greenfield stream to the existing industry AI use-case genome.

B2. **Analyzer-inventory intake** — define the schema to **ingest a Lakebridge/Analyzer-style
workload inventory** (tables/views/ETL jobs/stored procs/reports with complexity) through Data
Loads, so AbarVa estimates from real client data when available (spec §0 honesty rule).

B3. **Estimation engine** — implement the rubric (spec §3–4): fixed foundation + ingestion framework
(fixed + per-source) + per-workload variable → effort → **rate-card kernel** → cost baseline
(low/mid/high, 3-yr TCO), migration vs greenfield split. Honest empty states; planning-range labels.

B4. **Standards framework + RFP-evaluation lens** (spec §3, §5) — encode the Well-Architected
7-pillar adherence checklist + disposition policy as the SI-response template; implement the
**weighted scorecard** (tunable weights) that scores each SI bid across the dimensions; given the
baseline + N SI responses, normalize to common scope (reuse `pricing-normalization-model`) and emit
a **divergence report** (where each bid departs from the pillars + baseline) + BAFO question set
(reuse `S5_bafo` discipline).

B5. **Tests** — pure unit tests for the estimation rubric (fixed/variable decomposition, automation
leverage, migration/greenfield split, sourcing modes), the Analyzer-intake parser/validator, and
the RFP-normalization. Tenant isolation + honest-fallback tests.

B6. **Release record** + `npm run release:check`.

**Track B acceptance:** load a sample legacy-estate inventory for a test tenant → AbarVa emits a
target architecture, a workload effort/complexity breakdown, a cost baseline by sourcing mode, and
(given mock SI bids) a normalized divergence report. eslint + tsc + targeted jest green.

---

## Guardrails (non-negotiable)

- **AbarVa never re-scans/converts code** — it consumes the Analyzer inventory and adds the
  decision/value/cost/evaluation layer. Don't rebuild Lakebridge.
- **Build for pilot, not demo:** no fabricated numbers; calibrate to cited Databricks/partner
  benchmarks; planning-range labels; honest empty states.
- **Azure/Postgres data plane** (DATABRICKS is the client's target, not ours); broker boundary
  respected; tenant isolation; no prod DB mutation outside runners; typecheck-clean commits.
- Every heuristic carries source + as-of + confidence.

## Suggested agent split (parallel)
`research-databricks-methodology` · `research-archetype-benchmarks` · `research-si-approaches`
(Track A) ‖ `archetype-library-author` · `analyzer-intake+estimator` · `rfp-evaluation-lens+tests`
(Track B). Integrate + release last.

## Open item to confirm with the client
"Azure + Databricks on AWS" is contradictory — pin down Databricks-on-Azure (ADLS/ADF/Synapse-native)
vs Databricks-on-AWS (S3/Glue). It changes the native-service mapping and the estimate.
