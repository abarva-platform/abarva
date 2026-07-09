# 2026-07-09-moves-evidence-ledger-fallback — Moves Evidence Ledger Fallback

## Release ID

`2026-07-09-moves-evidence-ledger-fallback`

## Status

`candidate`

## Plain-English Summary

Moves free-text answers now prefer uploaded Move evidence when canonical pattern retrieval has no match. This prevents an evidence-rich Move from answering with unrelated manifest-pattern anchors while ignoring attached CSV evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Product runtime: `src/lib/programs/nexus-free-text.ts` changes shared Moves answer fallback behavior.
- QA: integration coverage now includes the exact no-match path where uploaded evidence must beat manifest fallback.

## Client Applicability

- All clients: Yes, for Programs/Moves free-text asks with uploaded program evidence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/nexus-free-text.ts`: ranks uploaded evidence rows and snippets for evidence-heavy questions before using manifest fallback.
- `src/lib/programs/nexus-free-text.ts`: keeps deterministic uploaded-evidence fallback from being silently replaced by unrelated manifest-pattern answers.
- `src/__tests__/integration/programs-nexus-free-text.test.ts`: adds canonical no-match regression coverage.

## QA / Validation

- Pass: `rg -n "Lakeshore|lakeshore|legal|\$[0-9]" src/lib/programs/nexus-free-text.ts || true` returned no matches.
- Pass: `npx jest src/__tests__/integration/programs-nexus-free-text.test.ts --runInBand`.
- Pass: `npx eslint src/lib/programs/nexus-free-text.ts src/__tests__/integration/programs-nexus-free-text.test.ts`.
- Pass: `git diff --check`.
- Pass: `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false`.
- Pass: `npm run release:check`.
- Pre-fix live proof: Chrome-auth post-deploy crawls at `proof/moves-e2e-lakeshore-legal-case-study-live-postdeploy-chrome-20260709T021954Z` and `proof/moves-e2e-lakeshore-legal-case-study-live-postdeploy-chrome-ea0e40c0-20260709T024328Z` showed attachments persisted and all Moves API calls returned 200, but Q-006/Q-007/Q-008 fell into manifest fallback.

## Rollout Plan

Open a PR, squash merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then rerun the signed-in Lakeshore Moves golden crawl.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: No local or ad-hoc Azure runtime mutation.
- Approved image digest: To be produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy; template image and 100% traffic revision must match the approved digest.
- Worker image invariant: Required by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Chrome-auth Lakeshore Move crawl and tenant-evidence-claim guard.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA main workflow. No schema or data migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI/checks: Pending.
- ACA deploy run: Pending.
- Live proof: Pending post-deploy crawl under a new `proof/moves-e2e-lakeshore-legal-case-study-live-postdeploy-*` folder.

## Known Gaps

Home, Intelligence, and Tower golden questions may still fail if their surfaces do not consume the uploaded Move CSVs. This release specifically fixes the Moves free-text evidence fallback.
