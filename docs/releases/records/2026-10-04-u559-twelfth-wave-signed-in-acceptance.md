# 2026-10-04-u559-twelfth-wave — Twelfth-wave signed-in acceptance

## Release ID

`2026-10-04-u559-twelfth-wave`

## Status

`released`

## Plain-English Summary

Documentation only. This records a signed-in walk of the live lab product against
three merges that had shipped and been deployed with nobody confirming how they
behave for a person actually using the surface.

Two of them add redesigned Moves presentation behind feature flags that were off
when they merged: a new portfolio landing page, and a three-step phase capture
flow. The third merge turns both flags on for one synthetic demo tenant. So the
third merge is what makes the first two observable at all, and all three are
walked together.

Both flags were confirmed on by reading the running surfaces, not by reading the
file that declares them — a merged default is not a serving state. Both surfaces
render what their merges claim, with no console errors.

The walk also records a near-miss in its own method. The first reading of the
landing page said the flag was **off**. That reading was taken while the deploy
was still finishing, so the page in hand had been served by the previous build;
the state it reported was the age of a document, not a flag. The record dates the
traffic shift, says which readings were discarded, and starts the walk window
there.

No product code, schema, configuration or runtime behaviour changes.

## Layer Impact

- **Layer 4 (Products)** — observation only. Two Moves surfaces were read signed
  in; nothing was written and no product behaviour changed.
- Layers 1–3 untouched.

## Client Applicability

- All clients: none — documentation only.
- Specific clients: none.
- Internal only: yes. An acceptance record used by the release lane.
- Public/demo only: no.
- Feature flag: none introduced. Two existing flags were observed to be **on**
  for the one synthetic tenant their definitions name, and their off path is
  recorded as owed rather than assumed.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — one new dated block
  recording the walk: the two-source SHA resolution, the runtime invariant read
  twice, the re-derived sweep, the per-flag runtime observation, three result
  rows, the stale-document finding, and the stated limits.
- This release record.

No source, migration, workflow or script changes.

## QA / Validation

The walk itself is the validation, and it was performed against the running
product rather than against tests. No test accompanies this change and none is
owed: nothing executable changed.

- **Serving SHA resolved at walk time, not pinned:** `15de62ec41` (#8976), which
  was also `origin/main` at walk start and at walk end.
- **Resolved from two independent sources**, because a revision suffix is a label
  a deploy wrote: `az acr manifest show-metadata` on the serving digest returns
  the sole tag `main-15de62ec`, and the revision name `--m15de62ec` agrees.
- **Runtime invariant proven, read twice:** template image
  `sha256:c7487b6f…a48b`, the 100%-traffic revision's own image identical to it,
  sole traffic entry at weight 100, revision `active`/`Healthy`/`Running`. Both
  reads — one before the walk, one at 23:30:26Z — returned the same digest and
  the same sole revision, so no deploy landed inside the walk.
- **Ancestor sweep re-derived, not inherited.** All three merges the item names
  were asserted ancestors of the walked build with
  `git merge-base --is-ancestor`. The population was then recomputed over
  `6b6b2af358..15de62ec41` rather than taken from the item's three: 3 commits are
  new, 1 of them has no product surface (measured — 2 files, none under
  `src/app`, `src/components` or `src/lib` outside tests), and 1 older row was
  re-opened because its previous disposition's ground has been withdrawn. The
  repository squash-merges, so the sweep is over `--first-parent`; `--merges`
  over the same range returns 0.
- **Both flags observed on the runtime**, each with a discriminator that exists
  in no other component, and each corroborated by the absence of the other
  path's own discriminator. One flag was additionally confirmed on three separate
  pages rather than one, so the observation is not a single page's accident.
- **Two candidate discriminators were rejected and the rejection is recorded**,
  because both appear on the flag-off path as well and would have proved nothing.
- **0 console errors** on both surfaces, with console tracking active across the
  loads rather than attached afterwards.

## Rollout Plan

Documentation only; it ships with the merge. No flag, no migration, no job, no
staged rollout.

## Deployment Authority

The repo-owned ACA main deploy workflow, on merge to `main`. This change starts
no deploy of its own and shifts no traffic. Every `az` call made during the walk
is a read; no Azure resource was mutated.

## Rollback Plan

Revert the commit. There is no runtime effect to roll back.

## Audit Evidence

- `docs/acceptance/signed-in-wave-acceptance-matrix.md`, the
  `2026-10-04 twelfth wave` block.
- Deploy run `37242940382` for `15de62ec41`, `completed/success`,
  23:12:53Z → 23:26:07Z. Its completion time is what dates the discarded
  readings.
- The registry manifest for the serving digest, sole tag `main-15de62ec`.
- Merge times taken from GitHub's own `mergedAt` rather than estimated:
  #8973 17:05:13Z, #8975 22:42:28Z, #8977 23:08:14Z, #8976 23:12:50Z.

## Known Gaps

1. **The off path of both flags is owed, and is not inferred.** This walk
   produced the **on** path, on the one synthetic tenant both flag definitions
   name — the only tenant on which the on branch is observable. The off path is
   what every other tenant gets; proving it needs a signed-in session on a second
   tenant. It was deliberately not manufactured by changing a flag, which the
   item forbids and which would invert what proof means.
2. **The predecessor wave's inherited dispositions were not re-verified.** This
   wave re-derived its own population above `6b6b2af358` and re-opened one row by
   name; it does not re-assert verdicts for merges below that bound.
3. **One rendered sentence was read, not traced.** The landing page's value line
   carries two counts. The record states that the sentence rendered with the
   counts the adapter produced; it does not assert those counts are correct,
   because the walk did not trace them to the governed facts behind them.
4. **The diff was scanned by hand for disclosure, not by a tool.** `gitleaks` is
   not on `PATH` in a worktree, so this says the scan was manual rather than
   implying a scanner ran. No tenant name, supplier legal name, e-mail address or
   UUID appears in either file.
