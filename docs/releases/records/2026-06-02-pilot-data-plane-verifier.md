# 2026-06-02-pilot-data-plane-verifier — Pilot Data-Plane Verifier

## Release ID

`2026-06-02-pilot-data-plane-verifier`

## Status

`candidate`

## Plain-English Summary

Adds the first executable T341 pilot private data-plane track: a reusable verifier that checks the SSO, Azure Blob landing zone, processing queue, Postgres data plane, audit ledger, scan gate, search index, notification fan-out, and admin-access configuration needed for the governed data loader wave. The verifier reports whether each hop is live-ready, stub-fail-closed, or blocked.

## Layer Impact

Release lane: `client-data-lane`.

This changes data-plane readiness tooling and Azure environment documentation. It does not change application runtime behavior, schemas, data writes, uploads, parsing, quarantine, or commits.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor are included in the pilot verification matrix.
- Internal only: AbarVa operators and PL agents use the verifier before live private data-plane execution.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/pilot-env/verify-data-plane.mjs`
- `scripts/pilot-env/__tests__/verify-data-plane.test.js`
- `docs/architecture/azure/PILOT-DATA-PLANE-ENV-MANIFEST-2026-06-02.md`
- `package.json`

## QA / Validation

- Pass: `node scripts/pilot-env/verify-data-plane.mjs --json`
- Pass: `npx jest scripts/pilot-env/__tests__/verify-data-plane.test.js --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked locally: `npm run secrets:staged` cannot run because the `gitleaks` binary is not installed in this worktree environment; the PR secret-scanning workflow remains the release gate.

## Rollout Plan

Merge to `main`. Operators and agents can run `npm run verify:pilot-data-plane` immediately. Live private data-plane validation requires setting the key names listed in the manifest and then running the verifier with `--live`.

## Rollback Plan

Revert the PR to remove the verifier, package script, manifest, and tests. No data, schema, migration, or runtime rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Local verifier output showing fail-closed behavior with no live keys.
- Focused Jest contract tests for stub-aware, live-blocked, and configured modes.
- CI release-control and secret-scanning results.

## Known Gaps

This is the executable PL-0/T341 harness, not the full live environment. Real live readiness still depends on Azure subscription/resource group selection, Clerk org/role mapping, queue technology finalization, legal attestation approval, and notification owner resolution.
