# Gated apply plan — two-tenant Layer 1-4 refresh

Prepared 2026-08-12. **Nothing in this document was executed.**

Scope: `meridian-health` and `skyharbor-air`. Every action below is a hard gate under
`docs/governance/TENANT_CONTEXT_SINGLE_SOURCE_OF_TRUTH_REDO_PLAN_2026-08-12.md` and needs
explicit Anand/Codex approval on the exact scope, count, and action before it runs.

Evidence base: `reports/tenant-layer-refresh-2026-08-12/` (layer matrix, claim
reconciliation, adapter gap register, hard gate register, per-tenant Layer 3 and Layer 4
summaries) and `reports/tower-fact-lineage/lineage.json`.

## Blockers that should be cleared before most of this plan is worth approving

| # | Blocker | Tenant | Evidence |
| --- | --- | --- | --- |
| B1 | The active intake package does not conform to the only approved template contract. 18 of 19 canonical dimensions are missing declared columns; the files use a generic `record_id / context_item / dimension / evidence_id` shape instead of the per-dimension contract columns. | meridian-health | `meridian-health/layer3-canonical-refresh-summary.md`; `claim-reconciliation-matrix.csv` `SCHEMA_GAP` rows |
| B2 | None of the 4 implemented mapping profiles can run against either tenant's active root. Best case is 13 of 21 required fields satisfied; `applications-systems-estate/v1` matches 0 required fields on either tenant. | both | `layer2-adapter-dry-run.csv` |
| B3 | 6 of 10 declared workstream adapter families have no implemented adapter at all. | both | `adapter-gap-register.csv` |
| B4 | Source-adapter extracts (`SA02`, `SA04`, `SA08`–`SA11`) sit inside the Layer 1 active intake root, which mixes Layer 1 and Layer 2. | meridian-health (6 files) | `claim-reconciliation-matrix.csv` `UNREGISTERED` rows |
| B5 | `.xlsx` copies of four canonical dimensions and an undeclared `19_data_analytics_platform_maturity` dimension sit inside the active intake root. | skyharbor-air (10 files) | `claim-reconciliation-matrix.csv` `UNREGISTERED` rows |
| B6 | Fact-lineage `CONFLICT` on headline money metrics. No figure for either tenant is quotable without an explicit status caveat. | meridian-health (3 metrics), skyharbor-air (1 metric) | `<tenant>/layer4-projection-refresh-summary.md` |
| B7 | The working tree carries uncommitted modifications to 19 files in `datasets/tenant-inputs/active/skyharbor-air/current/`, made before this slice by an "enriched dense synthetic generation" run. Reconciliation for this tenant was computed against that already-mutated root. Several rows carry absolute local filesystem paths in `source_file`. | skyharbor-air | `git status`, `git diff -- datasets/tenant-inputs/active/skyharbor-air/current/` |

B1–B3 mean a canonical load today would either fail on required fields or silently produce
an empty/partial canonical model. Approving GATE-03 before they are cleared is not advisable.

---

## GATE-01 — Activate a governed intake package as the registry active root

| Field | meridian-health | skyharbor-air |
| --- | --- | --- |
| Layer | 1 | 1 |
| Files affected | registry entry for 1 tenant | registry entry for 1 tenant |
| Current active root | `datasets/tenant-inputs/active/meridian-health/current` (25 files, 4,850 data rows) | `datasets/tenant-inputs/active/skyharbor-air/current` (29 files, 4,525 data rows) |
| Proposed root | `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake` (18 files today, manifest + review artifacts only — **no canonical dimensions yet**) | `datasets/tenant-inputs/skyharbor-air/v2026-08-governed-intake` (6 files today, manifest + review artifacts only — **no canonical dimensions yet**) |
| Command | manual edit of `datasets/tenant-inputs/tenant-input-registry.json`, then `node scripts/audit/tenant-layer-refresh.mjs` to re-derive | same |
| Expected output | `canonicalInputRoot` repointed; layer matrix shows the new root as `active-declared-source-package` | same |
| Rollback / readback | revert the registry commit; the prior active root is untouched on disk and remains readable | same |
| Approval | Anand/Codex, per tenant | Anand/Codex, per tenant |

**Not recommended yet.** Neither governed package contains canonical dimension files, so
activating it would point the registry at a package with no dimensions. Sequence GATE-02
work first.

## GATE-02 — Populate and then promote the governed package's canonical dimensions

| Field | meridian-health | skyharbor-air |
| --- | --- | --- |
| Layer | 1 → 2 → 3 | 1 → 2 → 3 |
| Files affected | 19 canonical dimensions + 6 adapter extracts to relocate | 19 canonical dimensions + 10 non-contract files to relocate |
| Command | not implemented — needs a promotion step that writes `v2026-08-governed-intake/canonical-dimensions/` from approved intake through the adapters | same |
| Expected output | canonical dimensions that conform to `template-manifest.json`, with per-file provenance | same |
| Rollback / readback | governed package is a separate root; the active root is never written | same |
| Approval | Anand/Codex | Anand/Codex |

Prerequisite: B1–B3. Deciding whether the contract or the tenant files are authoritative is
the first call to make, and it is a product decision, not a mechanical one.

## GATE-03 — Load canonical data into Azure/Postgres

| Field | Value |
| --- | --- |
| Layer | 3 |
| Target | `intelligence_v6.*` canonical stores |
| Files affected | whatever GATE-02 produces; today `0` conformant canonical dimensions exist for either tenant |
| Command | ACA Container Apps Job per `docs/ops/aca-data-build-job-rule.md` — job name, run id, tenant scope, build version, input source version, idempotency key, Blob proof bundle, validation output, quality-gate output |
| Expected output | job run id + row counts per dimension + quality gate pass + release record |
| Rollback / readback | documented job rollback, readback query per tenant, prior build retained |
| Approval | Anand/Codex **and** the data-build job contract |

