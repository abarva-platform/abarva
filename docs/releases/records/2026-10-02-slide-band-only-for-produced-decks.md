# 2026-10-02 — The Slide-Count Band Is Judged Only When a Deck Is Produced

## Release ID

`2026-10-02-slide-band-only-for-produced-decks`

## Status

`candidate`

## Plain-English Summary

A deck's slide count is checked against a band for its deliverable type — a business-case deck, for instance, is expected to run 10 to 14 slides. The check was applied to any deliverable that happened to carry slide data, including document-primary ones.

A business case is produced as a document. The generation step that writes the executive layer can still volunteer a few slides alongside the document, and nothing turns those into a deck. The slide-count check judged them anyway and blocked the business case for having three slides against a ten-slide minimum — a band the writer was never given (the instruction to write 10 to 16 slides is only issued when a deck is actually being produced) and the document never shows.

The slide-count band is now checked only when the deliverable is produced as a deck. This is the same condition under which the writer is told the band and under which slides are built up to it, so the three now agree. A document-primary deliverable is judged by its section and length bars, as before. A deck is judged exactly as before.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable quality gate for every client; not behind a feature flag.

- **Quality gate — deck length:** When the slide-count band is applied. The band values and the section/length bars are unchanged.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/quality-validator.ts`: judge the slide-count band only when a presentation format is produced.
- Tests.

## QA / Validation

- Targeted Jest: pass — deliverable orchestrator suites, `35 suites, 485 tests`, 4 new.
- Mutation check: with the guard removed, the document-primary case is blocked again and the test fails.
- The band is still enforced when a deck is produced: the test pins both too-few and within-band for a pptx build.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, after the numeric-lineage block cleared, the roadmap deliverable built and the business case was blocked for "3 slides; needs at least 10", although the business case is a document.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow and confirm the business case is no longer blocked on its slide count.

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

- A deliverable rendered as a deck only at persist time, through the decision-storytelling flag, is judged for its slide count at persist, not here; this change concerns the pre-persist quality gate, which sees the requested output formats.
- Latent slide data on a document-primary deliverable is not removed; it is simply not judged as a deck.
