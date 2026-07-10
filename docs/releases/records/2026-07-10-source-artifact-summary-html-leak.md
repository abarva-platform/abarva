# 2026-07-10-source-artifact-summary-html-leak — Fix raw CSS/HTML leak in artifact summaries

## Release ID

`2026-07-10-source-artifact-summary-html-leak`

## Status

`candidate`

## Plain-English Summary

The Source artifact detail page (`/source/events/{eventId}/artifacts/{artifactId}`)
could render raw CSS text — literal `<style>` block contents like
`:root { --bg: #F8F7F4; --fg: #0C1A3A; ... }` — directly in the visible page body
instead of a clean text summary. Found live while capturing demo screenshots of a
real generated Strategy Memo.

Root cause: `sourceArtifactRegistryRecordToDetail()` in `src/lib/source/queries.ts`
built the artifact's summary blurb by taking the raw blob text of a registered
artifact file and slicing the first 600 characters, *then* relying on the
rendering component to detect and strip HTML. For a generated HTML artifact
(the `..._preview.html` render), the document's `<style>` block routinely runs
past the 600-character cutoff, so the slice contains an opening `<style>` tag
with no matching `</style>`. The component's HTML-stripping regex requires a
closing tag to match, so it silently failed to strip anything, and the raw CSS
text rendered as plain page content.

Fixed by stripping HTML from the *full* document before truncating, not after —
strip-then-slice instead of slice-then-strip. Extracted the shared
`isFullHtmlDocument`/`htmlToPlainText` helpers (previously duplicated only in the
rendering component) into `src/lib/source/html-to-plain-text.ts` so both the
server-side summary builder and the client-side renderer use the identical,
correct-order logic.

## Layer Impact

`global-control-lane`: shared Source artifact-detail rendering logic, not
tenant-scoped or feature-flagged. Affects every registry-backed Source artifact
with an HTML body, for every tenant.

## Client Applicability

- All clients: yes — any tenant viewing a generated-HTML Source artifact's
  detail page is affected.
- Feature flag: none.

## Changes Included

- Added `src/lib/source/html-to-plain-text.ts`: shared `isFullHtmlDocument()` /
  `htmlToPlainText()` helpers, with a doc comment stating the strip-before-slice
  invariant explicitly so it isn't reintroduced.
- Updated `src/lib/source/queries.ts`'s `sourceArtifactRegistryRecordToDetail()`
  to detect and strip HTML from the full blob content before truncating to a
  600-character summary.
- Updated `src/components/source/SourceArtifactDrawer.tsx` to import the shared
  helpers instead of keeping a local duplicate (the duplicate was correct in
  isolation — the bug was entirely in the server-side truncation order — but
  centralizing removes the risk of the two copies drifting).
- Added `src/lib/source/__tests__/html-to-plain-text.test.ts`, including a test
  that reproduces the exact failure mode (slice-then-strip leaves raw CSS
  visible; strip-then-slice does not) to prevent regression.

## QA / Validation

Status: **pass**.

- `npx jest src/lib/source/__tests__/html-to-plain-text.test.ts src/components/source/__tests__/SourceArtifactDrawer.test.tsx`: 23/23 passing.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc -p . --noEmit`: clean, 0 errors.
- `npx eslint` on all 4 touched/added files: 0 errors, 0 warnings.
- Live-reproduced pre-fix on `app.abarva.ai`: opened a real registry-backed
  Strategy Memo artifact's detail page and observed raw `:root { --bg: ... }`
  CSS text rendered as visible page content, screenshotted for reference before
  writing the fix.

## Rollout Plan

Merge via squash to `main`. Deploy through the repo-owned
`aca-main-deploy.yml` workflow. No migration, worker job, feature flag, or env
var change required — this is a pure rendering-logic fix.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- ACA runtime invariant: required after deploy before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — reopen the same artifact detail page
  that showed the leak and confirm the summary now renders clean text.

## Rollback Plan

Revert the commit. Purely additive/corrective rendering logic — no data or
schema dependency, so rollback is a plain revert-and-redeploy.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Pre-fix live reproduction: screenshot captured during a demo-screenshot pass
  on a real generated Strategy Memo artifact detail page.
- Post-deploy live proof: pending.

## Known Gaps

None known for this fix. This does not address the two structural
canvas-unification items (dual canvas design systems; Value Proof/Report pages
missing navigation) tracked separately in the Phase 1 canvas audit.
