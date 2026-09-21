# 2026-09-21-source-contract-suite-ci-ownership — Source contract suites

## Release ID

`2026-09-21-source-contract-suite-ci-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now runs three previously unowned Source contract suites that
exercise imported behavior. Five other files remain individually excluded
because they are red, do not reproduce a known identity failure, only inspect
strings, or cover runtime-orphaned validators.

## Layer Impact

- `global-control-lane`: test and release-control infrastructure only.
- No client intake, adapter, canonical-model, tenant data, schema, migration,
  read-model, persistence, prompt, or product-surface behavior changes.

## Client Applicability

- All clients: the same CI ownership contract applies to shared code.
- Specific clients: none.
- Internal only: pull-request validation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add three green, imported, behavior-bearing test files to
  `.github/workflows/unit-suites.yml`.
- Add a behavior contract that pins the three owned files, the five exact
  quarantines, and the resulting partial census state.
- Refresh the committed test-coverage census.

## Suite Classification

Importer counts below are direct, non-test module imports across `src/` and
`scripts/`. Type-only imports are reported separately because they do not
execute runtime behavior. A file with separate runtime and type imports appears
in both columns.

| Suite | Assertions | Runtime importers | Type-only importers | Classification |
|---|---:|---:|---:|---|
| `contract-evidence/evidence-review.test.ts` | 3/3 pass | 1 | 0 | Owned: imported behavior includes an explicit refusal for unrelated requirements and short review rationales. |
| `contract-evidence/persistence.test.ts` | 3/3 pass | 3 | 0 | Quarantined: the subject and fixture carry tenant and event identity but no register contract identity, so the suite cannot reproduce the register/evidence split. |
| `contract-evidence/read-model.test.ts` | 1/1 pass | 3 | 2 | Quarantined: the summary accepts pre-filtered event evidence and no register contract identity, so the green result is a negative-control failure for the known split. |
| `contract-evidence/templates.test.ts` | 2/3 pass | 4 | 0 | Quarantined: red because the expected family list omits the current application-inventory requirement. |
| `contract-intelligence/cloud-adapter.test.ts` | 1/1 pass | 1 | 0 | Owned: an operator projection imports the subject and the suite checks structured evidence, unsized levers, review state, and source-document basis. |
| `contract-intelligence/education.test.ts` | 10/10 pass | 2 | 4 | Owned: product runtime paths import the subject and the suite checks blocked, partial, and ready behavior plus evidence-clause semantics. |
| `contract-intelligence/prompt.test.ts` | 1/1 pass | 0 | 0 | Quarantined: it checks that restriction strings are emitted, not that an unevidenced claim is refused; the subject is also orphaned. |
| `contract-intelligence/provenance.test.ts` | 4/4 pass | 0 | 1 | Quarantined: it does refuse unevidenced and invalid claims, but no runtime non-test importer executes the validators; the only importer consumes a type. |

## QA / Validation

- PASS: Jest discovered all 8 requested files.
- PASS: all 8 suites collected 26 assertions.
- PASS: all 8 suites ran rather than stopping at discovery.
- MEASURED: 7 suites were green with 25 passing assertions.
- EXPECTED FAIL: `templates.test.ts` was red with 1 failing assertion.
- PASS: the ownership behavior contract failed before workflow wiring and
  passed after the three-file step was added.
- PASS: removing one owned file from the workflow made the ownership behavior
  contract fail.
- PASS: focused ESLint.
- PASS: TypeScript no-emit validation.
- PASS: focused suites and the full behavior suite.
- PASS: census and release-control checks.

## Rollout Plan

Squash-merge through the protected pull-request path. CI ownership takes effect
on subsequent pull requests. There is no runtime rollout.

## Deployment Authority

- Repo-owned deploy workflow: not applicable; no runtime change.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; this is test ownership only.

## Rollback Plan

Revert the workflow step, behavior contract, census refresh, and this release
record together. No data, schema, or runtime rollback is needed.

## Audit Evidence

Inspect the eight-file discovery and execution results, the importer inventory,
the identity/refusal classification, the red-first and mutation outputs, the
refreshed census, and pull-request CI.

## Known Gaps

The five quarantined files remain unowned for the reasons in the classification
table. This change does not repair the register/evidence identity split or make
the orphaned provenance validators part of a runtime model path.
