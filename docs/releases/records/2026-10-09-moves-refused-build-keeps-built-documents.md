# 2026-10-09 — Moves: a refused build request keeps the built documents on the page

## Release ID

`2026-10-09-moves-refused-build-keeps-built-documents`

## Status

`candidate`

## Plain-English Summary

The phase build hook (`usePhaseDocumentBuild`), shared by the gate build
control and the gate step page, marks every document row "queued" the moment a
build is requested. When the server then refused the request before queuing
anything (the build is held, capture could not be finalized, or the request
failed), the hook reset every row to "idle" — including documents that were
already built and signed.

Nothing had changed on the record, but the page now said otherwise: built and
signed gate documents read "Not built", their download links were gone, and the
gate submission was refused as "not on the record yet" until the page was
reloaded. A refused rebuild therefore stalled the one forward action on the
gate.

The hook now keeps the rows as they stood when the request was made and puts
them back when the request is refused, alongside the refusal sentence. A first
build that is refused is unchanged (its rows were idle before the request).

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves phase build control and gate step page (client
  state only).
- Canonical model: no schema, data or tenant change.

## Client Applicability

- All clients: yes, wherever a phase build request is refused after documents
  were already built.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none for the hook; the gate step page itself remains behind
  its existing flag.

## Changes Included

- `src/components/strategic-moves/use-phase-document-build.ts`: snapshot the
  rendered rows when a build is requested; restore them when the request is
  refused instead of resetting every row to "idle".
- `src/components/strategic-moves/step-page/__tests__/GateReadinessStep.test.tsx`:
  a refused rebuild of three signed gate documents leaves all three signed,
  shows the refusal, and the gate still submits with every document.

## QA / Validation

- PASS: the new case. Mutant: the fix reverted (rows reset to "idle") — the
  case fails. 1 of 1 killed.
- PASS: `npx jest` on `src/components/strategic-moves/step-page` and the two
  `phase-approve-and-build-*` suites (74 cases).
- PASS: `tsc -p tsconfig.json --noEmit` (exit 0). ESLint and Prettier clean on
  the changed files.
- PASS: test and tenancy-fence censuses regenerated, unchanged (no new test
  file).
- NOT RUN: signed-in walk (see Deployment Authority).

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or data
job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: on a phase whose gate documents are built,
  request a rebuild while the build is held, and confirm the documents still
  read built (and signed where signed) beside the refusal.

## Rollback Plan

Revert this change through a pull request; a refused build request resets the
rows to "idle" again.

## Audit Evidence

- Pull request and CI results.
- The mutant run above.

## Known Gaps

- The case runs through the gate step page; the older build control shares the
  same hook and is covered by its existing suites only.
