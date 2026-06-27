# 2026-06-26 Tower Semantic Question Bank

## Release ID

`2026-06-26-tower-semantic-question-bank`

## Status

`candidate`

## Plain-English Summary

Adds the first Tower semantic question-bank execution artifact. The bank is designed to prove the Tower semantic mart and chat contract with thousands of question variations, including far more than one hundred metric-specific questions. The current generated bank is 6,330 questions total, including 3,840 metric-specific prompts. This is the evaluation foundation for preventing dashboard/chat contradictions before more runtime rewiring.

## Layer Impact

- `global-control-lane`: Adds shared Tower QA/evaluation code and documentation for all clients.
- `validation_qa`: Adds a generated Tower question bank with route, artifact, read-model, metric, entity, guardrail, and latency expectations.
- `data_evidence_knowledge_fabric`: Documents how Tower questions bind to the semantic mart/read-model contract, but does not migrate or load data.

## Client Applicability

- All clients: Applies to every tenant using Tower.
- Specific clients: None.
- Internal only: QA/reporting artifact until wired into live answer scoring.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/tower/tower-question-bank.ts`
- `src/lib/tower/__tests__/tower-question-bank.test.ts`
- `scripts/qa/tower-question-bank-export.ts`
- `docs/architecture/TOWER_SEMANTIC_MART_END_TO_END_DESIGN.md`
- `docs/architecture/TOWER_SEMANTIC_MART_END_TO_END_DESIGN.html`

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/tower-question-bank.test.ts --runInBand` (`6 passed`).
- Pass: `npx eslint src/lib/tower/tower-question-bank.ts src/lib/tower/__tests__/tower-question-bank.test.ts scripts/qa/tower-question-bank-export.ts`.
- Pass: `npx tsx scripts/qa/tower-question-bank-export.ts`.
- Exported HTML/JSON report under `out/tower-question-bank/` and `/Users/anand/Downloads/`.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to main through PR. This is not a runtime change and does not require an ACA deploy by itself. The next runtime phase wires the deterministic factual Tower answer layer and uses this bank as a live scoring input.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable for this non-runtime artifact.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this artifact; required once the bank is wired to live Tower chat scoring.

## Rollback Plan

Revert the PR that adds the question-bank generator, tests, export script, and architecture doc.

## Audit Evidence

- Targeted Jest output.
- ESLint output.
- Exported question-bank HTML and JSON:
  - `/Users/anand/Downloads/tower-question-bank-report.html`
  - `/Users/anand/Downloads/tower-question-bank.json`
  - `/Users/anand/Downloads/tower-question-bank-summary.json`
- TypeScript output.
- Release check output.

## Known Gaps

This release creates the evaluation bank and expected contract. It does not yet execute the questions against the live Tower endpoint and does not yet rewire the Tower chat fast path.
