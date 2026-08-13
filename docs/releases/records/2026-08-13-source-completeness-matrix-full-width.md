# 2026-08-13-source-completeness-matrix-full-width — Completeness matrix full width

## Release ID

`2026-08-13-source-completeness-matrix-full-width`

## Status

`candidate`

## Plain-English Summary

The vendor response completeness matrix shows one column per RFP section, plus a vendor column — eight columns in total. It was sharing a row with the Q&A symmetry log, which left it 546px of a 777px requirement. The previous release stopped it overflowing onto its neighbour by making it scroll inside its own card, which removed the collision but did not solve the underlying problem: two of the eight columns (Automation and References) were off-screen entirely, a status badge was cut in half at the card edge, and every vendor name wrapped onto four lines.

The matrix now takes the full stage width and the Q&A log sits beneath it. All eight columns are visible without scrolling from 900px upward, vendor names fit on one line, and no badge is clipped. Below 900px the matrix still scrolls inside its card, which is the correct behaviour at that width.

The Q&A log reads well at full width — it is a three-column row of question id, subject and status, so extra width goes to the subject line rather than creating awkward whitespace.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source Responses-stage layout only.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the Source Responses-stage canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/responses/ResponsesStageView.tsx`

## QA / Validation

- Measured the rendered stage at 1440, 1292, 1100, 900 and 768px: **0 visible overlaps, 0 visible spill, 0 run-together cells** at every width.
- Matrix fit specifically: table and available width both 1378px at 1440, 1230 at 1292, 1038 at 1100, 838 at 900 — no scroll and nothing clipped at any of those. At 768px it needs 757px in 706px and scrolls, with the scroll container containing it correctly.
- Read the rendered layout before shipping: all eight section columns visible, vendor names on one line, Q&A log legible beneath.
- `npx jest src/components/source/canvas/responses` — 11 suites, 20 tests passed.
- `npx eslint` — clean. `npx tsc -p tsconfig.json --noEmit` — clean. `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.

### Two corrections to the previous measurements

Both earlier layout releases reported counts that were partly false positives, and the harness has been corrected:

- **Overlap**: an element scrolled out of a scroll container still returns geometry from `getBoundingClientRect()`, so clipped content was being counted as overlapping. The harness now walks up through scroll ancestors and only counts a pair when both elements are actually painted.
- **Spill**: content extending past a scrolling ancestor is what scrolling is for, not a defect. The harness now only counts content that escapes a box which does not scroll or clip.

With those corrections, the 4 overlaps and 3 spills reported against the live page after the previous release were not real defects. The two defects fixed in that release were real; the residual counts were measurement error.

A `min-width: 0` was added to the intake panel's step table during this work on the assumption it was spilling. Re-measurement showed it was already scrolling correctly and the change had no effect, so it was reverted rather than kept.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, migration apply, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. All eight matrix columns must be visible without horizontal scrolling at desktop width.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the two-column layout. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Stage measurements at five viewport widths, rendered layout read before shipping, focused test, lint and typecheck output.
- Post-deploy ACA runtime invariant and signed-in Responses-stage measurement required after merge.

## Known Gaps

- The measurement harness is run manually and is not wired into CI, so it guards this change but will not catch a future regression automatically.
- Only the Responses stage has been measured. The `min-width: auto` grid-item behaviour that caused the original bleed is a generic CSS grid characteristic and may affect other Source surfaces, Home, Tower, Moves and Intelligence; no sweep has been done.
- This changes the stage layout, which is normally design-locked. It was made on explicit approval.
