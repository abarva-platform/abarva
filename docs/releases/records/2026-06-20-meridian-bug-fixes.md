# 2026-06-20-meridian-bug-fixes — Intelligence ask bar + Tower chat + nav click fix

## Release ID

`2026-06-20-meridian-bug-fixes`

## Status

`candidate`

## Plain-English Summary

Three targeted bug fixes surfaced during a Meridian Health System signed-in session:

1. **Intelligence ask bar** — The ask input on the Intelligence v2 surface was read-only with no handler. It now wires to the existing `/api/intelligence/ask` Sentinel reasoning route. Users can type a question and receive a streamed grounded answer inline. Suggested question chips also fill and submit on click.

2. **Tower chat program-specific answer** — Asking "how much do we spend on Epic?" (or any program name) returned a generic portfolio fallback instead of program-specific budget/spend data. `answerFor()` in `public/tower-v2/app.js` now checks program names and vendor names before falling back, returning the matched program's budget, YTD spend, CapEx/OpEx split, and status.

3. **Tower nav requires multiple clicks** — After interacting with content inside the Tower iframe (clicking tabs, asking questions), the iframe gains document focus. The browser then treats the first outer-page click as a "blur" click on the iframe rather than a navigation action, so clicking from Tower to Intelligence or any other surface required two or more clicks. A `TowerIframeContainer` client component now listens for `pointerdown` events on the outer document in capture phase; when the pointer goes outside the iframe, it preemptively blurs the iframe so the very next click on the AppTopBar nav links navigates immediately.

4. **AppTopBar right rail nav shift** — At moderate viewport widths (~1100–1300px), the AppTopBar's right rail (Learn, inbox badge, user avatar, sign-out) could overflow its `1fr` grid column and be clipped by the AppShell container's `overflow: hidden`. The right rail outer div now declares `minWidth: 0; overflow: hidden`, which allows the CSS grid to shrink the column correctly instead of the content overflowing and disappearing.

## Layer Impact

- **lane: global-control-lane** — Product UI shell (AppTopBar), Intelligence v2 surface component, and Tower v2 chat JS all ship as shared control-plane behavior across all tenants.

## Client Applicability

- All clients: Intelligence ask bar and AppTopBar nav shift apply to every signed-in session.
- All clients with Tower v2 enabled: Tower chat program lookup applies wherever the Tower v2 iframe is served; the program name set is tenant-specific (injected via `buildTowerV2V4DataScript`).

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` — remove `readOnly`, add `useState`/`useRef` for query/answer/fetching, streaming fetch to `/api/intelligence/ask?q=`, answer box display, chip click-to-ask.
- `public/tower-v2/app.js` — add program-name + vendor word-match lookup before the generic fallback in `answerFor()`.
- `src/app/(maestro)/tower/TowerIframeContainer.tsx` — new client component; `pointerdown` capture-phase listener to pre-blur iframe when clicking outside it, fixing single-click nav from Tower.
- `src/app/(maestro)/tower/page.tsx` — swap direct `<iframe>` for `<TowerIframeContainer>`.
- `src/components/shell/AppTopBar.tsx` — add `minWidth: 0; overflow: hidden` to right rail outer div.

## QA / Validation

- `node scripts/release-check.mjs --base origin/main --head HEAD` — passes with this record.
- Intelligence ask: wired to `/api/intelligence/ask` which has existing route + Sentinel reasoning + Clerk auth; same route verified live in prior sessions (Lakeshore/SkyHarbor).
- Tower chat: word-match covers "Epic" → "Epic and Clinical Systems" (word "epic" >3 chars, included in split words), "Workday" → "Workday HCM", vendor match covers FIS, DXC etc.
- AppTopBar: `minWidth: 0` is the standard CSS Grid fix for flex/grid overflow; left column already has it; right column was missing it.
- Signed-in live proof: required on ACA after merge (Intelligence ask stream + Tower Epic answer + Tower nav right rail).

## Rollout Plan

Merge to `main` → ACA auto-deploys the new image → all tenants receive the fix on next page load. No migration. No env var change. No feature flag.

## Deployment Authority

- Repo-owned deploy workflow: yes (ACA auto-deploy on push to main).
- Shared runtime mutators: none — this is a code-only change.
- Approved image digest: assigned at merge CI.
- ACA runtime invariant: template = traffic = revision (enforced by deploy-authority kernel, PR #3713).
- Worker image invariant: N/A — no worker change.
- Feature/env flag update path: N/A.
- Live signed-in proof required: yes — Intelligence ask + Tower Epic + nav right rail.

## Rollback Plan

Revert the commit on `main` and let ACA redeploy. No data migration to reverse. The previous behavior was a non-functional ask bar + generic fallback + nav clipping — all additive regressions with no data dependency.

## Audit Evidence

- PR: to be filed as `fix/meridian-bug-fixes-2026-06-20`.
- CI: release-check passes locally; ACA build + signed-in proof required post-merge.
- Prior route verification: `/api/intelligence/ask` live-proven on Lakeshore (signed-in, Context/Corpus Explorer session, commit 35049e8c).

## Known Gaps

- Intelligence ask answer is rendered as plain text (pre-wrap). Markdown rendering (links, bold, tables) is a follow-on if Sentinel returns structured markdown.
- Tower chat program lookup requires the program name to have at least one word >3 chars. Programs with short names (e.g., "SAP", "IBM") fall through to the generic fallback — these should add explicit vendor aliases in a follow-on.
- AppTopBar: at very narrow viewports (<1024px), the right rail is truncated from the left (Learn, badge get clipped before user avatar). A responsive design pass is a follow-on.
