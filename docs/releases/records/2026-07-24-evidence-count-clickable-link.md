# 2026-07-24-evidence-count-clickable-link — Wire evidence-item counts to the real Files & Evidence list

## Release ID

`2026-07-24-evidence-count-clickable-link`

## Status

`released` — merged (PR #5552, commit `1d63da0742348730ed3c3ae94b9861daeb09f1ae`), deployed
(ACA revision `ca-abarva-web-lab-eastus--m1d63da07`, digest
`sha256:3bfaf9084250d242beeac24555055958ebd4f2eb79820b94978058c4af754432` — confirmed as both
the template image and the 100%-traffic revision image), and live-proven signed-in
(2026-07-24).

## Plain-English Summary

A known UX issue in the Moves phase workspace: at gate approval, a user sees text like "3 evidence
items" with no way to see which 3 files those are, forcing a separate trip to the Files & Evidence
tab to check what was actually uploaded before approving a gate. Tracing the code showed the real
file list (`FileCabinetPanel.tsx`, with name/date/reviewer/status per file) already exists and is
already reachable via an existing `onOpenFiles` handler used elsewhere in the same component — the
three places the evidence count is displayed were simply never wired to it. This change makes all
three count displays clickable, opening the same Files & Evidence view the existing "Open Files &
Evidence" button already opens.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **UI-only, no schema or data-plane impact.** `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`:
  three `evidenceCount` displays converted from static text to `<button>` elements calling the
  component's existing `onOpenFiles` prop; new `.mxw-evidence-count-link` CSS. No new data
  fetching, no change to what `evidenceCount` counts or where it comes from.

## Client Applicability

- All clients: yes — shared Moves phase-workspace UI, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — UI-only fix using existing, already-proven navigation infrastructure

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — three `evidenceCount`
  displays (the "value" substep's "Evidence posture" figure, and the gate-approval decision
  surface's "N evidence items" and "N approved or agent-ready items" figures) converted to
  `<button onClick={onOpenFiles}>` with descriptive `aria-label`s; new
  `.mxw-evidence-count-link`/`.mxw-evidence-count-link-strong` CSS matching each spot's existing
  visual treatment (plain text with underline-on-hover for two spots, the existing pill style
  preserved for the decision-chips spot)
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 1 new
  assertion: Files & Evidence heading absent before interaction, evidence-count buttons present
  and accessible by role, clicking one reveals the Files & Evidence heading

## QA / Validation

- `npx eslint` on both changed files: clean
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`: no new errors (3
  pre-existing, unrelated missing-module errors in `src/components/home/*`)
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`:
  53/53 passing
- `npx jest src/components/strategic-moves`: 146/146 real tests passing; 1 suite fails to even
  load due to a pre-existing, unrelated Clerk/`@clerk/backend` module-resolution error — confirmed
  present on a clean `origin/main` checkout before this change (same failure, same stack trace,
  with and without this diff applied)
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open
- Live signed-in browser verification (2026-07-24, post-deploy): signed in as
  `anand.sundaram+apex@thesundaram.com` (Retail Demo tenant) on `app.abarva.ai`, opened Move
  "Apex Intelligent Store Operations and Inventory Accuracy - E2E 2026-05-02" (`RETAIL-APEX-2026`,
  P5 · Prepare to Execute), navigated to the "Approve & Build" workflow stage, and confirmed via
  the accessibility tree that both `button "0 evidence items — open Files & Evidence"` and
  `button "0 approved or agent-ready items — open Files & Evidence"` render as real, focusable
  `<button>` elements (not static text) with the exact `aria-label`s from this change. Clicking
  the first button navigated to the Files tab and rendered the real "Files & Evidence" heading —
  the exact behavior this fix was built to deliver, confirmed live in production, not just in a
  unit test.

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every Move's phase workspace immediately on deploy.
3. Live signed-in verification: open any Move's phase-review view, click any of the three
   evidence-count displays, and confirm the Files & Evidence tab opens with the real file list.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (client-rendered UI only)
- Feature/env flag update path: none
- Live signed-in proof required: yes — completed 2026-07-24, see QA/Validation for the signed-in
  browser evidence

## Rollback Plan

Revert the merge commit. The change converts three text nodes to buttons calling an already-
existing handler; reverting restores the prior inert-text behavior. No data cleanup required.

## Audit Evidence

- PR: #5552
- Merge SHA: `1d63da0742348730ed3c3ae94b9861daeb09f1ae`
- Deploy: ACA revision `ca-abarva-web-lab-eastus--m1d63da07`, digest
  `sha256:3bfaf9084250d242beeac24555055958ebd4f2eb79820b94978058c4af754432` — confirmed as both
  the template image and the 100%-traffic revision image
- Backlog item: `MOVES-UI-009` in `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  output captured pre-merge (53/53 passing, including the new assertion)
- Live proof: signed-in browser session on `app.abarva.ai`, Retail Demo tenant, Move
  `RETAIL-APEX-2026` P5 gate-approval stage — real button elements confirmed via accessibility
  tree, click confirmed to open the real Files & Evidence view (see QA/Validation)

## Known Gaps

- Does not add inline per-file metadata (name/date/uploader) at the count display locations
  themselves — `evidenceCount`'s data sources (`currentStateReadiness`, `move.linkedEvidence`)
  don't carry that data. This is a navigation fix to the existing, already-built file list, not an
  inline-preview feature.
