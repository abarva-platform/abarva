# 2026-09-22-source-evaluation-commercial-bafo-readiness — Source Evaluation Commercial BAFO Readiness

## Release ID

`2026-09-22-source-evaluation-commercial-bafo-readiness`

## Status

`candidate`

## Plain-English Summary

The Source Evaluation and BAFO decision-support panel now shows the governed response details an operator needs after supplier responses arrive: normalized question-level rows, named evaluator scorecard review, support-only commercial comparison, clarification drafts, and one BAFO round candidate with a clear next action. The read remains deterministic and read-only: it does not recommend a supplier, approve an award, send supplier communications, invent benchmarks, or claim realized savings.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products: extends the Source Evaluation/BAFO read model and mounted panel presentation. It reads existing governed response, pricing, scorecard, challenge, and BAFO-instruction records; it does not change canonical data, adapters, schemas, migrations, tenant rows, lifecycle approvals, supplier contact, or external-send behavior.

## Client Applicability

- All clients: Source events that render the Evaluation/BAFO decision-support panel.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/evaluation-bafo-readiness.ts`
- `src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts`
- `src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx`
- `src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx`

## QA / Validation

- Red-first proof: the focused read-model test failed before implementation because `questionResponses` was absent.
- Red-first proof: the focused rendered-panel test failed before implementation because the mounted panel did not render the normalized question-row section.
- Focused Jest after fix: `npx jest src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx --runInBand` passed, 9/9.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed by exit code.
- Scoped lint: `npx eslint src/lib/source/proposal-intelligence/evaluation-bafo-readiness.ts src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/components/source/canvas/responses/EvaluationBafoReadinessPanel.tsx src/components/source/canvas/responses/__tests__/EvaluationBafoReadinessPanel.test.tsx` passed.
- Release control: `npm run release:check` passed.
- Whitespace: `git diff --check` passed.
- Mutation proof: temporarily dropping `questionResponses` from the returned view made the focused read-model test fail on the expected section-row assertion; the code was restored.
- Mutation proof: temporarily disabling the question-row preview priority made the rendered-panel test fail because the Transition Plan row disappeared; the code was restored.

## Rollout Plan

Merge to `main`; the normal repo-owned Azure Container Apps deployment workflow will publish the product code. No migration, parser job, indexing job, data-build job, feature flag, approval action, lifecycle transition, supplier communication, or tenant-data operation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge for live product availability.
- Shared runtime mutators: None.
- Approved image digest: Pending repo-owned deploy.
- ACA runtime invariant: Pending repo-owned deploy.
- Worker image invariant: Required after deployment even though worker code is unchanged; both delivery worker images must match the approved web digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for claiming the mounted Source Evaluation/BAFO panel live.

## Rollback Plan

Revert the read-model, panel, and focused test changes. Rollback restores the previous summary-level Evaluation/BAFO panel without changing tenant data or event lifecycle state.

## Audit Evidence

- Focused Jest outputs listed above.
- Pull request and CI evidence pending.

## Known Gaps

This release does not create supplier communications, dispatch BAFO requests, accept concessions, approve awards, generate signed artifacts, mutate tenant data, or prove signed-in live acceptance. Scorecard authority is reported only when named human review records are supplied to the read model.
