# 2026-07-16-route-archive-audit — Route Archive Audit

## Release ID

`2026-07-16-route-archive-audit`

## Status

`candidate`

## Plain-English Summary

Adds a controlled route-retirement audit for the Next.js App Router. The audit inventories every page route, counts route references, and classifies routes as keep, redirect-candidate, archive-candidate, or human-review. This PR does not move, delete, redirect, or archive any route.

## Layer Impact

- Release lane: `internal-admin`.
- Internal admin / engineering control: adds an operator audit script and report bundle for route cleanup planning.
- Runtime product behavior: none. No app routes, middleware, redirects, pages, APIs, or navigation behavior are changed.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes, engineering route-retirement planning.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `scripts/audit/route-archive-audit.mjs`.
- Adds `npm run audit:route-archive`.
- Adds generated report files under `reports/route-archive-audit/`.

## QA / Validation

- Pass: `node --check scripts/audit/route-archive-audit.mjs`
- Pass: `npm run audit:route-archive`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Merge only. This is report/script-only and has no runtime rollout. A later PR should perform any approved archive moves or redirects.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime behavior; normal main workflow may still build after merge.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the audit script, npm command, and generated report. No data, migration, route, or deployment rollback is required.

## Audit Evidence

- Report bundle: `reports/route-archive-audit/`
- PR URL: https://github.com/abarva-platform/abarva/pull/4859

## Known Gaps

- This is not an archive/delete PR.
- Classification is conservative and literal-reference based; externally linked, role-gated, and dynamic routes require human owner review.
