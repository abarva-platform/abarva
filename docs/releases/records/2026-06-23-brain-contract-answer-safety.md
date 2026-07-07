# 2026-06-23-brain-contract-answer-safety — Ava answer render-safety gate

## Release ID

`2026-06-23-brain-contract-answer-safety`

## Status

`candidate`

## Plain-English Summary

Adds a shared answer-safety pass before Ava answers render. The deployed product could still show duplicated consultant labels like `Read: Read:` and expose internal record syntax such as `clients[...]`, UUIDs, `client_id`, or internal record IDs inside prose, tables, and source chips. This release cleans that at the canonical renderer boundary so every surface using `AgentAnswerRenderer` benefits.

## Layer Impact

- `global-control-lane`: Updates the shared `AgentAnswerRenderer` path used by Ask Ava surfaces and the shared Ask response policy.
- `client-data-lane`: No schema, ingestion, tenant data, retrieval, embedding, or migration change.
- `internal-admin`: No admin/runtime operator change.

## Client Applicability

- All clients: Yes. The render-safety normalizer is tenant-independent and applies to every tenant using the canonical Ava answer renderer.
- Specific clients: Not tenant-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/intelligence/answer/answer-safety.ts`
- `src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/response-policy.test.ts`
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`

## QA / Validation

- `npx jest src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand` passed.
- `npx eslint src/lib/intelligence/answer/answer-safety.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts` passed.
- Deployed-app tenant matrix and reality-crawl proof are required after merge/deploy before marking Brain Contract cells green.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the shared web runtime. No migration, data-plane write, worker job, DNS change, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No manual shared runtime mutation required.
- Approved image digest: Filled by the ACA main deploy workflow.
- ACA runtime invariant: Template image, traffic revision, and active revision image must match the deployed main digest before declaring runtime proof.
- Worker image invariant: Not affected.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes. Run `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` and the reality-crawl/report path once available.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy restore the previous runtime image. No data rollback or migration rollback is needed.

## Audit Evidence

- PR: [#3886](https://github.com/abarva-platform/abarva/pull/3886)
- CI once completed.
- Focused Jest and ESLint command output listed above.
- Post-deploy tenant matrix output and reality-crawl report once deployed.

## Known Gaps

This release is a render-safety gate, not the full typed-exhibit north star. `structured-exhibits.ts` still needs the next Brain Contract slice to retire prose/Markdown table scraping and accept only intentional typed exhibits.
