# 2026-10-11 — Move-scoped register operator job

## Release ID

`2026-10-11-moves-denials-register-operator-job`

## Status

`candidate`; no register row has been loaded by this release candidate.

## Plain-English Summary

Add a private ACA operator job for one synthetic, newly created Move. Its read-only preflight records the live Move, dedicated operator identity, register revisions and next register IDs. A later dry run and apply must use that exact snapshot and the unchanged 22-row source pack. The job creates proposed rows through the register's domain store, recording the automated operator's person ID and append-only events. It does not confirm a value, approve an estimate or serve a loaded row.

## Layer Impact

- Release lane: `client-data-lane` for a Move-scoped synthetic register load.
- Layer 1: no new intake or client source.
- Layer 2: no adapter change.
- Layer 3: potential 22 assumption rows and 22 creation events only after a separately committed named load approval and exact live binding.
- Layer 4: no product surface change. Existing Moves projections read the register through their current path.

## Client Applicability

- All clients: no shared product behavior changes.
- Specific clients: the one synthetic demo tenant, on a new Move created by the exact dedicated operator account.
- Internal only: private ACA operator job and proof bundle.
- Public/demo only: proposed synthetic register rows after the separately reviewed load approval.
- Feature flag: this job adds no product flag; its target operator is already gated by `moves_synthetic_e2e_operator_v1`.

## Changes Included

- Read-only preflight, dry run and apply modes on the private ACA operator job.
- Exact source-set hash, authenticated fresh-Move provenance, dedicated account email and Clerk-to-person identity, live register revisions, deterministic ID allocation and idempotency checks.
- One serializable transaction for the 22 register writes and their creation events, with post-commit readback and private proof output.
- No automatic write retry and no old-Move fallback.

## QA / Validation

- Typecheck: pass.
- Focused behavior tests: pass, 12 tests including preflight, stale scope/refusal, exact apply/readback with a preserved pre-existing revision, duplicate-load refusal, no-retry rollback, private job envelope, live identity and register readback, transaction lock ordering, proof bundles and a post-commit proof collision. One deliberate mutation of the P3 phase guard made all 4 affected tests fail; the original source was restored and the focused suite passed again.
- Scoped lint and offline source-hash command: pass.
- Coverage census: regenerated from 3,005 to 3,007 test files and 2,841 to 2,843 pull-request-workflow-reached files; 164 remain unreached. Tenancy-fence census regenerated with no diff. The first exact-head behavior coverage run found 89.86% lines against the 90% floor; the added private-runner tests exercise the previously uncovered operator paths, with the next full gate pending.
- Manifest validation: pass with existing declaration-owner warnings outside this change. Release check: pass, 11 of 11 gates. Library-orphan, route/export reachability and tenancy-fence checks: pass with no new findings.
- Live read-only preflight and apply: pending the fresh Move and exact named load approval.

## Rollout Plan

Merge through a PR. The repo-owned main deployment workflow is the only shared web release path. Run the private operator job from an approved digest with retry count zero. At P3 Step 4, perform preflight on the newly created Move, bind the exact snapshot and source hash, commit the named load approval for that Move through review, run a dry run, then dispatch apply through the private ACA operator path. Inspect the committed register and proof bundle before continuing the browser walk.

## Deployment Authority

- Repo-owned web deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: pending main deployment.
- ACA runtime invariant: pending deployment.
- Private operator job: `job-abarva-private-operator-eus`, with digest-pinned image and zero replica retries.
- Live signed-in proof required: yes, before the new Move is used for the walk.

## Rollback Plan

Revert job code through a PR if needed. Any committed register correction needs a separately authorized, Move-scoped audited action; do not silently delete or replay rows. A failed or uncertain apply must be inspected through live readback before another run.

## Audit Evidence

The operator proof bundle records the run ID, image digest, source hash, exact binding, proposed values, actor, manifest approval state, transactional result, post-commit readback and Blob proof URI. Product retrieval and deck figures remain separate proof stages.

## Known Gaps

The fresh Move, live register census, exact load approval, apply dispatch, signed-in retrieval and deck readback are pending. A Blob proof failure after a successful database commit is reported as committed with proof failure; operators must inspect the Move and must not retry blindly.
