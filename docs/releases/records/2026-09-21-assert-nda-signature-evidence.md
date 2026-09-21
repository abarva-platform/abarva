# 2026-09-21-assert-nda-signature-evidence — widened by asserting, not by ignoring

## Release ID

`2026-09-21-assert-nda-signature-evidence`

## Status

`candidate`

## Plain-English Summary

The NDA authority repository grew a `signatureEvidence` object and one
exhaustive expectation was not widened with it, so a governed suite on the NDA
stage ran 3 of 4.

| | before | after |
|---|---|---|
| `nda-authority-repository` suite | 3 of 4 | **4 of 4** |
| Signature-evidence fields asserted | 0 of 7 | **7 of 7** |
| Production change | — | **none** |

## Widened by asserting, and the fixture had to change first

Six of the seven fields came back `undefined`, because the fixture row did not
carry those columns. **Asserting `undefined` would have been worthless**: it
passes whether or not the repository reads the column at all, so it would have
made the suite green while pinning nothing about the mapping it exists for.

The fixture now carries real, distinct values — a document hash, a signature
method, two signatory names, a certificate hash and a private evidence
reference — and the expectation asserts each one. `signedAt` is asserted
against `effective_from`, because there is no separate `signed_at` column and
the repository says so in its own comment.

## `toEqual` was kept, deliberately

The case is named *reads only one tenant, event, and declared supplier entity*,
and its exhaustiveness is how it proves nothing extra leaked into the row.
Switching to `toMatchObject` would have turned it green in one line while
deleting the fencing property the case exists for — a gate satisfied by
weakening the gate.

That this still holds is measured, not asserted: adding one extra field to the
repository's returned object fails the case.

## Layer Impact

- `global-control-lane`. One test file. No product surface, tenant data,
  schema, projection, migration, flag, code path, or runtime behaviour.
  `nda-authority-repository.ts` is byte-identical to `origin/main`.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/source/nda/__tests__/nda-authority-repository.test.ts` — fixture
  columns added, expectation widened.

## QA / Validation

| What | Result |
|---|---|
| The suite | 3 of 4 → **4 of 4** |
| The NDA module | 1 suite, **4 passed** |
| `nda-authority-repository.ts` vs `origin/main` | **byte-identical** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

### Mutation results

| Mutation | Result |
|---|---|
| `certificateSha256` mapped to the wrong column | **1 case fails** |
| an extra field added to the returned object | **1 case fails** |

The first proves the new assertions are real rather than `undefined`
placeholders. The second proves exhaustiveness survived — it is the mutation
`toMatchObject` would have let through.

## Rollout Plan

Merge to `main`. A test-only change on a suite already reached by CI. No image
build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The suite returns to 3 of 4 and the signature-evidence mapping
returns to being unasserted.

## Audit Evidence

- The received-versus-expected diff showing the seven-field group.
- Both mutation results.
- `git diff` showing the repository unchanged.

## Known Gaps

- **The fixture values are invented, not drawn from a real NDA.** They are
  distinct and internally consistent, which is what the mapping assertion
  needs, but they are not evidence that any real row looks like this.
- **This asserts the mapping, not the authority.** That a signature method or
  certificate hash is *correct* for a given executed NDA is a different
  question, and no case here reaches it.
