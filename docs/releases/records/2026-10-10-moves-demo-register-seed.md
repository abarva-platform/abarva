# 2026-10-10 — Moves demo assumptions register seed job

## Release ID

`2026-10-10-moves-demo-register-seed`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator job that fills the assumptions register of the synthetic demo tenant's governed-data-foundation demo Move with sixteen realistic, fictional register rows. The goal is that register-governed document generation can later be switched on for the demo tenant without every figure in a document being blocked for lack of a register row.

The rows live in a committed, reviewable seed definition. They cover value (4), data (5), delivery (4) and adoption (3). Each row has a statement, why it matters, a working figure with a numeric value and unit, a source, an owner role (never a person) and a confidence of 1, 3 or 5. Twelve rows stay open; four are confirmed with an answer and a named answer source. Figures are taken from the demo tenant's synthetic intake files and the synthetic discovery evidence already loaded for the Move, and each row cites the file it comes from. One row is labelled a demo planning assumption because no synthetic source states it.

The job writes through the register store, so every register rule and the append-only history apply as they do for a person in the product. It refuses every tenant except the synthetic demo tenant, writes only the Move whose id the committed discovery-evidence load approval already declares, and authenticates that Move's client and declared archetype from the Move registry. A dry run reads and plans and writes nothing. An apply needs a separate, named-person load approval in the dataset manifest for this Move and the exact seed hash. That approval is deliberately not included here, because an agent must not write it on a person's behalf. A re-run writes nothing new.

## Load approval

The product owner (Anand Sundaram) approved this load on 2026-10-10. The
approval was recorded in the dataset manifest's `load_approval` and is pinned to:
- the demo Move `1557f032-5a5c-4475-abe5-b1a841576649`;
- the seed hash `19401a9627284bbfb7054f7e43faa25e9b400e3cda6f2a9297f9dfd0cafd2a33`;
- 16 rows;
- this release record.

A test checks the committed approval against the committed seed, so editing the
seed without a fresh approval fails CI.

## Layer Impact

Release lane: `client-data-lane`. AGENTS.md assigns client-scoped seed and ingestion changes to this lane, and this job writes tenant-scoped rows into the canonical register through the data plane. The data is synthetic, but the lane follows which layer is written, not whether the content is real. `public-demo` covers public routes, demo paths and investor-facing artifacts, and this change touches none of them.

- Layer 1, client intake: no change. The seed cites existing synthetic intake files and discovery fixtures read-only.
- Layer 2, source adapters: the job acts as a one-off adapter from the committed seed to register rows. It keeps the cited source path in every row.
- Layer 3, canonical model: when approved and applied, it adds sixteen `move_assumptions` rows and their `move_assumption_events` history for one Move. No schema change.
- Layer 4, products: no surface or generation change. The register flag and the generation flag are unchanged.

## Client Applicability

- All clients: no change. The job refuses any tenant other than the synthetic demo tenant.
- Specific clients: the synthetic demo tenant's one demo Move, and only after a named-person load approval and an explicit apply dispatch.
- Internal only: the operator job, its dispatch workflow and its proof bundle.
- Public/demo only: none.
- Feature flag: none added. The register itself remains behind `moves_assumption_register_v1`.

## Changes Included

- `datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json` (new): the seed definition, with sixteen synthetic rows.
- `docs/governance/dataset-manifests/moves-demo-assumption-register-seed-v1.json` (new): a Move-scoped manifest with `load_approval: null`.
- `scripts/moves/seed-demo-assumption-register-job.ts` (new): the job. It covers seed validation, the tenant and Move fences, the load-approval check, the plan, writes through the store, readback, quality gate and the proof bundle. Its `--seed-hash` option prints the hash, Move and idempotency key without a database.
- `scripts/moves/validate-demo-assumption-register-seed-proof.mjs` (new): the workflow's proof validator.
- `.github/workflows/moves-demo-register-seed-job.yml` (new): a manual dispatch with mode `dry_run` or `apply`. It binds the dispatch to the seed hash and the derived idempotency key, makes apply main-only with an exact confirmation and an approval reference, and runs the job through `npm run ops:aca-job` in the currently deployed digest-pinned image. It deploys nothing.
- `package.json`: the `moves:demo-assumption-register:seed-job` script.
- `src/lib/programs/__tests__/demo-assumption-register-seed-job.test.ts` (new) and the regenerated `docs/architecture/test-ci-coverage-census.json`.

Rows are written with origin `team` and actor kind `person`, using the user id `operator:<dispatching GitHub actor>`. The register has only `person` and `ava` actor kinds, and `ava` may only propose rows, so `person` is the closest kind for an accountable operator. The prefix keeps seed writes distinguishable from product users in the history.

