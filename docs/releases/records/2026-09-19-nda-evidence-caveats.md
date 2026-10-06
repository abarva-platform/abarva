# 2026-09-19 NDA Evidence Caveats

## Release ID

`2026-09-19-nda-evidence-caveats`

## Status

`candidate`

## Plain-English Summary

The NDA coverage decision rests on two inputs it takes entirely on trust: the list of template versions Legal has published, which is whatever the caller supplies, and the list of affiliate entities an NDA covers, which is whatever the record claims. Neither is verified, so a wrong list produces a confident wrong answer. Making them derivable needs register tables that do not exist yet. Until then the decision states, beside its own answer, where its confidence exceeds its evidence — and states it only where the answer actually depended on a trusted input.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 decision and readiness projection.
- Adds a field to two result types. No schema change, no migration, no behavior change to any existing state or blocker.
- Every prior coverage and readiness outcome is unchanged; the additions are reported alongside them.

## Client Applicability

- All clients: no change to what is allowed or refused.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add `evidenceCaveats` to the coverage result, naming the unverified template register and the asserted affiliate list.
- Earn each caveat rather than attaching it everywhere. The template caveat appears when coverage was decided by an executed document, when nothing was published at all, and when a document was turned away for its version alone — but not when a refusal had some other cause, because publishing every version in existence would not change that answer. The affiliate caveat appears only when cover reached the entity through the affiliate route, not when the entity matched directly.
- Carry no caveat when a waiver cleared it, since a waiver cites neither input, and none when the registry was never read.
- Surface the caveats on the readiness output beside the posture, because a caveat a reader has to go looking for is not stated.

## QA / Validation

- PASS: new behavior suite passes 9 of 9 cases.
- PASS: existing coverage and readiness suites pass 26 of 26, unchanged.
- PASS: mutation harness catches 9 of 9 seeded defects across both files, including both directions of every conditional — attaching a caveat that was not earned and withholding one that was — and dropping the surfacing step entirely.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on all three files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. No rendered surface reads the new field yet, so merging changes nothing a user sees.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. No rendered behavior changes.

## Rollback Plan

Remove the field from both result types and the suite that covers it. No runtime, data, or schema rollback is required.

## Audit Evidence

- New and existing behavior suite output.
- Mutation harness output across both changed files.
- TypeScript and lint exit codes.

## Known Gaps

**This is half of the item and the smaller half.** Making the two inputs derivable rather than asserted — a Legal-owned template register and a corporate tree for affiliates — needs register tables that are authored but held, so that work is not attempted here and remains open. Stating a gap is not closing it. No rendered surface displays the caveats yet either; the field exists and nothing reads it.
