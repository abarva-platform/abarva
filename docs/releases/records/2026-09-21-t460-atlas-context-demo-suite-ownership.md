# 2026-09-21-t460-atlas-context-demo-suite-ownership - Atlas v1 auth and context demo suite ownership

## Release ID

`2026-09-21-t460-atlas-context-demo-suite-ownership`

## Status

`candidate`

## Plain-English Summary

Four previously unrun test suites now run on every pull request: the three that cover the Atlas v1 tenancy boundary and execution-mode visibility, and the one that covers the deterministic context-demo route. Two of the three Atlas suites were not really testing the product at all — they read the route's own source code as text and looked for a string. Both are rewritten to call the code and check what it does. Nothing in the application changed.

## Layer Impact

- `global-control-lane`: test ownership, agent-route control coverage, coverage census, and release evidence only.
- Layer 4 Products: no application implementation changed; existing behavior receives additional pull-request regression coverage.
- No client intake, source adapter, canonical model, schema, migration, tenant data, authentication, authorization, or runtime behavior changes.

## Client Applicability

- All clients: indirect regression-protection benefit only.
- Specific clients: none.
- Internal only: pull-request CI and audit evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add the four measured files to one exact-file pull-request workflow command.
- Rewrite the Atlas tenancy-boundary suite to invoke `requireAtlasTenancy` and assert refusals, replacing source-text assertions.
- Rewrite the Atlas execution-mode suite's route cases to invoke the chat and ask handlers and read the response, replacing source-text assertions.
- Correct a stale strict-equality shape in the Atlas person-id normalization suite, which had not been told the tenancy context gained a field.
- Add a behavior contract holding exact workflow ownership, the two census rows, and the rule that an Atlas suite must not assert a control by reading a subject it could call.
- Update the earlier quarantine record for these three files, which pinned the directory as deliberately dark, to state that the quarantine ended and why.
- Refresh the generated test-to-CI coverage census.

## QA / Validation

The item named nine files. **Three were already owned on `main` before this work began** — the `src/scripts/tower/__tests__` trio was wired by the preceding round, which carried ten files while the item excluded three of them. That was re-verified and recorded before the first edit. The measured scope is therefore the remaining six.

Measured before any edit, per file:

| suite | loaded | collected | run | green | tests before | tests after | non-test importer audit |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `atlas/__tests__/auth-boundary.test.ts` | yes | yes | yes | **no** (1 of 2 failed) | 2 | 8 | `_auth.ts`: 4 (every Atlas v1 route) |
| `atlas/__tests__/auth-user-id-normalization.test.ts` | yes | yes | yes | **no** (2 of 2 failed) | 2 | 2 | `_auth.ts`: 4 |
| `atlas/__tests__/mode-visibility.test.ts` | yes | yes | yes | **no** (1 of 4 failed) | 4 | 7 | `chat/route.ts`, `ask/route.ts`: framework-owned entry points; `llm.ts`: 3 |
| `context/demo/__tests__/route.test.ts` | yes | yes | yes | yes | 24 | 24 | `route.ts`: framework-owned entry point, called by `FourModeDemoSurface.tsx` |
| `admin/context-layer/csv-upload/__tests__/route.test.ts` | yes | yes | yes | **no** (2 of 8 failed) | 8 | 8 | **not wired — see Known Gaps** |
| `admin/users/provision/__tests__/route.test.ts` | yes | yes | yes | **no** (3 of 4 failed) | 4 | 4 | **not wired — see Known Gaps** |

Baseline over the same scope: **6 files, 44 tests, 9 failing across 5 suites before.** After: the four wired files run **41 of 41 green**, plus 6 in the new ownership contract. The two not wired are unchanged at 5 failing of 12 and are named individually below; they are not quarantined by directory.

