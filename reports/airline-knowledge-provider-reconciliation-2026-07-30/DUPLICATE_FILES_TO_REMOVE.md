# Duplicate provider — file disposition

## Load-bearing fact this document is built around

`src/lib/knowledge/providers/` — the duplicate provider PR #5772 built — **does not exist on
`main`**. It exists only on the unmerged branch `feat/knowledge-ui-airline-demo-new`
(commit `1ad6fb725`, PR #5772), which is not an ancestor of `origin/main`
(`628cdda4c91535541e7d2bd9779b8f1289361d8a`, the SHA this PR is built from — confirmed via
`git merge-base --is-ancestor 1ad6fb725 origin/main`, which fails).

That means Step 3 of this PR's brief ("add a deprecation header to each file in
`src/lib/knowledge/providers/`, freeze but don't delete") cannot be executed as literal file edits
inside a branch built from `main` — there is nothing at that path to edit. Two hard rules this PR
must also honor make the alternative (copying the files onto `main` myself) the wrong move:

- "Do not touch the existing `feat/knowledge-ui-airline-demo-new` branch or PR #5772 — leave them
  exactly as they are."
- "Do not merge PR #5772 as currently implemented."

Copying the duplicate provider's source onto `main` via this PR would put unreviewed, admittedly
provisional code (see `types.ts`'s own header: _"the real CONSUMPTION_PROJECTION_REGISTRY.json does
not yet expose on this branch... reconcile these against the real registry rather than assuming
this file is authoritative"_) onto `main` outside of PR #5772's own review, which is exactly what
"do not merge PR #5772 as currently implemented" is guarding against. So this PR does not introduce
those files. Everything below is read via `git show origin/feat/knowledge-ui-airline-demo-new:<path>`
(read-only; never checked out).

## File list (frozen in place, on the PR #5772 branch, at PR B time — not touched by this PR)

| Path                                                                    | Disposition                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/knowledge/providers/types.ts`                                  | Frozen at PR B, then removed once PR B's UI imports the real `consumption-contracts` types instead.                                                                                                                                                                                                                                      |
| `src/lib/knowledge/providers/governed-knowledge-provider.ts`            | Frozen at PR B (its 39-method interface is a useful reference for PR B's migration — see `COMPONENT_TO_QUERY_MAPPING.md`), then removed once every component in `src/components/knowledge/**` (non-vnext) is rewired onto `KnowledgeUiViewModelAssembler`.                                                                               |
| `src/lib/knowledge/providers/design-harness-provider.ts`                | Frozen at PR B, then removed. Recommend PR B does **not** port this guard forward at all — the real `assertFixtureNamespace()` (`src/lib/knowledge/fixtures/index.ts`) already does the same job against the real fixture namespace, and `createDesignHarnessProvider` is an unimplemented stub today so nothing is lost by dropping it. |
| `src/lib/knowledge/providers/read-models.ts`                            | Frozen at PR B, then removed once its row types are replaced by this PR's assembler view-model types (`src/lib/knowledge/view-model/*`).                                                                                                                                                                                                 |
| `src/lib/knowledge/providers/__tests__/design-harness-provider.test.ts` | Frozen at PR B, then removed (its two "canonical tenants are rejected" assertions should be re-homed as coverage of `assertFixtureNamespace`, which already has that coverage — see `src/lib/knowledge/consumption-client/__tests__/activation-guard.test.ts`, which already asserts this for `airline-demo-new` specifically).          |

## What "frozen" means, operationally, once PR B exists

PR B is the PR that actually rewires `src/components/knowledge/**` (non-vnext) off
`src/lib/knowledge/providers/*` and onto `KnowledgeUiViewModelAssembler`. Since PR B necessarily
touches every consumer of the duplicate provider, it is the natural (and now the only actually
possible) place to also:

1. Add the header comment below to the top of each file in the table, in the same commit that stops
   adding new consumers of it (i.e. the first commit of PR B, before the migration commits).
2. Not add any new method to `GovernedKnowledgeProvider` or `read-models.ts` during the migration —
   every component's data need should resolve to a `KnowledgeUiViewModelAssembler` call instead.
3. Delete the whole `src/lib/knowledge/providers/` directory in PR B's final commit, once
   `git grep -l "lib/knowledge/providers"` under `src/components/knowledge/` returns nothing.

## Ready-to-apply deprecation header (for PR B to paste verbatim)

```ts
/**
 * @deprecated DUPLICATE PROVIDER — being replaced by KnowledgeUiViewModelAssembler over the real
 * KnowledgeConsumptionProvider (src/lib/knowledge/consumption-client, src/lib/knowledge/consumption-contracts).
 * See reports/airline-knowledge-provider-reconciliation-2026-07-30/ for the full reconciliation.
 * Do not add new methods here. Full removal happens once PR B migrates every consumer under
 * src/components/knowledge/** (non-vnext) onto the assembler.
 */
```

## Verification this PR did not introduce or modify any of these files

```
$ git diff --stat origin/main -- src/lib/knowledge/providers
(no output — path does not exist on this branch either, by design)
```
