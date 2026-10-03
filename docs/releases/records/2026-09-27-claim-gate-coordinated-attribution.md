# 2026-09-27-claim-gate-coordinated-attribution — Claim gate: an attribution behind a described list member

## Release ID

`2026-09-27-claim-gate-coordinated-attribution`

## Status

`candidate`

## Plain-English Summary

The execution register's pre-claim gate refuses an agent's claim when a file it intends to edit is
already held by somebody else's live claim. To decide that, it reads the paths a claim line holds —
and it reads the whole line, not only the declared `files:` list, because runs legitimately add a
hold in prose when the helper's list came out incomplete.

That reading had a blind spot with a self-reinforcing consequence. A claim line can name a list
whose members are one file path and one artifact described in words, then attribute the whole list
to a third party: *"all three need `<workflow file>` and the coverage census, both held by a live
`<item>` claim"*. The attribution vetoes are anchored at the head of the text behind the list, and
the list-joining rule only ever joins a path to another path — so the described member sat between
the path and the attribution, the veto could not see past it, and the path was recorded as held.

The consequence is a ratchet rather than a one-off miss: a run that documents *why* it passed an
item over, naming the file and the run that held it, creates a hold of its own on that file, which
outlives the release of the claim it was describing. The more carefully runs record their refusals,
the less of the tree stays claimable — and nothing declares it, because the holding line's own
`files:` list does not mention the file at all.

This change teaches the attribution veto to look past a coordinated member named in words when a
collective anaphor (`both`, `all`, `each`, …) says the attribution governs the whole list. Without
that anaphor nothing changes: the attribution is read as covering the described member alone and the
path in front of it goes on holding, which is the hold-preserving reading.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling, executed by agents and operators
against the execution register. It ships in no client-facing lane.

No product layer changes. This is execution tooling only — the pre-claim gate for the operator
claim register (`scripts/exec/`). No product surface, no canonical model, no source adapter, no
client intake, and no runtime code path is touched.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — agent/operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `pathAttributionTail` now skips a coordinated list
  member named in words when a collective anaphor follows it, before the attribution's word budget
  is counted. Two new named bounds: `PATH_TAIL_LIST_ANAPHOR` (the vocabulary that licenses the skip)
  and `PATH_TAIL_COORDINATED_MEMBER_REACH_TOKENS` (how many words the described member may be). The
  skip cannot cross `.`, `;` or `/`, so it can neither leave the sentence nor step over a path.
- `scripts/exec/register-time-authority.test.mjs` — eleven new assertions, four of which fail
  without the change.

## QA / Validation

Baseline and result measured over the same scope, from a clean worktree cut from `origin/main`
`b150f0c8407392fc5a95e729febdeb86358cf6e5`:

- `node scripts/exec/register-time-authority.test.mjs` — **4 failing before, 0 after**
  (318 passed / 4 failed → 322 passed / 0 failed).
- **The known positive is a live register line, not a transcription.** The committed fragment is a
  byte copy of the line that refused this run's own first-choice claim, carried with the whole
  line's sha256 so a rewrite of it cannot pass silently. Its behaviour is asserted unconditionally
  because the fragment is committed; its byte-presence in the live register is asserted only when
  that file is readable and is reported as NOT RUN otherwise, so a missing corpus cannot
  manufacture a pass.
- **Three mutations, each caught.** Removing the skip fails the four known-positive cases. Making
  the anaphor optional — i.e. letting any coordinator free the path in front of it — fails 16 cases
  including three pre-existing corpus-derived ones, so the anaphor requirement is load-bearing and
  over-freeing is detected. Removing the `.`/`;`/`/` exclusion fails only the two
  sentence-boundary controls, which is what those controls are for.
- **The numeric bound was swept over the live register, not chosen.** At reach 0, 1 and 2 the defect
  survives; at 3 it is repaired; at 3, 4, 5, 6, 8, 12 and 24 the verdict never moves again. Exactly
  **one line of 3,270 changes and exactly one path is freed**, and **zero paths become newly held**
  at any reach. The shipped bound is 4 — one token above the derived minimum, with the ceiling above
  it stated rather than asserted.
- **Proven on the real register in both directions.** Before the change the gate refused three of
  four requested paths, including a workflow file named only in another line's narrative. After it,
  the same probe refuses **only** the path a live claim genuinely declares, and names that holder.
  Every genuinely declared hold on the same register still holds.
- Sibling toolchain contracts, all 14 run: 12 exit 0. `id-collision` and `register-merge-coverage`
  each fail one case **identically with and without this change** — measured by restoring the
  `origin/main` module and re-running — so 2 failing before, 2 after; both read the live operator
  documents, which no CI runner has.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, judged on the
  exit code with `tsconfig.tsbuildinfo` removed first.
- `npx eslint` over both changed files — exit 0.
- Nothing was weakened, de-required, skipped, quarantined or deleted.

## Rollout Plan

Merge to `main`. No runtime rollout: these files are developer/operator tooling executed by the
`Execution queue toolchain` workflow and by agents on the operator host. No image, no container app,
no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This release changes no runtime template, image, flag, env var,
  scale or secret.
- Approved image digest: not applicable — no runtime image change is requested or implied.
- ACA runtime invariant: unaffected. The post-merge deploy run is the pipeline's own; this change
  cannot alter the served digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — no product surface changes, and no signed-in behaviour is
  claimed by this record.

## Rollback Plan

Revert the single commit. The change is two files with no state, no schema and no generated
artifact, so a revert restores the previous reading of the register immediately. The register itself
is append-only and is never written by this code path, so no data can be left inconsistent.

## Known Gaps

Stated rather than implied, because each of these is a place a reader could over-read this change:

- **This teaches the veto ONE shape; it does not stop holds being inferred from prose.** The gate
  still reads paths from anywhere on a claim line, and it must, because a run naming an extra file
  it genuinely touched in prose has to keep holding it — the suite pins that as a requirement. So
  the general class "a cited path reads as a held path" is narrowed here, not closed.
- **The item's own prescribed rule was found unimplementable, and the correction is recorded on the
  item rather than fixed here.** The filing asked for `files:`-list-only parsing. That would delete
  the proven behaviour above, so the mechanism was re-derived from the anchor instead. Anyone
  reading the item should read the correction beside it.
- **The front-position cue is still bounded in CHARACTERS** and therefore still reaches only as far
  as the first path of a list. That residual belongs to its own item and was deliberately not
  touched here; widening a front cue moves live holds.
- **One live line changed, so the corpus constrains this rule thinly.** The sweep found exactly one
  instance on 3,270 lines. The behavioural cases and the three mutations carry the proof; the corpus
  confirms the direction rather than establishing the bound on its own.
- **No signed-in proof is owed or claimed.** This release changes no product surface.

## Audit Evidence

- PR for this branch, with the before/after failure counts and the mutation results in its body.
- `Execution queue toolchain` CI job `Run the register time-authority contract`, which executes the
  new assertions on a runner with no operator documents — the not-run path is visible in its log.
- The committed live fragment and its sha256 in `scripts/exec/register-time-authority.test.mjs`,
  which an auditor can re-derive against the register line the record cites.