**Why two suites were rewritten rather than requoted.** Both failed only because the source they grep had been reformatted from single to double quotes while the control each named was present and correct. `_auth.ts` still refuses a mismatched tenant; both routes still set `x-atlas-mode`. Requoting the expectation would have made them green while leaving a gate that cannot fail — the defect this backlog exists to remove. The mutation table below measures that directly.

Mutation checks: 4 of 4 caught, each reverted and the control rerun.

| mutation | old text assertion | new behavioural assertion |
| --- | --- | --- |
| Delete the tenancy refusal from `_auth.ts` | would fail | **2 of 8 fail** |
| Return the raw Clerk id instead of normalizing to a UUID person id | n/a | **1 of 2 fail** |
| Delete the `x-atlas-mode` header from both routes **and leave its name in a comment** | **passes — the string is found once in each route** | **3 of 7 fail** |
| Drop one file from the new workflow command | n/a | **2 of 6 fail** (ownership and the resulting partial census row) |

The third row is the finding: the decoy mutation is the exact shape of the CI gate that went green after its control was deleted, and the rewritten suite catches it.

Boundary findings:

- The Atlas suites replace the tenancy resolver, the orchestrator and the rendered-response builder. No model client, no Postgres client and no outbound transport is reachable from them.
- The context-demo route is a deterministic read: its suite replaces tenancy, active client and the retrieval broker. It performs no write.
- One case in the mode suite still reads `llm.ts` as text, and is labelled as such in the file rather than left to look like the others. `logAtlasMode` is module-private and the only path reaching it runs eight tenant data queries first; exporting a private function so a test can see it would reshape the module to suit the test. Filed as T-462.

Census: 2,347 test files / 1,769 covered / 578 uncovered / 200 uncovered directories before. After: 2,348 test files / 1,774 covered / 574 uncovered / 198 uncovered directories, with high governed-risk directories 32 to 30. Both measured directories are fully covered, neither partial.

Local validation: 25 census-consuming behavior suites, 150 of 150 passing (one failed first — see Rollback note below — and passes after its record was updated); `tsc --noEmit` exit 0 with zero diagnostics; `eslint` exit 0 on the touched files; `census --check` exit 0.

## Rollout Plan

Merge through the protected pull-request path. The unit workflow begins enforcing the four suites on subsequent pull requests. No application, data-plane, or external-transport rollout is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: unchanged; this candidate does not request a deployment.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged and not inspected.
- Worker image invariant: unchanged and not inspected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; no product behavior changed, and none is claimed.

## Rollback Plan

Revert the workflow step, the three Atlas suite rewrites, the ownership behavior test, the quarantine-record update, the census refresh, and this release record. No schema, migration, data, transport, or runtime rollback is required.

## Audit Evidence

- Per-file red-first measurement above, taken on `origin/main` before the first edit.
- Mutation output for all four mutations, including the comment-decoy case where the old assertion passes and the new one fails.
- The generated census and local validation commands provide candidate evidence. PR and CI evidence are added by the repository pull-request flow.

## Known Gaps

- **`admin/users/provision/__tests__/route.test.ts` is deliberately not wired, and the reason is a defect, not a preference.** The suite mocks `@/lib/supabase-server`; the route stopped importing it and now calls `getAzureReadFluentClient()` and `selectAdminWriteAdapter()`. Its boundary mock therefore intercepts nothing on the path the route actually takes, which is why three of its four cases return 500. A user-provisioning route whose write boundary is not replaced must not be run in CI on that evidence. Filed as T-463.
- **`admin/context-layer/csv-upload/__tests__/route.test.ts` is deliberately not wired.** Its write boundary *is* replaced (`postgresCompat` and `objectStorage` are both mocked), so it is safe; its two failures are a stale strict-equality expectation on the inserted chunk rows, which have gained fields. It is repairable work, not a safety question. Filed as T-464.
- One mode-visibility case remains a source-text assertion, labelled in the file and filed as T-462.
- No data-plane, external-send, runtime, browser, or signed-in proof was attempted or claimed.
