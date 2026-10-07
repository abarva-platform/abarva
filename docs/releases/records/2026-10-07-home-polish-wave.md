# 2026-10-07-home-polish-wave — Home per-page polish wave

## Release ID

`2026-10-07-home-polish-wave`

## Status

`candidate`

## Plain-English Summary

Eight small, presentation-only improvements to the Home executive readout, from a
per-page design audit of the live surface. The biggest is a correctness fix: the
current-state architecture page drew a wheel whose centre was hardcoded to one
tenant's name, so every tenant's architecture page printed that same name in the
middle of its own diagram; it now shows the enterprise actually being viewed.

The rest sharpen how each page tells the client's story: the full business-model
briefing no longer renders twice (it was on both the first and second chapters);
a few places that spent the reserved "severity" red and "absence" amber as plain
decoration are recoloured so those colours keep their meaning; the two leadership
treatments now use the same colour; the "what needs a decision" list states why
it could not be computed instead of silently disappearing; a count label is made
singular when its number is one; the two front chapters open on the enterprise's
own scale (applications, vendors, data records) instead of internal evidence
counts; and a classification tag that repeated identically down every row of one
section is removed because the section heading already classifies it.

Every number, quote, and label still comes from the governed bundle; nothing is
invented, and no new data is introduced.

## Layer Impact

- `global-control-lane`: shared Home v4 product surface for every tenant. The
  change touches four presentation components (`ChapterPage.tsx`, `HomeV4App.tsx`,
  `ArchitecturePage.tsx`, `DecisionQueue.tsx`) plus two test files. It reorders,
  restyles, and re-scopes already-governed values; it adds no data, no model
  output, and no new data-plane read. The governed-visual boundary and the
  reserved palette (red = rated severity, amber = declared absence) are preserved
  — in fact two of the fixes restore reserved-colour discipline, and the
  previously-hidden "could not compute" state is rendered as a stated absence.

## Client Applicability

- All clients: Yes — it renders for every Home surface across all tenants; the
  tenant-name correctness fix in particular affects every non-first tenant.
- Specific clients: N/A.
- Internal only: No.
- Public/demo only: No (synthetic demonstration tenants render it today, but these
  are the production Home components).
- Feature flag: None; the changes replace existing rendering in place.

## Changes Included

- Commit: `fix(home): polish wave — governed per-page story enhancements` on branch
  `home/polish-wave`.
- `src/components/home/v4/ArchitecturePage.tsx` — thread `tenantDisplayName` through
  `L0Landscape` → `ExecutiveRunMap` → `ArchitectureWheel` and use it in the wheel
  centre (was a hardcoded tenant name); recolour two run-map blocks, two
  governed-lakehouse nodes, and the intelligence pipeline stage off the reserved
  red/amber into non-reserved hues.
- `src/components/home/v4/HomeV4App.tsx` — render the full business briefing only on
  Our Business (removed from Executive Brief); pass estate scale to the two briefing
  chapters so their KPI rail can lead with it.
- `src/components/home/v4/ChapterPage.tsx` — leadership-voice strip amber → navy;
  estate-scale KPI tiles for briefing/prose chapters (gated on estate presence);
  singular "evidence view pending" label; drop the per-row Industry Context kind tag.
- `src/components/home/v4/DecisionQueue.tsx` — when contracts are served without a
  record as-of date, record a stated-absence note instead of returning null.
- `src/components/home/v4/__tests__/cockpit-layout.test.tsx`,
  `decision-queue.test.tsx` — updated/added to match the singular label and the new
  stated-absence behaviour.
- No migrations, routes, scripts, or data changes.

## QA / Validation

- `node scripts/quality/typecheck.mjs` — passed (clean, exit 0).
- `npx eslint` on the four changed components + two tests — passed (exit 0).
- `npx jest src/components/home/v4/__tests__` — passed (39 suites, 468 tests).
- `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json` — passed; 12
  failing suites, equal to the baseline (pre-existing DB-dependent snapshot suites),
  no movement away from the baseline.
- Visual proof: rendered the affected surfaces (Executive Brief, Our Business,
  Technology & Data, What Needs Attention, and the architecture view) for both
  shipped golden snapshots to static HTML and inspected in a browser, plus a DOM
  assertion pass. Confirmed: each tenant's wheel centre reads its own name; the full
  briefing appears once; the industry per-row tag is gone; the decision queue shows
  the as-of-date absence note; the leadership strip is navy; the KPI rail opens on
  estate scale; and red is no longer used decoratively in the architecture (the
  remaining amber is confined to gap/absence/boundary notices).

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow
(`.github/workflows/aca-main-deploy.yml`) builds the image from the merge SHA and
deploys it to the shared Lab/Product web Container App; no manual Azure action is
taken. The change is active once that revision is healthy and holds 100% traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (the only
  authority that shifts shared web traffic).
- Shared runtime mutators: none in this change; no feature flag, env var, scale,
  secret, or worker-job change.
- Approved image digest: assigned by the main deploy workflow on merge (the
  `main-<sha>` build for this change's merge commit).
- ACA runtime invariant: after deploy, the web Container App template image, the
  100%-traffic revision image, and required worker images must match the approved
  digest.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — open the architecture page for a non-first
  tenant on the deployed revision and confirm the wheel centre reads that tenant.

## Rollback Plan

Pure UI, no schema or data change. Fastest path: revert the commit on `main` and
let the main deploy workflow build and deploy the prior SHA; or, as an immediate
stopgap, shift ACA traffic back to the previous healthy revision via the repo-owned
workflow. No migration rollback is involved.

## Audit Evidence

- PR URL: to be attached when the PR is opened.
- CI run: the PR's required checks (speed mode) plus the local gate output above.
- Deployment URL: `https://app.abarva.ai` Home architecture + briefing chapters,
  post-deploy.
- Screenshots: browser captures of the rendered surfaces for both synthetic tenants
  (captured during validation).

## Known Gaps

- Live signed-in post-deploy proof on `app.abarva.ai` is owed after the ACA
  revision is healthy; this record is a `candidate` until that proof is captured.
- Out of scope for this wave (from the same audit, deferred): the remaining
  thin-chapter arc changes (lead Performance & Value with the value-proof hero
  number; surface the organization and program/AI gaps higher), the evidence-view
  label and spacing tweaks, and the broader decision on whether amber is a strict
  "absence" colour or also a "caution" tier (a palette-policy decision, not a
  per-tile fix).
