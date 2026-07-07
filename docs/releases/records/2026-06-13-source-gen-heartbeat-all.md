# 2026-06-13-source-gen-heartbeat-all — Heartbeat-stream all Source generations

## Release ID

`2026-06-13-source-gen-heartbeat-all`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Fixes the HTTP 504 on Source deliverable generation (d01/d02/d03/d05). A synchronous Anthropic generate
sends no bytes to the client for 60-240s; the ACA ingress idle-times-out (~245s observed) and 504s before
the artifact persists. d09 already avoided this by wrapping generation in a JSON heartbeat stream (whitespace
every 12s keeps the connection alive until the final JSON). This applies that exact, already-proven wrapper
to EVERY artifact instead of only d09 — a one-line change in the POST handler.

No client change is needed: the heartbeat stream returns 200 with the JSON payload after leading whitespace,
and `JSON.parse` ignores the whitespace (the d09 client path already consumes this shape).

## Layer Impact

- `global-control-lane`: One line in the generate route's POST handler — always use `streamJsonHeartbeat`.
  No schema, new route, client, or runtime-dependency change. Reuses the existing d09 mechanism.

## Client Applicability

- All clients: Source generation that previously 504'd on slow synchronous calls now completes and persists.
- Specific clients: SkyHarbor — where the 504 was caught live regenerating d02/d03 (~245s).
- Internal only: None.
- Public/demo only: None.
- Feature flag: gated/board-grade generation is reached through `workspace_explorer_source`.

## Changes Included

- `generate/route.ts`: POST handler wraps all artifacts in `streamJsonHeartbeat` (was d09-only).

## QA / Validation

- PASS: `npx eslint` clean · `tsc --noEmit` clean.
- Pending: live re-test on ACA — regenerate d02/d03 on SkyHarbor and confirm a 200 + persisted draft (no 504),
  even with the degraded synchronous call latency.

## Rollout Plan

Build image → `containerapp update` → shift 100% traffic → regenerate d02/d03. Revert is the d09-only guard.

## Rollback Plan

Revert the PR — restores the d09-only heartbeat. No data/schema to unwind.

## Audit Evidence

PR diff (one line + this record), CI checks, local eslint/tsc output, and the live finding (identical ~245s
504 on both Sonnet and Opus single-pass d03) that proved the idle-timeout cause. Generation egress stays
audited via `preflightAnthropicDirectClient`.

## Known Gaps

- This keeps generation synchronous (heartbeat-kept-alive). For very long Opus + multi-pass d09 it raises the
  ceiling but full asynchronous generation (job + poll) remains the durable end-state for arbitrary latency.
