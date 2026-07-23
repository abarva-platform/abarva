# 2026-07-23-source-artifact-parse-backlog-verifier — Source Artifact Parse Backlog Verifier

## Release ID

`2026-07-23-source-artifact-parse-backlog-verifier`

## Status

`deployed-runtime-proven`

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
- Pass — PR #5475 merged as `7ed2f371817b3aebb5305ffc150c569aa3304a49` after GitHub checks passed.
- Pass — repo-owned ACA main deploy run `30015900379` completed successfully for merge SHA `7ed2f371817b3aebb5305ffc150c569aa3304a49`.
- Pass — current superseding ACA main deploy run `30022213407` completed successfully for `c6fbb7ff0ef205f5789b602ef1da56ebcb28d65b`, which contains PR #5475.
- Pass — independent ACA runtime invariant passed at `2026-07-23T16:03:20.101Z`: active revision `ca-abarva-web-lab-eastus--mc6fbb7ff`, 100% traffic, digest `sha256:95832144a70e85cd2f87d3b87ddba50d8cf066cb04900de2b40bbe8f2891f88a`, health OK, and both worker jobs on the same digest.
- Pass — runtime read-only verifier proof from ACA/VNet passed on digest `sha256:95832144a70e85cd2f87d3b87ddba50d8cf066cb04900de2b40bbe8f2891f88a` for Lakeshore event `LAKE-AMS-2026-C1402EFD` (`c05872d8-0465-4bc8-8eeb-ff3d42ac6761`): `artifacts=9`, `parsed=0`, `parserReady=9`, `searchReady=0`, `graphProjected=0`, `attention=0`, report path `/tmp/source-artifact-parse-backlog-proof/parse-backlog.json`.
- Pass — ACA private operator job proof run `job-abarva-private-operator-eus-7swni78` restored the job to the documented idle image and `/bin/true` command after the read-only verifier completed.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. The verifier is inactive until an operator runs the read-only command locally or inside the ACA/VNet runtime.

## Deployment Authority

- Repo-owned deploy workflow: required after merge (`.github/workflows/aca-main-deploy.yml`).
- Shared runtime mutators: none from this PR.
- Approved image digest: current superseding main deploy digest `sha256:95832144a70e85cd2f87d3b87ddba50d8cf066cb04900de2b40bbe8f2891f88a`.
- ACA runtime invariant: passed on revision `ca-abarva-web-lab-eastus--mc6fbb7ff`.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: no user-facing UI change. Runtime proof should verify the command exists and, where safe data exists, read-only artifact backlog readback succeeds.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this release is read-only.

## Audit Evidence

- PR: #5475.
- Merge SHA: `7ed2f371817b3aebb5305ffc150c569aa3304a49`.
- Local validation: focused Jest, help command, ESLint, TypeScript, and `npm run release:check` passed before merge.
- ACA deploy proof: repo-owned ACA main deploy run `30015900379`; current superseding deploy run `30022213407`; independent invariant active revision `ca-abarva-web-lab-eastus--mc6fbb7ff`, digest `sha256:95832144a70e85cd2f87d3b87ddba50d8cf066cb04900de2b40bbe8f2891f88a`.
- Runtime read-only proof: ACA/VNet operator job execution `job-abarva-private-operator-eus-7swni78` returned `status=ok` with 9 Lakeshore Source artifacts, all parser-ready and none parsed/search-ready/graph-projected/promoted; operator job idle restoration verified.

## Known Gaps

- This does not add an async parse worker or backfill job.
- This does not repair old persisted drafts or artifacts.
- This does not run OCR/transcription for image/audio/video.
- This does not create embeddings, vector-index artifacts, or project graph rows.
- This does not run enterprise-context writeback or promote anything to `agent_ready`.
