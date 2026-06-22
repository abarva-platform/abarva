# 2026-06-22-tenant-matrix-storage-state-auth — Tenant Matrix Uses Browser Auth State

## Release ID

`2026-06-22-tenant-matrix-storage-state-auth`

## Status

`candidate`

## Plain-English Summary

The tenant-matrix live gate now uses the same Playwright `storageState` files as the signed-in crawl (`.auth/agent-<tenant>.json`) instead of assuming a copied Cookie header is enough. It also fails fast when private pages redirect to sign-in or `/api/intelligence/ask` returns HTML instead of the expected answer stream.

## Layer Impact

`internal-admin` lane — QA harness hardening only. No product runtime behavior, schema, feature flag, or client data changes.

## Client Applicability

- All clients: the gate can run across Apex Retail, First Capital, SkyHarbor, Meridian, and Lakeshore.
- Internal only: yes, this changes operator proof tooling.

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs` auto-discovers `.auth/agent-<tenant>.json`.
- Page checks run in a signed-in browser context when storage state is available.
- Ask checks run inside that browser context and reject redirects/HTML responses.
- Expert detection also accepts `AgentAnswer.contributingExperts`.

## QA / Validation

- pass: `node --check scripts/qa/tenant-matrix-gate.mjs`
- pass: `npm run release:check`
- fail: signed-in matrix run against `https://app.abarva.ai` using freshly minted agent auth states. The hardened gate now produces a valid failure: First Capital, SkyHarbor, Meridian, and Lakeshore render both pages and synthesize answers, but fail tenant-citation grounding; Lakeshore also emits the "not loaded" hedge; Apex agent auth redirects to sign-in.

## Rollout Plan

Merge to `main`. No migration or feature flag. Operators rerun:

```bash
BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs
```

after running `scripts/auth/prime-agent-client-auth-states.ts --refresh`.

## Deployment Authority

- Repo-owned deploy workflow: normal main deploy if merged.
- Shared runtime mutators: none.
- Approved image digest: n/a for QA-only harness change.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, by running the matrix with storage states.

## Rollback Plan

Revert this PR to return to the previous cookie-only matrix gate.

## Audit Evidence

- PR URL
- CI checks
- Matrix output from a signed-in run

## Known Gaps

This PR hardens the gate only. It does not fix missing tenant citations or the Apex agent-login redirect; it makes those failures unambiguous.
