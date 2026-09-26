# 2026-09-26-governed-artifact-controls — Move scope, evidence admission, and the gates above composition

## Release ID

`2026-09-26-governed-artifact-controls`

## Status

`candidate`

## Plain-English Summary

Controls that decide **what evidence an artifact is allowed to be built from**, and **which
artifact the evidence can support** — both of which previously had no answer.

A discovery assessment for one contact-centre capability was generated from 159 governed
evidence items. Nineteen came from that Move's own intake. Two were the enterprise anchor.
The rest included enterprise IT budget lines for the EHR and ERP, risks belonging to other
use cases, and the economics of seven unrelated AI programmes — and a slide comparing the
capability to Microsoft 365 Copilot reached a pack addressed to the VP of Member Services.
Separately, a target-state architecture was requested for a Move whose own record says it
has not cleared discovery, and nothing refused it.

This release adds, as code with tests: a declared Move scope; an admission engine that
admits evidence only on a legal path from that scope; coverage and containment gates;
artifact eligibility resolved from governed state rather than from the request; claim
boundaries as a typed contract; and a check that required governance markers survive to the
rendered file.

**It gates nothing yet.** Everything runs in shadow and reports.

## Layer Impact

**Release lane: experimental**

Layer 4 (products) only. New pure modules under `src/lib/deliverables/governance/`, reached
by an operator shadow-report script and their own tests. No product route, job, migration or
runtime path calls them. One wording change to the P2 slide-contract purpose.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes — operator shadow reporting only**
- Public/demo only: no
- Feature flag: none, because nothing routes to it

## Changes Included

- `src/lib/deliverables/governance/move-scope.ts` — `MoveScope`, `ScopeAmendment`,
  `EvidenceAdmissionPolicy`, `EvidenceAdmissionDecision`, and the admission engine
- `src/lib/deliverables/governance/evidence-gates.ts` — coverage, containment, shadow report
- `src/lib/deliverables/governance/artifact-eligibility.ts` — eligibility from governed state
- `src/lib/deliverables/governance/claim-constraints.ts` — typed claim boundaries and the
  prose fallback
- `src/lib/deliverables/governance/governance-chrome.ts` — required markers on the rendered file
- `scripts/deliverables/proof/shadow-admission.ts` — runs all of it in shadow over a real
  generated artifact
- `src/lib/deliverables/slide-contract.ts` — P2 reframed
- `docs/design/deliverables/GOVERNED_ARTIFACT_CONTROLS_INCREMENT.md` — the contract

No migrations. No routes. No jobs.

## QA / Validation

**Status: pass.**

| Check | Result |
|---|---|
| `npx jest src/lib/deliverables` | **pass** — 1,094 tests, 99 suites |
| Governance suites specifically | **pass** — 43 tests, 4 suites |
| Five planted policy cases | **pass** — each fails its own gate |
| Orphan audit | **pass** — no change against baseline |
| ESLint | **pass** |
| `release:check` locally | **pass** |
| Shadow run over a real artifact | **executed** — reported below |

The five planted cases, which must fail before the policy may gate anything:

```
drop one Move-uploaded item       → coverage FAIL
remove a required family          → coverage FAIL
remove a decision-critical item   → coverage FAIL
add an off-scope family           → containment FAIL
place benchmark in the core story → containment FAIL
```

Eligibility is asserted in **both** directions: every P3 blocked for the real Move state, and
every P3 allowed once each condition clears. A resolver that only ever blocks passes an
"is it blocking?" test and is useless.

**Shadow result over the real generated artifact** — 159 available, 54 admitted, 105 would
exclude, 48 cited by the artifact, **23 of those inadmissible**. Eligibility blocked all
three P3 artifacts and allowed both P2 artifacts. The chrome gate failed on two markers,
independently reproducing a finding that a human review had caught and no deterministic gate
had.

## Rollout Plan

No runtime rollout. Merges as code, tests and documentation with no reachability from any
product surface. Shadow reporting precedes enforcement by design, per the graph adoption
rule: report, compare against the current read path, adopt only when the comparison holds.

## Deployment Authority

Not applicable. Cannot affect Container Apps, deploy workflows, runtime images, flags,
environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none required
- Live signed-in proof required: no — no client-visible surface changes

## Rollback Plan

Revert the merge commit. Nothing depends on it, no data is written, no migration applied.

## Audit Evidence

- The increment contract and the shadow output committed alongside it
- Per-candidate `EvidenceAdmissionDecision` records carrying the basis, the depth and the
  traversal path, so "why was this evidence even considered?" has an answer
- The planted-case suites, each asserting one gate fails on its own

## Known Gaps

- **Nothing is enforced.** By design; shadow first.
- **Scope is transcribed, not declared.** The shadow script reconstructs the Move's scope
  from records that name it. Production requires it declared at Move creation from intake,
  with amendments carrying actor, reason, timestamp and diff. Until that exists, the control
  can be defeated by editing a list.
- **Admission runs on a derived edge set**, not on the governed graph substrate. The shape is
  identical and the source is not.
- **Claim boundaries are normalised from prose**, so no constraint can resolve to permitted —
  correct, because the prose never declares what would clear it, and uncomfortable on purpose.
- **The chrome gate is not wired to any renderer.** It reports; it does not yet refuse.
