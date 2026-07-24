# 2026-07-23-restore-duplicate-heading-suppression — Restore accidentally-deleted duplicate-heading fix

## Release ID

`2026-07-23-restore-duplicate-heading-suppression`

## Status

`candidate`

## Plain-English Summary

PR #5530 (native PPTX renderer) was built from a local branch that had fallen behind
`origin/main`. Copying its locally-edited `renderers.tsx` into a fresh worktree — without first
checking whether `origin/main` had moved on that same file — silently deleted an already-merged,
already-live feature: `withoutDuplicateSectionHeading()` / `normalizeHeadingText()`, which strip a
model-repeated section heading from the first line of a section's Markdown body before rendering
to DOCX, HTML, or PDF. That deletion merged and deployed to production as part of #5530. This
change restores the function and its three call sites exactly as they existed before, with the
PPTX renderer PR #5530 already added on top — the two features are unrelated and compose cleanly.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **Application/rendering layer only.** `src/lib/deliverables/orchestrator/renderers.tsx`:
  restores `normalizeHeadingText()`, `withoutDuplicateSectionHeading()`, and wires them back into
  `renderDeliverableDocx`, `renderDeliverableHtml`, and `renderDeliverablePdf`. No schema change,
  no change to the PPTX renderer this restores alongside.

## Client Applicability

- All clients: yes — this restores shared deliverable-rendering infrastructure
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx` — restored `normalizeHeadingText()` and
  `withoutDuplicateSectionHeading()`, and their 3 call sites (DOCX, HTML, PDF section rendering)
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — new regression suite (`DOCX/
  HTML/PDF renderers — duplicate section-heading suppression`), 4 assertions: DOCX/HTML/PDF each
  render a model-repeated title exactly once; a genuinely different first-line heading is
  preserved untouched
- `docs/backlog/moves-product-backlog.md` — new `MOVES-BUG-004` entry documenting the regression,
  root cause, and corrective process note

## QA / Validation

- `npx eslint src/lib/deliverables/orchestrator/renderers.tsx src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`:
  clean
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`: no new errors (3
  pre-existing, unrelated missing-module errors in `src/components/home/*`)
- `npx jest src/lib/deliverables`: 411/417 passing. The 6 failures are all pre-existing and
  unrelated — confirmed present on a clean `origin/main` checkout before this change: 1 stale
  fixture-name mismatch (`SkyHarbor Air` vs `Airline Demo`) in an unrelated HTML preview test, 2
  stale `golden-regression.test.ts` byte-stable snapshots, 3 `visual-and-prompt.test.ts` prompt
  assertions unrelated to rendering
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open
- Diff verified equal-and-opposite to the deletion in #5530: `git diff 29b1bb525 <this-branch> --
  src/lib/deliverables/orchestrator/renderers.tsx` shows only the PPTX renderer addition plus the
  restored duplicate-heading function — nothing else changed relative to the last known-good
  state before #5530

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow, as soon as possible given this
   restores a deployed regression.
2. No flag/tenant change — takes effect for every future deliverable render immediately on
   deploy.
3. Live signed-in verification: regenerate a deliverable whose model output happens to repeat its
   section title as the first Markdown line (or use the same DOCX/HTML/PDF fixture from the new
   test) and confirm the title renders exactly once.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (web request path only)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3; not yet completed as of this
  record

## Rollback Plan

Revert the merge commit. The restored function is self-contained and additive relative to the
current `main`; reverting removes it again (returning to the regressed state), which is why this
should merge promptly rather than be rolled back.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `MOVES-BUG-004` in `docs/backlog/moves-product-backlog.md`
- Root-cause evidence: `git diff 29b1bb525 6c440e7dcc3639290bec758a0745f9c610c6285b -- src/lib/deliverables/orchestrator/renderers.tsx`
  shows the exact deletion (available in this session's history)
- Test evidence: `npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` output
  captured in this session's validation pass (25/26 passing, 1 pre-existing unrelated failure)

## Known Gaps

- No live signed-in proof yet that a real generated deliverable in production actually exhibited
  the duplicated-heading symptom during the regression window (2026-07-23,
  `6c440e7dcc3639290bec758a0745f9c610c6285b` deploy onward) — the fix is proven via unit tests
  against the exact code path, not an observed live incident.
- Process gap this incident exposes: local working-branch staleness relative to `origin/main` is
  not currently checked before copying edited files into a fresh worktree for a PR. No tooling
  change is included in this release to prevent recurrence — noted in `MOVES-BUG-004`'s "Notes /
  remaining gaps" as a corrective practice, not yet enforced by automation.
