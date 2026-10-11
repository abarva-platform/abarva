# 2026-10-11-tower-registered-intake-physical-stage — Inactive Tower stage path

## Release ID

`2026-10-11-tower-registered-intake-physical-stage`

## Status

`candidate`

## Plain-English Summary

Adds a governed way to prepare an inactive Tower assessment from the registered synthetic intake. It keeps an unapproved fiscal-year budget and unproved value unknown. A separate review and explicit version-bound approval are required before any data is written or shown in Tower.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: reads only files declared in the active tenant-input registry; the user-detail extract contributes a file hash and count, not individual records.
- Layer 2: stages source-file metadata and selected source records with exact file and row lineage. Unapproved evidence-register content is excluded.
- Layer 3: stages objects with declared business IDs and one explicitly declared aggregate Metric identity. Source-specific measures retain their planning or usage basis.
- Layer 4: stages nine Tower view families under a distinct inactive assessment. No stage operation changes the active lifecycle selection.
- Shared operator control: the ACA wrapper checks that the Tower stage job's declared image digest, job name, timeout, and execution lane match its own request. Other job scripts keep their existing path.

## Client Applicability

- All clients: no automatic rollout.
- Specific clients: one explicitly supplied, active registry tenant when a separately approved operator job runs.
- Internal only: candidate build, preflight, and private stage operation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/tower/stage-registered-intake-partial.mjs` builds, checks, and can stage a physical assessment after exact approval. Its read-only re-attestation mode can issue the missing private proof for the same staged assessment and original stage run ID after exact database readback, without changing rows.
- `scripts/tower/registered-intake-identity-contract.json` declares the aggregate spend Metric identity and basis.
- `docs/governance/dataset-manifests/tower-registered-intake-partial-20261011.json` declares source selection. Its `load_approval` and `serving_approval` remain null.
- `supabase/migrations/20261011173000_tower_value_chain_unknown_amounts.sql` permits null unproved value and unassessed evidence priority in new rows. Its new check applies to new or changed rows while leaving prior rows untouched.
- `scripts/tower/run-unknown-amount-schema-job.mjs` keeps the read-only before fingerprint, focused migration, and compared after fingerprint inside one private ACA job execution. It checks that all configured database URLs agree, refuses a missing migration ledger or an already-applied focused migration, and emits a proof bundle plus receipt into the ACA logs for extraction by the operator wrapper.
- `scripts/tower/probe-unknown-amount-schema.mjs` records the before fingerprint and verifies unchanged existing numeric rows after migration.
- `package.json` adds dry-stage and ACA-job entry points.
- `scripts/ops/submit-aca-operator-job.mjs` adds a narrow Tower stage and re-attestation request binding.
- The named-file CI control now judges and runs the newly added, live agent-answer exhibit suite so a merged branch keeps exact coverage of that partially wired test directory. Its coverage census is refreshed from the same workflow wiring.

## QA / Validation

- Local dry stage generated 17 source-file metadata entries, 299 selected source records, 237 canonical objects, 281 canonical measures, and nonempty rows for all nine views. Its quality gate passed and refused a write because exact load approval was absent.
- The physical gate checks unique IDs, source hashes, cited rows, null unknown amounts, and exclusion of unapproved evidence content and user-level detail.
- Focused wrapper plan-only test passes with matching digest/job/timeout and rejects a mismatched digest without contacting Azure.
- Local checks: four physical Tower tests, five same-job schema proof tests, 22 shared operator-wrapper tests, focused ESLint and Node syntax checks on changed scripts, the dataset-manifest validator, and all 11 release gates passed. After merging the current main branch, the whole-repo TypeScript check passed.
- The updated named-file control, new exhibit suite, scanner refusal, and census checks passed together: 154 tests across eight suites. The full behavior floor is rerun on the PR head by CI.
- After integrating current `main`, the named authored-exhibit test was aligned with the current SVG matrix renderer and its qualitative rationale text. The exact five-file CI invocation passed 70/70 tests locally.
- After the merged image is available, run `tower:migrate:unknown-amounts:dry-job` through `ops:aca-job` with the digest-pinned image, `db-migrate` container, and private `DATABASE_URL` secret reference. Its read-only baseline and ledger precheck produce an extracted proof receipt; do not continue if the focused migration is already recorded or if the target database is ambiguous.
- In a separately authorized execution, run `tower:migrate:unknown-amounts:apply-job` with `TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM=APPLY`. The same ephemeral job captures the baseline, checks the existing ledger, runs only `20261011173000_tower_value_chain_unknown_amounts.sql`, compares after readback, and checks the recorded migration hash. A failed check exits nonzero and emits a failed receipt. The wrapper requires the extracted proof receipt to pass, records the migration audit seal, and verifies idle restoration. Retain its local evidence directory in the private release record; the schema job itself does not claim a Blob upload.

After the exact merged image digest is known, the private operator commands are:

```bash
npm run ops:aca-job -- --image <approved-acr-image@sha256:digest> \
  --script tower:migrate:unknown-amounts:dry-job --container db-migrate \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --out-dir /tmp/tower-unknown-amount-schema-dry-proof

