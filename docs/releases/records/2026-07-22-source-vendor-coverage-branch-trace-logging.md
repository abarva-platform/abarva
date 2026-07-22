# 2026-07-22-source-vendor-coverage-branch-trace-logging — Trace every branch inside the vendor-coverage answer builder

## Release ID

`2026-07-22-source-vendor-coverage-branch-trace-logging`

## Status

`candidate` — typecheck/lint/test clean locally. Deploying to isolate the exact branch that
returns `null` for the live-verify gap.

## Plain-English Summary

Fourth round of live-verify on the vendor-coverage governed chat answer. The wrapper-level
error logging added in `2026-07-22-source-vendor-coverage-answer-error-logging.md` confirmed
(via a clean Log Analytics query with no matching entries, immediately after deploy, with logs
from other requests visibly flowing in the same window) that `buildVendorCoverageGovernedAnswer`
is **not throwing** — it is returning `null` from one of its own internal early-return guard
clauses. Two of the most likely guard clauses were investigated by direct evidence and ruled
out: `isCanonicalClientKey` (the seeded event's real tenant key, `meridian-health`, is
confirmed present in `CANONICAL_TENANT_KEYS`; `"Healthcare Demo"` is only a downstream
display-text sanitization, not the underlying `client_key`), and archetype resolution (the
event's raw `archetype` field is `"Infrastructure"`, which doesn't exact-match the registry's
lowercase `eventType: 'infrastructure'`, but `resolveValueArchetype`'s fallback-to-first-
archetype-with-lever-rules path should still land on the AMS archetype used to build the
seeded CSV).

Rather than keep guessing between the remaining candidates (`vendorResponses.signalPresent`,
`insight.vendors.length === 0`, or a resolution mismatch between the canvas's server-render
client-key and this route's client-key), this adds a `console.error` trace at every early-
return branch inside `buildVendorCoverageGovernedAnswer` itself, plus one on the success path,
so the next Log Analytics query names the exact branch definitively instead of requiring
another round of elimination.

## Layer Impact

- `global-control-lane`: touches only `vendor-coverage-governed-answer.ts`'s internal control
  flow. Adds `console.error` trace calls on every branch (all six early-return points plus the
  success path) — no behavior change to what is returned.

## Client Applicability

- All clients: yes — no gate, no flag.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/source/ava/vendor-coverage-governed-answer.ts` — added a local `trace()` helper
  (structured `console.error` with `step`, `eventId`, `clientKey`, `eventType`, and
  branch-specific detail) called at: `not_canonical_client_key`, `no_vendor_response_signal`
  (with fact count), `no_archetype_resolved`, `insight_not_live_or_no_vendors` (with resolved
  archetype id/eventType, `isModel`, vendor count, and the raw derived vendor list), and
  `insight_live_with_vendors` (the success path, confirming the function reaches candidate
  construction). Purely additive — no return-value changes.

## QA / Validation

- `pass` — `tsc --noEmit` clean (only the same pre-existing, unrelated node_modules-drift
  errors).
- `pass` — `eslint` — 0 errors.
- `pass` — `vendor-coverage-governed-answer.test.ts` — 8/8 (unaffected by the trace calls,
  which don't change any return value the existing tests assert on).

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: not applicable to this diagnostic change; the vendor-coverage
  feature's live-proof remains open, tracked across this record and the three prior records in
  this chain.

## Rollback Plan

Revert the merge commit — removes the trace calls. No data migration either direction.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after merge and deploy.
- Log Analytics: after deploy, re-ask the seeded vendor-coverage question and query
  `ContainerAppConsoleLogs_CL` for `source.vendor-coverage-governed-answer.trace` to identify
  the exact branch.

## Known Gaps

- The exact reason `buildVendorCoverageGovernedAnswer` returns `null` for the seeded
  Healthcare Demo (meridian-health) event is still open pending this trace's output.
