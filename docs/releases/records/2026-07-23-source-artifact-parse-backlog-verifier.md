# 2026-07-23-source-artifact-parse-backlog-verifier — Source Artifact Parse Backlog Verifier

## Release ID

`2026-07-23-source-artifact-parse-backlog-verifier`

## Status

`candidate`

## Plain-English Summary

Adds a read-only Source artifact parse-backlog verifier. Operators can now inspect existing Azure/Postgres `source_artifacts` rows for one Source event or one tenant and get a proof JSON that separates stored artifacts, parser-ready files, parsed evidence, search-ready artifacts, graph-projected artifacts, stale parsing rows, failed parser rows, and image/audio/video files that still need governed OCR or transcription.

This release does not parse files, repair artifacts, run a worker or backfill, create embeddings, vector-index content, project graph rows, run enterprise-context writeback, or promote anything to `agent_ready`.

## Layer Impact

- `client-data-lane`: Adds read-only verification over existing `source_artifacts` registry state. No schema, migration, data mutation, indexing, or promotion is included.
- `internal-admin`: Adds an operator-facing CLI command for local/VNet/ACA proof bundles.

## Client Applicability

- All clients: yes, for tenants with Source artifact registry rows.
- Specific clients: none hard-coded.
- Internal only: operator command only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/artifact-registry/parse-backlog.ts`: builds a read-only parse/search/graph readiness report from existing artifact registry rows.
- `src/scripts/source/verify-source-artifact-parse-backlog.ts`: resolves a tenant-scoped Source event or tenant-wide scope, reads Source artifact rows, writes `parse-backlog.json`, and optionally emits a base64 proof bundle.
- `package.json`: adds `source:artifact-parse:verify-backlog`.
- `src/lib/source/artifact-registry/__tests__/parse-backlog.test.ts`: covers parser-ready, unsupported OCR/transcription, parsed-not-indexed, attention, and no-mutation honesty rules.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-INGEST-001e`.

## QA / Validation

- Pass — `npm test -- --runInBand --runTestsByPath src/lib/source/artifact-registry/__tests__/parse-backlog.test.ts` passed, 4/4 tests. Jest printed pre-existing duplicate manual mock warnings for mdast/micromark helpers.
- Pass — `npm run source:artifact-parse:verify-backlog -- --help` printed read-only verifier usage and exited 0.
- Pass — `npx eslint src/lib/source/artifact-registry/parse-backlog.ts src/lib/source/artifact-registry/__tests__/parse-backlog.test.ts src/scripts/source/verify-source-artifact-parse-backlog.ts` passed.
- Pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` passed.
- Blocked — first `npm run release:check` run rejected this release record because the QA section used `Pending` instead of explicit pass/fail/not-run/blocked status language.
- Pass — rerun `npm run release:check` after this QA status correction passed.
- Blocked — local read-only tenant/event probe (`npm run source:artifact-parse:verify-backlog -- --client-key lakeshore --event-id c05872d8-0465-4bc8-8eeb-ff3d42ac6761`) could not reach Azure/Postgres because this worktree environment has no `ABARVA_AZURE_DATABASE_URL` or `DATABASE_URL`; runtime VNet proof remains required after deploy.
- Not-run — PR checks.
- Not-run after merge — repo-owned ACA main deploy or a superseding main deploy that contains the merge SHA, independent ACA runtime invariant, and read-only runtime command proof where safe data exists.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. The verifier is inactive until an operator runs the read-only command locally or inside the ACA/VNet runtime.

## Deployment Authority

- Repo-owned deploy workflow: required after merge (`.github/workflows/aca-main-deploy.yml`).
- Shared runtime mutators: none from this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: no user-facing UI change. Runtime proof should verify the command exists and, where safe data exists, read-only artifact backlog readback succeeds.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release is read-only.

## Audit Evidence

- PR: pending.
- Merge SHA: pending.
- Local validation: pending.
- ACA deploy proof: pending.
- Runtime read-only proof: pending.

## Known Gaps

- This does not add an async parse worker or backfill job.
- This does not repair old persisted drafts or artifacts.
- This does not run OCR/transcription for image/audio/video.
- This does not create embeddings, vector-index artifacts, or project graph rows.
- This does not run enterprise-context writeback or promote anything to `agent_ready`.
