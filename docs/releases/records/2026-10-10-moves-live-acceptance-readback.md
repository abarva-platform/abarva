# 2026-10-10 — Moves live acceptance readback

## Release ID

`2026-10-10-moves-live-acceptance-readback`

## Status

`candidate`

## Plain-English Summary

Production signed-in checks now require a dedicated production Clerk credential before attempting a browser session. Step pages display the authenticated Move's tenant name, and a historical phase displays that phase's gate criteria rather than the Move's current-phase criteria. These changes address acceptance readbacks without changing any gate decision or stored Move data.

## Layer Impact

- Release lane: `experimental` for feature-enabled Moves step pages, plus `internal-admin` for the read-only walk.
- Layers 1–3: no intake, adapter, canonical record, or tenant-data mutation.
- Layer 4: Moves presentation and historical gate read projection. The existing evaluator remains the sole gate authority.

## Client Applicability

- All clients: no default behavior change while step pages are feature gated.
- Specific clients: none named in this public record.
- Internal only: the live walk's credential preflight.
- Public/demo only: the current step-page enrollment is limited to a synthetic demo tenant.
- Feature flag: existing step-page flag; no flag change.

## Changes Included

- Four workflows that sign in to the production app require the dedicated production E2E secret and refuse a key without the production prefix. Development browser checks retain their separate credential.
- Shared step-page header and call sites show the tenant name from the authenticated Move projection.
- The phase route evaluates the viewed historical phase's gate while preserving current-phase navigation tallies.

## QA / Validation

- Full step-page Jest suite: 9 passed, 157 tests passed. Transformer suite: 17 tests passed.
- Mutation checks: removing the tenant label failed its page test; returning the current gate for a historical view failed its transformer test. Both original files were restored.
- Typecheck: pass.
- Focused ESLint: pass.
- Playwright live-walk discovery: pass, one spec discovered.
- Post-deploy crawl contract smoke and YAML parse of all four changed workflows: pass.
- Visual check: actual component HTML with its CSS at 1440px and 390px, light and dark; tenant label visible, no horizontal document overflow. No change to the template region order.
- Library orphan, route reachability, export reachability, manual, coverage census, and tenancy census checks: pass with no added drift. Release check: all 11 gates pass.
- Live signed-in acceptance on this candidate: not yet run; requires the production E2E credential and a repo-owned deploy.

## Rollout Plan

Merge through a scoped pull request. The repo-owned ACA main deploy workflow publishes the product code. The read-only walk may then run with a repository secret for the same production Clerk instance as the app. No data job, migration, or approval write is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone controls shared runtime traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: supplied by the deploy workflow, not this PR.
- ACA runtime invariant: verify template, 100% traffic revision, and required worker digests after deploy.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: a passing per-view walk artifact before claiming the pages proven.

## Rollback Plan

Revert the PR through the normal release lane. No database rollback is needed.

## Audit Evidence

- PR checks and local focused tests.
- After deploy, the `moves-step-pages-live-walk` artifact with per-view results and screenshots.

## Known Gaps

- A production Clerk E2E key must be configured as `CLERK_PRODUCTION_E2E_SECRET_KEY`; the key itself must not enter this repository. The shared development secret remains separate.
- A read-only walk of an existing fixture can reveal a missing approved upstream estimate. The walk records this one exact P4 view as a known gap; the page remains blocked and no approval state is invented.
- The candidate has no post-deploy signed-in proof yet.
