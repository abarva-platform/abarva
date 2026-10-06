# 2026-09-11-source-workspace-url-state — The page describes what is on screen

## Release ID

`2026-09-11-source-workspace-url-state`

## Status

`draft`

## Plain-English Summary

Opening a contract in Source and then refreshing threw the contract away and
dropped the reader back on the portfolio list. Because the two views look
nothing alike, this read as the product changing its own layout.

It was not a layout problem. Selecting a contract and switching a contract tab
lived in React state only, while the address bar kept whatever workspace tab the
page was originally opened on. The page therefore described a different view from the
one on screen. Any refresh, shared link or back button rebuilt the workspace
from those stale parameters — and the contract was not in them.

Reading a URL into the workspace already worked; deep links have been reliable
all along. Only the writing half was missing. The address bar is now kept in
step with the selection, so refreshing returns to the contract and the tab the
reader was on, and a copied link opens what the sender was looking at.

## Layer Impact

- `global-control-lane`: shared Source product behaviour for all clients, not
  feature-gated.
- **Layer 4 (Products · Source).** Client-side navigation state only.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `viewModel.tsx` — `workspaceTabParamFor` reads a selection back out to the
  workspace-tab parameter that would reproduce it. The existing
  `WORKSPACE_TAB_SELECTIONS` map only ran the other way.
- `WorkspaceClient.tsx` — an effect mirrors the current selection and contract
  tab into the query string. `history.replaceState`, not `pushState`: this
  mirrors state that has already changed, and pushing an entry per tab click
  would turn the back button into a tab-history walker.
- `__tests__/workspaceUrlState.test.ts` — new; covers the state-to-parameter
  direction and the round trip for all five workspace tabs and for a contract
  with a tab.

## QA / Validation

- Reproduced live on `61294d5ab` before fixing. Clicking a contract opened
  Contract 360 while the URL stayed on `?workspaceTab=contracts`; clicking a
  contract tab left it unchanged; reloading that URL returned the portfolio
  list with the contract gone.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence` — 19
  suites, 173 tests, passing.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** Open a contract from the contracts
  tab, switch to a different contract tab, confirm the address bar carries
  `contractId` and `contractTab`, reload, and confirm the same contract and tab
  come back.

## Rollback Plan

Revert and redeploy. Client-side only; no migration and no data change.

## Known Gaps

- **The portfolio tabs are still full-page navigations.** They are anchors with
  hrefs, so each click reloads the document and shows the loading shell. That is
  the other half of what a reader experiences as the layout changing, and it is
  not addressed here — converting them to client-side transitions is a larger
  change to the shell's navigation and deserves its own release.
- **The back button is unchanged.** Using `replaceState` means going back leaves
  the workspace rather than stepping back through selections. That is the
  existing behaviour and this release does not alter it; making back close a
  contract would need a `popstate` handler and its own proof.
- **Other Source routes still exist** — `/source/portfolio`,
  `/source/vendor-portfolio`, `/source/360` — and render their own surfaces.
  `/source` and `/source/workspace` resolve to one shell, which is where product
  navigation points, but the others have not been audited or retired here.

## Audit Evidence

- Commit on branch `claude/source-workspace-url-state`, based on `61294d5ab`.
- CI run for the PR, including `npm run release:check`.
- Live reproduction and local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
