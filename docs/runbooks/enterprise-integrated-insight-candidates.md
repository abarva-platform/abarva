# Integrated Insight Candidate Jobs

This is an operator-only, derived layer over canonical objects, declared relationships and
deterministic measures. It neither writes canonical facts nor changes a product's active record.
The existing legacy insight engine is not replaced; this job uses ID- and assessment-bound ECL
lineage rather than merging legacy entity-name keys into canonical truth.

## Scope and State

- Every run selects one code-defined canonical tenant explicitly.
- Inventory reports available assessments. Planning selects one explicitly; it never chooses a
  newest assessment or silently joins different versions.
- Cube measures are not recomputed from JSON. Only admitted, passed Cube slices supply extra
  lineage links to the same canonical measures.
- A candidate has `not_reviewed` governance, `agent_ready=false` and no product-active pointer.
  A search index is storage infrastructure, not proof of retrieval or cite rendering.
- External benchmark comparisons require a confirmed, non-synthetic reference, exact
  comparability dimensions, a cited HTTPS source and an unexpired validity date.

## Release

Merge through a PR, then use `.github/workflows/aca-main-deploy.yml` to obtain an approved,
digest-pinned image containing these scripts. Apply only the named additive migration through
the private ACA job lane. Schema deployment and loading candidate data are separate operations.
Do not use local SQL, web requests or ad-hoc shared web updates.

Migration: `20261011210000_enterprise_integrated_insight_candidates.sql`.

## Job Bindings

Use the shared `scripts/ops/submit-aca-operator-job.mjs` wrapper and coordinate with any other
workstream using the same operator job before submitting. Supply:

```ini
ECL_INSIGHT_TENANT_KEY=<canonical tenant from code>
ECL_INSIGHT_RUN_ID=<fresh safe run id>
ECL_INSIGHT_OPERATOR_IDENTITY=<actual operator identity>
ECL_INSIGHT_BUILD_VERSION=integrated-insights-v1
ECL_INSIGHT_RELEASE_RECORD=docs/releases/records/2026-10-11-enterprise-integrated-insight-candidates.md
ECL_INSIGHT_STORAGE_ACCOUNT=<private proof storage account>
```

Pass `DATABASE_URL` as a secret reference, not a literal connection string. The wrapper sets
`ABARVA_OPERATOR_IMAGE` and `ABARVA_OPERATOR_BRANCH_COMMIT`; these bind the run to its pinned image
and git SHA. Proofs go to the existing private proof container, with immutable run-specific paths.

1. Run `ecl:integrated-insights:inventory-job`. It opens a read-only transaction and reports
   canonical families and measure definitions by assessment without reading raw intake text.
2. Run `ecl:integrated-insights:plan-job`, additionally passing `ECL_INSIGHT_ASSESSMENT_ID`,
   `ECL_INSIGHT_AS_OF=YYYY-MM-DD` and `ECL_INSIGHT_DATASET_ID`. It writes no database rows.
3. Inspect the candidate findings, exclusions and `not_assessable` rule outcomes. A clear rule
   result is bounded to its declared predicate, not whole-enterprise clearance.
4. Obtain a human-recorded manifest approval for the exact assessment, finding count and
   `plan.loadVersionHash`. That hash includes canonical inputs, rules and resulting findings.
   The agent must not populate a person's approval on their behalf.
5. Run `ecl:integrated-insights:apply-job` with all the same bindings and
   `ECL_INSIGHT_EXPECTED_VERSION_HASH=<approved loadVersionHash>`. It re-reads inputs within a
   serializable transaction, refuses drift, verifies content and every FK-backed lineage set,
   commits, then checks the candidate serving view using an independent read-only connection.
6. Inspect the Blob proof, commit status and operator idle restoration separately. Replays may
   verify identical content; they never overwrite a previous release with new content.

## Rules in Version 1

- Priority-to-program mapping gaps within the selected assessment.
- Recorded approved budget versus forecast, only for identical dated periods and USD units.
- Ended-period AI targets without an eligible, comparable actual reading.
- Declared high/critical-risk paths through explicitly critical applications to platforms.
- Compatible actual-to-external-reference range comparisons; no percentile or causal inference.

Money never becomes realized value by comparison. Source flags alone do not grant Finance or
evidence approval. Unknown dates, conflicts, duplicate comparable measurements, missing sources,
restricted sources and inferred relationships cannot establish a valid comparison.

## Next Gate

This release does not admit findings to Home, Tower or agents. Review, source readiness,
serving approval and signed-in retrieval/cite-render proof are later gates. Reuse the canonical
IDs and source version throughout that work; do not copy another product's conclusions as facts.
