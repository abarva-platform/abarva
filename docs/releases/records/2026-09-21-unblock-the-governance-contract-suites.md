# 2026-09-21-unblock-the-governance-contract-suites

## Release ID

`2026-09-21-unblock-the-governance-contract-suites`

## Status

`candidate`

## Plain-English Summary

The context-and-corpus governance contract suites were failing twelve cases,
in a directory no workflow runs. Every failure traced to one stale fixture
value, and the cases were reporting it instead of testing the rules they name.

| | before | after |
|---|---|---|
| `src/lib/governance` suites | 61 of 73 | **73 of 73** |
| Production change | — | **none** |

## Not a governance regression

The live gate is intact and was checked first: `validate:context-corpus` runs
on every pull request through `context-corpus-governance.yml`, and it passes
on real data — agent-readiness, duplicates and manifests all green.

What was broken is the **unit-test contract for the policy logic**, which runs
in no workflow and had therefore been failing unnoticed.

## One stale value, twelve symptoms

The fixtures used a `client_key` the schema no longer admits. Validation
rejected that field **before** reaching the rule under test, so a case named
*requires pii_phi_handling for sensitive classifications* was in fact
reporting:

```
client_key: Invalid option: expected one of "corpus_global"|"meridian-health"|"skyharbor-air"
```

Three files carried it, including six positional arguments that an earlier
pass over the named properties missed — leaving a bundle declaring one tenant
while its adapter was told another. That inconsistency was introduced and then
caught in the same change; it is recorded because a half-applied fixture edit
is worse than the original stale one.

## The controls are now proven, which they were not before

A fixture fix that quietly hides a broken control would be worse than the red
it replaced, so both fences were mutated:

| Mutation | Result |
|---|---|
| the `pii_phi_handling` requirement disabled | **1 case fails** |
| the restricted-downstream-context fence disabled | **1 case fails** |

Before this change neither mutation could have been caught: the cases failed
on the fixture, whatever the rules did.

## Recorded, not normalised away

The schema admits the shared-corpus key and two tenant keys, which is
**narrower than the tenant registry**. The exact set is in the validation
error quoted above, and in `dataset-manifest.ts`. Using an admitted key makes these cases
test what they claim; it does not settle whether the schema should admit the
rest. That question is noted in the fixture comment and left open.

## Layer Impact

- `global-control-lane`. Three test files. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/governance/__tests__/dataset-manifest.test.ts`
- `src/lib/governance/__tests__/context-corpus-policy.test.ts`
- `src/lib/governance/__tests__/agent-context-bundle.test.ts`

## QA / Validation

| What | Result |
|---|---|
| `src/lib/governance` suites | 61 of 73 → **73 of 73** |
| `npm run validate:context-corpus` | **exit 0**, gate passed |
| Governance source files | **unchanged** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. Test-only. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. Twelve cases return to failing on a fixture field rather than
testing the governance rules they name.

## Audit Evidence

- The validator run, showing the live gate green throughout.
- The rejected-field message that every one of the twelve was really reporting.
- Both mutation results.

## Known Gaps

- **The directory is still dark** and is deliberately not wired here: the
  workflow file is being edited by another lane during a smoke run, and a
  second edit to it now would conflict. Wiring it is the obvious follow-on.
- **The schema admits fewer tenants than the registry holds**, which is left
  open rather than resolved.
- **Green means the rules now run, not that they are the right rules.** No
  judgement was made here about whether the policy itself is correct.
