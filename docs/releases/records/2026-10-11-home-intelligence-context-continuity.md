# 2026-10-11-home-intelligence-context-continuity — Version-bound advisory continuation

## Release ID

`2026-10-11-home-intelligence-context-continuity`

## Status

`candidate`

## Plain-English Summary

Home can continue a question in Intelligence with the selected enterprise record attached. Intelligence resolves the record on the server and refuses an unauthorized or changed version before answering. It does not silently combine the selected Home evidence with unrelated tenant assessments. Questions stay out of the navigation URL. Source and readiness limits remain visible and enforced.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1–3: no source, canonical data, schema, admission, load approval or serving selection changes.
- Layer 4: Home, its advisor and Intelligence use the same record resolver for this continuation. The record marker is an equality check, never an access credential. Industry references remain separate from enterprise evidence. The existing context-governance validator still filters model input; publication does not earn agent readiness.

## Client Applicability

- All clients: existing standalone Intelligence behavior remains unchanged.
- Specific clients: only the code-declared Home preview tenants accessible to existing platform-admin or foundation-operator sessions can use the continuation.
- Internal only: no new operator capability or access grant.
- Public/demo only: synthetic source labels remain intact; no new data rollout.
- Feature flag: no flag; continuation is opt-in through the Home link.

## Changes Included

- Shared Home record resolver for page, Home advisor and advisory continuation.
- Version-bound Home links with chapter focus and one-use, tenant/version-scoped session question storage.
- Server-side request validation, existing authorization checks, stale-version refusal and selected-record retrieval isolation.
- Visible source state in Intelligence; same aVa branding and native chat surface.
- No automatic advisor invocation on navigation; the user chooses the question to submit.

## QA / Validation

PASS: 32 focused suites / 306 tests, covering Home selection, shared resolver, mounted UI, route guards, server-page tenant resolution, source isolation, tenant fences and existing advisor behavior. PASS: TypeScript (8 GB heap after reconciliation with main), focused ESLint, all 11 release gates and all five context-corpus checks (existing manifest warnings remain unchanged). PASS: Home ratchet has no baseline movement (730/758 tests, 12 previously baselined suites). New isolation tests and the provisional-evidence validator run in PR CI. Signed-in continuation and changed-version refusal are not run until deploy; no live claim is made here.

## Rollout Plan

Protected PR, squash merge, then the repo-owned ACA main workflow. The existing dataset load and serving gates are unchanged. This release does not refresh Home data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` exclusively shifts shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture from the main deploy.
- ACA runtime invariant: template and 100% traffic revision match the approved digest.
- Worker image invariant: required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: source label, retained question, correct tenant and changed-version refusal.

## Rollback Plan

Revert this PR through the protected main workflow. No data or serving pointers require rollback. Removing the continuation restores independent navigation; existing source and admission gates remain in place.

## Audit Evidence

PR diff, current-head CI, focused tests, release gates, main deploy, runtime digest checks and private signed-in proof. Session storage contains only the chosen question, is scoped to the tenant and record, and is consumed on arrival; it is not a new canonical dataset.

## Known Gaps

The record may still be a reviewed stored fallback. Staged datasets require their own exact-version load, review and serving decisions before inclusion. This change cannot establish financial approval, measured outcomes, external benchmark compatibility or a cross-assessment identity map. Moves and Source question continuation are not part of this release.
