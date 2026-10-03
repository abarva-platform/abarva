# 2026-09-29 Source Upload Link for Existing Evidence State

## Release ID

`2026-09-29-source-upload-link-existing-state`

## Status

`candidate`

## Plain-English Summary

When a required Source evidence row already has a readiness label but no linked source file, a new upload now attaches its persisted artifact. A record-backed row cannot inherit a higher, unsupported readiness label from earlier narrative text; it reflects the uploaded file's actual parse state. Previously linked, validated rows retain their state. Human gate decisions are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: reconciles an event's evidence-state projection with a governed artifact ID after upload.
- Layer 3, canonical enterprise model: no object, fact, supplier, financial value, or authority is created or changed.
- Layer 1/2: no intake format or adapter change.

## Client Applicability

- All clients: yes, for Source event evidence uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source upload-to-substrate reconciliation and focused behavior tests.
- No migration, data job, approval-policy change, or external transmission.

## QA / Validation

- Pass: red-first regression reproduced the skipped source link for an existing higher-rank row and an equal-rank row.
- Pass: two deletion mutations each failed the relevant live-shaped test and were restored.
- Pass: upload-sync 20/20, all canvas-substrate tests 66/66, upload route 15/15, and mounted upload/evidence authority tests 5/5.
- Pass: TypeScript (`tsc --noEmit --incremental false`), scoped ESLint, `git diff --check`, and `npm run release:check`.
- Not run: PR CI/review and signed-in post-deploy replay; complete before merge or live claim.

## Rollout Plan

Squash-merge the reviewed PR to `main`. Only the repo-owned ACA main workflow may build and deploy the digest-pinned web image. No migration or data build is part of this release. After runtime proof, repeat the exact requirement-bound synthetic upload and inspect the event-scoped evidence row plus signed-in checklist.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and sole 100%-traffic revision readback.
- Worker image invariant: pending required worker readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, upload then requirement readback.

## Rollback Plan

Revert through a PR and the repo-owned main deploy workflow. Existing uploaded artifacts remain registered; rollback does not delete user files or rewrite evidence rows. Any reconciliation of previously uploaded files requires a separately governed data decision.

## Audit Evidence

- Focused test output and mutation failures are recorded in the private execution ledger; PR, CI, deploy and signed-in receipts will be added when available.

## Known Gaps

- An upload that completed before this correction can remain a stored artifact without a requirement link. This release does not run a backfill or delete it.
- AI drafts, Client Final review and stage approval remain separate gates.
