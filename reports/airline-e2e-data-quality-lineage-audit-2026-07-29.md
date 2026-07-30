# Airline-demo-new — End-to-End Data Quality & Lineage Reconciliation Audit

**Audit date:** 2026-07-29 · **Tenant:** `airline-demo-new` · **Source release:**
`airline-demo-new-source-corpus-v1.0.0` · **Mode:** read-only, no mutation, no rebuild.

Proof bundle: `proof/airline-e2e-data-quality-lineage-audit-2026-07-29/` (`lineage.csv`,
`lineage.json`, `semantic-defects.csv`, `cube-lineage.csv`, `product-readiness-defects.md`,
`sql-readback.sql`).

---

## 1. Executive verdict

**airline-demo-new is a real, in-progress data-plane build that has cleared several genuine
governance gates, but it is not client-demo-ready, and the exact control totals this audit was
asked to cross-check are themselves under-corroborated.** Three findings dominate the verdict:

1. **Environment mismatch, first.** The repo checkout this audit was invoked against
   (`/Users/anand/Projects/nexus`, branch `feat/tower-tfamily-mart`) does **not contain** the
   airline-demo-new source corpus, execution evidence, or consumption contracts at all — only a
   truncated `21-processing-wave-execution/{00-state-probe,06-knowledge-validate}` stub. The full
   material exists only on unmerged `codex/airline-*` worktrees (confirmed: the commit that
   introduces `clients/airline-demo-new/19-template-instantiation-source-corpus` is not an
   ancestor of the current branch's HEAD). This audit used the most complete, most recently
   committed such worktree — `nexus-tenant-sunset-20260729` (branch
   `codex/fix-aca-hygiene-transient-20260729`, HEAD `334395fbd`, 2026-07-29 14:46 local) — as its
   read root, and cross-checked it against ~10 sibling worktrees for consistency. This is a
   process finding in its own right: **work this consequential is sitting outside `main` across
   more than a dozen parallel worktrees with no single merged source of truth.**
2. **The three headline control totals are real but under-corroborated.** `review_decisions:
{accepted: 112201, deferred: 152029, rejected: 0}` and the baseline/projection hashes given in
   this audit's brief match exactly one file in the entire repository:
   `foundation-closure-authority-record-20260729.json`. No raw execution log anywhere in the
   repository shows a successful review-decision-apply run producing these numbers. The one raw
   execution log that **does** exist for that pipeline stage
   (`knowledge-review-via-validate-job-20260728-logs.txt`, dated one day earlier) recorded
   `status: "failed_process"`, `error.code: "process_verification_failed"`,
   `blockers: ["no_explicit_accepted_review_decisions"]`. The authority record explains this by
   saying raw logs for the successful 2026-07-29 run were deliberately kept out of git ("operator
   proof bundle") — a defensible operational choice, but it means, from this audit's read-only,
   repo-only vantage point, these totals are **ONE_SOURCE / asserted, not independently verified**
   (see §6, §10 SD-10). Per AGENTS.md's own fact-lineage discipline, that distinction must be
   stated whenever these numbers are quoted, and this report does so throughout.
3. **The data that did land is real, but the consumption/Cube layer has confirmed contract
   drift and at least two full-family projection failures.** Applications, vendors, and
   relationships reconcile plausibly from source to projection. KPIs/metrics (420 source rows →
   0 published) and risk-driven evidence gaps (650 source rows → 0 published) do not. Two
   populated projection tables feeding live Cube measures (`data_product_inventory_v1`,
   `technology_estate_v1`) are not declared in the governed `CONSUMPTION_PROJECTION_REGISTRY.json`
   contract at all. Full detail in §5, §6, §8, §10.

**The one unambiguous good-news finding**: `airline-demo-new` is correctly **not wired into any
product surface yet** (confirmed absent from `CANONICAL_TENANTS.ts` on every branch checked). No
end user is looking at any of these gaps today. That is the only reason this is a "fix before
demo" report and not a "live incident" report.

**Sections completed fully vs. partially — see §13 note; DB-reachability finding — see §2.**

---

## 2. Data-flow map

```
CLIENT INTAKE (synthetic, not real client evidence)
  01-template-workbooks/*.xlsx (templates, not sampled — see gap below)
  02-synthetic-enterprise/*.md (enterprise profile narrative; no structured interview CSV exists)
        |
        v
SOURCE ADAPTERS / SOURCE CORPUS DESIGN
  03-source-corpus-design/synthetic-source-samples/*.csv  (25 files, ~110,895 rows total)
  parser-visible-source-manifest.csv  (only enumerates 10/25 files — SD-11, design-doc gap)
  04-restricted-evaluator-design/  (hidden-canonical-truth-sample.json: 311 objects;
     source-to-truth-crosswalk.csv: 338 rows — evaluator-only, confirmed NOT parser-visible,
     no leakage found in a full grep sweep)
        |
        v  [freeze: execution/airline-demo-new-source-corpus-v1.0.0.freeze-manifest.json,
             approved 2026-07-27 by Anand Sundaram, source commit 009ca3b68, PR #5684]
        v
AZURE LANDING (rg-abarva-airdn-lab-eus2-001, private VNet)
  source_registry.source: 25 rows, parser_visible=25, parsed=25/25 (100%) — VERIFIED, raw psql
     output captured 2026-07-28T00:24Z (sql-readback.sql §1)
        |
        v
WORKING CANDIDATES (Postgres, private)
  entity_candidate=99,015 · fact_candidate=99,015 · relationship_candidate=66,200
  Total = 264,230 — VERIFIED, raw psql output captured 2026-07-28T00:45Z
        |
        v  [review-decision-apply — see §6/§10 SD-10 for corroboration caveat]
        v
REVIEW DECISION LEDGER
  accepted=112,201 · deferred=152,029 · rejected=0  (asserted by one summary record only)
        |
        v
CANONICAL MODEL / DOMAIN PUBLICATION
  domain-publication-v1: accepted_entities=34,534 · accepted_facts=37,000 ·
    accepted_relationships=16,605
        |
        v
KNOWLEDGE BASELINE (active)
  knowledge-baseline-v1, hash 135d860b...5549425549
        |
        v
CONSUMPTION PROJECTION (knowledge-consumption-core-v1)
  114,566 rows across 12 reported objects (§5, §8) — 2 objects populated but UNGOVERNED
  (data_product_inventory_v1, technology_estate_v1); at least 4 registry-declared objects
  (executive_perspective_v1, strategic_interpretation_v1, metric_observation_v1,
  module_knowledge_packet_v1) absent from the reported breakdown entirely
        |
        v
PRODUCTS
  Home / Source / Intelligence / Moves / Tower / Cube / Superset / Observable
  → NONE currently consume this tenant. `airline-demo-new` absent from CANONICAL_TENANTS.ts.
  → Operations & Vendor Exposure Superset/Observable package explicitly status: "dormant".
```

---

## 3. Source-family quality matrix

Full per-family detail (source file, measured row count, designed projection destination,
plausibility, sample evidence) is in `proof/.../lineage.csv`. Summary:

| Family                          |   Source rows (measured) | Planned scale (`PACKAGE_MANIFEST.json`) | Designed destination                               |                             Actual published count | Verdict                                                 |
| ------------------------------- | -----------------------: | --------------------------------------: | -------------------------------------------------- | -------------------------------------------------: | ------------------------------------------------------- |
| Applications/platforms          |                    1,495 |                                   1,495 | `application_inventory_v1`                         |                                              1,405 | Plausible (6.0% review attrition)                       |
| Infrastructure/cloud            |                   10,000 |                                  10,000 | **none found**                                     |                                                  — | **Gap** — largest family, no destination                |
| Data/analytics/AI               |                    1,250 |                                   1,250 | `domain_summary_v1` (per mapping doc)              |     `data_product_inventory_v1`=6,580 (undeclared) | **Contract drift**                                      |
| Integrations                    |                    6,200 |                                   6,200 | none confirmed                                     |         possibly folds into `relationship_edge_v1` | Unverified                                              |
| BI reports                      |                    6,200 |                                   6,200 | none found                                         |                                                  — | **Gap**                                                 |
| Vendors                         |                      420 |                                     420 | `vendor_contract_inventory_v1`                     |                                                420 | **Exact match**, strongest result                       |
| Contracts                       |                      820 |                                     820 | same object as vendors                             |                                420 (=vendor count) | **Gap or grain ambiguity**                              |
| SLAs/incidents                  |                        9 |                       (part of ops:420) | none found                                         |                                                  — | **Gap**                                                 |
| Workforce/roles                 |                    9,500 |                                   9,500 | none found                                         |                                                  — | **Gap**                                                 |
| Programs                        |                      190 |                                     190 | `module_knowledge_packet_v1` (provisional mapping) |                                       not reported | **Gap**                                                 |
| Risks                           |                      650 |                                     650 | `evidence_gap_v1` (confirmed mapping)              |                                                  0 | **Confirmed pipeline failure**                          |
| Controls                        |                    1,900 |                                   1,900 | none mapped anywhere                               |                                                  — | **Gap**                                                 |
| KPIs/metrics                    |                      420 |                                     420 | `metric_observation_v1` (registry)                 | `metric_catalog_v1`=0 (different, undeclared name) | **Confirmed pipeline failure**                          |
| Source procurement evidence     |         9×4 + 27×6 = 198 |                            (ops family) | none found                                         |                                                  — | Content correctly self-flags as deferred-worthy (SD-09) |
| Relationships/graph             |                   60,000 |                                  60,000 | `relationship_node_v1`/`edge_v1`                   |                                    34,534 / 16,605 | Plausible consolidation, best-corroborated              |
| Industry overlays               |       not sampled (xlsx) |                                       — | —                                                  |                                                  — | Not examined this pass                                  |
| Interview/current-state signals | 0 CSVs (1 narrative .md) |                                       — | `executive_perspective_v1`                         |                                       not reported | **Structural gap** — no structured artifact exists      |
| Enterprise profile              |          1 narrative .md |                                       — | `enterprise_identity_v1`/`enterprise_brief_v1`     |                                              1 / 1 | Plausible                                               |

**Of 16 required families, 4 reconcile plausibly (applications, vendors, relationships,
enterprise profile), 2 have a confirmed mapping that produced zero output (risks, KPIs), 1 has
undeclared-but-populated destination (data/analytics), and the remaining ~8 (infrastructure,
integrations, BI reports, SLAs, workforce, programs, controls, interview signals) have no
confirmed destination traceable from repo artifacts at all.**

---

## 4. Item-level lineage coverage

**Methodology and coverage, stated plainly:**

- **Row-count reconciliation: exhaustive (100%) per family.** Every one of the 25 source CSVs
  was counted directly (`wc -l` / Python `csv.DictReader`, header excluded) rather than trusting
  any self-reported total, and cross-checked against `PACKAGE_MANIFEST.json`'s planned scale and
  against `independent-semantic-audit.json`'s own arithmetic (procurement file counts matched
  exactly; `service_volume-baseline.csv` measured 220 rows against a planned "ops":420 — a 52%
  shortfall the corpus's own validation docs do not mention).
- **Qualitative field-level sampling: representative, not exhaustive.** 20 hand-picked,
  fully-cited items across all 16 families plus enterprise profile and industry overlay are in
  `lineage.csv`/`lineage.json`, each chosen specifically to surface a defect or confirm a clean
  match — this is a defect-finding sample, not a random statistical sample, and should not be
  read as "X% of rows are fine."
- **Independent recomputation, exhaustive over specific claims.** A parallel research pass
  recomputed (not copied) `relationship_origin_type_count=14`, `application_origin_share=0.05`,
  and 100% ID-endpoint resolution across all 14 ID-bearing relationship object types directly
  from the raw 60,000-row `relationship-load-template.csv` — all matched the corpus's own
  validation claims exactly, with one caveat: two object types (`capability`, `service_tower`,
  12,000 of 60,000 rows combined) have no ID-backed source catalog and were excluded from the
  "0 broken endpoints" claim's scope without that exclusion being stated in the validation
  report itself.
- **Item-level DB-internal ID lineage: not traceable from this environment, and marked so
  explicitly.** `parser_record_id`, `evidence_id`, `candidate_id`, `canonical_object_id`,
  `projection_row_id` are `lineage_gap` for every sampled item in `lineage.csv`. This is not
  because the audit skipped a step — it is because **no per-row lineage export exists anywhere
  in the checked-in repository** for the operational-landing families (only the
  restricted-evaluator crosswalk carries stable per-row IDs, and that crosswalk is scoped to the
  evaluator truth path, not the operational pipeline). Live Postgres was unreachable (§ below),
  so these fields could not be filled from a live query either. **This is flagged as a design
  defect per this audit's own instructions**: a governed data pipeline moving ~264,000 review
  decisions through five transformation stages (candidate → entity/fact/relationship → domain
  publication → baseline → projection) should be able to answer "show me every hop for this one
  row" without a live DB session, and today it cannot, from anything checked into the repo.

**DB reachability finding:** Direct TCP/DNS resolution of
`pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com` failed (private-DNS-only, as
AGENTS.md's VNet-private design predicts). The AGENTS.md-sanctioned break-glass
(`az containerapp exec`, read-only) was checked and found **unavailable**: `az containerapp list
--resource-group rg-abarva-airdn-lab-eus2-001` returned an empty list — the resource group has
only ACA **Jobs** (`job-airdn-*`, run-on-demand batch), not standing Container Apps with running
replicas to exec into. Triggering a new job execution to create something to exec into would
itself be a code-execution/mutating action, which this audit's hard rules forbid. **Conclusion:
live DB verification was genuinely, not just conveniently, unavailable in this environment.**
Full annotated queries (both the ones actually run by a prior operator, evidenced from raw logs,
and the ones this audit would run given access) are in `proof/.../sql-readback.sql`.

---

## 5. Semantic quality findings

See `proof/.../semantic-defects.csv` for all 15 defects with full evidence citations. Highlights
(severity in parentheses):

- **(critical)** SD-10 — control totals asserted by one self-reported record, contradicted in
  timing by the one raw execution log available for that stage (§1, §6, §10).
- **(high)** SD-04 — `data_product_inventory_v1` (6,580 live rows, feeds a real Cube measure) is
  not declared in the governed consumption contract at all.
- **(high)** SD-05 — `evidence_gap_v1` is 0 rows against a confirmed 650-row risk mapping.
- **(high)** SD-06 — KPI family (420 rows, exact scale match) has no working path to any
  populated metrics projection under any of its three inconsistently-named candidate tables
  (`metric_catalog_v1`, `metric_observation_v1`, and the source CSV itself).
- **(high)** SD-03 — the single largest source family (infrastructure/cloud, 10,000 rows) has no
  traceable consumption destination anywhere in the registry or the published counts.
- **(medium)** SD-01/SD-02 — identity/domain correctness defects: a data-quality flag
  (`'regional duplicate'`) stored as a business `application_type`, and a `service_tower` label
  that disagrees between an application and its own linked contract for the same `contract_id`.
- **(medium)** SD-07 — `vendor_contract_inventory_v1` row count (420) matches vendor count
  exactly, not the 820-row contract count; grain is undocumented.
- **(medium)** SD-11 — the design-time "parser-visible source manifest" enumerates only 10 of
  ~25 actually-landed source files (the live DB registry, per the one verified psql query in
  §4, is more complete than this document).
- **(medium)** SD-12/SD-13 — a Cube measure (`vendor_concentration_pct`) with a literal `null`
  SQL stub is bound to a live dashboard tile, and a dormant dashboard's semantic-binding file
  references Cube domain names that don't exist in the shipped Cube YAML.
- **(positive)** SD-09 — procurement scorecards and vendor proposals are honestly self-labeled
  as non-final in the source data itself, consistent with correct deferred-by-design intent
  (pipeline-level confirmation not possible without live DB access).
- **(positive)** SD-15 — the tenant is correctly not wired into any product surface, matching
  the freeze manifest's explicit prohibition.

---

## 6. Accepted/deferred classification audit

**A policy-language gap, stated first:** the specific "accepted = deterministic/routine, deferred
= commercial interpretation" rule this audit was given to apply was **not found documented
anywhere inside the airline-demo-new corpus package itself** (`AIRLINE_SOURCE_FAMILY_STRATEGY.md`,
`DECISION_MEMO.md`, `SOURCE_LAYER_BOUNDARY_MATRIX.csv`, and the hidden-truth design doc were all
grepped for "accepted", "deferred", "commercial interpretation" with no hits). That rule appears
to live in this audit's own brief / broader repo governance, not in the tenant's own design
package — worth reconciling so future corpus authors can self-check against the same rule.

**Applying the rule to the data anyway:**

- Procurement scorecards (`procurement-evaluation-scorecards.csv`) carry an explicit
  `evaluator_note: "synthetic scorecard; final decision requires baseline and risk-owner
signoff"` on every sampled row — textbook deferred content, and the source data says so about
  itself.
- Vendor proposals (`procurement-vendor-proposals.csv`) carry marketing/commercial-posture
  language (`"stabilize first, automate after baseline proof"`, `"premium assurance"`) —
  correctly deferred-shaped content.
- Applications, vendors, and relationships are deterministic source-derived inventory —
  correctly accepted-shaped content, and their published row counts are the ones that reconcile
  most plausibly (§3, §8).
- **What could not be confirmed**: whether the actual review pipeline honored this classification
  per row. The 264,230-candidate ledger split (112,201 accepted / 152,029 deferred / 0 rejected,
  57.6% deferred) is directionally consistent with a corpus that is majority index/range-disclosed
  commercial content — but no per-family or per-candidate-type breakdown of that split exists in
  any repo artifact (see `sql-readback.sql` §2.1 for the exact query that would close this gap).
  **No specific item was found where an accepted item should clearly have been deferred, or vice
  versa** — but that is a statement about what evidence exists to check against, not a clean bill
  of health, given the missing breakdown.

---

## 7. Relationship/graph quality audit

60,000 relationship rows, 14 `from_object_type` values, 19 `relationship_type` values in
perfectly uniform 3,000/6,000-row buckets — **a controlled dictionary, not free text**
(`semantically_matched` for type discipline). For 12 of the 14 object types, 100% of both
`from_source_native_id` and `to_source_native_id` values resolve to real IDs in their respective
source CSVs (independently recomputed, not copied from the corpus's own validation report).

**Two object types are not traceable to any source catalog:**

- `capability` (3,000 rows, e.g. `"station recovery"`, `"disruption recovery"`) — free-text
  labels with no backing CSV anywhere in the 25-file corpus. Status: `wrong_relationship` /
  `lineage_gap` (SD-08). If these reached the accepted 16,605 published edges, they are graph
  nodes with no evidence trail — the "relationship graphs with meaningless nodes" failure mode
  this audit was specifically asked to catch. Whether they were in fact accepted or deferred is
  unverified (needs `sql-readback.sql` §2.7).
- `service_tower` (9,000 rows, e.g. `"Corporate and SAP AMS"`) — not ID-backed, but the same
  ~5 label values recur consistently as a `service_tower` column across three other source
  files, so the vocabulary is at least internally consistent (`semantically_matched` with a
  caveat, lower severity than `capability` — SD-14). One concrete inconsistency was found: the
  same `contract_id` (`CONT-AIRDN-0002`) carries a different `service_tower` value on its linked
  application row vs. its own contract row (SD-02) — a within-corpus contradiction, not a
  structural gap.

The 60,000-row relationship table plausibly consolidates to the published 34,534 nodes / 16,605
edges (order-of-magnitude consistent with the working ledger's `relationship_candidate=66,200`,
raw-verified 2026-07-28), and `accepted_relationship_count` is one of only 4 measures the
foundation-closure record claims passed live Cube/Postgres parity — the best-corroborated
relationship-layer result in this audit.

---

## 8. Cube lineage and parity audit

Full detail in `proof/.../cube-lineage.csv`. The governed `CONSUMPTION_PROJECTION_REGISTRY.json`
declares **14** consumption objects. `knowledge_consumption_model.yml` (the Cube semantic model)
defines **7** models covering **15** measures/dimensions against those objects. The actual
published projection (`foundation-closure-authority-record-20260729.json`) reports **12**
populated object counts. Reconciling all three:

- **Registered + populated + plausible**: `enterprise_brief_v1`, `enterprise_identity_v1`,
  `domain_summary_v1`, `application_inventory_v1`, `vendor_contract_inventory_v1`,
  `relationship_node_v1`, `relationship_edge_v1`, `relationship_evidence_v1`,
  `search_document_v1`.
- **Registered but absent from the populated-count breakdown entirely** (status unconfirmed,
  likely 0 or unbuilt): `executive_perspective_v1`, `strategic_interpretation_v1`,
  `metric_observation_v1`, `module_knowledge_packet_v1`. The last of these directly backs the
  Cube `ProgramRiskControl` model's two measures (`program_at_risk_count`,
  `decision_readiness_score`) — **both measures are cube_gap: querying a table with no
  confirmed rows.**
- **Populated but NOT registered anywhere in the governed contract** (contract drift):
  `data_product_inventory_v1` (6,580 rows, backs `DataAnalyticsEstate.data_product_count`) and
  `technology_estate_v1` (1,405 rows — identical to the application count, suggesting it may be
  a denormalized copy of `application_inventory_v1` rather than a distinct infra/integration
  object — backs `TechnologyEstate.integration_count`, which itself actually reads
  `relationship_edge_v1`, not `technology_estate_v1`, per the YAML's `sql_table` override).
- **`evidence_gap_v1` and `metric_catalog_v1`**: both registered/reported and both exactly **0**
  rows against confirmed non-trivial source mappings (650 risks, 420 KPIs respectively) — see
  §5, §6.
- **`vendor_concentration_pct`**: the Cube measure's SQL body is the literal string `"null"` — a
  stub bound to a live (if currently dormant) dashboard tile (SD-12).
- **Parity check result** (`cube_postgres_parity` in the closure record): `passed_count: 4,
failed_count: 0, not_applicable_count: 4`, naming only 4 passed measures
  (`application_count`, `vendor_count`, `accepted_relationship_count`,
  `open_critical_gap_count`) out of 15 measures defined in the YAML. **7 of 15 defined measures
  have no reported parity status at all** — neither passed, failed, nor explicitly
  not_applicable. This audit could not determine which 4 were marked `not_applicable` or why,
  because no per-measure breakdown was found in any checked-in artifact.
- The **Operations & Vendor Exposure** Superset/Observable package (`clients/shared/
22-operations-vendor-analytics/`) is explicitly `status: "dormant"` and references two Cube
  domain names (`RiskControlPortfolio`, `ProgramPortfolio`) that do not exist in the shipped
  model (only the combined `ProgramRiskControl` does) — SD-13, currently harmless only because
  the package is dormant.

**Bottom line: of the Cube's 15 defined measures, 2 are the best-verified numbers in the whole
audit (`application_count`, `accepted_relationship_count`), 2 read from tables with confirmed-zero
rows despite real source mappings, 2 read from an undeclared/ungoverned table, 2 read from a
table with no confirmed rows at all, 1 is a literal SQL stub, and 7 have no parity status
reported anywhere.**

---

## 9. Product-readiness defects

Full detail in `proof/.../product-readiness-defects.md`. Headline: **there are no live defects
today because `airline-demo-new` is not wired into any product surface** (confirmed absent from
`CANONICAL_TENANTS.ts` on every branch checked, consistent with the freeze manifest's explicit
prohibition on wiring before baseline publication proof). The file documents nine forward-looking
defects that would surface the moment wiring happens if §5/§8's gaps are not fixed first: empty
KPI panels, a false "0 critical gaps" signal, an ungoverned table feeding a live Home number, an
always-null vendor-concentration tile, a relationship graph with unbacked `capability` nodes, a
data-quality flag masquerading as a business taxonomy value, contradictory `service_tower`
labels between linked records, an incomplete parser-visible manifest, and a dashboard
semantic-binding file that references non-existent Cube domains.

---

## 10. Top 25 quality defects by severity

Full table with evidence and downstream location: `proof/.../semantic-defects.csv` (15 named
defects, SD-01 through SD-15) plus the following 10 additional items surfaced only in this
narrative report (not independently line-itemized in the CSV because they are process/coverage
findings rather than single-item data defects):

1. **(critical)** SD-10 — review-decision control totals corroborated by one self-reported
   record only, contradicted in timing by the sole available raw execution log.
2. **(critical)** Repo/environment mismatch — the audited tenant's entire data-plane build lives
   outside `main` across 10+ unmerged worktrees with no single source of truth (§1).
3. **(high)** SD-04 — `data_product_inventory_v1` (6,580 rows) feeding a live Cube measure with
   zero governance contract coverage.
4. **(high)** SD-05 — `evidence_gap_v1` = 0 rows against a confirmed 650-row risk mapping.
5. **(high)** SD-06 — KPI family full-pipeline failure (420 source rows → 0 anywhere
   downstream, under three inconsistently-named candidate objects).
6. **(high)** SD-03 — infrastructure/cloud (10,000 rows, largest family) has no traceable
   destination at all.
7. **(high)** 7 of 15 Cube measures have no reported parity status (passed/failed/not_applicable
   all unaccounted) — §8.
8. **(high)** SD-08 — 3,000 `capability`-origin relationship edges with no backing source
   catalog; unconfirmed whether they reached production.
9. **(medium)** SD-07 — `vendor_contract_inventory_v1` grain ambiguity (420 vs. 820).
10. **(medium)** SD-11 — parser-visible-source-manifest.csv covers 10/25 files.
11. **(medium)** SD-01 — `application_type='regional duplicate'` (QA flag as business value).
12. **(medium)** SD-02 — `service_tower` disagreement between linked application/contract rows.
13. **(medium)** SD-12 — `vendor_concentration_pct` Cube measure is a literal null stub, bound
    to a live tile.
14. **(medium)** SD-13 — dashboard binding references non-existent Cube domain names.
15. **(medium)** SD-14 — `service_tower` relationship endpoints are label-only, not ID-backed.
16. **(medium)** `service_volume-baseline.csv` measured 220 rows against a planned "ops":420 —
    52% shortfall not mentioned in the corpus's own validation docs.
17. **(medium)** No per-family or per-candidate-type breakdown exists for the 112,201/152,029
    accepted/deferred split anywhere in the repo — §6.
18. **(medium)** `module_knowledge_packet_v1` (backs the `ProgramRiskControl` Cube model,
    provisional-confidence mapping for 190 program rows) has no confirmed populated status.
19. **(low)** Programs, controls, workforce, BI reports, integrations, SLA/incident history —
    5 families with no confirmed consumption destination, lower severity than infra/KPI/risk
    only because they are smaller or already deferred-shaped by design.
20. **(low)** SD-09 — procurement content correctly self-labels as non-final (positive, but
    unconfirmed at the pipeline level).
21. **(low)** No structured interview/current-state-signal source artifact exists — only a
    single narrative markdown file — for a family this audit's own minimum-coverage list
    requires.
22. **(low)** Industry-overlay template workbook not sampled this pass (time-budget gap, flagged
    for follow-up, not a confirmed defect).
23. **(informational)** `tmp-airline-metric-parity-current-20260728.yaml` at the main repo root
    is a job manifest for a script invoked with `--apply` (not obviously read-only) — left over
    from a prior session; not run, but worth cleaning up so it isn't mistaken for a proof
    artifact.
24. **(informational)** SD-15 — tenant correctly absent from `CANONICAL_TENANTS.ts` (positive
    finding, listed here for completeness of the severity-ranked view).
25. **(informational)** The raw psql diagnostic evidence that IS in the repo (parser-visible
    count, hidden-truth-leakage check, broken-relationship check, all 2026-07-28) is
    high-quality, dated, and genuinely corroborating — the gap is specifically in the
    review-decision-apply stage's evidence trail, not a blanket absence of real verification
    across the whole pipeline.

---

## 11. What must be fixed before client demo

1. Close SD-10: produce or re-derive the raw per-type accepted/deferred breakdown for the
   review-decision ledger (via `sql-readback.sql` §2.1) so the headline control totals are
   independently verifiable, not just attested.
2. Fix or explicitly document the grain and governance of `data_product_inventory_v1` and
   `technology_estate_v1` (SD-04) — register them in `CONSUMPTION_PROJECTION_REGISTRY.json` with
   a real `source_publication`, or stop the Cube model from reading them.
3. Re-run (or diagnose why) the risk→`evidence_gap_v1` pipeline produced 0 rows against 650
   source risks (SD-05) — this is the single most demo-visible defect, since it would show as a
   false "no open risks" signal to an executive audience.
4. Wire KPIs (SD-06) into a real, single, consistently-named metrics projection, or remove the
   KPI-facing UI surface until they are.
5. Resolve the infrastructure/cloud family's missing destination (SD-03) — the largest source
   family by row count cannot remain untraceable.
6. Fix `vendor_concentration_pct`'s null stub before activating the Operations & Vendor Exposure
   package (SD-12), and fix its Cube-domain-name mismatch (SD-13).
7. Confirm whether the 3,000 `capability`-origin relationship rows reached production
   (SD-08) — if so, either back them with a real capability catalog or exclude them.
8. Resolve `vendor_contract_inventory_v1`'s grain ambiguity (SD-07) before any contract-level
   Cube measure (`active_contract_count`, `contract_renewal_exposure`) is trusted.

## 12. What is safe to keep frozen

- The **zero-data certification, schema/RLS conformance, and infrastructure apply record**
  (`20-phase1-azure-infrastructure-execution-package/`) — well-evidenced, dated, raw command
  output, no concerns raised by this audit.
- **Source landing and parsing**: 25/25 sources registered and parsed, raw-verified
  (2026-07-28T00:24Z query, §4). No hidden-truth leakage into parser-visible tables, raw-verified
  the same run.
- **Hidden-truth / restricted-evaluator separation design**: 311 hidden-truth objects, 338
  crosswalk rows, correct 1:1 ID correspondence, no boilerplate leakage, and the one
  intentionally-unsupported control case (`unsupported_hidden_truth`) correctly has no
  crosswalk row.
- **Applications, vendors, and relationships as source families** — the three
  best-corroborated data domains in this audit; safe to build on without re-litigating.
- **The tenant's non-wiring into product surfaces** — correctly frozen as not-yet-live; do not
  change this until §11's items are closed.

## 13. What must not be promoted

- **Do not wire `airline-demo-new` to any product surface** (Home, Source, Intelligence, Moves,
  Tower, Cube, Superset, Observable, aVa) until SD-04, SD-05, SD-06, SD-07, and SD-10 are
  resolved — each would produce a materially misleading or empty user-facing signal today.
- **Do not activate the Operations & Vendor Exposure Superset/Observable package** while it is
  bound to a null-stub measure and mismatched Cube domain names (SD-12, SD-13).
- **Do not quote the 112,201 / 152,029 / 0 review-decision totals, or any number derived from
  them, as independently verified** in any client-facing or governance artifact until either
  live DB access closes SD-10, or the "operator proof bundle" referenced in the authority record
  is produced for independent review. Quote them as "reported by the foundation-closure authority
  record, not independently re-verified in this audit" if they must be cited at all.
- **Do not treat `parser-visible-source-manifest.csv` as the authoritative inventory of what was
  landed** (SD-11) — it undercounts by more than half; use the live `source_registry.source`
  count (25/25, verified) instead.

---

### Sections completed fully vs. partially (summary)

- **Fully completed, corpus/file-based**: §2 (data-flow map), §3 (source-family matrix, 100%
  row-count coverage / representative qualitative sampling), §7 (relationship audit, exhaustive
  recomputation of type/endpoint statistics), §8 (Cube lineage, complete registry-vs-YAML-vs-
  actual-counts reconciliation), §9 (product-readiness, complete given the tenant is unwired).
- **Fully completed, mixed corpus + one dated raw-log verification**: §4 (item-level lineage —
  row counts exhaustive, field-level sampling representative at ~20 items, DB-internal IDs
  explicitly marked unavailable), §6 (accepted/deferred audit — policy-language gap noted,
  content-level assessment complete, pipeline-level per-item confirmation not possible).
- **Partial by design, environment constraint documented**: §1/§5/§10/§11 all rely on the
  finding that live DB access was genuinely unreachable (confirmed, not assumed — see §4) and
  that the review-decision-apply stage's raw evidence is not in the repo by the authority
  record's own admission. These sections are as complete as repo-only evidence allows and say so
  explicitly rather than treating the one self-reported summary as ground truth.
- **Not completed**: industry-overlay workbook content (time-budget gap, flagged, not a
  confirmed defect); full exhaustive (non-representative) sampling of all ~264,230 review
  decisions (explicitly out of scope per this audit's own instructions, which call for
  representative sampling plus exhaustive coverage only where corpus size allows — applied here
  to the procurement families, which were counted exhaustively, and to the relationship
  type/endpoint statistics, which were recomputed exhaustively over all 60,000 rows).
