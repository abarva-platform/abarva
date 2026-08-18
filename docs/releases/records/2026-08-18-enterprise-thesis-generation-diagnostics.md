# 2026-08-18-enterprise-thesis-generation-diagnostics — Diagnose and fix the empty-generation failure

## Release ID

`2026-08-18-enterprise-thesis-generation-diagnostics`

## Status

`candidate`

## Plain-English Summary

The first live run of the EnterpriseThesis generation call, against both tenants through an ACA
Job with a real key, returned empty text on every call — deterministic layers worked correctly
(42 and 40 real signals, all evidence-coverage figures correct after the prior fix), but
generation produced nothing to validate or export.

Two changes, not one guess. First, `callClaude()` now logs the actual API response shape whenever
text comes back empty — content block types and stop reason — so a second empty response is
diagnosable rather than another blind retry. Second, `max_tokens` for the EnterpriseThesis call is
raised from 4000 to 16000: the schema asks for up to a dozen array fields, several holding multiple
structured claims (statement + evidence_ids + confidence each), and 4000 tokens is plausibly too
low for that shape on a reasoning-capable model, especially if reasoning consumes output-token
budget before visible text.

The prior 4000 figure was carried over from the orientation-pack generator's per-block budget
without being reconsidered for a schema an order of magnitude larger. This fix raises the budget
generously rather than incrementally, on the same logic used earlier this session for percentage
and comma-formatting fixes: fix the actual mismatch once, with headroom, rather than nudge a
number repeatedly against real data.

## Layer Impact

Lane: `global-control-lane`. Generator logic only.

## Client Applicability

All clients — the EnterpriseThesis build is tenant-agnostic and this affects both active tenants
identically.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` — diagnostic logging on empty generation
  response; `max_tokens` raised from 4000 to 16000 for the EnterpriseThesis call specifically (the
  verifier calls, at 200 tokens for a one-word verdict plus one sentence, are unaffected).

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit` — PASS, 0 errors, genuine clean exit.
- `npx eslint` — PASS, 0 errors.
- 20 existing tests across the two affected test files — PASS, unaffected by this change (no
  tested function's behavior changed, only the runtime API call parameters and logging).

**NOT YET RUN:** whether the fix actually resolves the empty-generation failure is unproven until
the next live run — that is what this PR unblocks. If the diagnostic output on that run shows a
different cause than a token-budget shortfall, the fix will be revised based on what it actually
says rather than guessed again.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. Rerun
`data-build:enterprise-thesis:plan` as an ACA Job against both tenants and read the result.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR.

## Rollback Plan

Revert the commit. No data written by this change.

## Audit Evidence

First failed run captured at `./reports/enterprise-thesis/plan-1/04-logs.txt` — both tenants'
signal packets generated correctly (42 and 40 real signals, all evidence-coverage figures correct),
both thesis generation calls returned `! thesis generation returned no text` with no further
diagnostic information, which this PR's logging addition exists to provide on the next run.

## Known Gaps

The idle-restore verification step also failed on that same job run (`replicaTimeout is "7200",
expected "1800"`) — the job's own execution succeeded; this is the operator wrapper's post-run
state check on the shared job resource, unrelated to generation. Tracked separately, not blocking
this fix.
