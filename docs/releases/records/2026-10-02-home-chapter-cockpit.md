# 2026-10-02-home-chapter-cockpit — Home v4 chapter rendered as an executive cockpit

## Release ID

`2026-10-02-home-chapter-cockpit`

## Status

`candidate`

## Plain-English Summary

The Home v4 chapter view used to render as one long vertical scroll: an executive readout, then the
deterministic tables and findings, then the authored narrative bands stacked one after another, then
the exhibits. A reader had to scroll the whole length to see what a chapter held.

This change reorganises that same content into a cockpit, without changing any of it. A chapter now
opens with its compact header and executive readout, then a KPI rail — a row of big-number tiles —
then the governed exhibits, then the deterministic evidence, and finally the authored narrative in a
tabbed workspace that swaps one band view in for another in place rather than stacking them down the
page. The chapter synthesis moves into the first tab and flows across the full width of the canvas
in reading-width columns instead of one tall, thin measure.

Nothing about which chapter renders, or whether it renders at all, changed. The same coherence gate,
the same reviewed/served/fallback paths, and the same not-ready message decide that, exactly as
before. Every governance affordance is preserved: provenance declaration, source lines on each
claim, the reserved red for rated severity and amber for absence, the not-established treatment, and
the figure-to-rows drill. The findings a reader must act on stay in the always-visible region, never
hidden behind a tab.

The KPI tile numbers are counted only from data already on the chapter's props — the deterministic
depth, the band split, and the vendor/metric/queue row sets. A tile whose number cannot be derived
without inventing one is omitted rather than filled with a placeholder, so the rail can carry no
figure that is not a count of something real.

## Layer Impact

Release lane: `global-control-lane`. This is shared control-plane rendering for the Home product and
applies to every tenant that reaches Home, so it ships on the global control lane rather than any
client-scoped lane.

- Layer 4 (products) — Home: the chapter component's render was restructured into the cockpit layout.
  No data plane, adapter, canonical model, loader, or other product surface is touched.
- Layers 1–3 (intake, source adapters, canonical model): no change. No schema, migration, loader, or
  dataset is involved.

## Client Applicability

- All clients: yes — the Home chapter cockpit is shared rendering and reaches every tenant that opens Home.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — the layout replaces the previous chapter render directly, gated by the same
  coherence/fallback logic that already governed it.

## Changes Included

- `src/components/home/v4/ChapterPage.tsx` — render reorganised into the cockpit: a derived KPI rail,
  the exhibits moved up into a charts region, the deterministic evidence kept always-visible, and the
  authored bands reorganised into a tabbed narrative workspace. Added: `deriveChapterKpis` (counts
  from props only), `CockpitKpiRail`, and `CockpitNarrative` (tabs, with the synthesis in
  full-canvas columns). All reused sub-components (header, readouts, page-shape, table set, chapter
  spine, decision queue, renewal timeline, metric distance, findings block, unsupported views, the
  claim bands, and the exhibit path) are unchanged.
- `src/components/home/v4/__tests__/cockpit-layout.test.tsx` — new. Pins that KPI numbers equal the
  counts on the props, that red/amber are spent only on their reserved meanings, that the rail
  carries no money figure, that a tab appears only for a non-empty band and swaps the view in place,
  and that the findings stay out of the tab workspace.
- `docs/releases/records/2026-10-02-home-chapter-cockpit.md` — this record.

## QA / Validation

- Home test ratchet (`node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json`): pass — no
  movement away from the baseline. Before the change: 838 of 866 tests passing, 12 failing suites
  (all 12 are the baselined pre-existing failures, none on the chapter surface). After, with the six
  new cockpit tests added: 844 of 872 passing, the same 12 baselined suites failing at the same
  counts. No new or worsened suite.
- TypeScript (`rm -f tsconfig.tsbuildinfo; npx tsc --noEmit --pretty false`): pass — exit 0, no
  errors.
- ESLint on every touched file: pass — exit 0.
- New cockpit test suite run in isolation: pass — 6 of 6.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.

## Rollout Plan

Merge to `main` by squash merge via PR. The change ships with the next Azure Container Apps web image
build and deploy through the repo-owned main deploy workflow. There is no migration, no data build,
and no feature flag, so there is no separate activation step beyond the image deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only path that shifts
  shared web traffic.
- Shared runtime mutators: none in this change — no env var, flag, scale, secret, traffic, or
  template mutation is performed by this change.
- Approved image digest: assigned by the main deploy workflow at build time from the merged SHA; this
  record does not pin a digest.
- ACA runtime invariant: unchanged by this change; the standard post-deploy proof (template image,
  100% traffic revision image, and worker job images all matching the approved digest) is owned by
  the deploying session.
- Worker image invariant: not affected — no worker job image changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — a signed-in Home chapter render check on the affected lane
  after deploy, owned by the deploying session. This record is not `live-proven`.

## Rollback Plan

Revert the PR, or redeploy the previously approved digest-pinned web image through the repo-owned
deploy workflow. The change is render-only — no data, schema, or migration change — so rollback is
image-only and carries no data-restore constraint.

## Audit Evidence

- PR URL: added at PR time by the parent session.
- CI: Home test ratchet, `tsc --noEmit`, ESLint, and `release:check` on the PR.
- Local evidence captured this session: ratchet before/after summaries, `tsc` exit line and log, and
  the isolated new-suite run, all green as recorded under QA / Validation.
- Live signed-in Home render proof: owed at deploy time; not yet captured.

## Known Gaps

- The exhibits reuse the existing full-bleed exhibit path unchanged, so charts stack full-width
  rather than sitting side-by-side in cards. Preserving the exhibit's governance (its source line,
  counts, and remainder accounting) was chosen over a side-by-side card layout.
- The Technology & Data cross-dimension pivot and the larger cross-estate table are out of scope;
  that chapter gets the same cockpit layout over whatever it renders today. Those need estate rows
  plumbed to the chapter and are a separate phase.
- KPI tiles are display-only; figure-to-rows drill remains on the findings and exhibits, as before.