Blocked by B1–B3. Do not run as `az containerapp exec`.

## GATE-04 — Rebuild retrieval indexes

| Field | Value |
| --- | --- |
| Layer | 3/4 |
| Target | Azure AI Search / FTS indexes for both tenants |
| Command | indexing job after GATE-03 |
| Expected output | indexed counts per tenant, plus end-to-end cite-render verification — "loaded" is not "indexed" is not "retrievable" is not "cited"; report each state separately |
| Rollback / readback | prior index retained until swap |
| Approval | Anand/Codex |

## GATE-05 — Enable aVa / Source / Moves / Tower / Home context use

| Field | Value |
| --- | --- |
| Layer | 4 |
| Target | agent context bundle + product projections, per tenant |
| Precondition | every context object passes `evaluateGovernedObject`; `agent_ready` earned, not assumed |
| Command | flag/config change on the shared runtime through the repo-owned ACA main deploy workflow |
| Expected output | signed-in live proof per affected tenant |
| Rollback / readback | flag off; traffic shift to the prior digest-pinned revision |
| Approval | Anand/Codex |

Blocked by B6 for anything that quotes a figure. With `promised_value_usd` in `CONFLICT`
for both tenants, no value narrative may be surfaced.

## GATE-06 — Change signed-in runtime routes

| Field | Value |
| --- | --- |
| Layer | 4 |
| Command | `.github/workflows/aca-main-deploy.yml` only; digest-pinned `--image` |
| Expected output | template image, 100%-traffic revision image, and worker job images all matching the approved digest; then live route proof |
| Rollback / readback | traffic shift to prior revision |
| Approval | Anand/Codex |

## GATE-07 — Retire, move, or delete legacy tenant files

| Field | meridian-health | skyharbor-air |
| --- | --- | --- |
| Layer | 1-4 | 1-4 |
| Files affected | 25 (adjacent standard pack) + 0 (candidate pack) = **25** | 23 (adjacent standard pack) + 20 (candidate pack) = **43** |
| Duplicate analysis | 17 dimensions byte-identical to the active root, 8 divergent | 4 identical, 20 divergent |
| Command | retirement manifest apply step (`retirement-manifest-draft.csv` seed exists for meridian-health only, under `reports/tenant-context-truth-redo/meridian-health-execution-draft-2026-08-12/`) |
| Expected output | retire-in-place first: files retained, blocked from runtime read paths; deletion only after a rollback window |
| Rollback / readback | files remain on disk; runtime guard is the enforcement, not deletion |
| Approval | Anand/Codex |

The 17 (meridian) and 4 (skyharbor) byte-identical duplicates are the safe first tranche.
The 8 and 20 divergent copies must be reconciled before either copy is retired, because
retiring the wrong one destroys the only record of the difference.

## GATE-08 — Change canonical CSV column contracts

| Field | meridian-health | skyharbor-air |
| --- | --- | --- |
| Layer | 1 | 1 |
| Scope today | 2 naming drifts, 18 column gaps | 0 naming drifts, 0 column gaps |
| Command | amend `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json` + update loaders/adapters + re-validate |
| Expected output | documented reason, migration path, re-validation across all tenants |
| Rollback / readback | revert the contract commit |
| Approval | Anand/Codex, with written justification |

This is the decision behind B1. Two options, and they are not equivalent:

- **Contract is authoritative** → meridian-health's active package is regenerated to the
  contract shape. Larger change, one standard, adapters work for every tenant.
- **Tenant files are authoritative** → the contract is amended to the governance shape.
  Smaller change, but skyharbor-air then becomes the off-contract tenant and the adapters
  still do not run.

`skyharbor-air` already conforms. On the evidence, the contract is the cheaper thing to
keep and `meridian-health` is the thing to regenerate — but this is Anand's call, not a
mechanical one, and nothing was changed either way.

---

## Suggested sequence

1. Decide GATE-08 (which shape is authoritative). Everything downstream depends on it.
2. Clear B4/B5 by relocating adapter extracts and non-contract files out of the active
   intake roots — through GATE-07's retire-in-place mechanism, not deletion.
3. Build the missing Layer 2 adapters (B3) and fix required-field mismatch (B2).
4. GATE-02: produce conformant canonical dimensions in the governed package.
5. Reconcile the fact-lineage conflicts (B6) — declare a source of record per metric.
6. GATE-01: activate the registry root, per tenant, one at a time.
7. GATE-03 → GATE-04 → GATE-05 → GATE-06, each with its own proof.
8. GATE-07 deletion tranche, only after the rollback window.

## Execution record

| Gate | Tenant | Executed | Date | Approver |
| --- | --- | --- | --- | --- |
| GATE-01 | meridian-health | no | — | — |
| GATE-01 | skyharbor-air | no | — | — |
| GATE-02 | meridian-health | no | — | — |
| GATE-02 | skyharbor-air | no | — | — |
| GATE-03 | meridian-health | no | — | — |
| GATE-03 | skyharbor-air | no | — | — |
| GATE-04 | meridian-health | no | — | — |
| GATE-04 | skyharbor-air | no | — | — |
| GATE-05 | meridian-health | no | — | — |
| GATE-05 | skyharbor-air | no | — | — |
| GATE-06 | meridian-health | no | — | — |
| GATE-06 | skyharbor-air | no | — | — |
| GATE-07 | meridian-health | no | — | — |
| GATE-07 | skyharbor-air | no | — | — |
| GATE-08 | meridian-health | no | — | — |
| GATE-08 | skyharbor-air | no | — | — |
