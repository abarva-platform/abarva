# 2026-10-01 Source RFP Issuance Language

## Release ID

`2026-10-01-source-rfp-issuance-language`

## Status

`candidate`

## Plain-English Summary

An RFP draft cannot present itself as already issued to vendors. Both D09 drafting paths now instruct the writer to identify an unreleased document as a draft. The existing disclosure fence recognizes affirmative issuance claims and prevents a falsely issued-looking Client Final from being stored as the authoritative package.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: tightens the D09 draft and final-admission controls. It does not change canonical facts, release authority, recipient selection, or delivery receipts.

## Client Applicability

- All clients: newly generated D09 drafts and D09 Client Final submissions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The D09 section and fallback prompts keep release state as Draft / Not issued until separately authorized and evidenced.
- The existing D09 disclosure fence identifies affirmative release-state and vendor-issuance claims.
- Unit and Client Final route tests cover false issuance, honest draft language, and zero-write refusal. No migration or data load.

## QA / Validation

- Red-first: the live-shape false-issuance phrase had no disclosure violation, and both D09 prompt paths lacked the specific release-state instruction.
- A deliberate detector-removal mutation changed the Client Final response from `422` to `200`; restoring the pattern returned `422` with no Blob, registry, or artifact-body writes.
- The generation group passed 15 suites / 183 tests; the adjacent Client Final and generation-route tests passed 2 suites / 15 tests. Typecheck, scoped ESLint, release check, and diff check passed. CI and signed-in replay remain unproven in this candidate record.

## Rollout Plan

Squash-merge after applicable validation. Only the repo-owned ACA main workflow may build and deploy the main image. Regenerate a signed-in D09 draft and inspect its saved body and disclosure/quality receipt. Do not treat generation or merge as external publication.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: verify web template, sole 100%-traffic revision, and both delivery-worker jobs on the same immutable digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: persisted D09 body and quality receipt after regeneration.

## Rollback Plan

Revert through a reviewed PR and the repo-owned main deploy workflow. No schema or tenant-data rollback is needed.

## Audit Evidence

- Red/green helper and prompt tests, plus the route mutation returning `200` only when the new pattern is removed.
- PR, CI, merge SHA, ACA run, and signed-in replay are recorded in the private execution ledger when available.

## Known Gaps

This prevents false issuance language; it does not approve a package, supply Legal-cleared terms, create a recipient snapshot, publish to suppliers, or satisfy the RFP stage gate.
