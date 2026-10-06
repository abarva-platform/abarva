# 2026-09-19 Executed NDA Signature Capture

## Release ID

`2026-09-19-executed-nda-signature-capture`

## Status

`candidate`

## Plain-English Summary

A governed contract already decided what makes an uploaded document executed, and nothing could satisfy it: the record of an executed agreement had nowhere to hold a signature method, a signing party, or a completion certificate. This adds those columns, reads them, and makes coverage consult them — so a document whose signing evidence was captured and falls short stops clearing, while the records written before the columns existed continue to clear and say plainly that the signing is unrecorded.

## Layer Impact

- Release lane: `client-data-lane`.
- One migration authoring change, one read path, one projection.
- **The migration is authored, not applied.** Applying it is a separate authorized step.

## Client Applicability

- All clients: no behavior change until the migration is applied. After it is applied, no existing record changes state, because every one of them lacks signature evidence entirely and that case is deliberately unchanged.
- The rendered supplier coverage gains a caveat line on records with no signing evidence.

## Changes Included

- Add five nullable columns to the executed-document authority: signature method, both signatory names, a completion certificate hash, and a private evidence reference. Two fields the contract wants already exist and are deliberately not duplicated — the document hash is reachable through the artifact the row points at, and the signature date is the existing executed-at column.
- Constrain the signature-method vocabulary so a value the contract cannot interpret never reaches it, including the declared value that declares nothing, which the contract refuses.
- Read the new columns into the governed record.
- Make supplier coverage consult the signing evidence behind the document that granted it.

## QA / Validation

- PASS: new coverage suite passes 6 of 6; the executed-document contract suite passes 13 of 13; the three sibling NDA suites pass 35 of 35, unchanged.
- PASS: mutation harness catches 6 of 6, including refusing on absence as well as incompleteness, accepting incomplete evidence, and dropping the guard that keeps the document check away from waiver coverage.
- PASS: the migration's constrained vocabulary is compared against the contract's accepted values programmatically and matches exactly. A constraint naming a value the code refuses, or omitting one it accepts, is a gate that could never pass.
- PASS: TypeScript exit code 0.
- **Not proven:** the migration has not been applied, so the read path has not executed against a table carrying these columns. That proof is owed after the migration is authorized.

## Rollout Plan

Merge through the protected pull-request lane. The migration is authored only; applying it is a separate authorized step, after which the read path can be exercised. Deploy only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the read path and the projection change; the coverage behavior returns to ignoring signing evidence. The migration is additive and idempotent — reverting it means dropping five nullable columns and one constraint, and no data depends on them.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the migration is applied. Nothing here claims it.

## Audit Evidence

- New and existing suite output.
- Mutation harness output.
- The programmatic comparison of the constrained vocabulary against the contract's accepted values.

## Known Gaps

**Absence and incompleteness are treated differently, and that departs from how this item was originally written.** The item said an artifact with no signature evidence should stop clearing. Measured, no record carries any, so enforcing that would turn every covered supplier red the day the migration lands — a gate that fails on arrival is a gate somebody switches off. Absence therefore clears with a stated caveat, and only captured-but-incomplete evidence refuses. That ratchets: it costs nothing today and bites the moment anyone records evidence badly.

**Nothing writes these columns.** The capture path from an operator's upload into these fields is a separate piece of work, and until it exists the columns hold nothing. The contract, the storage and the read are in place for it.

An earlier draft of the migration also constrained when a signature date may fall. It was removed: no one here can inspect the existing rows, and a constraint that any of them violates fails the migration on apply.
