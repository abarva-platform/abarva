# 2026-08-29-tower-finance-status-own-key — Read the finance status from its own field

## Release ID

`2026-08-29-tower-finance-status-own-key`

## Status

`candidate`

## Plain-English Summary

`financeStatus` was mapped from `fundingStatus`, which resolves
`funding_status ?? finance_status ?? review_state` — three different things behind one name. On a
business case `funding_status` holds the **committee decision** (fund / continue / challenge /
shape / defer); on a tool rollout it holds the **rollout stage** (pilot / funded / scale /
controlled_rollout).

So the chain never yielded a finance status for a case, and yielded a non-null value for every row.
Both consequences were visible on the live surface:

- The Verdict pipeline bucketed committee decisions against the five finance statuses, matched
  none, and rendered five labelled rows with no bars.
- A population filter built on "only a case carries a status" returned **55** — 42 business cases
  plus 13 tool rollouts — where the portfolio has 42.

`finance_status` is written on case payloads only, so reading it directly fixes both at once: the
pipeline gets real statuses, and its presence becomes a correct separator between cases and tools.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **App read path:** `financeStatus` reads `finance_status` in the reader and is carried through the
  mart type and view model on its own. `fundingStatus` is unchanged and keeps its chain; the point
  is that the finance status no longer borrows from it.
- **Layer 4 and below:** untouched. The field was already being written.

## Client Applicability

- All clients: yes — any tenant whose Tower read includes both cases and tool rollouts.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/current-layer-view-model.ts`, `command-center/view-model.ts`
- `src/components/tower/command-center/views/VerdictPanel.tsx` — comment corrected to describe what
  the filter actually relies on
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — three guards

## QA / Validation

- Widening suite → 14/14, including the three new guards: the reader reads `finance_status`
  directly; the view model does not source it from `fundingStatus`; and the read site carries
  neither `funding_status` nor `review_state`.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 153 pass / 21 fail
  across 6 suites. Baseline: 21 fail across 6 suites. Identical; the +3 are this change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean.
- `eslint` on all changed files → clean.
- Found by live inspection at revision `ca-abarva-web-lab-eastus--m4a97e6af`: the constraint panel
  rendered outcome labels reading `8 → fund`, which is a committee decision, not a finance status.

## Rollout Plan

Merge to `main` by squash; the ACA main deploy workflow builds and deploys. No migration, no data
build, no flag change — the underlying field is already in the projection.

## Rollback Plan

Revert the squash commit. Code-only. Reverting restores the empty pipeline and the 55-row count.

## Deployment Authority

- Repo-owned deploy workflow, unchanged. No `az` command in this release.
- Live signed-in proof required: yes — a capture showing real finance statuses in the Verdict
  pipeline and a case count matching the portfolio.

## Audit Evidence

- The five-file diff.
- Widening-suite output (14/14) and the baseline comparison above.
- The live capture that surfaced it: constraint-panel outcome labels reading `8 → fund` at
  revision `ca-abarva-web-lab-eastus--m4a97e6af`.
- Post-deploy: a signed-in capture of the Verdict pipeline carrying real finance statuses.

## Known Gaps

- Not live-proven; `candidate`.
- **The constraint panel's conclusion may change.** It currently reports that 4 of 5 constraints
  span more than one outcome, but it was reading committee decisions. Whether the design's claim —
  that constraint and finance status are the same field twice — holds on Meridian is unknown until
  this deploys, and the panel is built to state either answer.
- `fundingStatus` keeps its three-way fallback. Nothing else should be read through it without
  checking what it resolves to for that row type.
