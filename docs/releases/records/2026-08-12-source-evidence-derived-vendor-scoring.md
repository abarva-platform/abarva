# 2026-08-12-source-evidence-derived-vendor-scoring — Evidence-derived vendor scoring

## Release ID

`2026-08-12-source-evidence-derived-vendor-scoring`

## Status

`candidate`

## Plain-English Summary

The vendor evaluation scorecard did not score vendors from their proposals. Each criterion returned a fixed number chosen by matching the vendor's identity string — for example, the service-level score returned 8.8 if the vendor identifier contained "specialist", 7.4 if it contained "scale", and 7.1 otherwise. The scorecard then displayed a citation to that vendor's service-level exhibit beside the number, implying the score had been read from the document. It had not. Sixty branches of this kind ran across the scorecard, the side-by-side comparison rows, the advance/hold recommendation, the executive tradeoffs and the BAFO improvement scenarios.

Two consequences followed. Any vendor whose identifier matched none of the known branches fell to a single default, so two comparable bidders received identical scores on every criterion regardless of what they had submitted. And the displayed citation could not support the number it sat beside, which would not survive an evaluation challenge.

Every criterion now derives its score from the evidence it cites: the extraction cards of that type, the structured exhibit behind them, and the response section map. The rationale attached to each score names the drivers that moved it, so a score can be defended line by line. Where a criterion has no parsed evidence at all, the score is withheld and its weight is spread across the criteria that do have evidence, rather than the vendor being scored zero for something we could not read. A missing exhibit the vendor was asked for still scores low; that is a vendor gap, not a reading gap.

The advance/hold recommendation, finalist posture, executive tradeoffs, comparison-row postures and BAFO headroom are now derived from the same evidence. BAFO headroom in particular is recomputed rather than asserted: the package is re-scored with every gap treated as closed, and the difference is reported as the upside.

The Source answer engine carried the same fixed conclusions in prose ("Advance Vendor A as the risk-adjusted lead..."). Those sentences are now built from the parsed vendor summaries. Its evidence-gated fallback — which runs precisely when structured scores cannot be read — no longer names a leading, cheapest, or riskiest vendor at all, because in that state there is nothing to support the claim.

**The demo ranking changes as a result, and that is the point.** On the SkyHarbor fixture the leader moves from Vendor A to Vendor C. Vendor C has the fewest unsupported claims, the fewest incomplete exhibits and the strongest service-level evidence. Vendor A's service-level score falls from 7.1 to 4.8 because its service-level exhibit is partial and caps credits at 4% of monthly fee — evidence that was always in the fixture and that the previous score ignored. The weights were not tuned to preserve the previous outcome; doing so would have reproduced the defect being removed.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source evaluation scorecard, decision view, comparison rows, and the Source answer engine's evaluation responses.
- Canonical model: No change. No schema, migration, or persisted record is touched.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes for the code path, but the vendor profiles that feed it are gated by `isAmsVendorResponseMveEvent` to SkyHarbor and Lakeshore-AMS events. Other events return no profiles and render empty states, so no client sees a changed score today.
- Specific clients: Demo tenants only, in practice.
- Internal only: No.
- Public/demo only: Effectively yes at present.
- Feature flag: None.

## Changes Included

- `src/lib/source/proposal-intelligence/evidence-scoring.ts` (new scorer)
- `src/lib/source/proposal-intelligence/mve-profile.ts`
- `src/lib/source/source-answer-engine.ts`
- `src/lib/source/proposal-intelligence/__tests__/proposal-intelligence.test.ts`
- `src/lib/source/__tests__/source-answer-engine.test.ts`

## QA / Validation

- `npx jest src/lib/source/proposal-intelligence src/lib/source/__tests__/source-answer-engine.test.ts` — 2 suites, 89 tests passed.
- Full `npx jest src/lib/source src/components/source` compared against a stashed clean-`origin/main` baseline: **no new failing suites**. One suite that failed on the baseline now passes. 17 suites remain failing identically on both, unrelated to this work.
- Assertions that pinned a specific winner were replaced with invariants, not with the new winner: the leading vendor must equal the highest weighted score, and the highest-transition-risk vendor must equal the lowest transition-readiness score. A future weight change cannot quietly install a predetermined winner.
- Printed the derived decision view and read it before shipping: ranking, per-criterion scores with confidence and citation, finalist guidance, tradeoffs, and recomputed BAFO headroom.
- `npx eslint` on all changed files — clean, no warnings.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc -p tsconfig.json --noEmit` — clean.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, migration apply, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The evaluation scorecard must show derived scores with per-criterion rationales, and the ranking must match the derived summaries.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior scorecard. No database rollback is required, because nothing is persisted. Reverting restores identity-keyed scores.

## Audit Evidence

- PR URL: pending.
- Local focused test, full-suite baseline comparison, lint, typecheck, and printed decision-view output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in evaluation-scorecard screenshot required after merge.

## Known Gaps

- The scoring bands (exhibit complete +2.0, partial +0.4, missing −2.2, and so on) are a first calibration. They are transparent and testable, but they have not been validated against a real evaluation panel and should be reviewed before any client-facing scoring use.
- The transition-readiness criterion reads the transition exhibit and transition cards. Client-SME-dependency risk, which its guidance also names, currently sits in the assumptions exhibit and is not read by that criterion. This is why the fixture's previous "highest transition risk" vendor changes. Bringing dependency evidence into the transition criterion is deliberate follow-up work, not done here.
- Score confidence is derived per criterion from exhibit completeness and card confidence. Criteria with no extraction cards report low confidence even when their exhibit is complete, which is honest but conservative.
- Scoring remains advisory and human-owned. Nothing in this change auto-approves, auto-advances, or persists a score.
