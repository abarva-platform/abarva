# 2026-10-11-tower-registered-intake-candidate — Registered intake candidate proof

## Release ID

`2026-10-11-tower-registered-intake-candidate`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable Tower candidate build from the current active tenant input registry. It shows what each of nine Tower views could safely say from registered source files. Missing budget approval, conflicting money, unapproved evidence, and missing identity links remain visible gaps. This release does not write a database row or change the page.

## Layer Impact

Release lane: `client-data-lane` for an inactive, synthetic candidate proof. No client-scoped database data is changed by this PR.

- Layer 1: reads only the registered active input root and records source file hashes; source files are unchanged.
- Layer 2: records a source reference for each candidate row. This is a dry adapter proof, not a physical source load.
- Layer 3: forms typed, source-backed candidate facts while keeping unsupported financial facts unknown. This is an inactive build artifact.
- Layer 4: maps candidate records to nine Tower view families for review. It does not populate serving tables or change runtime selection.

## Client Applicability

- All clients: the script can only resolve an active registry tenant supplied by key.
- Specific clients: none activated by this release.
- Internal only: candidate build and read-only lifecycle preflight.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/tower/build-registered-intake-reload-candidate.mjs` builds the source manifest, candidate facts, nine view previews, integrity gates, and coverage gaps.
- `scripts/tower/probe-registered-reload-lifecycle.mjs` verifies the exact tenant has one declared active assessment matching the serving selector before any proposed write.
- `package.json` exposes the candidate and preflight commands.

## QA / Validation

- Pass: `npm run test:tower-registered-intake-candidate` verifies that unsupported money stays unknown, every view has source-backed rows, the raw user extract is not copied into proof, and inactive tenants are rejected.
- Pass: `npm run tower:registered-intake:candidate -- --tenant-key <active-key> --out-dir <private-dir>` builds a dry candidate and records fatal checks separately from coverage gaps.
- Pass: `node --check` on both new scripts.
- Not run: database lifecycle preflight, physical reload, and signed-in browser proof.
- No database write, deployment, or signed-in Tower proof is claimed.

## Rollout Plan

Merge the candidate builder for operator review. A later, separate governed writer must stage a distinct inactive assessment from an approved dataset manifest. It must first pass the exact tenant lifecycle preflight, then prove all nine staged views by direct assessment readback. Promotion must atomically switch the declared active assessment after those checks.

## Deployment Authority

- Repo-owned deploy workflow: shared web traffic changes only through the main ACA deployment workflow.
- Shared runtime mutators: none in this release.
- Approved image digest: required when running the private operator preflight; captured by its job proof.
- ACA runtime invariant: must be checked after any later deployment.
- Worker image invariant: must match the approved digest for later operator execution.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after later data promotion.

## Rollback Plan

No runtime state changes here. Revert the PR to remove the builder. Future staged assessments need a separate lifecycle rollback plan before promotion.

## Audit Evidence

The candidate output contains file hashes, source row counts, source references, view counts, fatal checks, and coverage gaps. The lifecycle preflight prints the exact declared active assessment or fails closed.

## Known Gaps

Physical Layer 2/3/4 writes, direct staged assessment readback, promotion, and signed-in browser proof require a separate release. An approved FY budget and claimable AI value remain unknown until their owners supply reconciled evidence.
