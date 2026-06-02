# 2026-06-02-pilot-loader-wave-brief — Pilot Loader Wave Brief

## Release ID

`2026-06-02-pilot-loader-wave-brief`

## Status

`candidate`

## Plain-English Summary

Adds the canonical Pilot Loader Wave execution brief to the repository so the private data-plane backlog rows T341 through T352 have a GitHub-accessible authority document. The brief maps each Excel row to a named PL agent, names the current gaps, and defines the phased execution plan for the pilot-ready governed data loader.

## Layer Impact

Release lane: `internal-admin`.

Internal-admin planning and release-control documentation. This does not change runtime behavior, schemas, migrations, routes, or client data access.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: Apex, Meridian, and SkyHarbor are named in the execution brief as the pilot smoke-test coverage set.
- Internal only: AbarVa execution and governance teams.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/build/CODEX-PILOT-LOADER-WAVE-BRIEF-2026-06-02.md`
- `docs/releases/records/2026-06-02-pilot-loader-wave-brief.md`

## QA / Validation

- Pass: Verified the repo brief is byte-for-byte identical to the accessible copy in `~/Downloads`.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked locally: `npm run secrets:staged` could not run because the `gitleaks` binary is not installed in this worktree environment; the PR secret-scanning workflow remains the release gate.

## Rollout Plan

Merge to `main`. No production deploy behavior changes are expected because this is documentation-only.

## Rollback Plan

Revert the commit if the brief needs to be removed or replaced. No data or runtime rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- CI release-control gate.
- Local hash check proving the repo copy matches the accessible Downloads brief.

## Known Gaps

This PR does not complete T341 through T352. Those rows remain implementation work until the PL agents ship the test environment, attestation, upload, quarantine, processing, clarification, commit, outputs explorer, and E2E smoke evidence.
