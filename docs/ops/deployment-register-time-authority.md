# Deployment register — time authority

The execution lanes keep an append-only register of what was claimed, merged
and deployed. Every line of it carries a timestamp, and until now each lane
wrote that timestamp from its own idea of the time.

Measured against GitHub over a single day's window before this rule existed:

| measure | value |
|---|---|
| merge announcements resolved to an authoritative `mergedAt` | 26 |
| outside ±300s of the event they reported | 17 |
| drift range | −44s to +48,077s |
| lines stamped in the future of the clock that read them | 6 |
| appended lines whose stamp is earlier than a line above them | 63 |

Opposite signs and non-constant magnitude, so this is not a fixed clock skew
that a single offset would repair. The damage is not the lines themselves —
each line's content checked out — it is that closed items had already derived
elapsed figures from the ordering ("six hours ago", "the 30th hour"), and a
reader cannot tell which such figure is sound.

## The rule

**There are exactly two authorities, and an estimate is neither of them.**

| line kind | authority |
|---|---|
| an event line — a merge, a deploy, a run outcome | GitHub's own `mergedAt` for the pull request, or the workflow run's `createdAt` / `updatedAt` |
| a claim line — claiming, releasing, or amending a claim | a literal `date -u` read **at the instant of writing** |

Three consequences, all of which the control checks:

1. **Never carry a stamp forward** from earlier in the same run. A value read
   twenty minutes ago is an estimate by the time it is written.
2. **A line written well after its event must quote the authoritative instant.**
   Reconciling a four-hour-old merge is correct and normal; doing it without
   naming `mergedAt` leaves the line's own stamp as the only time on offer, and
   that is not the event's time.
3. **Any line quoting an elapsed duration must name the two timestamps it
   subtracted.** "Six hours ago" is not checkable; "from `A` to `B`" is.

**Existing lines are never restamped.** The register is audit history and the
correction pattern is append-only: append a correction, do not rewrite a line.

## Running the control

```
node scripts/exec/register-time-authority.mjs \
  --file ~/Downloads/EXECUTION_CLAIMS.md \
  --since 2026-09-21T12:00:00Z --github
```

Exits 1 when any **failing** verdict is raised. `--json` emits the same report
as data. `--authority <file>` injects the authoritative instants from JSON
instead of calling `gh`, which is how the behavioural suite proves the control
without a network. `--strict` promotes the advisory verdicts to failing.

| code | severity | meaning |
|---|---|---|
| `future_stamp` | **fails** | stamped after the clock that read the file — always wrong, needs no network |
| `unsourced_elapsed` | **fails** | quotes an elapsed duration while naming fewer than two timestamps |
| `announced_before_event` | advisory | announces a merge more than 60s before GitHub's `mergedAt` (60s of slack covers a minute-precision stamp rounding down through the event) |
| `drifted_without_authority` | advisory | stamped more than the tolerance after the event **and** does not quote the authoritative instant |
| `authority_missing` | advisory | announces a merge the control could not resolve — reported rather than skipped, because a lookup that quietly finds nothing must not read as a pass |

### Why two severities

The first two verdicts are decided from the line alone: a stamp later than the
clock that read it is wrong with no interpretation, and a duration with fewer
than two instants behind it names its own gap.

The other three first have to decide **which** pull request a line is
announcing as merged, and register lines are long and discursive — one line can
report opening PR #A while narrating the merge of PR #B, or use the word
`mergedAt` to describe this very rule. That attribution is a heuristic: the
merge token *nearest* the reference decides it, and a negated one
("NOT MERGED YET") disqualifies it. Measured on the real register it is right
on 72 of 76 references. Right is not exact, so those three are reported and
counted but do not fail a run unless `--strict` is passed. A heuristic
presented as a hard gate is how a control stops being believed, and then stops
being read.

## Writing a correct line

```
node scripts/exec/register-time-authority.mjs --emit --pr 8155
```

prints a line prefix built from GitHub's `mergedAt` and a `date -u` read, with
both named in the line, so the right thing is the easy thing.

## Why the control cannot be run in CI against the real register

The register is an operator file outside the repository, so no workflow can
read it. What CI holds shut is the **control**: `Execution queue toolchain`
runs `scripts/exec/register-time-authority.test.mjs`, which exercises every
verdict over fixture registers and asserts on exit status. The control is
mutation-proved, comment decoy included. The audit itself is run by whoever
holds the register, which is how a rule about an operator artifact stays
honest without pretending CI can see it.

## Scope note

This is a process rule with an executable checker. It changes no product
runtime, no tenant data and no deployment path.
