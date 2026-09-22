# 2026-09-22-place-the-t700-band-on-the-stage-map

## Release ID

`2026-09-22-place-the-t700-band-on-the-stage-map`

## Status

`candidate`

## Plain-English Summary

The stage map is the only hand-maintained file behind the nine-stage execution
view. It declares which backlog ids belong to which lifecycle stage, and the
board reports every backlog id it cannot place.

Ids filed during 22 September were on no list. The board **exited non-zero** on
them, and the operator script that picks the next item to work on judges that
exit code and stops — so while they sat unplaced, the queue offered nothing to
anybody.

This places all of them. It is a data edit: ten strings, no code.

| | before | after |
|---|---|---|
| board exit code | **1** | **0** |
| ids the board cannot place | **10** | **0** |

**It was seven when this change was opened and is ten now.** Three more were
filed while it waited for CI. They are added here rather than left for a second
change, because merging a placement that still leaves the board exiting non-zero
would deliver a fix that does not fix. This is the nature of the work: the
backlog is append-only, so placement is a catch-up against a moving target, and
the only durable answer is the gate named under Known Gaps.

## Where they go, and why not a lifecycle stage

Nine are defects in the board and queue generators themselves — record
boundaries, rung attribution, blocker rules, id-band accounting, claim
ownership — and the tenth is a props-and-call-sites cleanup left behind by an
earlier removal. The map has a track for exactly this, described in its own
words as work that *"advances no lifecycle stage; listed apart so it is not read
as progress against the vision."*

That placement follows the file's established precedent rather than a judgement
call: every comparable generator id already sits there — 70 ids in the same
band, including the immediate predecessors of these seven. Putting any of them
on a lifecycle stage would inflate the nine-stage view with work that cannot
move it.

## The finding this surfaced, which matters more than the placement

Three of the seven land under **`Blocked (see source)`**, and **none of them is
blocked**. They are unclaimed agent work.

The blocked rule is a bare word match with no anchoring and no veto. These three
rows are *about* that rule, so their own descriptive prose triggers it:

- one row uses the word **8 times** in its title and acceptance, every use
  describing the defect;
- the other two take it from their shared section body, in phrases that read
  "the same shape as the … gap filed as …" and "excluded from the … bucket as
  finished work" — both descriptions of a mechanism, neither a statement that
  the item is blocked.

**This is the exact latent defect one of those three rows was filed to fix,
landing on that row itself.** It was predicted in the row's own text: a future
row saying "this is not blocked" would be labelled from its body.

The practical consequence, stated plainly so nobody reads the bucket wrong:
**these three are now filed where no agent will look and no owner owes anything.**
Until the blocked rule is anchored, they have to be taken by reading the backlog
directly rather than by waiting for the queue to offer them.

Placing them did not cause this. It made it visible, which is the point.

## Layer Impact

- `internal-admin`. Operator tooling data only. No product surface, tenant data,
  schema, migration, projection, flag, route or runtime behaviour. Nothing under
  `src/` reads this file, it is in no image, and no Container App reads it.
- No code changed. The file is declarative by contract — the generator refuses
  it outright if a status-looking key appears — and nothing here adds one.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `scripts/exec/source-stage-map.json` — ten ids appended to the
  platform-integrity track.

## QA / Validation

### An instrument error found and corrected mid-measurement

Reported first because the corrected numbers depend on it. The first exit-code
reading showed **0 on both sides**, which would have said the change did
nothing. It was wrong: the operator-root flag selects the four operator
documents, **not** the map, and the map is read from the working tree — which
was already edited. Both "before" and "after" ran the fixed map.

Re-measured with the map passed explicitly on each side, against the
pre-change map extracted from `origin/main`:

| | exit code |
|---|---|
| pre-change map | **1** |
| this map | **0** |

### Bucket delta, on inputs whose checksums were confirmed identical on both sides

Re-measured against merged `main` after the three late ids were added, so these
supersede the seven-id figures this change was opened with:

| bucket | before | after |
|---|---|---|
| **claimable** | 2 | **4** |
| blocked on the owner | 190 | **196** |
| held · expired-idle · expired-in-flight · released | 5 · 90 · 120 · 134 | unchanged |

**Claimable moves by two, and both were read rather than counted.** They are the
two newest ids — follow-ups to the ownership gate, filed hours ago, carrying no
claim line and no work started. Offering them is correct; that is what the queue
is for.

The rest are accounted for by label rather than by subtraction:

| label | before | after |
|---|---|---|
| `Blocked (see source)` | 32 | **34** |
| `Signed-in acceptance owed` | 92 | **96** |
| every other label | — | **unchanged** |

**A correction to this record's own earlier claim.** Opened at seven ids, it
reported claimable unchanged at 2 and said so as a headline — earlier runs had
declined this placement precisely because it might move that number. With ten
ids the honest figure is 2 → 4. The seven-id measurement was not wrong; it is
superseded, and the difference is entirely the two new rows, not a change in
what placement does.

### Other gates

| What | Result |
|---|---|
| board toolchain suite | **10 passed, 0 failed** |
| queue toolchain suite | **133 passed, 0 failed** |
| file still parses as JSON | yes — 327 entries on the track |
| diff size | **8 insertions, 1 deletion** — no reserialisation |

The diff size is called out deliberately: re-emitting this file through a JSON
writer rewrites it wholesale, and a previous attempt at a two-id edit produced
247 insertions. This edit is textual.

## Rollout Plan

Merge to `main`. Operator tooling data only: no image build, migration, flag,
traffic shift or runtime change. The next board regeneration picks it up.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: **no**, and
  structurally rather than as a judgement call — nothing under `src/` reads this
  file, it is in no image, and no Container App reads it

## Known Gaps

- **No CI gate can catch the next recurrence.** The backlog document this map is
  checked against lives outside the repository, so nothing in CI can assert that
  every filed id is placed. The check exists only in the operator script, at the
  moment someone runs it. That is why this recurs, and closing it needs the
  backlog inside the repo or a scheduled job with access to it — neither is
  attempted here.
- **Three ids are mislabelled as blocked**, as described above. Not fixed here:
  that is a separate filed item, and bundling a pattern change with a data edit
  would make neither measurable.
- **Placement is not triage.** Each of the seven is on the track that matches its
  nature; none has been assessed for priority, and nothing here decides which
  should be worked next.
- **The id-band exhaustion is untouched.** These seven use an interim numbering
  because the documented band is spent; which range it extends into is still an
  open owner decision, and placing them does not settle it.

## Rollback Plan

Revert the PR. The seven ids return to being unplaced, the board exits non-zero
again, and the operator queue stops offering work.

## Audit Evidence

- Both exit codes, measured with the map passed explicitly on each side.
- The bucket table and the per-label breakdown, on inputs checksummed identical.
- The instrument error above, with what the wrong reading would have claimed.
