# 2026-06-03-source-language-canon-pass1 — Remove highest-severity buyer-facing jargon (M3 pass 1)

## Release ID

`2026-06-03-source-language-canon-pass1`

## Status

`candidate`

## Plain-English Summary

The Source surface leaked internal vocabulary into buyer-facing copy. Two of the worst, confirmed on `main`, are fixed here:

1. The new-event intake labelled empty fields with **agent codenames** — "Sentinel needs", "Steward needs", "Atlas needs". A buyer doesn't know who Steward is. Now simply "Needed".
2. The Document tab's empty state used build internals — "No artifacts **scaffolded**", "the canvas **substrate** is empty", "**canonical specs** need to be extended". Now plain language: "No documents yet for {stage}. Documents appear here as Sentinel drafts them…".

A regression-guard test locks these and forward-guards against a developer command (`npm run …`) ever appearing in a Source component's UI.

## Layer Impact

- **global-control-lane**: buyer-facing copy in two shared Source components + a new behavior test. No schema/RLS/data/logic change.

## Client Applicability

- All clients (copy change). No flag.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx` — field-status chip shows "Needed" instead of "{agent} needs".
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx` — empty-state copy de-jargoned.
- `src/__tests__/behaviors/source-language-canon.test.ts` — new regression guard (agent-codename labels, empty-state jargon, dev-command leak).

## QA / Validation

- `jest source-language-canon` → **3/3 pass** · `tsc --noEmit` clean on touched files · `eslint` clean.

## Rollout Plan

Merge → Vercel deploy. Copy change, live immediately.

## Rollback Plan

Revert the PR. Pure copy + test change; safe.

## Audit Evidence

- Audit source: `reports/2026-06-03-source-simplicity-audit/` — Tier-3 leaks (`03-clutter-inventory.md` L1/L3), language canon (`08-source-cxo-bible.md` §7).
- PR URL: _to be filled on push_

## Known Gaps

- **Deferred to M3 pass-2:** the word "deterministic" still appears across ~25 live Source components. It is pervasive and mostly in non-empty-state copy/comments; a careful, separate sweep (with the canon guard extended) will address it without false positives. Also deferred: `rich`/`outline`/`stub` tier labels surfacing in `SourceArtifactDrawer` / `SourceRfpReadinessPanel`.
- Some target files (`DocumentTab`) have uncommitted edits on `codex/corpus-wave-24`; this PR edits `main`, so a merge reconciliation may be needed there.
