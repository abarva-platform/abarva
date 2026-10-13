# Home Advisor Output Completion

## Release ID

`2026-10-13-home-advisor-output-completion`

## Status

`candidate`

## Plain-English Summary

Home's advisor now reserves output capacity for reasoning and a concise visible answer. The provider receives the answer's JSON schema instead of relying on a prose instruction alone. An incomplete response is labelled as an unavailable answer, not as proof that enterprise evidence is absent. Discovery follow-up questions retain discovery intent instead of treating a disclaimer about savings as a request for financial claims.

## Layer Impact

- Layer 4, Products: Home answer request configuration, safe failure wording and suggested questions.
- Layers 1-3: No intake, adapter, canonical object, tenant data, relationship, retrieval or projection mutation.
- Release lane: `global-control-lane`.

## Client Applicability

- All clients: Existing authenticated Home advisor path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home availability controls remain unchanged.

## Changes Included

- `src/lib/home/preview/ava-answer.ts`: Explicit adaptive thinking, medium primary effort, low repair effort, shared strict output schema and reasoning headroom.
- A single repair stays within the existing total deadline. Citation admission, tenant fencing, source version, spend denominator and concise-answer guards remain in force.
- Failure diagnostics include only lengths, stop reason and token counts, never raw generated text.
- Focused mocked response tests cover thinking-only output, repair, genuine evidence gaps and discovery follow-up intent.

## QA / Validation

- Pass: 863 Home tests across 61 suites, including 15 output-completion cases.
- Pass: Repo-owned Node 24 typecheck, focused ESLint and diff whitespace checks.
- Pass: Independent bounded review of SDK request compatibility, failure safety and preserved guards.
- Pass: All 11 repository release checks.
- Not run for this candidate: Required CI and signed-in production acceptance. These follow publication and deployment and are not established by local tests.

## Rollout Plan

Open a PR against the canonical organization repository. Squash merge only after protected checks pass. Build and deploy through `.github/workflows/aca-main-deploy.yml`. Capture independent runtime invariant and signed-in advisor proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: Only that workflow; no ad-hoc Azure build or traffic change.
- Approved image digest: Resolved from the exact merged SHA and recorded with deploy proof.
- ACA runtime invariant: Template and healthy 100% traffic revision must match the approved digest.
- Worker image invariant: All jobs derived from the repo-owned worker update script must match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Concise cited answers, proposed-target boundaries, correct spend denominator, three relevant suggestions and preserved record source.

## Rollback Plan

Revert this PR through a new PR and the same approved main deploy workflow. No migration or tenant-data rollback is required.

## Audit Evidence

Inspect the PR diff, local test output, required CI, exact-SHA ACA run, independent runtime invariant and private signed-in proof bundle. No private tenant narrative belongs in this public record.

## Known Gaps

Schema conformance is not factual entailment proof. A refusal, exhausted budget or provider outage can still prevent an answer. Existing evidence and semantic guards remain necessary. Source refresh, other-module data integration, charter approval and full visual export parity are outside this change.
