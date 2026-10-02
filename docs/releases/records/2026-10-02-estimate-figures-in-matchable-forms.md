# 2026-10-02 — Estimate Hours and Rates Are Written in the Forms a Document Uses

## Release ID

`2026-10-02-estimate-figures-in-matchable-forms`

## Status

`candidate`

## Plain-English Summary

A deliverable's figures are traced to governed evidence by exact match. An earlier change today put the reviewed estimate's calculated figures into that evidence, and cost tables then traced correctly.

Two tables were still blocked on a deployed build. The cause was how the estimate's own text wrote two kinds of number. Hours were written without a thousands separator — "1015" — so a document's correctly reproduced "1,015 hours" matched nothing. A rate was written as "USD 150", so a document's "$150" matched nothing.

The estimate text now writes every quantity with thousands separators and US dollar amounts with the dollar sign. Nothing about the matching rule changes: a figure the estimate does not contain is still unsupported.

A blocked figure is also now named. The message that reports an unsupported table quoted only its first characters, so the figure that failed to trace had to be guessed. It now lists the figures in the blocked text that match no evidence. What is blocked is unchanged; the message says more.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — estimate rendering:** How the reviewed estimate's figures are written in the text given to the writer and held as evidence. The figures themselves, and how they are calculated, are unchanged.
- **Numeric-lineage gate:** Unchanged.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on roadmap-phase deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/estimate-model.ts`: quantities with thousands separators; US dollar amounts with the dollar sign.
- `src/lib/deliverables/orchestrator/numeric-lineage-tokens.ts` (new): the one definition of a traceable figure, used by the citation repair and by the blocker message; `untracedFigures`.
- `src/lib/deliverables/orchestrator/quality-validator.ts`: the unsupported-figure blocker names the figures with no match in evidence.
- `src/lib/deliverables/orchestrator/section-generation.ts`: uses the shared definition instead of its own copy.
- Tests: a table of hours over a thousand and dollar-sign rates traces to the estimate; an hours figure the estimate does not contain stays unsupported.

## QA / Validation

- Targeted Jest: pass — estimate model, estimate evidence, and deliverable orchestrator suites; 1 new test, 1 updated assertion.
- Mutation check: with hours written without separators again, the new test fails.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: after the earlier change, a rebuilt roadmap on a synthetic workflow was blocked on two tables instead of three; the cost-only table traced, and the two that remained carried hours.
- The exact unmatched figure could not be read from the run record, which shows only the start of each blocked table. This change addresses the two forms that the estimate text demonstrably did not carry, and makes the next blocked table name its untraced figures. A second deliverable was blocked on a table that appeared to hold only traced costs; that case is not explained yet and is what the new message is for.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation result: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The check reads text up to the next sentence end, across table rows and section boundaries. A table followed by a cited sentence is treated as one cited claim; a table with one untraceable figure is blocked as a whole.
- Currencies other than the US dollar have no symbol form the lineage check recognises.
- A writer that derives a new figure from the estimate — a difference, a percentage change — is still blocked, as intended.
