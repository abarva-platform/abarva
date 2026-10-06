# The migration apply gate is the largest single lever on Source vision completion

Read-only finding, 2026-09-21. No migration was applied, no workflow was
dispatched, no database was queried, nothing was mutated. Every claim below is
checkable from files in this repository and from GitHub run metadata.

## What prompted it

The generated Source board reports **40.5% proof-weighted vision completion**
across the nine CPO lifecycle stages. Four stages carry the weakest rungs:

| Stage | Rung (floor) | Stated blocker |
|---|---|---|
| Request intake | Open | — |
| Triage | Open | — |
| Vendor panel | PR / CI | Blocked |
| NDA | Merged | — |

Item `D-006` explains the first two: the authority schema is authored and the
read path fails closed, but there is no activation write path, and the
migration "remains a separately gated database operation". Its evidence is a
read-only workflow run confirming **exactly two pending migrations**.

## The finding: that evidence is stale by seven migrations

Run `35450587648` was created **2026-09-19T15:03:00Z**. The migration
`20260919152000_source_event_authority_versions.sql` is timestamped
**15:20:00Z the same day — seventeen minutes later.** Six more were added on
2026-09-20.

Seven migrations therefore entered the tree *after* the measurement that says
two are pending:

```
20260919152000_source_event_authority_versions.sql
20260920003500_source_nda_authority.sql
20260920010000_source_executed_nda_authority.sql
20260920012000_source_event_candidate_supplier_authority.sql
20260920014000_source_nda_waiver_supplier_authority.sql
20260920120000_source_executed_nda_signature_evidence.sql
20260920130000_source_artifact_malware_scan_status.sql
```

**The count is not restated here as a number.** Migrations apply in timestamp
order, so everything after a pending migration is also pending — which would
make the true figure at least nine, and twelve if the three files dated between
the two named ones are pending as well. But the original measurement reports
`20260916201000` as pending while three later files are not listed, so the
ledger's ordering behaviour is not what a reading of the filenames assumes. The
honest statement is that **the figure must be re-measured, and it is larger than
two**; asserting a specific number from filenames would repeat the error this
document exists to record.

## Why it matters more than the count suggests

The queued migrations are not incidental. They are the substrate of exactly the
four weakest stages:

| Migration creates | Stage it gates |
|---|---|
| `source_event_authority_versions`, `source_event_authority_version_approvals` | Request intake, Triage |
| `source_event_candidate_supplier_authority` | **Vendor panel** (Blocked) |
| `source_nda_template_versions`, `source_event_nda_waivers` | NDA |
| `source_executed_nda_authority` | NDA |
| NDA waiver supplier authority, executed-NDA signature evidence | NDA |
| `source_events.activation_state` (+ solicitation motion columns) | Request intake, Triage |

One human decision — passing the apply gate — is what stands between four of
the nine CPO stages and their next rung. No amount of agent work moves those
four past it.

## Two things the apply will NOT fix, found while checking

**1. `D-006`'s acceptance asks for a column that no migration creates.** It
requires the activation transition to record "the named actor and accepted
request version". The pending migration adds
`solicitation_motion_accepted_by_user_id` and `solicitation_motion_accepted_at`
— actor and timestamp for the *solicitation motion*, not for *activation*. A
search across every migration and all of `src/` for `activation_accepted`,
`accepted_request_version` or `activated_by` returns nothing.

So applying the migration does not make `D-006`'s acceptance satisfiable. Either
a further migration mirrors the existing all-or-nothing idiom for activation, or
the acceptance is amended to record the actor somewhere else. **That is a design
decision and it is not taken here.**

**2. The version-authority logic has no callers.**
`src/lib/source/new-workspace/source-version-authority.ts` defines the request
and strategy version contract — canonical payload hashing, version planning,
approval states. A search for `planSourceAuthorityVersion` and
`SourceAuthorityCurrentVersion` across `src/` returns **no consumer outside the
module itself**. The only references to the `source_event_authority_versions`
table are in a test that asserts the migration file's SQL *text* contains
certain strings — a source-text check, not a runtime path.

So the tables, the logic, and the read path each exist, and nothing joins them.
Applying the migration creates tables that no code writes to.

## What was deliberately not done

- **No migration was applied and no workflow was dispatched.** The
  `db-migration-lab` workflow that produced the original figure contains the
  apply step itself, so dispatching it to re-measure risks performing the very
  operation the gate exists to hold.
- **No new migration was authored.** Closing the `activation_accepted` gap would
  add a tenth file to a queue whose problem is that it is not being applied, and
  the alternative design — recording the actor in an audit table — has not been
  ruled out by whoever owns the surface.
- **No count is asserted.** See above.

## What would move the number

1. Re-measure the pending set through the read-only path, so the queue is known
   rather than inferred.
2. Decide the apply. Four of nine stages are waiting on it.
3. Decide where activation records its actor, which `D-006` needs and no pending
   migration provides.
4. Wire the version-authority logic to its tables, which is ordinary work with
   no gate in front of it and is the one item on this list an agent can do now.