Idempotency works in two parts. The run key must equal `moves-demo-register-seed-v1:` followed by sha256 of the Move id and the seed hash. Each row's natural key is its area plus the sha256 of its normalised statement. A row already present is never written again. The one exception is completing the confirm of a row an interrupted seed run created. A row a person has changed since is left as it is.

## QA / Validation

Passed:

- New suite (39 tests, mocked register that runs the real domain model): seed schema and every cross-field rule refused on its own; roles are never names; confidence values are 1, 3 or 5 only; every canonical tenant key except the demo tenant is refused (keys derived from code); Move declaration and authentication refusals; dry run writes nothing; apply refuses without the load approval; a second run writes 0; an interrupted confirm is finished; human-changed rows are left alone; readback failures; proof bundle shape against the job rule; the validator's accept and refuse cases; the workflow structure, including that it deploys nothing.
- Mutation testing: 113 mutants across the job and the validator, applied one at a time and restored from a scratch backup; all 113 killed. A first pass left 10 survivors. Four were checks no input can reach (two redundant tenant comparisons, an unreachable writes-match check, a person-name check behind the role allow-list), and those checks were removed. Six were missing cases, and tests were added for them.
- `npm run typecheck`: clean.
- `npx eslint` on the new files: clean.
- `npm run audit:lib-orphans`: no change against the baseline. `scripts/` is an operator-tooling entry root.
- Test census regenerated: one new test file, swept by the existing `src/lib/programs/__tests__` directory step. No new test directory.
- All `validate:context-corpus*` scripts and `npm run release:check`: pass.

Not run: no workflow was dispatched and nothing was run against a database. The live dry run and the apply are separate operator steps.

## Rollout Plan

1. Merge through a PR to `main`. The repository-owned ACA main deploy workflow then builds the digest-pinned image.
2. Print the seed hash and idempotency key with `npm run moves:demo-assumption-register:seed-job -- --seed-hash`.
3. Dispatch `.github/workflows/moves-demo-register-seed-job.yml` with mode `dry_run`, and review the planned writes in its proof bundle.
4. A named person adds the `load_approval` to the manifest (Move id, seed hash, this release record) in a reviewed PR.
5. Dispatch `apply` from `main` with the confirmation and an approval reference.
6. After the apply, deciding whether to turn on register-governed generation for the demo tenant is a separate step.

## Deployment Authority

- Repo-owned deploy workflow: none is changed. The dispatch workflow resolves the current web image digest and runs the private operator job in it.
- Shared runtime mutators: none. There is no image build, no Container App template update and no traffic change. `ops:aca-job` restores the operator job to idle and verifies it.
- Approved image digest: whatever digest is live when the job is dispatched. It is recorded in the proof contract.
- ACA runtime invariant: unchanged by this release.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before generation is enabled. Open the demo Move's register and confirm the sixteen rows and their sources.

## Rollback Plan

Code: revert the PR. The job is inert until dispatched.

Data: register rows are never deleted by the product, and the history is append-only. To withdraw a seeded row, a person supersedes or corrects it in the product, which leaves an audited trail. If the whole seed has to be withdrawn before anyone uses it, that needs a separate, approved data-repair job. This release does not include one. A failed apply leaves a proof manifest saying which writes landed. A re-run completes the seed without duplicating rows.

## Audit Evidence

- The PR and its merge commit.
- This branch's test, typecheck, lint, census, governance and release-check runs.
- Mutation results: 113 of 113 mutants killed on the final pass.
- For each dispatch: the workflow contract, the operator summary, the extracted proof bundle (progress, plan, validation, quality gate, proof manifest) and, for an apply, the Blob proof objects under `moves-demo-assumption-register-seed/runs/<run id>/`.

## Known Gaps

- The apply is blocked until a named person adds the manifest load approval. This is intended.
- The job assumed the private operator job already had the Blob proof storage account and identity settings. The first apply dispatch refuted this: it stopped before starting (`AZURE_STORAGE_ACCOUNT_NAME_required`) and wrote nothing. Follow-up fix: the dispatch workflow now passes the private data-plane proof account and the operator job's attached managed identity (a Storage Blob Data Contributor on that account) to the apply only. Each can be overridden with a repository variable. The scope step refuses an apply when either is malformed. A new test checks that every variable the job requires in apply mode is supplied by the apply step.
- Figures are synthetic and single-source. A confirmed row is confirmed only against the synthetic assessment it cites, and each answer says so. The tenant-intake lineage report marks the intake spend totals as single-source, so the spend baseline row is left open for Finance.
- Generation is not switched on here.
