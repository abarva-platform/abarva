# 2026-10-04-c638-tenth-wave — Tenth-wave signed-in acceptance

## Release ID

`2026-10-04-c638-tenth-wave`

## Status

`released`

## Plain-English Summary

Documentation only. This records a signed-in walk of the live lab product
against two merges that had shipped and been deployed without anyone confirming
they behave correctly for a person actually using the surfaces. One of the two
is confirmed working; the other could not be exercised at all, and the record
says exactly why and what would be needed to exercise it later.

It also re-reads two earlier defects on a newer build to confirm their fixes
still hold, and records the counts.

No product code, schema, configuration or runtime behaviour changes.

## Layer Impact

- **Layer 4 (Products)** — observation only. Moves and Source surfaces were read
  signed in; nothing was written and no product behaviour changed.
- Layers 1–3 untouched.

## Client Applicability

- All clients: none — documentation only.
- Specific clients: none.
- Internal only: yes. An acceptance record used by the release lane.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — one new dated block,
  four rows, recording the walk.
- This release record.

No source, migration, workflow or script changes.

## QA / Validation

The walk itself is the validation, and it was performed against the running
product rather than against tests.

- **Serving SHA resolved at walk time, not pinned:** `a69aff1552` (#8970).
  Both merges the item names were asserted as ancestors of it with
  `git merge-base --is-ancestor`: `2fe1d2f7f2` and `9fbddbffa0`, both ancestors.
- **Runtime invariant, bracketed:** two independent read-only `az` reads at
  15:42:45Z and 15:50:05Z each returned template image and sole 100%-traffic
  revision on the same digest
  `sha256:973c5abde5cf269a32c28e871e31b2159c3223a4300f10f2efc756ab72767b2b`,
  revision `ca-abarva-web-lab-eastus--ma69aff15`, `Healthy` / `Running`.
  `origin/main` advanced during the walk and the serving revision did not
  follow it, so no deploy occurred inside the bracket.
- **Row 1 — artifact quality signal display: pass.** Held on both sides in one
  session and joined **per artifact** by creation stamp rather than compared as
  sets, because a set-wise match can be satisfied by a sibling. Route returned
  34 artifacts, 16 scored, distinct values `{80, 82, 90}`, none at or below 1,
  none non-integer, none above 100. The panel rendered 5 scores; 5 of 5 agree
  with the route's own value for the same artifact.
- **Row 2 — NDA envelope draft state: blocked**, on two independent
  preconditions. Measured across all 5 of the tenant's source events: every
  status read returned HTTP 200 with the provider undispatched and zero
  envelopes, so there is no draft state to assert. The migration is named in the
  record; its applied state is reported as **unestablished** rather than
  inferred, because the loader does not select the column the migration adds.
- **Row 3 — build/run identifiers on client-visible move labels: pass**, third
  consecutive unchanged reading at 0 of 8.
- **Row 4 — broken decimals on the Home cockpit: pass**, 0 over a
  1,188,433-byte raw server response, with a positive control proving the
  corpus was present: 1,041 correctly-formed decimals, and each hand-named
  string appears only in correct form.

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
  were read-only `az containerapp show` and `az containerapp revision show`.
- Approved image digest: not applicable — no image is proposed by this change.
- ACA runtime invariant: observed and recorded above as evidence for the walk,
  not changed by it.
- Worker image invariant: untouched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: this record **is** that proof, for the two
  merges named.

## Rollback Plan

Revert the commit. No migration, no runtime state, no data to unwind.

## Audit Evidence

- `docs/acceptance/signed-in-wave-acceptance-matrix.md`, the
  `2026-10-04 tenth wave` block — the four rows, their verdicts and the measured
  counts behind each.
- The two bracketing read-only `az` reads quoted in that block.
- The ancestry assertion for both named merges.

## Known Gaps

- **Row 2 is unproven, not passing.** The NDA draft-state path cannot be
  exercised by any read-only signed-in walk: its subject is a provider webhook,
  the provider is undispatched on this runtime, and no envelope exists. Closing
  it needs a dispatched lab provider and at least one drafted envelope, which is
  a write and is out of scope for a walk.
- The applied state of the migration named in row 2 is not established here.
- Rows 3 and 4 are confirmations of earlier readings on a newer build, not
  independent new findings, and are labelled as such.
