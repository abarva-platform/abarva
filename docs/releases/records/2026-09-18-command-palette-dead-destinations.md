# 2026-09-18-command-palette-dead-destinations — Command palette stops offering destinations that are not there

## Release ID

`2026-09-18-command-palette-dead-destinations`

## Status

`released`

## Plain-English Summary

The command palette (Cmd/Ctrl-K) listed a Users entry pointing at `/admin/users`. There is no page
at that path and no redirect covering it, so anyone who picked it landed on a 404. The palette also
still used the word "Setup" for the admin area, which the left rail had already renamed to "Admin",
and it offered an "Intelligence · Solutions" destination for a surface that was retired months ago
and now survives only as a configured redirect onto the Intelligence library — so the label promised
one place and the click delivered another.

All three came from one commit that reverted an earlier correction. The correction's own test was
still in the repository and had been failing ever since, but that test is invoked by no npm script
and no workflow, so the failure reached nobody.

The palette now offers Overview, Connectors, Users & Access, Policies and Tenant profile under the
Admin name the rail uses, each pointing at a route that exists. The retired Solutions entry is gone.
A new test drives the real component and fails if any future entry points somewhere with no page
behind it.

## Layer Impact

- `global-control-lane`. Products layer only: one shared navigation component and one test. No
  canonical model, no source adapter, no client intake, no data plane, no schema, no migration.

## Client Applicability

- All clients: yes — the palette is shared chrome on every signed-in surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional.

## Changes Included

- `src/components/shell/CommandPalette.tsx` — the admin entries take the rail's vocabulary and
  point at routes that exist (`/admin`, `/admin/connectors`, `/admin/users-access`,
  `/admin/policies`, `/admin?tab=tenant`); the retired Intelligence · Solutions entry is removed;
  the result rows are keyed by label rather than by path; the route table is exported so a test can
  assert every destination resolves.
- `src/__tests__/behaviors/command-palette-destinations.test.tsx` — new behavioral suite.

## QA / Validation

Verified on clean `origin/main` (`69b9e876c`) before any edit. `/admin/users` has no page route
under `src/app` and no `next.config.ts` redirect source. `/intelligence/solutions` has no page route
and does have a redirect onto `/intelligence`. `git show` on the two commits proves the corrected
shape existed and was reverted.

**The rule this suite enforces, and its cost.** A destination must resolve to a real page route.
A path that exists only as a redirect is not accepted, even though the user does arrive somewhere:
arriving somewhere other than the label promised is the defect, not the cure. The cost is that a
deliberate alias could not be offered in the palette without a page behind it. No current entry
wants that.

Measured over the identical 8-case suite. The unfixed component here means the route table as it was
on main, with only the export added, since the export is test scaffolding and not the repair:

| state | result |
|---|---|
| unfixed | **6 failed / 2 passed of 8** |
| destinations and vocabulary fixed, row key unchanged | 1 failed / 7 passed |
| complete | **0 failed / 8 passed** |

The middle row matters. Two of the eight cases pass on unfixed code by design. One is the resolver
guardrail — if the repository's own routes stop resolving, every other case is reporting the
resolver's blind spots rather than the palette's defects. The other is the duplicate-row case, and
it fails on a **partial** repair: on main the default list happened to hold one `/tower` entry, so
the shared React key was harmless; removing the retired entry above it shifts a second `/tower` into
that list, React reconciles two children with the same key, and a search for "Tower" then draws five
rows for four entries with one row repeated. Measured in all three states. Keying by label fixes it.
That is why the key change belongs to this repair rather than sitting beside it as a tidy-up.

Six mutations, each caught by the case that should catch it:

| mutation | result |
|---|---|
| restore the dead Users destination | 2 failed (dead-destination list, Users) |
| re-add the retired Solutions entry | 1 failed (dead-destination list) |
| revert the vocabulary | 5 failed |
| revert the row key to the shared path | 1 failed (duplicate row) |
| point Connectors back at the overview | 1 failed (Connectors) |
| make the resolver unable to say no — mutates the **test** | 1 failed (resolver guardrail) |

The last is the one that stops this being a gate that cannot fail.

`src/components/shell/__tests__/admin-shell-vocabulary.test.ts` was **1 failed / 2 passed** on main
and is **3 passed** now, untouched — its assertions describe the restored shape.

Scope baseline `npx jest src/__tests__/behaviors src/components/shell`: **1 failing / 252 passing
before → 0 failing / 261 passing after**. The one failing suite before was the vocabulary test above.

`tsc --noEmit` exit 0 with `tsconfig.tsbuildinfo` removed first; `eslint` exit 0; `release:check`
exit 0 — all judged by exit code, not by grepping output.

The new suite lives in `src/__tests__/behaviors`, so it runs in the `Behavior coverage floor` CI job
and inside `test:before-commit`. That placement is the point: the existing test covering this
component sits in a directory no routinely-run command touches, which is why a reverted fix went
unseen.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the image
and shifts traffic. No migration, no flag, no data build, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No manual Azure command is run for this change.
- Approved image digest: produced by that workflow from the merge commit.
- ACA runtime invariant: to be proven after the deploy run — Container App template image must equal
  the 100%-traffic revision image, digest-pinned.
- Worker image invariant: unchanged; this release alters no worker job.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — open the palette on a signed-in session, search for an admin
  destination, and confirm it lands on the page rather than a 404.

## Rollback Plan

Revert the PR and let the deploy workflow ship the previous image. Nothing persists state, so a
revert is complete. Reverting restores the 404 destination, which is why it should only be done for
an unrelated fault.

## Audit Evidence

- The PR, its checks, and the deploy run keyed to the merge commit.
- The before/after and mutation tables above are reproducible from the suite named in this record.

## Known Gaps

- **Live signed-in proof is owed.** It is read-only and safe — open the palette and follow an admin
  entry — but no human was present during this run to drive a signed-in session.
- **Three Tower entries promise a lens the palette cannot reach.** "Tower · Value", "Tower · Spend"
  and "Tower · Actions" all navigate to `/tower`, the same place as the plain "Tower" entry. Not a
  dead destination, so outside this item's acceptance, and which lens should exist is a product-copy
  question rather than a defect with one correct answer. Left untouched and reported to the backlog.
- **One entry hard-codes a single fixture tenant's programme** into shared chrome, so it appears in
  the default list for every signed-in user regardless of tenancy. Clicking it should fail closed on
  tenant scoping, and the data is synthetic today, but the label itself is visible to everyone. What
  belongs in that slot is an owner's call; reported to the backlog rather than swept in here.
- The existing vocabulary test remains in a directory no npm script or workflow runs. Widening that
  scope is a separate backlog item and would surface unrelated failures; enforcement for this
  component now sits in the behaviors suite instead.
