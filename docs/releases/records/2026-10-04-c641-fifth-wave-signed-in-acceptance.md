# 2026-10-04-c641-fifth-wave-signed-in-acceptance — Fifth-wave signed-in acceptance walk

## Release ID

`2026-10-04-c641-fifth-wave-signed-in-acceptance`

## Status

`released`

## Plain-English Summary

Ten merges had reached the lab runtime with nobody having signed in and looked at
them. This change adds the record of that walk: a results matrix with one row per
surface, each marked pass, fail or blocked, plus the evidence that the runtime did
not move underneath the walk.

It ships documentation only. No route, component, API response, control, flag,
schema or tenant datum is touched, so there is nothing here for a user to receive
at runtime — what it changes is what the repository can prove about code that was
already live.

Two results are worth reading before the matrix. A previously filed display defect
(four decimal figures printed to an executive with a space inside them) measures as
fully resolved on the serving build: zero occurrences across the whole page payload,
with all five named figures rendering correctly. And a previously filed naming
defect measures as zero on the surface but is **not** closed: one of its two shapes
is genuinely fixed and proven against the raw record, while the four rows that
carried the other shape have left the data entirely, so that half remains untested
rather than passing. The matrix states that distinction rather than reporting the
headline count alone.

## Layer Impact

- **Layer 4 (Products)** — read only. Home, Moves and Source surfaces were observed;
  none was modified by this change.
- No other layer is touched. Layer 1 intake, layer 2 adapters and layer 3 canonical
  model are unchanged, and nothing here asserts a tenant fact.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — a release-governance artifact
- Public/demo only: no
- Feature flag: none

The walk itself was performed against the synthetic composite reference tenant,
which labels itself on the surface as a synthetic portfolio and not a customer.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new dated block for the
  fifth 2026-10-03 wave, inserted ahead of the two existing blocks.
- `docs/releases/records/2026-10-04-c641-fifth-wave-signed-in-acceptance.md` — this record.

No source file, workflow, script, migration or dataset is modified.

## QA / Validation

The validation for a walk is the walk. What was done, and how each claim was made
checkable rather than asserted:

- **Ancestry, not a pinned SHA.** `git merge-base --is-ancestor` was run for each of
  the ten merges against the serving SHA `aa23d2c31fcfd494bc834ee771762578757a480c`;
  all ten returned ancestor. This is the form the item asks for, because a pinned-SHA
  acceptance becomes unexecutable as soon as the next deploy lands.
- **Runtime invariant bracketed.** Read-only `az containerapp show` and
  `az containerapp job show` at 02:00:16Z and again at 02:07:45Z. Both reads returned
  the same template image, the same sole 100%-traffic revision, the same
  `latestReadyRevisionName` and the same two worker images, so no deploy landed inside
  the walk.
- **Counts measured over the whole payload, not spot-checked.** The decimal-defect
  re-read scanned 1,112,296 characters of the rendered body — which includes the
  embedded server payload, the surface on which the defect was originally established
  — for the broken pattern, and probed each of the five named figures in both its
  correct and its broken form.
- **Raw record read beside the rendered one.** The move-name re-read compared
  `GET /api/v1/programs` output against what the board rendered on the same row, which
  is what separates "the sanitizer works" from "the data changed". The matrix reports
  that both are true of different rows.
- **Next-action uniqueness measured.** The phase surface was scanned for every
  next-action phrasing rather than read for impression; exactly one match.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

**No write was performed on any surface.** No approval submitted, no phase advanced,
no step saved, no envelope drafted or sent, no file downloaded. Two stages that were
locked or already passed were opened for reading only; both declare that viewing
them changes nothing.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow will build and deploy as it does
for any merge; there is no runtime behaviour in this change to roll out, and no flag,
env var, migration or job to apply.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged
- Shared runtime mutators: none; this change contains no `az` mutation and no workflow edit
- Approved image digest: not applicable — docs-only, no image contract asserted
- ACA runtime invariant: **read, not changed.** At 02:00:16Z and 02:07:45Z the web
  template image, the sole 100%-traffic revision `ca-abarva-web-lab-eastus--maa23d2c3`
  (Healthy / Running), `latestReadyRevisionName`, `job-abarva-deliv-worker` and
  `job-abarva-deliv-worker-event` were all
  `sha256:1b909a50bed3385ed898dd7d5c56b849b3a98e2f26c1015f94a0fe04b365c7dc`
- Worker image invariant: both worker jobs matched the web template digest at both reads
- Feature/env flag update path: none
- Live signed-in proof required: **not for this change** — it ships two documents and
  reaches no signed-in surface. `deployed` is its ceiling, exactly as the two prior
  walk records were treated. What it proves live is ten *other* merges.

## Rollback Plan

Revert the commit. Nothing is deployed, migrated or flagged by it, so reverting
removes the record and restores the previous file contents with no runtime effect.
The underlying observations would remain true; only the repository's record of them
would be lost.

## Audit Evidence

- The matrix block itself: `docs/acceptance/signed-in-wave-acceptance-matrix.md`,
  section "2026-10-03 fifth wave — walked on deployed SHA `aa23d2c31f`", which carries
  the ancestry table, both runtime reads, six verdict rows and the stated limits.
- Claim register: `EXECUTION_CLAIMS.md`, item C-641 claimed at 2026-10-04T01:59:52Z by
  `source-backlog-executor#20261004T015700Z`, appended through the claim gate.
- PR URL and CI run: recorded on the pull request opened from this branch.
- Serving revision at walk time: `ca-abarva-web-lab-eastus--maa23d2c3`, created
  2026-10-04T01:21:50Z, from merge `aa23d2c31f` (#8945).

## Known Gaps

- **Row 5 (Source NDA send, #8936) is blocked, not passed.** The authority gate was
  observed refusing, with four product-stated preconditions named. Whether the server
  refuses a send that gets past the client rests on that merge's own tests; proving it
  live needs a committed send, which an unattended walk must not perform.
- **Row 6b (#8927) is blocked and the item's own pairing does not hold.** That merge
  changes only an ACA job script, its test and its docs — no route, component or API
  response — so it is not reachable from any signed-in surface. Running the job is a
  mutating data build and out of bounds here.
- **The move-name re-read is 0 of 8 on the surface but does not close U-553.** One of
  its two shapes is proven sanitized against the raw record; the four rows carrying the
  other shape are absent from the corpus, so that rule's sufficiency is untested rather
  than met.
- **Three merges ahead of the serving SHA are not covered.** #8947, #8949 and #8950 had
  not reached the runtime at walk time, and two of the three are client surfaces. A
  sixth wave is already forming and needs its own item.
- Four surface observations are recorded in the matrix under "Noted, not filed" because
  each needs a product decision rather than a guess.
