# 2026-10-12-source-declared-evidence-repair

## Release ID

`2026-10-12-source-declared-evidence-repair`

## Status

Candidate. Local validation is not deployment, a database apply, or signed-in acceptance.

## Plain-English Summary

The contract package adapter preserves declared invoice identities, source files, payment amounts and usage quantities instead of replacing them with defaults. The contract briefing labels monetary spend as spend, not measured consumption. Incomplete monetary rows withhold comparisons rather than becoming zero.

A deterministic subscription scenario generator produces explicitly synthetic, unreviewed documents, invoices, payments, usage, service observations and an unsized candidate action. A declared minimum quantity constrains the renewal diagnostic. The package is an offline candidate, not a loaded client record, reviewed legal agreement, savings calculation, or connected source-system extract.

An internal operator job can repair only sealed document-origin metadata. Exact approval, manifest, tenant, contract, current before-images, content hashes, load runs and affected counts are mandatory. Mutations require separately approved code and digest-pinned runtime identity. A private backup precedes updates, and guarded restore refuses newer edits.

## Layer Impact

Release lanes: `global-control-lane` for adapter and product behavior; `internal-admin` for sealed operator tooling; `public-demo` for the unapplied synthetic candidate. Any later tenant apply belongs to its own exact `client-data-lane` decision.

- Layer 1: a registry-declared synthetic scenario input and its assumptions; no real-client file handling changes.
- Layer 2: preserve declared source-row values and missingness; source-origin metadata follows an exact sealed manifest.
- Layer 3: no canonical schema change. The optional repair changes only approved `doc.file.metadata_json` objects, never document content or financial values.
- Layer 4: Economics and Performance distinguish recorded monetary spend from measured quantities and avoid unsupported conclusions about rate, delivery or reconciliation.

## Client Applicability

- All clients: product copy and completeness guards wherever the affected briefing components render.
- Specific clients: none receive a data mutation merely by merging or deploying.
- Internal only: sealed metadata repair job with explicit decision and runtime gates.
- Public/demo only: the new synthetic package candidate remains unreviewed and unapplied.
- Feature flag: none added; no authentication or RLS weakening.

## Changes Included

- Declared-row normalization called by the existing package loader.
- Synthetic subscription scenario generator, manifest, fixture and source files.
- Exact-target metadata repair job, private proof and guarded restore.
- Source integration CI executes all new suites, including disposable Postgres transaction tests.
- Existing Economics billing-coverage tests retain zero-versus-unknown controls.

## QA / Validation

- Red-first real-loader test observed replacement invoice references and source files before the hook; fixed loader passed.
- Red-first render tests observed spend being asserted as consumption and incomplete totals being displayed.
- Node suites: 40 passing assertions, zero skips, including eight real disposable-Postgres subtests for no-write preflight, exact metadata updates, restore, count rollback, drift refusal, private backup failure, non-metadata side effects and post-commit proof failure.
- Focused Jest: 56 passing assertions across four suites, including the existing suite-owner guard.
- Full contract workspace plus adapter and loader: 44 suites / 447 passing assertions, using exact test paths so route-group parentheses cannot silently omit the UI suites.
- Mutation proof: relaxing the SQL affected-count guard failed the rollback test; restoring payment-from-spend failed four assertions. Both mutations restored before validation.
- Offline package plan passed both adapter and projection quality gates with an invalid database URL: no connection opened. Expected 71 adapter rows, 68 canonical fact assertions and 14 invoice facts. The opportunity remains unsized with a blocked calculation, not a priced result.
- TypeScript and focused lint passed. Manifest governance passed with the existing warning that engineering attribution is not personal load approval. No personal review attribution was invented.
- CI coverage census matches the committed shape; tests are placed outside another owner's suite-declaration region.

## Rollout Plan

Squash merge the reviewed candidate. Only the repo-owned ACA main workflow builds and promotes the image. The operator script is available afterward but does not run automatically. Its exact sealed approval must also bind the released code and approved runtime, then a serialized private ACA Job must capture fresh native before-images, private Blob proof and independent readback.

The new subscription package has no load approval. Before any apply, resolve the existing canonical writers that hard-code reviewed state, obtain an exact delegated package decision, archive current native rows, test transactional rollback and prove affected projections. Do not run a full historical package reload to repair metadata.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change; no ad-hoc web traffic or template commands.
- Approved image digest: not yet captured for this candidate.
- ACA runtime invariant: template, healthy 100%-traffic revision and required workers must match the approved digest.
- Worker image invariant: verify independently after deployment.
- Feature/env flag update path: no flag change. Operator env values are execution-scoped.
- Live signed-in proof required: Economics, Performance and document lineage on affected contract identities after their separately approved apply.

## Rollback Plan

Revert product/adapter code through a new PR and the main deploy workflow. Keep a data rollback separate: restore only original metadata when the full current after-images still match the private committed proof. Abort on drift. No financial, measurement, term, approval or document-content rollback is implied. The synthetic candidate needs no database rollback because it has not been loaded.

## Audit Evidence

Private operator decision, sealed hashes, transaction tests, plan reports, private before/validated/after Blob proofs, independent native readback, PR/CI/main deploy and signed-in screenshots. Public records describe the mechanism; tenant-specific native rows and receipts remain private.

## Known Gaps

No shared database mutation, deployment or signed-in proof yet. Canonical term, scope, consumption and performance writers have review-state behavior that must be resolved before the new synthetic package applies. A loaded row does not prove client review, indexing, retrieval, citation rendering, commercial validity or Finance-confirmed value. The offline diagnostic is not yet an executable persisted opportunity-sizing rule.
