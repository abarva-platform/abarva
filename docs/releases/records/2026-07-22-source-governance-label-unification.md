# 2026-07-22-source-governance-label-unification — Source Governance Label Unification

## Release ID

`2026-07-22-source-governance-label-unification`

## Status

`candidate`

## Plain-English Summary

Source aVa artifact-authority answers now use the same shared artifact-authority resolver as the rest of Source instead of maintaining a hand-copied precedence order inside the answer engine. This prevents aVa from drifting away when the shared rules change, especially for explicit artifact acceptances that are stronger than a merely inferred current-authoritative generated record but still not the same as a client-final upload.

## Layer Impact

- Release lane: `global-control-lane` because this changes shared Source answer-engine behavior for all tenants.
- Product runtime: Updates `source-answer-engine.ts`, used by Source aVa artifact-governance answers.
- Evidence integrity: Aligns aVa artifact-finality selection with `resolveAuthoritativeArtifact()`.
- Governance/audit: Keeps the answer honest when the strongest available artifact is authoritative but not client-final.

## Client Applicability

- All clients: Yes, for Source aVa artifact-finality / artifact-authority questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-answer-engine.ts`
- `src/lib/source/__tests__/source-answer-engine.test.ts`
- `docs/backlog/source-product-backlog.md`

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/client-final-artifacts.test.ts --runInBand` — passed, 67 tests.
- Focused regression verifies an active-acceptance artifact beats a merely current-authoritative generated record through the shared resolver, and aVa does not claim client-final status when it is not confirmed.
- ESLint, TypeScript, `npm run release:check`, PR checks, ACA deploy proof, runtime invariant, and signed-in live proof are required before this record can move from `candidate` to `released`.

## Rollout Plan

Merge to `main` through a governed PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image to `app.abarva.ai`. No migration or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR; deploy must be performed by the repo-owned main workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Required after main deploy.
- Worker image invariant: No worker changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, a Source aVa artifact-finality answer should still render from signed-in `app.abarva.ai` and cite the artifact authority evidence path.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow roll forward with the revert commit. No schema rollback is required.

## Audit Evidence

- PR URL: Pending.
- Release checks: Focused Jest passed locally; ESLint, TypeScript, and `npm run release:check` pending.
- ACA deploy run: Pending.
- Runtime invariant report: Pending.
- Signed-in live proof bundle: Pending.

## Known Gaps

This slice does not add a new data join from `source_artifact_acceptances` into the Source aVa evidence formatter. It only aligns the answer-engine selection when that evidence is present. Safe repair/regenerate of old persisted drafts remains open as `SOURCE-ARTIFACT-AUTHORITY-001` item #8.
