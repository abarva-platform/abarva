# 2026-09-27-stage-beat-rule-index-extraction — The fifth stage-beat helper, shared between its two callers

## Release ID

`2026-09-27-stage-beat-rule-index-extraction`

## Status

`candidate`

## Plain-English Summary

Two of the modules that build the per-stage task and gate content on the Source canvas each carried
their own private copy of the same tiny helper: it turns the event archetype's list of value-lever
rules into a lookup keyed by lever, so that when a lever produces a number the surface can find the
rule it came from and print that rule's own words — the specific ask to press in a best-and-final
round, or the specific way the lever moves a scorecard.

Both callers tolerate a lookup miss, and that is what makes one shared copy worth having. When the
lookup fails they do not throw and they do not change a number; they quietly print a generic sentence
that names no rule. On a client surface that reads as guidance — plausible, and no longer the
archetype's. Two copies of that lookup are two places the same mistake can be made independently,
so this change moves it into the module the stage-beat builders already share.

The immediately preceding change moved four other helpers the same way and deliberately left this one
behind, because four of the six beat modules do not build this lookup at all — they read the rules
from the list or search it directly — so the population here is two, not six, and folding it in would
have widened a change whose whole value was that its scope could be checked at a glance. It was filed
as separate work rather than absorbed, and this is that work.

No behaviour changed, and the record below proves that rather than asserting it.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients, not gated by a
feature flag and not scoped to any client's data plane.

- **Layer 4 — Products (Source).** A presentation-side rule lookup used by two stage-beat builders.
  No product gained or lost a capability; the same lookup is built by one function instead of two.
- **Layer 3 — Canonical model.** Untouched. The helper reads the archetype definition the resolver
  already returned and writes nothing.

## Client Applicability

- All clients: yes — the Source canvas renders identically for every tenant, which is the point of
  the change and what the before/after comparison establishes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. There is no behaviour to gate.

## Changes Included

- `src/lib/source/facts/view/stage-beat-formatters.ts` — gains `ruleIndex`, moved verbatim.
- `src/lib/source/facts/view/bafo-fact-beats.ts` — private copy removed, shared helper imported.
- `src/lib/source/facts/view/evaluation-fact-beats.ts` — same.
- `src/lib/source/facts/__tests__/u546-stage-beat-formatter-extraction.test.ts` — extended in place
  with the cases for this helper. No second suite and no second baseline; see QA below for why.

No migration, no route, no script, no runtime configuration, no new file.

## QA / Validation

**Why this extends the existing suite instead of adding one.** That suite already builds both
affected stages on both branches of each stage's signal and compares each built view character for
character against a snapshot. Those four comparisons are exactly the "nothing changed" evidence this
helper needs, and the snapshot they read was generated on `31641238a1` — before this change *and*
before the one that created the shared module. It is therefore a stricter pre-change baseline than one
regenerated on the parent commit would have been, and a second suite would have had to rebuild the
same views against a newer, weaker snapshot.

**Nothing gained a branch in the move.** Unlike the four helpers moved previously, there were no
differing signatures to reconcile: both private copies took the same parameter type, returned the
same type, and had the same single-expression body including the `?? []` arm for an archetype that
declares no rules. The shared version is that body verbatim. The `?? []` arm is asserted directly,
because it is the one branch of this helper that no rendered view can reach — the stage view builder
returns nothing when no lever computes.

**Red first.** The extended suite copied onto clean `origin/main` at `f7e7f9302f`: **2 failed / 63
passed of 65**. Both failures are the two cases that are *about* the extracted helper, and they fail
there because it does not exist. The module is loaded inside those cases rather than at the top of the
file so that the red-first count says what changed rather than failing everything.

**Green after.** Same suite on this branch: **65 passed of 65**.

**Scope baseline, same scope, same command as CI, both sides from clean worktrees.**
`npx jest src/lib/source/facts --no-coverage --ci`:

| | suites | tests | failing |
|---|---|---|---|
| `origin/main` at `f7e7f9302f` | 26 | 474 | **0** |
| this branch | 26 | 505 | **0** |

