# 2026-08-07-source-workspace-universal-compact-strip — Make the compact ticker the default on every Source Workspace tab

## Release ID

`2026-08-07-source-workspace-universal-compact-strip`

## Status

`candidate`

## Plain-English Summary

The last two days of Explore and Contract-Optimization fixes compacted the static value-strip dashboard on exactly those two tabs. Live review of the Concentration tab (and, by the same logic, every other tab — Context, Renewals, Leverage, Opportunities, Agenda, every contract sub-tab, vendor pages, opportunity pages) showed the original full 5-6 card dashboard plus the 10-card V4 semantic proof panel still rendering there, unchanged — because that was the explicit, narrower scope of the prior two releases. This release makes the compact-ticker-first pattern the default everywhere in the Source Workspace: every tab now opens with a one-line ticker built from that tab's own already-computed value-strip data (the same numbers the full strip always showed, just the top 4 instead of all 5-7 as cards), with "+ full context" expanding to the original full strip and V4 proof panel on demand. Explore and Optimization keep their hand-picked ticker items and ring visuals; every other tab gets a generic ticker derived directly from its existing per-kind value-strip computation (`vsItem` calls in `buildViewModel.ts`), so no new data or copy was written — only how it's surfaced changed.

## Layer Impact

- `global-control-lane`: `src/app/(maestro)/source/preview/workspace/{buildViewModel.ts,WorkspaceClient.tsx}` — UI-layer view-model and rendering only. No data or computation change; `valueStrip` itself (the source of both the full cards and the new generic ticker items) is untouched.

## Client Applicability

- All clients: yes — every tenant using any Source Workspace tab.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `buildViewModel.ts`: removed the now-always-false `stripFull` field entirely (dead code once every tab compacts). `stripCompact` is now unconditionally `true`. `compactItems` keeps its hand-curated Explore and Contract-Optimization branches, and falls back to `valueStrip.filter(v => !v.missing).slice(0, 4).map(v => ({label: v.label, value: v.value}))` for every other kind/tab — reusing the exact per-tab value-strip data that already fed the old full-card dashboard.
- `WorkspaceClient.tsx`: removed the dead `{vm.stripFull ? <FullContextStrip vm={vm} /> : null}` render branch (now unreachable). `FullContextStrip` itself is unchanged and still used inside `CompactContextStrip`'s "+ full context" expansion.

## QA / Validation

- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit -p . --pretty false` — passed, clean.
- `npx eslint` on both changed files — passed, clean.
- `npx jest buildViewModel.numeric.test viewModel.explore.test` — passed, 14/14, unaffected.
- Confirmed via grep that no test references `stripFull`/`stripCompact`/`compactItems`/`compactRing` directly, so removing the dead field doesn't touch test surface.
- Live signed-in verification pending post-deploy (see below) — this directly follows a live-observed gap (Concentration tab screenshot still showing the old full dashboard), so live re-verification is the actual bar here, not just static checks.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no feature flag — pure view-model + rendering change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies (template image, 100%-traffic revision, worker jobs all match digest).
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — reload the Concentration tab (the tab flagged live as still showing the old dashboard) and confirm it now opens with a compact ticker and unobstructed content below, with "+ full context" expanding to the original full strip and V4 proof panel. Spot-check at least one more tab (Renewals or Leverage) and one contract sub-tab (Overview or Economics) to confirm the same pattern holds everywhere, and confirm Explore and Optimization are unaffected by this generalization.

## Rollback Plan

Revert the PR. `stripFull` and the per-tab `if (kind === 'portfolio' && activeTab === 'Explore') / else if (kind === 'contract' && activeTab === 'Optimization')` gating return, restoring the full dashboard on every tab except Explore and Optimization.

## Audit Evidence

- PR diff for the two changed files.
- This record's QA section.
- Post-deploy: live signed-in screenshots of the Concentration tab (before/after comparison against the screenshot that prompted this release) and at least one contract sub-tab, both showing the compact ticker with working "+ full context".

## Known Gaps

The generic fallback ticker takes the first 4 non-missing value-strip items in whatever order each `kind` branch already defines them — it does not curate which 4 are most demo-relevant per tab the way Explore and Optimization's hand-picked items do. If a specific tab's first 4 items turn out to be less useful than a different subset, that's a quick follow-up (just reordering or hand-picking that tab's `compactItems`), not a structural problem. This release does not touch vendor-page or opportunity-page ticker curation beyond the generic fallback — if those need hand-picked items too, that's the same follow-up pattern.
