# 2026-06-05-intelligence-surface-evidence-discipline — Intelligence Surface Evidence Discipline

## Release ID

`2026-06-05-intelligence-surface-evidence-discipline`

## Status

`candidate`

## Plain-English Summary

Intelligence answers now give stronger priority to authenticated product-surface facts and loaded tenant context when synthesizing CXO answers. If the live surface says a Lakeshore proof uses Azure AI Search, has a Kyriba Source artifact spine, or has specific Move/Tower evidence, Sentinel is instructed to use those facts directly before falling back to general doctrine. The Ask API also reports an explicit `ask_synthesis_empty` stream error if a request returns classification but no answer text.

## Layer Impact

- `global-control-lane`: Shared Intelligence answer synthesis behavior changes for all tenants using `/api/intelligence/ask`.
- `client-data-lane`: Lakeshore live QA context and scoring are hardened to make tenant-scoped proof stricter and more diagnosable.

## Client Applicability

- All clients: Intelligence synthesis gives explicit priority to authenticated surface facts, tenant facts, and graph facts.
- Specific clients: Lakeshore live QA now checks the observed Kyriba, AMS, Azure AI Search, Source, and Tower proof gaps more strictly.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`: adds a mandatory surface-evidence block to the synthesis prompt.
- `src/app/api/intelligence/ask/route.ts`: emits `ask_synthesis_empty` when the stream produces no assistant text.
- `scripts/lakeshore/intelligence-live-answer-qa.mjs`: strengthens Lakeshore proof context and treats missing answer events as stream failures.
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`: adds regression coverage for mandatory surface evidence and empty-stream error behavior.

## QA / Validation

- `pass`: Focused Jest guardrail tests: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/agent/output-discipline/prompt-contract.test.ts --runInBand`.
- `pass`: `git diff --check`.
- `pass`: `npm run release:check -- --base origin/main --head HEAD`.
- `not-run`: Post-deploy validation will re-run the Lakeshore live Intelligence proof against `https://app.abarva.ai` after merge/deploy.

## Rollout Plan

Merge to `main`, let Vercel production deploy, then re-run the Lakeshore authenticated live Intelligence proof. No migration or manual data operation is required.

## Rollback Plan

Revert the PR to restore the prior synthesis prompt and route behavior. No database rollback is required.

## Audit Evidence

- PR URL and CI checks for this release candidate.
- Follow-up Lakeshore live Intelligence proof report after deployment.
- Prior evidence baseline: `reports/2026-06-05-lakeshore-live-intelligence-proof/lakeshore-live-intelligence-proof-2026-06-05T16-56-39-672Z-05d640648/summary.json`.

## Known Gaps

This does not expand the Lakeshore corpus. It tightens runtime use of already supplied tenant and surface facts.
