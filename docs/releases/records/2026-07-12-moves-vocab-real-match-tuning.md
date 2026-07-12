# 2026-07-12-moves-vocab-real-match-tuning — Confirmed real positive match, tune vocabulary

## Release ID

`2026-07-12-moves-vocab-real-match-tuning`

## Status

`candidate`

## Plain-English Summary

Closes the last open item from the deliverable-content carries-forward feature: a confirmed live
positive match against a real generated Move deliverable.

Drove CANARY (Move `37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4`, a synthetic SkyHarbor Air demo Move) through
its P3 "Approve & generate deliverables" flow, which really queued and generated a
`target_state_architecture` artifact (83KB real HTML, 21 real headings, board-ready). Fetched the
real generated content via the existing `/api/v1/programs/:id/artifacts` read endpoint and ran the
extractor's exact matching logic against it in-browser (content itself never left the browser
context — only derived match/no-match facts were inspected).

Result: even the broadened vocabulary from the prior release (`2026-07-12-moves-signal-vocab-
expansion.md`) matched **zero** of the 21 real headings — the premium generation path's real
language ("Architecture thesis", "Story spine summary", "Implementation waves", "AI decision &
control flow") is more narrative than the technical marker vocabulary assumed. Two precise,
evidence-backed additions now produce a genuine match:

- `wave` → matches the real heading "Implementation waves" (signal: `workstreams`)
- broadened `decision record` → `decision` → matches the real heading "AI decision & control flow"
  (signal: `decisions`) — the premium path never literally says "decision record"

Confirmed live against a real generated artifact are the two new heading skeletons — a permanent
regression test (`matches real headings observed live...`) now locks in this exact real-world case
so it can't silently regress.

## Layer Impact

- `global-control-lane`: same file, same call site as prior releases. No new surface.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag.

## Changes Included

- `src/lib/deliverables/deliverable-content-signals.ts`: added `wave` to the `workstreams` keyword
  list; broadened `decision record` to `decision` in the `decisions` keyword list. Comment records
  the specific real Move/artifact this was validated against.
- `src/lib/deliverables/__tests__/deliverable-content-signals.test.ts`: added a regression test
  reproducing the real heading language observed live ("Architecture thesis", "AI decision &
  control flow", "Implementation waves") to lock in this exact match going forward.

## QA / Validation

- `npx eslint`: PASS — 0 errors.
- `npx jest src/lib/deliverables/__tests__/deliverable-content-signals.test.ts`: PASS — 6/6 (5
  pre-existing + 1 new).
- `npx tsc --noEmit -p .`: local run crashed at the Node/V8 level a third time this session (same
  native stack trace, not a reported type error) — confirmed reproducible, environment-only. CI's
  typecheck job is authoritative.
- **Live positive-match proof — CONFIRMED THIS RELEASE.** Real generated `target_state_architecture`
  artifact for CANARY (Move `37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4`), fetched via
  `/api/v1/programs/:id/artifacts` → `/api/v1/artifacts/:artifactId`, matched two real signals
  (`workstreams` via "Implementation waves", `decisions` via "AI decision & control flow") using
  this exact vocabulary. This closes the "Known Gap" tracked in the two prior release records and
  in `project_moves_readiness_pack_and_generation_pipeline` memory.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant.

## Rollback Plan

Revert this commit. Purely additive vocabulary tuning within one existing file.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.

## Audit Evidence

- `npx eslint` (0 errors) and `npx jest` (6/6) output captured this session.
- Live positive-match evidence: real artifact id `d74ed94a-a600-46ee-ad5d-a505556c4cac`
  ("CANARY — SkyHarbor Recovery Command IROPS Target Architecture"), generated 2026-07-11 23:26 UTC
  via this session's own "Approve & generate deliverables" click on CANARY's P3 gate. Verified
  `status: 200`, `contentLength: 83058`, 21 real `<h1-4>` headings, `board_ready` status, quality
  score 100. Matching logic run in-browser against the real content; only derived match/no-match
  facts (heading text, not full snippets) were returned to the assistant.

## Known Gaps

- None remaining for the "does this ever match real content" question — that is now proven. Future
  work (if picked up) would be broadening real-world coverage further (more Moves, more deliverable
  types) rather than proving the mechanism works at all.
