# 2026-08-16-source-ava-response-portfolio-grounding — Source aVa Response and Portfolio Grounding

## Release ID

`2026-08-16-source-ava-response-portfolio-grounding`

## Status

`candidate`

## Plain-English Summary

This release tightens Source aVa grounding for two question families. Vendor-response comparison and completeness questions now use the visible event response profiles instead of falling back to broader vendor context. Source portfolio chart questions now fail closed unless governed Source portfolio grounding is present, and Source readers prefer governed Source tenant aliases declared in the tenant registry.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical enterprise model: no canonical schema or data changes. Tenant alias resolution for Source read models now honors governed Source aliases declared in the registry.
- Layer 4 — Products: Source aVa prompt grounding and Source workspace read-model resolution are hardened so generated answers stay aligned to governed Source projections.

## Client Applicability

- All clients: Source aVa response grounding and Source read-model alias resolution apply wherever Source chat is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source chat and Source analytics gates continue to apply.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/lib/source/ava/answer-mode.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/source-v4-workspace-snapshot.ts`
- Regression tests under `src/app/api/chat/agent/__tests__`, `src/lib/source/ava/__tests__`, and `src/lib/source/data-model/__tests__`.

## QA / Validation

Focused regression validation:

```bash
npm test -- --runTestsByPath src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/ava/__tests__/answer-mode.test.ts src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts --runInBand
```

Result: 5 suites passed, 78 tests passed. Jest emitted existing duplicate manual mock warnings unrelated to this change.

Additional validation required before marking released:

- ESLint on touched files.
- TypeScript compile.
- `npm run release:check`.
- Repo-owned ACA deployment.
- ACA runtime invariant proof.
- Live Source aVa hard-question rerun for response-completeness and portfolio-chart prompts.

## Rollout Plan

Merge through the protected PR path. The repo-owned ACA main deploy workflow builds and deploys the runtime image. No manual Azure mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: to be captured from the ACA deploy workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source aVa response and portfolio prompts.

## Rollback Plan

Revert the PR or deploy the previous approved ACA image digest through the repo-owned workflow. No data rollback is required because this release does not mutate tenant data.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/6434
- CI/check output: targeted Jest, ESLint, TypeScript, release check.
- Deployment evidence: ACA workflow run and runtime invariant proof.
- Live proof: Source aVa hard-question capture after deployment.

## Known Gaps

Live upload to parse to persist to readback remains a separate controlled data-plane gate. This release does not perform any production data mutation.
