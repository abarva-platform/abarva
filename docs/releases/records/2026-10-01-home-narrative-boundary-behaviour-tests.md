# 2026-10-01 Home Narrative Boundary Behaviour Tests

## Release ID

`2026-10-01-home-narrative-boundary-behaviour-tests`

## Status

`candidate`

## Plain-English Summary

The Home narrative builder decides which projected facts and derived signals a model is allowed to read. Its test suite only checked that certain text appeared in the builder's source file, and no CI workflow ran it, so a change that let an unproven fact into the model's input would have passed unnoticed. This change adds tests that run the builder on planted rows and check what ends up in the model's input, runs the suite on pull requests, and tightens the builder in the places those tests reached.

No product surface changes. The builder still refuses to generate for every tenant, because nothing yet records the readiness proof it requires.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake and source adapters: no changes. Source-record context is now refused inside the builder itself instead of relying on its caller to pass none.
- Canonical model: no schema, record, or readiness-ledger changes.
- Product: the Home narrative builder, which is an operator job, and its tests. No Home page, export, or advisor code changes.
- CI: one new pull-request workflow.

## Client Applicability

- All clients: the shared narrative builder and its CI check. Nothing a client can see changes.
- Specific clients: none.
- Internal only: operator job behaviour, tests, and the CI workflow.
- Public/demo only: none.
- Feature flag: none. The existing approved-write gate is unchanged.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`:
  - the packet builder, the signal readiness decision, and the refusal condition are exported so tests can execute them; importing the module no longer runs the job, and running it through a symlinked path still does;
  - non-empty source rows or source summaries are refused by the builder;
  - a derived signal's proof is bound to the source version of every row the signal cites, instead of to the signal's own text twice;
  - rows the job itself writes (chapter summaries, chapter claims, the stored story plan) are never assessed as fact candidates;
  - a row is admitted on its own proof, not on a context id it may share with another row;
  - labels used to replace raw identifiers in generated prose come from admitted rows only.
- `scripts/ecl/home-narrative-readiness.ts`: one shared definition of the signal source hash, for the builder and for whatever later records signal proofs.
- `scripts/data-build/build-enterprise-thesis.ts` and `scripts/data-build/build-home-chapters.ts`, which the builder imports: each decided whether it was run or imported by testing whether the invoking path contained its own name, so an importer whose path contained that name started a build. Both now compare resolved files.
- `scripts/ecl/__tests__/home-narrative-admission-boundary.test.ts` (new) and `scripts/ecl/__tests__/home-narrative-readiness.test.ts`: behaviour tests.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`: runs both test files, fails if either found no tests or skipped one, and checks the workflow's path filter against the files the suite loads and reads.
- `.github/workflows/ecl-home-narrative-boundary.yml` (new): runs `npm run test:ecl-home-narrative-layer` on pull requests that touch those files.
- No migration, data build, or dependency change.

## QA / Validation

- PASS: `npm run test:ecl-home-narrative-layer` on Node 24, the version the workflow uses. 91 assertions, which include 13 behaviour tests: 11 for the builder and the scripts it imports, and 2 for the readiness check.
- PASS: mutation check. 49 mutants of the builder, the readiness module, the two imported build scripts' entry checks, the tests, and the workflow; 48 fail the suite, each on an assertion. The one that does not is an edit to an unchanged filter that only ever receives admitted rows, so no input can observe it.
- PASS: the three Jest suites that import the two build scripts (`tests/behaviors/build-home-chapters.test.ts`, `tests/behaviors/enterprise-thesis-validation.test.ts`, `scripts/data-build/__tests__/build-home-chapters-cli.test.ts`), 41 tests.
- PASS: for a fixture with no shared context ids, no stored story plan, and no source rows, the packet is byte-identical to the one the previous builder produced.
- PASS: `tsc --noEmit --pretty false` under an 8 GB heap, exit 0.
- PASS: ESLint on the touched files, zero errors. The five existing unused-function warnings in the dormant source path are unchanged.
- PASS: `npm run release:check`.
- PASS: `npm run audit:test-ci-coverage:check`, `npm run audit:ci-gate-registry`, `npm run audit:named-suite-requiredness`, and `npm run test:npm-script-targets`. The new workflow moves none of their baselines.
- NOT RUN: the new workflow on GitHub. Its first run is on the pull request.
- NOT RUN: governed narrative generation, any tenant data build, and the Home test ratchet, whose paths contain no changed file.

## Rollout Plan

Squash-merge the reviewed PR. The repository ACA main deploy workflow builds and deploys the merged SHA as it does for any merge; the web runtime does not import the changed files. No migration, tenant data operation, or flag change. The new workflow starts running on the next pull request that touches a listed path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded in workflow output after deployment.
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker jobs must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: none for this change. No product surface reads the changed code, and no narrative is generated or published.

## Rollback Plan

Revert the PR through a new reviewed PR and the same ACA main workflow. No data rollback is needed: this change writes no readiness record, projection row, or narrative row. Reverting restores the earlier signal-proof format. No signal proof exists yet, so nothing recorded is invalidated in either direction.

## Audit Evidence

PR, the suite output, the mutation table, the new workflow's first run, and the ACA main deploy run in the private completion ledger.

## Known Gaps

- No code in this repository writes the readiness records the builder requires, for projected rows or for derived signals. Until something does, the builder refuses for every tenant and generates nothing. This change does not alter that.
- The steps of the job that need a database (calling the refusal check, and passing the admitted-row labels to the prose scrubber) are held by assertions on the source text, not by execution.
- A signal's source binding covers the rows it cites, at most twenty per signal, not every row counted in an aggregate.
- A row's content hash is the hash of the row exactly as the builder reads it. Whatever records readiness proofs must hash the same shape; there is no shared helper for that yet.
- Two admitted rows whose keys normalise to one context id both appear under that id. Only the case where one of the two is unproven is closed here.
- The new workflow is path-filtered and is not a required status check.
