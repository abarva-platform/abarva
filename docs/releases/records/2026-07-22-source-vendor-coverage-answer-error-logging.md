# 2026-07-22-source-vendor-coverage-answer-error-logging — Stop silently swallowing vendor-coverage answer failures

## Release ID

`2026-07-22-source-vendor-coverage-answer-error-logging`

## Status

`candidate` — typecheck/lint clean locally. Deploying to get a real error signal for the
live-verify gap below.

## Plain-English Summary

Third round of live-verify on the vendor-coverage governed chat answer (see
`2026-07-22-source-vendor-coverage-governed-chat-answer.md` and the two live-surface-fix
records that followed it). After correcting the client wiring twice, asking the seeded
vendor-coverage question in the real "Ask aVa" widget still returns only the prose summary
line — no `agent-answer` NDJSON line at all. Direct network-level testing (a raw authenticated
`fetch` to the route from the browser) confirms the request reaches the right route with the
right `Accept` header and gets a 200 with `content-type: application/x-ndjson`, but the body
has exactly one line.

The route's call to `buildVendorCoverageGovernedAnswer(...)` is wrapped in
`.catch(() => null)` — deliberately, so a genuinely honest "no signal yet" `null` never breaks
the chat turn. But that same catch also silently swallows a *real* thrown error, making the
two cases indistinguishable from the outside. Log Analytics queries for this event/tenant over
the request window found zero error-level log lines, which is consistent with either case —
so before spending another live-verify round guessing, this makes the failure observable.

This is not a guess-and-check patch: the catch behavior is intentionally unchanged (a failure
here must never break the chat turn), only the previously-silent branch now logs enough to
tell the difference between "no signal" and "threw."

## Layer Impact

- `global-control-lane`: touches only the vendor-coverage NDJSON branch of
  `nexus/ask/route.ts`, already scoped to Source event chat. Adds a `console.error` call on
  failure only — no behavior change on success or on the "no signal" `null` path.

## Client Applicability

- All clients: yes — no gate, no flag.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — the `.catch(() => null)` around
  `buildVendorCoverageGovernedAnswer(...)` now logs a structured `console.error` (event id,
  client key, resolved `eventType`, error message, stack) before still resolving to `null`.
  Behavior is otherwise byte-for-byte identical — a failure still never breaks the chat turn.

## QA / Validation

- `pass` — `tsc --noEmit` clean (only the same pre-existing, unrelated node_modules-drift
  errors).
- `pass` — `eslint` — 0 errors, 0 warnings.
- `manual` — this is a diagnostic-visibility change, not a behavior fix; the actual live-verify
  proof is still open and will be captured once the real root cause is found via the new log
  line and (if code changes are then needed) a follow-up fix + record.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: not applicable to this diagnostic change itself; the
  underlying vendor-coverage feature's live-proof remains open and tracked in the prior three
  records in this chain.

## Rollback Plan

Revert the merge commit — restores the fully-silent catch. No data migration either direction.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after merge and deploy.
- Log Analytics: after deploy, re-ask the seeded vendor-coverage question and query
  `ContainerAppConsoleLogs_CL` for `source.nexus-ask.vendor-coverage-governed-answer.failed`
  to capture the real cause (or its absence, confirming a legitimate no-signal `null`).

## Known Gaps

- The underlying reason the vendor-coverage answer isn't appearing is still open as of this
  record. This change exists specifically to close that gap in the next verification pass
  rather than guessing further.
