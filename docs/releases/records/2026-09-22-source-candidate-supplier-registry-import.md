# 2026-09-22-source-candidate-supplier-registry-import — Controlled Candidate Supplier Registry Import

## Release ID

`2026-09-22-source-candidate-supplier-registry-import`

## Status

`candidate`

## Plain-English Summary

This release adds the controlled operator path for importing the public-safe synthetic candidate supplier registry fixture into the governed Source supplier legal-entity table for one explicitly named tenant. The default path is dry-run proof only. Apply mode is guarded by tenant scope, immutable input identity, explicit approval, and an exact confirmation token.

The change does not import data by itself. It does not create Source events, write candidate-supplier event acceptance records, contact suppliers, send email, apply migrations, or shift shared web traffic.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: Reuses the already-governed synthetic supplier registry fixture and its manifest. The fixture remains public-safe synthetic source-shaped input.
- Layer 2: Adds a deterministic loader/operator path that validates the fixture and maps eligible rows into supplier registry rows only after separate apply approval.
- Layer 3: Apply mode can append tenant-scoped `source.vendor` rows for reviewed eligible synthetic candidate suppliers when the schema already exists.
- Layer 4: No product UI or runtime projection is changed in this release.

## Client Applicability

- All clients: No automatic effect.
- Specific clients: None without a separately approved manual workflow dispatch for one explicit non-global tenant.
- Internal only: Operator workflow and proof artifacts.
- Public/demo only: The source fixture remains synthetic demo data.
- Feature flag: None.

## Changes Included

- `scripts/source/load-candidate-supplier-registry.ts`
- `.github/workflows/source-candidate-supplier-registry-import-job.yml`
- `src/__tests__/integration/source/source-candidate-supplier-registry-loader.test.ts`
- `src/__tests__/integration/source/source-candidate-supplier-registry-import-workflow.test.ts`
- `package.json` scripts `source:candidate-supplier-registry:job` and `source:candidate-supplier-registry:apply-job`

## QA / Validation

- PASS: Focused Jest for the supplier registry loader and workflow contract.
- PASS: Dry-run command proving no database configuration is required.
- PASS: Mismatched input hash refusal before proof output.
- PASS: Apply refusal before database access when approval is absent.
- PASS: Proof-bundle generation check.
- PASS: Targeted ESLint on the new loader and tests.
- PASS: TypeScript typecheck.
- PASS: `npm run release:check`.
- PASS: `git diff --check`.
- PASS: Mutation proof weakened the `corpus_global` apply fence and the focused loader suite failed on that guard.
- PASS: Mutation proof swapped the workflow apply script to the wrong entrypoint and the workflow contract suite failed.

## Rollout Plan

Merge to `main` makes the manual workflow and npm scripts available. The repo-owned ACA main deploy may ship the code to the shared runtime, but no import runs from deploy alone. A later data-plane load requires a separate manual workflow dispatch with dry-run proof first and then a separately approved apply run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this release.
- Approved image digest: Not assigned until the repo-owned deploy workflow runs after merge.
- ACA runtime invariant: Required before claiming deployed/runtime-proven.
- Worker image invariant: Required before claiming deployed/runtime-proven.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for merge alone; required only after a separately approved data load if a product surface claim is made.

## Rollback Plan

Revert the PR to remove the loader scripts and manual workflow. If a future approved apply has inserted rows, rollback of data rows requires a separate tenant-scoped data-plane rollback plan and approval; this release does not perform that apply.

## Audit Evidence

- Pull request URL after opening.
- Focused Jest output for loader and workflow tests.
- Dry-run proof JSON and proof-bundle validation from local tests.
- TypeScript, ESLint, release check, and whitespace check output.

## Known Gaps

- No migration apply performed.
- No manual workflow dispatched.
- No tenant data imported.
- No Source event, candidate-supplier event authority, supplier contact, email, or signed-in acceptance proof.
