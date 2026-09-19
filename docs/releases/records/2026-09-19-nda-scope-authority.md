# 2026-09-19-nda-scope-authority — stage 05 gets a scope and waiver contract, and no silent waiver

## Release ID

`2026-09-19-nda-scope-authority`

## Status

`candidate`

## Plain-English Summary

Stage 05 could describe an NDA file but had no policy behind it. Nothing said
which template version applied, which affiliate or event scope a document
covered, or when a waiver may stand in for an NDA at all.

The owner decision (recorded 2026-09-19) settles all three:

- **Legal** owns versioned NDA text and any deviation from it.
- **Procurement** owns event, supplier and affiliate scope metadata.
- Day one is a controlled upload of an executed document.
- **No silent waiver.** A waiver must be explicit, time-bound, reasoned,
  displayed separately from an executed NDA, and carry a named Legal approver
  before it can clear readiness.

This is the read-only contract implementing that. It answers one question —
is this supplier covered for this event — and it fails closed on every path
that is not an affirmative yes.

### Where it refuses, and why each refusal is its own case

| situation | result | why |
|---|---|---|
| registry slice unavailable | not covered | Unknown is not covered. An outage must close the gate, not open it. |
| template version Legal has not published | not covered | A document citing unpublished text is not authority. |
| NDA with the supplier that does not name this event | not covered | **The inference the decision exists to refuse** — having an NDA with a supplier is not having one for this engagement. |
| NDA outside its effective window | not covered | |
| affiliate entity, NDA scoped to the entity only | not covered | Affiliates are reached only when the scope level says so. |
| NDA belonging to another tenant | not covered | |
| waiver missing a reason, an approver, or an expiry | not covered | Each is a separate requirement and each is named separately in the failure. |

A waiver without an expiry is refused with a specific reason: **that is a
policy change, not a waiver.**

### Two ordering rules that matter

**An executed NDA always outranks a waiver.** Waivers are only considered when
no NDA covers the event. Otherwise a waiver could become the recorded reason a
gate cleared while a real NDA existed, which understates the position on the
record.

**All waiver defects are reported together.** Naming one missing field at a
time turns a single fix into four round trips.

### What this deliberately is not

It generates no NDA text, dispatches nothing to a supplier, records no
signature, and writes nothing. Those are separate items, and two of them
(production e-signature, supplier delivery channel) are gated on decisions this
does not make. `asOf` is passed in rather than read from the clock, so a
coverage decision is reproducible.

## Layer Impact

Release lane: `global-control-lane`.

- **Products · Source, stage 05** — a new read-only decision module. Nothing
  mounts it yet, so no surface behaviour changes in this release.
- **No schema, no migration, no tenant write, no external call.**

## Client Applicability

- All clients: no behaviour change today — the contract exists and is not yet
  wired to a surface
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `src/lib/source/nda/nda-scope-authority.ts` | new — the coverage contract |
| `src/__tests__/behaviors/nda-scope-authority.test.ts` | new — 18 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `nda-scope-authority.test.ts` | **pass** — 18/18 |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

Nine mutations, each removing one refusal. **All nine caught.**

| mutation | observed |
|---|---|
| a registry outage opens the gate | 1 of 18 red |
| an unpublished template version is accepted | 1 of 18 red |
| an NDA with the supplier covers any event | 1 of 18 red |
| expiry stops being checked | 1 of 18 red |
| affiliates reached at every scope level | 1 of 18 red |
| a waiver with no reason is usable — **the silent waiver** | 2 of 18 red |
| a waiver with no named Legal approver is usable | 2 of 18 red |
| a waiver outranks an executed NDA | 3 of 18 red |
| opposite-tenant NDAs read as cover | 1 of 18 red |

Each mutation is a way the module could quietly say "covered", which is a way
a supplier receives material they have not contracted to protect. That is why
each has its own case rather than being folded into one happy-path assertion.

## Rollout Plan

Squash merge to `main`. No surface consumes it yet, so nothing changes for a
user on merge. No image build beyond the normal deploy, no migration, no flag.

## Deployment Authority

Ordinary application code through the repo-owned deploy path; it mutates no
runtime configuration.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: whatever the main deploy produces for the merge SHA
- ACA runtime invariant: unchanged by this release
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **not yet applicable** — nothing renders this.
  It becomes required when a surface consumes it.

## Rollback Plan

Revert the commit. Nothing consumes the module, so removal affects no surface.

## Audit Evidence

- The contract: `src/lib/source/nda/nda-scope-authority.ts`
- Its behaviour: `src/__tests__/behaviors/nda-scope-authority.test.ts`
- The decision it implements: the D-014 acceptance in the execution backlog
- PR URL and CI run: recorded on the PR

## Known Gaps

- **Nothing mounts it.** Stage 05 readiness does not yet consult this contract,
  so the policy is expressed and not yet enforced on any screen. Wiring it is
  the next item and is where signed-in proof becomes owed.
- **No storage contract.** Where an executed document and its certificate live,
  and under what retention, is a separate item and is not answered here.
- **Template publication is an input, not a source.** The contract is handed
  the list of versions Legal published; nothing here verifies that list came
  from Legal.
- **Affiliate relationships are an input too.** The contract trusts
  `coveredAffiliateEntityIds` on the record rather than deriving the corporate
  tree, so a wrong affiliate list produces a wrong answer confidently.
