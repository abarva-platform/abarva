# 2026-07-19-intelligence-grounding-answer-mode-v1 — Intelligence Grounding and Answer Mode v1

## Release ID

`2026-07-19-intelligence-grounding-answer-mode-v1`

## Status

`candidate`

## Plain-English Summary

Intelligence now treats AI trend, AI use-case, top-bets, value/complexity, and priority-matrix questions as a first-class CXO answer mode instead of falling through to the generic answer path. The mode is prompt-first: Claude is instructed before generation to use the Client Grounding Packet first, then layer industry patterns and benchmarks, and to produce chart-ready tables when the user asks for visuals. Runtime remains responsible for validation, safety gates, and rendering, not editorial rewriting.

## Layer Impact

- `global-control-lane`: Shared Intelligence answer classification and prompt contract.
- `agent-context`: Client Grounding Packet now carries an explicit CXO specificity checklist and retains more ownership/governance detail from source rows.
- `retrieval`: AI strategy questions pull V7 ownership, systems, data, vendors, controls, function-system-data-vendor bridge, process evidence, benchmark, and infrastructure context together.
- `experience`: Explicit trend/top-N/matrix asks are more likely to render high-quality tables and Recharts artifacts because the model is prompted in the right answer mode before generation.

## Client Applicability

- All clients using `/api/intelligence/ask`.
- Primary proof tenants: FS Demo for chart/matrix rendering and Meridian/Healthcare Demo style questions for client-specific grounding.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/ask/response-policy.ts`
- `src/lib/intelligence/ask/answer-mode-registry.ts`
- `src/lib/intelligence/ask/client-grounding-packet.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/retrievers/v7-dossier.ts`
- Focused tests for answer mode classification, grounding packet content, and V7 retrieval dimension selection.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/intelligence/ask/__tests__/client-grounding-packet.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/answer-mode-registry.ts src/lib/intelligence/ask/client-grounding-packet.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retrievers/v7-dossier.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/intelligence/ask/__tests__/client-grounding-packet.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts`
- Pass: `npm run release:check`
- Pending after deploy: live signed-in FS Demo chart proof on `https://app.abarva.ai/intelligence?client=arcturus`.

## Rollout Plan

1. Open PR from `codex/intelligence-grounding-answer-mode-v1`.
2. Squash merge to `main` after checks.
3. Deploy through the repo-owned ACA main workflow.
4. Verify ACA runtime invariant and health.
5. Run live signed-in proof for an FS Demo AI investment ranking prompt and confirm client-specific answer text plus rendered chart artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous digest through the approved ACA main workflow. No data migration rollback is required.

## Audit Evidence

- PR: pending.
- Local focused tests: passed.
- Typecheck/lint/release gate: passed.
- ACA deploy proof: pending.
- Live signed-in proof: pending.

## Known Gaps

- This release improves prompt-first answer mode selection and grounding packet assembly; it does not alter the underlying tenant data quality.
- Live deployed proof is pending until the PR merges and ACA deploys the merged SHA.
- Some tenants may still have thin AI tool/program/interview coverage; in those cases aVa should name the missing evidence rather than infer it.
