# 2026-08-12-client-intake-workstream-front-door — Client intake front door and two-tenant layer classification

## Release ID

`2026-08-12-client-intake-workstream-front-door`

## Status

`candidate`

## Plain-English Summary

Two things changed.

First, the intake template pack now opens with something a client can act on. Previously the pack's
index workbook contained an internal data-generation contract — instructions written for our own
tooling, not for a client — and each of the 25 other workbooks opened straight onto data tabs with no
statement of who should fill them in or why. The index workbook is rebuilt as a front door: what the
client is being asked for, which owner group provides it, where to record a review decision, how the
smaller ten-workstream intake model maps into the internal canonical dimensions, and an explicit list
of what stays closed until a subject-matter expert has reviewed the result. Every other workbook now
opens on a short instruction sheet naming its workstream, its owner group, the evidence that usually
populates it, and a pointer back to the index. No column contract changed.

Second, both synthetic cover tenants were classified across all four architecture layers, and the
result is a set of findings rather than a refresh. The classification is mechanical — it compares what
is on disk against the declared contract and against itself — so it reports conflicts instead of
asserting values. Nothing was promoted, loaded, indexed, or activated.

The material findings: one cover tenant's registry-active intake package does not conform to the
column contract that the other one does conform to; none of the four implemented mapping profiles can
satisfy their required source fields against either tenant; six of ten declared adapter families have
no implementation; and the existing tenant-input quality gate validates file presence and row-count
depth but not column conformance, which is how the non-conforming package passed unnoticed.

## Layer Impact

Release lane: `client-data-lane`. The change is confined to client-scoped intake templates, audit
tooling, governance documents, and evidence reports; it touches no shared control-plane behaviour, so
no `global-control-lane` impact applies.

- **Layer 1 (Client Intake):** template pack workbooks updated (presentation only). A governed intake
  draft package was added per tenant containing a source register, workstream coverage matrix, SME
  validation matrix, evidence request log, and blocked-claim list. These are drafts and are not
  registry-declared.
- **Layer 2 (Source Adapters):** no adapter changed. A dry-run reports, per mapping profile per
  tenant, whether required source fields can be satisfied. Nothing was transformed or written.
- **Layer 3 (Canonical Model):** no canonical store was written. A per-tenant summary records the
  required checks and their results.
- **Layer 4 (Products):** no product surface, projection, cube, or runtime route changed. A per-tenant
  readiness report records which local artefacts exist and what blocks each surface.

## Client Applicability

- All clients: no. No runtime behaviour changes.
- Specific clients: none. Both tenants in scope are synthetic cover tenants.
- Internal only: yes — templates, audit tooling, governance documents, and reports.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/build-universal-template-workbook-quality-bar.mjs` — new. Audits the pack, rebuilds
  the index workbook, injects a governed instruction sheet into every other workbook, writes an
  inventory with before/after workbook hashes. Idempotent.
- `scripts/audit/tenant-layer-refresh.mjs` — new. Tenant-agnostic; takes `--tenant` and has no
  per-tenant branching. Classifies layer roots, derives claims, dry-runs the mapping contract, writes
  the governed intake draft package and per-tenant Layer 3/4 summaries.
- `scripts/audit/tenant-context-truth-inventory.mjs` — read-only inventory used to produce the
  evidence base for the above.
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/` — 26 workbooks updated,
  `client-intake-workstreams.json` added, `template-manifest.json` and `README.md` updated. The
  `.csv` column contracts are byte-for-byte unchanged.
- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md` — added. `AGENTS.md` on `main` already
  links to this file, so the repository currently has a dead link to its own layering contract.
- `docs/governance/CLIENT_REVIEW_WORKBOOK_QUALITY_BAR.md`,
  `docs/governance/TENANT_CONTEXT_SINGLE_SOURCE_OF_TRUTH_REDO_PLAN_2026-08-12.md` — the standard this
  work implements, plus its execution log and the findings carried out of this slice.
- `reports/tenant-template-quality-bar-2026-08-12/`, `reports/tenant-layer-refresh-2026-08-12/` —
  evidence, including the gated apply plan.

## QA / Validation

| Check | Command | Result |
| --- | --- | --- |
| Template JSON validity | `node -e` parse of `client-intake-workstreams.json` and `template-manifest.json` | `json ok` |
| Script syntax | `node --check` on both new scripts | pass |
| Workbook integrity | independent read of all 26 workbooks with `openpyxl` | 26/26 open; instruction sheet first in every one; all pre-existing tabs preserved |
| Workbook determinism | builder run twice from a pristine copy of the pack | identical hashes on both runs; no duplicate sheet wiring |
| Column contracts | `git status` on `**/standard-2026-07-v3/*.csv` | 0 modified |
| Tenant input quality | `npm run audit:tenant-input-quality` | passed, 6 active tenants |
| Context/corpus governance | `npm run validate:context-corpus` | 5/5 gates passed |
| Cross-source fact lineage | `node scripts/tower/fact-lineage-report.mjs` | ran; conflicts recorded, no figure quoted in any artefact |
| Release control | `npm run release:check` | passed |

Reproduce the two builders with:

```
node scripts/audit/build-universal-template-workbook-quality-bar.mjs
node scripts/audit/tenant-layer-refresh.mjs
```

## Rollout Plan

Merge to `main`. No runtime rollout is required or intended: no application code, route, flag,
environment variable, image, or worker job is touched. The repo-owned ACA main deploy workflow will
build and deploy on merge as it does for every commit; the resulting revision is expected to be
behaviourally identical to the current one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none. No `az containerapp` command is part of this release.
- Approved image digest: not applicable — no runtime image contract changes.
- ACA runtime invariant: unchanged by this release; the post-merge revision should be verified healthy
  as normal practice.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no — no signed-in surface changes. Post-merge verification is limited
  to confirming the deployed revision is healthy and the application still serves.

## Rollback Plan

Revert the squash commit. Every artefact is additive: templates are regenerable from the committed
script, the governed intake draft packages are not registry-declared and nothing reads them, and the
reports are evidence files. No migration, no data-plane write, and no runtime state to unwind.

## Audit Evidence

- Workbook hashes before and after: `reports/tenant-template-quality-bar-2026-08-12/template-workbook-inventory.csv`
- Layer classification: `reports/tenant-layer-refresh-2026-08-12/layer-refresh-matrix.csv`
- Derived conflicts: `reports/tenant-layer-refresh-2026-08-12/claim-reconciliation-matrix.csv`
- Adapter coverage: `reports/tenant-layer-refresh-2026-08-12/adapter-gap-register.csv`,
  `layer2-adapter-dry-run.csv`
- Actions deliberately not taken: `reports/tenant-layer-refresh-2026-08-12/hard-gate-register.csv`
  and `gated-apply-plan.md` — 8 gates × 2 tenants, execution record `no` throughout.

## Closed Gates

Not performed, and not approved by this release: registry activation, active intake root replacement,
Azure/Postgres load, retrieval index rebuild, assistant or product context activation, signed-in
runtime route change, retirement or deletion of any legacy file, and any change to a CSV column
contract.

## Known Gaps

- The two governed intake draft packages contain manifests and review artefacts only. Neither
  contains canonical dimension files yet, so neither is a candidate for registry activation today.
- The Layer 2 dry-run checks whether required source fields exist in a tenant's own files. It does not
  execute an adapter, so it proves a profile *would fail*, not that a satisfied profile *would
  succeed*.
- Relationship-type conformance is reported as `NOT_VERIFIED`. The canonical relationship dictionary
  lives in `intelligence_v6.relationship_types`, and this lane has no data-plane access by design.
- Per-row evidence linkage and per-row attestation are reported as `PARTIAL`. The check confirms an
  evidence dimension exists and carries rows; it does not verify that each fact resolves to a source
  row.
- One cover tenant's coverage reads as fully covered because its files match the column contract and
  carry rows. That is a schema and volume statement, not an attestation — its content remains
  synthetic and unvalidated, and its blocked-claim list records the caveats.
- The working tree from which this evidence was produced already carried uncommitted modifications to
  one cover tenant's active intake root, made by an earlier generation run and not by this release.
  Those files are excluded from this release, but the reconciliation for that tenant was computed
  against that already-modified state and should be re-derived once it settles.
- Workbook instruction sheets reuse the pack's existing shared styles by index. The builder falls back
  to unstyled output if a workbook's style table is too small, which would be legible but visually
  inconsistent. No workbook in the pack hit that fallback.

## Follow-ups

1. Decide whether the column contract or the non-conforming tenant package is authoritative. Every
   downstream layer depends on this and it is a product decision, not a mechanical one.
2. Add column-contract conformance to `npm run audit:tenant-input-quality`, so a package that does not
   match the declared contract cannot pass the gate again.
3. Two audit scripts retained from the prior slice remain tenant-specific by name. They should take a
   tenant argument, as `tenant-layer-refresh.mjs` does.
