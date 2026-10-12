# 2026-10-12-tower-source-story-coverage — Explain source context in Tower

## Release ID

`2026-10-12-tower-source-story-coverage`

## Status

`candidate`

## Plain-English Summary

Tower now explains which work areas are linked to loaded programs and which programs still need a link. It shows an AI case's expected kind of benefit as a source description of the plan. Usage counts no longer appear as adoption rates, and incomplete estimates and benefit totals stay visibly incomplete. These descriptions remain separate from approved funding, measured outcomes, and Finance-cleared value.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1–3: no source, adapter, canonical object, metric, relationship, or approval change.
- Layer 4: shared Tower presentation reads existing source-linked work areas and expected benefit kinds. It does not infer a primary funding domain or calculate money from the new categories.

## Client Applicability

- All clients: the shared Tower interface changes wherever governed rows are already served.
- Specific clients: none activated or loaded by this release.
- Internal only: none.
- Public/demo only: no separate public route.
- Feature flag: none.

## Changes Included

- Replace the program funding-domain grouping with a count of programs linked to each declared affected work area. Show programs without a link and state how programs linked to multiple areas are counted.
- Use "loaded program rows" where the interface previously said "reviewed program rows" without a review record.
- Show the source's expected benefit kind in the AI case table and distribution. Keep any separately classified value type visible and leave funding, yearly estimates, measured results, and Finance clearance under their own labels.
- Show the source's expected benefit kind separately from its spend category in the full AI portfolio table. Identify Tower's funding display group as a grouping from intake labels, separate from recorded category and Finance approval.
- In the adoption lens, Tools table, and Tower question suggestions, show and compare a percentage only when the source-backed adoption percentage is explicitly loaded; a usage count or a count labeled "Adoption" cannot become a 100% adoption claim. Label generic tool usage with its recorded metric rather than calling every count users.
- In the vendor chart, include only metrics explicitly named as active users. Explain that counts added across tools are not unique people and that rollout denominators cover usage-linked tool rows only.
- Withhold the Finance-case comparison and foundation benefit total when their inputs are missing. Draw zero claim coverage with an empty bar and describe missing budget split fields as missing.
- Require an explicit source-backed loaded amount before calling Finance-validated or reporting-cleared dollars verified in Tower cards, case rows, or assistant context. Counts and source status remain visible without turning absent amounts into zero-dollar claims.
- Keep source codes and source references in existing detail and proof paths; no intake or serving data is rewritten.

## QA / Validation

- PASS after rebasing onto the plain-language Tower change: 16 Tower command-center test suites, 128 tests, including missing work-area links, source expected-kind categories, count-only usage across the Adoption lens, Tools table, and suggested questions, partial financial states, absent Finance amount flags, and zero claim coverage.
- PASS: Tower test ratchet; 1,883 of 1,891 tests passed with the same six failing suites in the committed baseline and no new failure.
- PASS: TypeScript no-emit check, changed-file ESLint, and all 11 release gates.
- PASS: `git diff --check` on the rebased PR head.
- NOT RUN: signed-in Tower review; it is required after main deployment to confirm the selected assessment's rendered tabs and drawers.

## Rollout Plan

Review and merge the protected PR. The repo-owned ACA main workflow builds and deploys the merged Git SHA. Verify the web template, healthy 100% traffic revision, and required worker image digests, then walk the affected Tower tabs with a signed-in session. This candidate changes presentation only; it does not promote an assessment or reload data.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` alone may shift shared web traffic.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture only after a later merge and workflow deployment.
- ACA runtime invariant: web template, healthy 100% traffic revision, and required worker images must match that digest.
- Worker image invariant: required worker jobs match the approved web digest.
- Feature/env flag update path: none.
- Live signed-in proof required: affected Tower tabs and detail drawers after deployment and assessment selection.

## Rollback Plan

Revert the presentation commit through a protected PR and redeploy the prior approved digest through the repo-owned workflow. No source or database rollback is needed.

## Audit Evidence

The PR diff, focused tests, typecheck, lint output, release-gate output, and subsequent ACA/browser checks establish the release state. A PR or local test is not signed-in product proof.

## Known Gaps

Affected work areas do not establish primary funding domains or approved budgets. Expected benefit kind does not establish a benefit amount or an outcome. Separate source relationships, financial reconciliation, and approval gates remain necessary before those claims can be made.
