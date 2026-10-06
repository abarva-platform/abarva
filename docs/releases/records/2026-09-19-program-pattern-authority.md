# 2026-09-19-program-pattern-authority — Validate acted-upon pattern keys before Programs writes

## Release ID

`2026-09-19-program-pattern-authority`

## Status

`candidate`

## Plain-English Summary

Programs origination can persist a selected pattern key as an acted-upon match and as part of the
program decision trail. Three write paths accepted that key without first proving that it exists in
the promoted Programs pattern catalog. A model or caller could therefore create an authoritative-
looking audit row for a key that classification never produced.

This change establishes the existing promoted Programs catalog as the authority for these keys.
Optional keys remain optional. A supplied key must resolve to an `engagement_topics` row whose
promotion state is `published`, `validated`, or `active`; otherwise the write fails before an
engagement or acted-upon match is created. The separate generated Intelligence manifest is not used
as a substitute authority.

## Layer Impact

Release lane: `global-control-lane`.

- **Canonical Programs write controls:** one shared pattern-key authority resolver.
- **Agent and API writers:** the conversational commit tool, structured origination submit, and
  direct program origination mutation now use the resolver.
- **Client intake, Source adapters, product data, and schemas:** unchanged.

## Client Applicability

- All clients using Programs origination.
- No client-specific data, configuration, copy, or exception is introduced.
- Existing rows are not changed or backfilled by this release.

## Changes Included

- Resolve supplied pattern keys against promoted `engagement_topics` rows.
- Normalize accepted keys once and use that value in snapshots, match logs, module-state context,
  classification codes, and audit evidence references.
- Return a recoverable refusal when the key is not promoted or when the catalog cannot be checked.
- Add focused behavior coverage for the resolver and all three external write boundaries.

## QA / Validation

- Failing first: the new resolver module did not exist and all three writer boundaries accepted or
  advanced past an invented key.
- Focused result after repair: 3 suites / 21 tests pass.
- Mutation proof: bypassing the resolver in all three writers produces 4 focused failures; restoring
  the calls returns 21 / 21 passing.
- Broad Programs baseline: 6 suites / 7 tests fail on clean main and 6 suites / 7 tests fail after
  the change, with the same failing suite list; passing tests increase from 3,526 to 3,535 because
  this release adds two suites and nine tests.
- `npm run typecheck`, scoped ESLint, whitespace checks, and release control are required before PR.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main workflow deploys the resulting image.
No migration, data-build job, tenant-data mutation, feature flag, or manual traffic change is part of
this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutation outside that workflow: none.
- Signed-in proof: exercise one valid classified pattern and one invalid key after deployment; the
  invalid key must refuse without creating a program or match-log row.

## Rollback Plan

Revert the merge commit. No schema or existing row requires rollback.

## Audit Evidence

The PR, focused failing-first output, mutation output, final focused suite, typecheck, lint, release
control, ACA digest readback, and signed-in valid/invalid origination proof.

## Known Gaps

- Existing historical match-log rows are not audited or backfilled by this release.
- The Programs catalog and the generated Intelligence pattern manifest remain separate authorities;
  this change makes that boundary explicit but does not merge the registries.
