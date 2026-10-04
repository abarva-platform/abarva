# 2026-10-04-c596-eleventh-wave — Eleventh-wave signed-in acceptance

## Release ID

`2026-10-04-c596-eleventh-wave`

## Status

`released`

## Plain-English Summary

Documentation only. This records a signed-in walk of the live lab product
against a merge that had shipped and been deployed with no one confirming how it
behaves for a person actually using the surface. The merge changes how a
supplier panel decides whether a supplier can be contacted: it now counts
contact records in the canonical contact table instead of in a copy embedded in
an older payload.

The walk confirms the panel now shows the canonical count, and reports that no
supplier row's readiness wording changed — not because two counts happened to
agree, but because every supplier on this runtime carries a contact policy that
stops the decision before the changed line is reached. Saying which of those two
it is matters: the first would be luck, the second is a property.

It also sweeps every merge in the build that was running at walk time and gives
each one a verdict or a stated reason for not having one, so that no shipped
change is left silently unaccounted for.

No product code, schema, configuration or runtime behaviour changes.

## Layer Impact

- **Layer 4 (Products)** — observation only. Source and Moves surfaces were read
  signed in; nothing was written and no product behaviour changed.
- Layers 1–3 untouched.

## Client Applicability

- All clients: none — documentation only.
- Specific clients: none.
- Internal only: yes. An acceptance record used by the release lane.
- Public/demo only: no.
- Feature flag: none introduced. One existing flag was observed to be off.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — one new dated block
  recording the walk: the sweep, three result rows, the derivation note and the
  stated limits.
- This release record.

No source, migration, workflow or script changes.

## QA / Validation

The walk itself is the validation, and it was performed against the running
product rather than against tests.

- **Serving SHA resolved at walk time, not pinned:** `6b6b2af358` (#8974), which
  was also `origin/main` at walk start and at walk end. The merge the item names,
  `d756684bf6` (#8971), was asserted an ancestor of it with
  `git merge-base --is-ancestor`.
- **The serving build was established twice, from independent sources.** The
  registry answers it — `az acr manifest show-metadata` on the serving digest
  returns exactly one tag, `main-6b6b2af3` — and the revision name agrees. A
  revision suffix alone is a label a deploy wrote, and an overtaken run can leave
  one that is not the build's, so the registry read is the one that carries.
- **Runtime invariant, bracketed:** two independent read-only `az` reads at
  22:31:41Z and 22:39:49Z each returned template image and sole 100%-traffic
  revision on the same digest
  `sha256:167167481e0b23bac257e5f7f651c3b98f512e15393a417f6790b153b3ebd49e`,
  revision `ca-abarva-web-lab-eastus--m6b6b2af3`, `active`, `Healthy` /
  `Running`. Unchanged across both reads, so no deploy landed inside the walk.
  The digest the backlog item quotes from an earlier walk was not reused; these
  are two fresh reads of a different digest, as the item requires.
- **Ancestor sweep:** 60 first-parent merges between the oldest wave SHA this
  file records and the walked SHA, enumerated with `git rev-list --first-parent`
  and each checked with `git merge-base --is-ancestor` — **60 merges, 60
  ancestors**. 52 carry the ninth wave's disposition, 2 were verdicted by the
  tenth, 1 is walked here, 4 touch no non-test file under `src/app`,
  `src/components` or `src/lib`, and 1 is excluded as flag-off. Nothing in the
  build is left without a disposition.
- **Row 1 — supplier contact readiness on the Stage 04 accepted-candidate
  panel: pass, with a null differing-label result.** All five of the tenant's
  source events were read rather than one, because an empty panel and an
  agreeing panel look alike from a single page: four serialize zero
  accepted-candidate rows and one serializes four. On that one, each of the four
  rows prints `Active contacts: 1` with the blocker sentence "Contact requires
  review before any approach." The readiness decision returns on the contact
  policy *before* reaching the line this merge changed, and the policy value
  that would reach it occurs zero times across all five events — so no row on
  this runtime exercises the changed branch, and no row's label can differ. The
  record argues it that way rather than from two counts agreeing.
- **Row 1a — the number the panel prints: pass on the after-side only.** The
  merge's own release record states an independent database read found four
  active canonical contacts while the panel still displayed zero. This walk
  observed the after-side, four in total across four rows, and explicitly does
  not claim to have observed the before-side, which the runtime has moved past.
- **Row 2 — the flag-gated Moves capture flow: excluded, and observed excluded.**
  The flag is registered with an empty tenant include list; on the signed-in
  phase page the server serializes the flag as false, the live DOM carries one
  `data-capture-v2` element whose value is `off`, and the flag-on path's own
  first-step string appears zero times. The exclusion rests on an observation of
  the runtime rather than on a reading of a config file.

No unit or integration suite is affected; no source file changed.

## Rollout Plan

Merge to `main`. No runtime rollout — the change is documentation. The repo-owned
ACA main deploy workflow will build and deploy as it does for any merge; this
record asserts nothing about that deploy because the change cannot affect
runtime behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp update`, no traffic or
  revision change, no env/flag/secret change was performed. The only Azure calls
  were read-only `az containerapp show`, `az containerapp revision list` and
  `az acr manifest show-metadata`.
- Approved image digest: not applicable — no image is proposed by this change.
- ACA runtime invariant: observed and recorded above as evidence for the walk,
  not changed by it.
- Worker image invariant: untouched.
- Feature/env flag update path: not applicable. No flag was enabled or disabled.
- Live signed-in proof required: this record **is** that proof, for the merge
  named.

## Rollback Plan

Revert the commit. No migration, no runtime state, no data to unwind.

## Audit Evidence

- `docs/acceptance/signed-in-wave-acceptance-matrix.md`, the
  `2026-10-04 eleventh wave` block — the sweep table, the result rows, the
  derivation of the readiness label from the rendered blocker sentence, and the
  stated limits.
- The two bracketing read-only `az` reads and the registry tag read quoted in
  that block.
- The ancestry assertion over all 60 merges in the walked build.

## Known Gaps

- **The changed branch was not exercised.** Every accepted supplier on this
  runtime carries a contact policy that short-circuits the readiness decision
  ahead of it. The null result is therefore a property of the current data, and
  a row with a contactable policy would be needed to exercise the new count in
  the decision rather than only in the displayed number. Recording one is a
  write and is out of scope for a walk.
- **The pre-change input is not readable from the surface.** The embedded
  contact array the old rule read is not serialized to the client, so the two
  rules' outputs could not be compared side by side; the argument rests on the
  policy short-circuit, which needs no access to it.
- **Four of the five events carry zero accepted-candidate rows.** That is
  reported as zero driving rows and not as an absence of contacts or envelopes —
  an empty panel does not distinguish the two and this walk does not claim to.
- The surface's own rendered list of events was a floor, not the population: the
  hydrated page offered four and the server offered five. The fifth was read, and
  the discrepancy is recorded in the block because taking a rendered list for the
  population is how a row goes unverdicted.
