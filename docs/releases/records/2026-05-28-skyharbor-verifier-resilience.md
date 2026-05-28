# 2026-05-28-skyharbor-verifier-resilience — Packet 29 Verifier Resilience

## Release ID

`2026-05-28-skyharbor-verifier-resilience`

## Status

`candidate`

## Plain-English Summary

This release hardens the SkyHarbor Packet 29 Tier-1 verifier so one transient browser-side fetch failure or stale ask-session memory no longer aborts or poisons the full 25-question evidence run. The runner now uses Playwright only to establish Clerk auth, then replays `/api/intelligence/ask` from Node `fetch` with an authenticated cookie jar, a unique run-level `tabId`, per-question aborts, and retries. It applies response `Set-Cookie` headers between questions and refreshes auth if the endpoint returns HTML instead of NDJSON. If the retry also fails, the question is retained as a scored failure row. That preserves the audit artifact and makes the pass/fail evidence honest.

## Layer Impact

- ops-release-lane: makes `scripts/skyharbor/07_verify/ground_truth_runner.mjs` suitable for full Packet 29 Section 8 evidence capture.
- app-control-lane: no production runtime behavior change.
- client-data-lane: no schema or data change.

## Client Applicability

- Specific clients: SkyHarbor Air / Delta demo verification path.
- All clients: not applicable.
- Feature flag: not applicable.

## Changes Included

- `src/app/api/intelligence/ask/route.ts` initializes the request-body tenant fallback before user/context lookups, so intermittent context lookup failures cannot erase `tenantInventoryKey`.
- `scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs` extracts an authenticated Clerk cookie header after browser sign-in.
- The runner calls `/api/intelligence/ask` via Node `fetch` instead of `page.evaluate(fetch(...))`, preventing one wedged page request from poisoning later questions.
- The runner sends a unique `tabId` per execution so prior failed verifier runs cannot contaminate the next run's ask-session memory.
- The runner keeps a small cookie jar, applies response `Set-Cookie` headers, and refreshes auth if the ask endpoint returns an HTML page instead of NDJSON.
- Each ask has a per-question abort timer and retries.
- If both attempts fail, the question is retained as a failed result with the error captured instead of terminating the whole run.

## QA / Validation

Passed locally:

```text
node --check scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs
npx eslint scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs scripts/skyharbor/07_verify/ground_truth_runner.mjs
git diff --check
```

## Rollout Plan

Merge to main after CI is green. No production deploy is required for runtime behavior, but main must carry the verifier used for the Packet 29 evidence artifact.

## Rollback Plan

Revert this commit if the verifier retry logic masks a deterministic runner bug. Rollback only affects local audit script behavior.

## Audit Evidence

- Prior Packet 29 verifier run aborted at `CTO-Q18` with `page.evaluate: TypeError: Failed to fetch`, leaving only raw events through `CTO-Q17` and no complete Markdown/JSON score artifact.
- A later hardened run completed the artifact but showed that once the browser page fetch wedged at `CTO-Q05`, most later questions became `page.evaluate: TypeError: Failed to fetch` rows rather than actual agent responses.
- A subsequent Node-fetch run showed that a static cookie header could drift into HTML 404/tenant-page responses after several questions; the cookie jar and auth refresh path address that harness defect.
- The same run showed Q1 occasionally inheriting stale "data unavailable" context from previous failed verifier attempts; the explicit run-level `tabId` isolates each replay while preserving continuity inside that replay.
- Isolated probes also showed the ask route sometimes returned only the surface source for SkyHarbor despite the request body carrying `client: skyharbor`; the route now preserves the request-body fallback even if contextual client resolution throws.
- The updated runner keeps the same scoring rubric and request payload, but moves request execution to Node `fetch`, updates cookies between calls, retries, and records a failed row with `status: 0` plus the captured fetch error if attempts fail.
- Syntax, lint, and diff checks are listed in `QA / Validation`.

## Known Gaps

The Packet 29 gate still depends on the actual 25-question production run. This release only prevents one transient fetch failure from erasing the run artifact.
