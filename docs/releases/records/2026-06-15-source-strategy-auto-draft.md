# 2026-06-15-source-strategy-auto-draft — Auto-draft the strategy memo on Strategy entry

## Release ID

`2026-06-15-source-strategy-auto-draft`

## Status

`candidate`

## Release Lane

`experimental`

## Plain-English Summary

Today the Strategy stage waits for a human to click "Draft with Sentinel" before the strategy memo exists —
even though P0 intake already captured and validated the facts the memo is composed from. That reads as
duplicate work. This makes the memo **auto-draft on entry**: when you land on the Strategy stage with no memo
yet, the canvas runs the governed Draft-with-Sentinel generation **once, automatically** — so the memo appears
from the validated P0 facts without a click.

It reuses the exact proven path shipped earlier (governed generation → persists `d01` to the artifact registry
→ gap-flags where evidence is thin, no fabrication → narrated in the Sentinel dock). The human still confirms
archetype/value and the sponsor still endorses — auto-*draft*, not auto-*approve*.

Guards: fires only when `nextMove.draftArtifactCode` is set (i.e. the draft is genuinely still needed — it
self-disables the moment the memo exists), only on the `strategy` stage, never over an existing authored body,
and exactly once per mount (ref guard). Gated behind a new tenant flag `source_strategy_auto_draft` (default
off).

## Layer Impact

- `experimental` lane, `global-control-lane` mechanics: client-side `useEffect` in `UniversalCanvasShell` that
  calls the existing `handleDraftWithSentinel`; a new `source_strategy_auto_draft` feature flag; the event page
  resolves it and passes it as a prop. No schema, API, or runtime-dependency change — generation uses the
  already-deployed `/artifacts/[code]/generate` route.

## Client Applicability

- All clients: no change with the flag off (manual draft remains the norm).
- Specific clients: SkyHarbor — enabled via env to validate the auto-draft on the live IT-outsourcing event.
- Internal only: None.
- Public/demo only: None.
- Feature flag: `source_strategy_auto_draft` (tenant policy, default off; `workspace_explorer_source` must also
  be on, since this lives on the decluttered canvas).

## Changes Included

- `features/registry.ts`: add `source_strategy_auto_draft` flag (tenant, default off).
- `source/events/[eventId]/page.tsx`: resolve the flag and pass `strategyAutoDraftEnabled`.
- `UniversalCanvasShell.tsx`: `strategyAutoDraftEnabled` prop + a guarded one-shot `useEffect` that auto-runs
  `handleDraftWithSentinel(nextMove.draftArtifactCode)` on Strategy entry.

## QA / Validation

- PASS: `npx eslint` clean on all three files · `tsc --noEmit` clean.
- PASS: `jest features + source-event-canvas-render` (the one failing suite, `neo4j-gate`, fails identically on
  clean `origin/main` — env-dependent NEO4J test, unrelated).
- Pending: live on ACA — open a fresh SkyHarbor Strategy event with no memo → the memo auto-drafts without a
  click, persists, and the dock narrates it.

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → set
`ABARVA_FEATURE_SOURCE_STRATEGY_AUTO_DRAFT_TENANTS=skyharbor` → open a fresh Strategy event and confirm the
auto-draft fires once.

## Rollback Plan

Unset the env flag (instant, no redeploy) or revert the PR. With the flag off the manual draft is unchanged.

## Audit Evidence

PR diff (flag + prop + effect + this record), CI checks, local eslint/tsc/jest output, and the post-deploy
capture of a fresh Strategy event auto-drafting its memo with no click.

## Known Gaps

- **Entry-trigger, not approval-trigger.** This fires when you reach Strategy, not literally inside the P0
  approve handler. A true approval-moment trigger requires durable async generation (the synchronous Anthropic
  call can't run inside the approve request without timing out) — that async infra is the prerequisite
  follow-on.
- **Carry-forward not yet wired.** Pre-satisfying the three `GATE-STRATEGY-*` criteria from the sponsor's P0
  endorsement depends on P0 first *capturing* that endorsement (the P0-UI slice: confirm archetype/value +
  sponsor sign at intake). Until then the gate still recomputes server-side on reload.
- `d01` auto-draft is board-grade but not held to the strict 10-dimension consulting gate (deliberate: the
  human confirm + sponsor sign is the checkpoint; the strict gate could make the auto-draft refuse).
