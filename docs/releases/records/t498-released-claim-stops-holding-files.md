# 2026-10-05-t498-released-claim-stops-holding-files — a hand-written release stops holding its files

## Release ID

`2026-10-05-t498-released-claim-stops-holding-files`

## Status

`candidate`

## Plain-English Summary

The execution register is the append-only log that decides which agent run owns which files.
Before any run starts work it asks a gate: *is anything I need held by somebody else right now?*
The gate reads each recent register line, decides whether that line is still a live claim or has
already been handed back, and refuses the run if a file it wants is still held.

Deciding "handed back" turned on one word, and the rule for recognising that word was narrower
than the register it reads. It matched `RELEASED` only in capitals, and matched a lower-case
`released` only when the literal word `item` came next. A release written by hand as
`released — <id> MERGED` satisfied neither branch, so the gate read a finished, merged, deployed
item as a live claim and kept holding every file its author had listed — for the full three-hour
window, against every other run. The incentive that creates is backwards: the more precisely an
agent names what it touched, the longer it blocks everybody else.

This change matches the verb in either case and drops the requirement for a word after it. Nothing
else widened: the rule is still anchored at the head of the line's message, and it is still the
verb `released`/`releasing` and never the noun `release` — so the many claim lines that merely
promise "one public-safe release record per PR" still hold their files, which is the whole reason
the anchor exists.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operator capability — the coordination
toolchain agent runs execute before they start work. No client-facing lane applies: nothing here is
gated, projected, rendered or served.

- **Layer 4 — Products:** none. No product surface, route, tenant projection or canonical object is
  touched, and nothing a client can see changes.
- **Platform tooling (no layer):** one reader in the operator-side execution toolchain
  (`scripts/exec/register-time-authority.mjs`) and its behavioural suite. This is agent
  coordination scaffolding, not application code.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator/agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `announcesRelease` matches the announcement verb in
  either case and no longer requires `items?` after it; the now-unreachable lower-case branch is
  deleted rather than left beside the new rule, because a pattern no input can reach is a guard
  that survives every mutation of itself.
- `scripts/exec/register-time-authority.test.mjs` — ten new cases: three for the shapes the old
  rule missed, two regression guards for the two shapes it did admit (one of which is what the
  sanctioned writer emits today), three negative controls re-asserted in lower case because that
  is the half the widening touched, and two end-to-end cases through the gate itself — one proving
  the files come back, one proving a line that holds work still refuses.

## QA / Validation

**Calibrated against the live register before changing anything**, in both directions:
2,359 lines parsed, **531** reading as releases under the old rule and **532** under the new one.
Exactly **one** line changes verdict, and it is the known positive the item's acceptance names — a
run that released `C-555` after that item had merged and deployed, written in exactly the shape
that fell between the two branches. No line that holds work stops holding it.

**Red first, then the fix, same suite and same scope on both sides:**

| measurement | result |
|---|---|
| `scripts/exec/register-time-authority.test.mjs` on `origin/main` (43b4fe93c8), unchanged | 354 passed, 0 failed |
| the ten new cases added, subject still unfixed | **360 passed, 4 failed** |
| the ten new cases with the fix | **364 passed, 0 failed** |
| every suite in `scripts/exec/` on `origin/main`, clean baseline | 1458 passed, 0 failed |
| every suite in `scripts/exec/` on this branch | **1468 passed, 0 failed** |

The whole directory was run, not only the suite I edited: `announcesRelease` is a shared reader and
six other suites in it consume the gate that calls it.

**The fix was then broken four ways. Each mutation was asserted non-no-op (the file differed) before
its suite ran, and each was caught:**

| # | mutation | killed by |
|---|---|---|
| 1 | drop the case-insensitive flag | 13 failures — the uppercase regression guard added here, plus 12 pre-existing cases |
| 2 | restore the old `\s+items?` requirement | 4 failures — all four of the new cases for the missed shapes, including the end-to-end one |
| 3 | drop the head-of-message anchor | 7 failures — 2 new lower-case negative controls plus 5 pre-existing ones |
| 4 | admit the noun `release` as well as the verb | 1 failure — exactly the negative control added for it |

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0, zero
diagnostics** (exit code judged, not grepped).

`node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

**Stated rather than implied:** the suite that proves this runs in the workflow job
`Execution queue behavioral contract`, which is in **0 of the 19 required status checks** on `main`.
So this proof is real but it cannot fail a merge, and no claim is made here that it can. That gap
is the subject of separate filed items and is not widened or narrowed by this change.

## Rollout Plan

Merge to `main`. **No runtime rollout.** Nothing here is imported by the application, bundled, or
read by any Azure Container Apps revision or worker job; the file is executed by operator tooling
and by one non-required CI job. The behaviour change takes effect the next time an agent run calls
the pre-claim gate from a checkout containing this commit.

## Deployment Authority

Not required — this release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not applicable (no runtime change)
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no** — nothing renders on a product surface

## Rollback Plan

Revert the commit. The reader is pure and stateless, no artifact or committed file is regenerated
by it, and the register is append-only and untouched by this change, so a revert restores the prior
verdict exactly with nothing to replay or migrate.

## Audit Evidence

- The PR, its diff, and the before/after and mutation tables above.
- `Execution queue behavioral contract` run on the PR — the suite that holds these cases.
- The calibration is reproducible on any copy of the register: parse it with
  `parseRegisterLines`, count `announcesRelease` before and after, and the delta is the one line.

## Known Gaps

- **The suite proving this is in no required check.** Stated above and in the PR rather than left
  for a reader to discover. Wiring the execution-toolchain job into the required set is a separate,
  already-filed concern and deliberately out of scope here.
- **A post-release amendment line still holds its files, and that is a decision rather than a bug.**
  An amendment appended after a release carries the machine-generated head `claimed`, because the
  writer offers only claim, release and abstain; the deliberate rule that a run's own later line
  wins then keeps it holding, correctly. The recommendation is a fourth writer action for an
  amendment that inherits the announcement it amends, rather than teaching the reader to recognise
  amendment prose. No code here guesses at it.
- **The other half of the originating item is already discharged on `main`.** Re-verified before
  this work: a refusal now prints the contended path, the holding line and the holding run, and
  names which half of the gate objected. That half needed nothing.
- **A separate defect sits beside this one and is not fixed here.** The hold reader scans a line's
  whole text, so a path named only in explanatory prose becomes a lock. That is a different reader
  and a different repair; naming it here so it is not mistaken for part of this one.
