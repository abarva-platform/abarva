# 2026-09-29 Source Client Final Readable Body

## Release ID

`2026-09-29-source-client-final-readable-body`

## Status

`candidate`

## Plain-English Summary

Source now refuses to mark an uploaded Client Final authoritative when the file contains no extractable text. The operator receives a clear error and can provide a text-readable final. Unreadable files may still be handled through the ordinary evidence workflow; this change does not approve an AI draft or a sourcing stage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: strengthens the human-reviewed artifact acceptance boundary before Source records an authoritative version.
- Layer 3, canonical enterprise model: no facts, suppliers, prices, contracts, or approvals are created or changed.
- Layers 1 and 2: no intake format or adapter change.

## Client Applicability

- All clients: yes, when accepting a Source Client Final.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Client Final route refuses null or whitespace-only extracted content before blob or metadata writes.
- Acceptance form explains the text-readable requirement.
- Behavioral regression covers both unreadable outcomes and absence of persistence side effects.
- No migration, data job, or approval-policy change.

## QA / Validation

- Pass: red-first route tests reproduced a 200 response for unreadable content before the fix.
- Pass: disabling the guard made both unreadable-content tests fail; the guard was restored.
- Pass: focused route and Client Final authority suites, 24/24 tests.
- Pass: TypeScript (`tsc --noEmit --incremental false`).
- Pass: scoped ESLint, `npm run release:check`, and `git diff --check`.
- Not run: PR CI/review and post-deploy signed-in negative replay at record creation.

## Rollout Plan

Squash-merge the reviewed PR to `main`. Only the repo-owned ACA main workflow may build and deploy the digest-pinned web image. No migration or data build is needed. Verify the route refuses an unreadable synthetic final without changing artifact authority; do not submit an approved final or record a stage decision as part of this negative test.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and sole 100%-traffic revision readback.
- Worker image invariant: pending required worker readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, negative control if safe, plus unchanged artifact queue.

## Rollback Plan

Revert through a PR and the repo-owned main deploy workflow. No stored file or database migration is rolled back by this release.

## Audit Evidence

- Focused test and mutation output are in the private execution ledger; PR, CI and deploy receipts will be added when available.

## Known Gaps

- This guard confirms a readable body exists; it does not replace human review of source claims, sections, visual quality, or approval rights.