**The trap this item's own acceptance warns about, measured rather than reasoned about.** A mutation
that reaches nothing reads exactly like a mutation that was caught. So the prescribed mutation was run
*before* the callers were rewired, while they still held their private copies: dropping a rule from the
shared helper then failed **1 case of 65** — the one that calls it directly — and all 24 per-rule
surface cases passed, because the mutation reached no rendered view. Had the rewiring been skipped or
half-done, that is the number this record would carry. After rewiring, the same mutation fails **13 of
65**.

**Deliberate breakage, caught per stage, and non-vacuous for every rule.**

| mutation to the shared helper | failing cases | stages that failed by name |
|---|---|---|
| drop the FIRST rule from the map | 13 of 65 | both, on the per-rule case and on the byte-identical baseline |
| drop the LAST rule from the map | 11 of 65 | both, on that rule's per-rule case |

The second mutation is there because the first one alone would not have distinguished a suite that
covers all six rules from one that covers only the single lever the fixture makes compute. Dropping
the last rule fails the case for *that* rule on both stages, so the per-rule cases are decisive per
rule and not only for the computed one.

**A measured limit, stated rather than left to be discovered.** The suite asserts two directions per
stage: that each rule's own text is on the surface, and that the caller's lookup-miss text is not.
The second direction is the weaker one on the best-and-final stage — its confirm-task fallback is
reachable only by a lever that computed, and its evidence-task fallback stands in for a rule field
that two of the six rules do not declare. That is why the per-rule assertion, not the fallback
assertion, is what covers every rule on every stage; both mutation rows above are consistent with it
and the suite header records the measurement.

**Static checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit `0`
with no diagnostics, judged by exit code rather than by grepping for `error TS`. `npx eslint
--max-warnings 0` over the four changed files exit `0` — warnings tolerated at zero, because the repo
lint script sets no warning ceiling and so exits `0` with warnings present.

**CI coverage, read off the workflow rather than inferred.** `.github/workflows/unit-suites.yml:255`
runs `npx jest src/lib/source/facts --no-coverage --ci` as a directory, so the extended suite is
inside the required `Unit suites` check with no wiring change.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as usual. There is
nothing to enable and no order of operations: the change is inert until the image ships, and once it
ships the rendered output is unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp update` and no ad-hoc ACR build.
- Approved image digest: assigned by the main deploy workflow on merge; recorded in Audit Evidence
  once the run completes.
- ACA runtime invariant: to be read after the deploy run — template image, 100%-traffic revision
  image and worker job images on one digest.
- Worker image invariant: unaffected; no worker code path changed.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** The change is behaviour-preserving by construction, and the
  before/after view comparison is the evidence. A signed-in session would add nothing this record
  does not already carry, and claiming one would misdescribe what was checked.

## Rollback Plan

Revert the squash commit. Four files, no migration, no data, no configuration, no flag. The two beat
modules return to their private copies and the rendered output is unchanged either way, so the
rollback carries no ordering constraint and no window.

## Audit Evidence

- The pull request and its CI run, including the `Unit suites` check.
- `src/lib/source/facts/__tests__/u546-stage-view-baseline.json` — the pre-extraction snapshot this
  change is compared against, and the commit it was generated on (`31641238a1`) is named in the suite
  header, so the comparison can be reproduced by regenerating it there.
- The red-first and green-after counts above, both over the same suite; the scope baseline table,
  both sides run from clean worktrees with the command CI runs.
- The mutation table and the before-rewiring mutation number. Each is reproducible by making the
  named single-line edit to `ruleIndex` in `stage-beat-formatters.ts` and re-running the suite.

## Known Gaps

- The two-copy population this closes was the last of its kind among the stage-beat modules. No
  further duplicated helper is known there; the remaining rule-resolution sites read the list or
  search it and build no lookup, which is a different shape and not a copy of this one.
- Deploy digest and the ACA runtime invariant are not in this record yet; they are read after the
  merge and belong to the deploy, not to the code change. This record says `candidate`, not
  `released`, until they are.
