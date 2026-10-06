# 2026-09-19 Source Stage 05 NDA Readiness

## Release ID

`2026-09-19-source-stage05-nda-readiness`

## Status

`candidate`

## Plain-English Summary

Source New now shows a read-only Stage 05 NDA readiness card for the supplier phase. The card states what NDA evidence is complete, what is still blocking, which supplier legal entity is explicitly covered when the read model provides one, and the next governed action. It does not infer identity from filenames, approve legal terms, contact suppliers, or send anything.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation and a small Source New read-model helper only. The route continues to use tenant-resolved event rows and tenant-filtered artifact rows; no canonical model, schema, migration, loader, tenant data, external action, or data-plane write behavior changes.

## Client Applicability

- All clients: yes, for Source New supplier/NDA phase visibility.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `SourceNewWorkspace` renders a Stage 05 NDA readiness card when the operator reviews the Suppliers & NDA phase.
- `buildSourceNewNdaReadiness` derives readiness from current NDA artifact metadata and an explicit governed supplier legal-entity field only.
- `SourceNewFileRow` can carry an optional supplier legal entity from an authorized caller; the live route does not synthesize one when the artifact registry lacks that field.
- Focused behavior tests cover ready NDA posture, missing legal-entity blockers, and absence of send/contact controls.

## QA / Validation

- PASS: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand`
- PASS: `npx jest src/components/source/new-workspace/SourceNewFiles.test.tsx --runInBand`
- PASS: `npx eslint src/lib/source/new-workspace/nda-readiness.ts src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx src/components/source/new-workspace/SourceNewFiles.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN YET: PR checks.

## Rollout Plan

Merge through PR into `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Signed-in Source New acceptance remains a separate human gate after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy before live claims.
- Worker image invariant: not affected by this change, but read back with the runtime invariant when available.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, separate human acceptance after deploy; not performed in this slice.

## Rollback Plan

Revert the PR. This removes the read-only Stage 05 card and helper without data rollback.

## Audit Evidence

PR, focused Jest output, scoped ESLint output, TypeScript output, release check output, repo-owned deploy run, ACA runtime invariant readback, and later signed-in Source New acceptance.

## Known Gaps

The live artifact registry does not yet expose a persisted supplier legal-entity field for NDA files, so the live page will block rather than infer one until an authorized read adapter supplies it. This slice does not approve legal terms, send supplier communications, mutate tenant data, or perform signed-in acceptance.
