# DEMO6 — Program Flagship Demo Script

Wave: wave-18
Lane: DEMO6 (docs)
Branch: wave18/demo6-program-flagship-demo-script
Status: code_complete
Authored: 2026-04-26

## What was created

- `docs/demo/PROGRAM_FLAGSHIP_DEMO_SCRIPT.md` — comprehensive demo script for the Program detail page (the AbarVa flagship surface).
- Three durations: 10 minutes, 20 minutes, and 45 minutes.
- Structure: why-this-page, demo route, preflight, what NOT to claim, station-by-station talk track, what to show, three pilot-ask versions (5/10-min/full ~250-word), story-arc one-pager, deterministic caveat, recovery playbook, founder sign-off, three appendices (word budgets, FAQ answers, honesty checklist).

## What was NOT changed

- No application code changed.
- No dependencies added.
- No tests added or modified (docs-only lane).

## Validation

- TypeScript: not affected (no code change). `tsc --noEmit` expected clean.
- Jest: not run (no code change).

## Manifest updates

- `docs/build/build-slices.json` — appended DEMO6 entry.
- `docs/build/build-waves.json` — wave-18 entry (created/extended) including DEMO6.
- `docs/build/production-readiness.json` — documentation/demo notes appended.

## Notes for integration agent

- Docs-only; no production_ready promotion.
- No deferred-claim regression risk; script explicitly enforces deterministic-vs-live separation and the canon guardrails.
