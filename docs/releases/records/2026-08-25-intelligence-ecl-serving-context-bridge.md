# 2026-08-25-intelligence-ecl-serving-context-bridge — Intelligence ECL Serving Context Bridge

## Release ID

`2026-08-25-intelligence-ecl-serving-context-bridge`

## Status

`candidate`

## Plain-English Summary

Adds a provider-scoped Intelligence retrieval bridge so `/api/intelligence/ask` can ground
ECL preview answers in the populated `serving.*` views when the caller explicitly requests
`ecl_projection_db`. The default Intelligence path is unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Intelligence Ask can now include ECL serving-view rows as governed sources
  for ECL preview requests.
- Layer 3 Canonical / projections: No schema or data mutation. The bridge reads existing
  serving views that are populated by the governed ECL load.

## Client Applicability

- All clients: No default-path change.
- Specific clients: ECL preview requests for tenants with populated ECL serving views.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Request-scoped through `provider=ecl_projection_db` /
  `surfaceContext.substrate=ecl_projection_db`.

## Changes Included

- Adds `src/lib/intelligence/ask/retrievers/ecl-serving-context.ts`.
- Wires the retriever into `src/lib/intelligence/ask/index.ts` before synthesis.
- Raises the source cap only for explicit ECL provider requests so ECL rows are not truncated
  behind legacy context.

## QA / Validation

- `npx eslint src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retrievers/ecl-serving-context.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — passed.
- `npm run ecl:ava-consultant-eval` — passed case-contract validation for 13 ECL eval cases.
- Runtime import sanity for provider detection — passed.
- Attempted unrelated governance test path; it fails on existing `origin/main` expectations and
  was not used as release evidence for this slice.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned
image, then rerun the governed live aVa ECL consultant eval job.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by ACA main deploy after merge.
- ACA runtime invariant: Required before live proof is claimed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, via the ECL aVa consultant live eval job.

## Rollback Plan

Revert the PR or deploy the prior digest. Because the bridge is provider-scoped, rollback only
removes ECL serving-view context from ECL preview requests.

## Audit Evidence

- PR URL and merge commit.
- CI and ACA main deploy run.
- Live ECL aVa consultant eval report after deployment.

## Known Gaps

No default-provider cutover is included. This does not claim live answer quality until the
post-deploy ECL consultant eval passes or reports its remaining gaps.
