# 2026-09-19-nda-readiness-consumes-authority — stage 05 readiness now asks whether anything actually covers the event

## Release ID

`2026-09-19-nda-readiness-consumes-authority`

## Status

`candidate`

## Plain-English Summary

Stage 05 readiness checked the NDA *document*: a current artifact is filed, it
names a supplier legal entity and a scope, it has a hash, a review state, and a
validity window covering today. All good checks, and all properties of the file.

They cannot establish the two things the stage 05 owner decision added, because
neither is a property of the file:

- whether **Legal published** the template version the document cites, and
- whether a **waiver** standing in for an NDA meets all four of its
  requirements — explicit, time-bound, reasoned, and carrying a named Legal
  approver.

Readiness now consults the coverage contract for both.

### The case that makes this worth doing

An artifact can pass **every** file-level check and still not cover the
engagement. Before this change that artifact read as **ready**; it now reads as
**blocked**, with the reason stated:

```
No executed NDA covers this event and no waiver has been granted.
```

That is the inference the decision exists to refuse — having an NDA with a
supplier is not having one for this event — and it was previously invisible at
the readiness layer.

### The other two consequences

**A registry outage reads as blocked, not clear.** The contract returns
`not_covered` with *"unknown is not covered"*, and readiness shows that reason
rather than collapsing it into a generic failure. An outage must not open a
gate.

**A waiver is displayed as a waiver.** When a waiver is what cleared coverage,
the result carries the waiver id, the named Legal approver, the expiry and the
reason, and the complete-item line reads *"Covered by WAIVER …, not by an
NDA"*. A result that only said "ready" would satisfy the gate and defeat the
policy. An executed NDA always outranks a waiver, so a waiver never appears
when a real NDA covered it.

## Layer Impact

Release lane: `global-control-lane`.

- **Products · Source, stage 05** — `buildSourceNewNdaReadiness` gains an
  optional coverage input and two new result behaviours. Its existing
  file-level checks are unchanged.
- No schema, no migration, no tenant write, no external call.

## Client Applicability

- All clients: **not yet in effect.** The coverage parameter is optional and
  the one caller does not supply it, so no tenant sees a behaviour change on
  merge.
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none — the absence of the input is what gates it, which is
  stated as a gap below rather than presented as a design

## Changes Included

| file | change |
|---|---|
| `src/lib/source/new-workspace/nda-readiness.ts` | consults `evaluateNdaCoverage` when given a coverage input; surfaces a waiver distinctly |
| `src/__tests__/behaviors/nda-readiness-consumes-authority.test.ts` | new — 7 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `nda-readiness-consumes-authority.test.ts` | **pass** — 7/7 |
| `step-readiness.test.ts` (the pre-existing suite) | **pass** — 5/5, unchanged |
| `npx jest src/__tests__/behaviors` | **pass** — 45 suites / 455 tests |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| coverage never consulted — back to file checks only | caught | 5 of 12 red |
| a `not_covered` verdict stops blocking | caught | 3 of 12 red |
| a waiver is no longer surfaced as a waiver | caught | 1 of 12 red |
| the waiver line stops saying it is a waiver | caught | 1 of 12 red |

The last is the one that would be easiest to lose in a wording change and
hardest to notice: the waiver still present, still clearing the gate, and no
longer distinguishable on screen from an executed NDA.

## Rollout Plan

Squash merge to `main`. Behaviour reaches a user only once the caller supplies
the coverage input, which is a separate change. No image build beyond the
normal deploy, no migration, no flag.

## Deployment Authority

Ordinary application code through the repo-owned deploy path.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: whatever the main deploy produces for the merge SHA
- ACA runtime invariant: unchanged by this release
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **not yet, and owed as soon as the caller
  passes coverage.** Nothing a user sees changes on merge.

## Rollback Plan

Revert the commit. Readiness returns to file-level checks only. No caller
passes the new input, so nothing else is affected.

## Audit Evidence

- The mount: `src/lib/source/new-workspace/nda-readiness.ts`
- The contract it consults: `src/lib/source/nda/nda-scope-authority.ts`
- Behaviour: `src/__tests__/behaviors/nda-readiness-consumes-authority.test.ts`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **The coverage input is optional, and the caller does not pass it.** That is
  what let this land without a caller rewrite, and it means the policy is
  expressed and still not enforced on any screen. **The stage is no closer to
  proven than before this merge** — the next change is the one that matters,
  and it is where signed-in acceptance becomes owed.
- **Where the inputs come from is unanswered.** Published template versions and
  affiliate entity ids are handed in; nothing derives them. A wrong affiliate
  list still produces a confident wrong answer.
- **The artifact type test is still a substring match** (`artifactType`
  containing `nda`). Untouched here, and it means an unrelated artifact type
  containing those three letters would be treated as an NDA document.