npm run ops:aca-job -- --image <approved-acr-image@sha256:digest> \
  --script tower:migrate:unknown-amounts:apply-job --container db-migrate \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --env TOWER_UNKNOWN_AMOUNTS_APPLY_CONFIRM=APPLY \
  --out-dir /tmp/tower-unknown-amount-schema-apply-proof
```

Inspect each `summary.json`, extracted `proof/schema-job-receipt.json`, baseline/readback, migration seal, and idle-restoration evidence before any stage job. Both executions require the approved, digest-pinned image containing this code; do not substitute the current web or operator template image if it predates this change.

If the apply job commits but its after readback or proof capture fails, **stop**. A repeat apply refuses the already-recorded migration. Run the read-only recovery command:

```bash
npm run ops:aca-job -- --image <approved-acr-image@sha256:digest> \
  --script tower:migrate:unknown-amounts:reconcile-job --container db-migrate \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --out-dir /tmp/tower-unknown-amount-schema-reconcile-proof
```

Its receipt is deliberately `manual_review_required`: it verifies current schema and exact ledger hash but cannot know the original pre-apply numeric fingerprint. The wrapper records `tower_schema_proof_verified=false`, `tower_schema_manual_review_required=true`, and `summary.ok=false` even if the read-only ACA job succeeds. Compare its `current.json.unchanged_numeric_basis` with the original failed apply job's extracted `baseline.json.unchanged_numeric_basis` and record both proof hashes in the private release review. If the original baseline cannot be recovered or the fingerprints differ, resolve through a separately reviewed repair; do not stage the candidate. ACA success alone cannot produce a verified apply seal when the Tower proof receipt is missing or fails.
- Before any stage write: run the dataset manifest validator, exact-tenant lifecycle preflight, physical dry stage, and receipt fingerprint review. No data write or live browser proof is claimed here.

## Rollout Plan

Merge through a PR. Apply the narrow schema migration through the private, digest-pinned ACA operator job after a dry-run and migration review; this is a separate schema step and is not assumed to happen with a web deploy. Use the focused Tower script, not the generic all-pending migration script. Obtain a named `load_approval` on the exact assessment, source-set hash, and this release record. Run `tower:registered-intake:stage-job` only through `ops:aca-job` with explicit tenant, run ID, operator identity, git SHA, image digest, timeout, retries, and private Blob proof destination. The wrapper independently binds the supplied job name, image digest, and timeout to its own request. The job validates its transaction readback and uploads the proof bundle. A separate independent readback and named `serving_approval` gate any later lifecycle promotion.

## Deployment Authority

- Repo-owned deploy workflow: only the main ACA workflow may change shared web traffic.
- Shared runtime mutators: none from this stage job.
- Approved image digest: required and recorded by the ACA operator wrapper.
- ACA runtime invariant: required after any later web deployment.
- Worker image invariant: use a digest-pinned private operator job image.
- Feature/env flag update path: none.
- Live signed-in proof required: after separate serving promotion.

## Rollback Plan

The stage job inserts a new assessment and leaves the active assessment unchanged. If proof upload fails after commit, run `tower:registered-intake:stage-reattest-job` through the private ACA wrapper with the original `TOWER_RELOAD_STAGE_RUN_ID` and a new re-attestation run ID. It performs read-only checks of source-file hashes, every selected source record, canonical identities and measures, projection manifests, nine physical payload hashes/counts, excluded rows, and active lifecycle selection before reissuing the same private proof URI. It cannot overwrite staged database rows. A missing or unverified private Blob receipt is never promotion proof. The nullability migration has no data rewrite and can be reversed only after confirming no null rows depend on it. Later serving promotion has its own atomic pointer rollback.

## Audit Evidence

The private proof bundle includes the exact stage-generated `candidate.json`, file/identity hashes, physical preflight, quality gate, transaction readback, and stage receipt. Reviewers must use that file byte-for-byte; regenerating it after stage changes the candidate SHA binding. Private `progress.json` records running, committed, and proof-verified checkpoints. The ACA wrapper records job execution and idle restoration. Independent promotion checks bind receipt view counts and row fingerprints to staged database rows.

## Known Gaps

Load and serving approvals are pending. Source coverage gaps remain explicit, including unsupported fiscal-year approval, unresolved value claims, unapproved evidence, and an absent ITSM feed. A successful local dry stage is not a loaded, deployed, or live-proven Tower page.
