# 2026-10-02 — Design Options Use the Right Pattern and the Approved Discovery Findings

## Release ID

`2026-10-02-design-options-use-the-right-pattern-and-prior-findings`

## Status

`candidate`

## Plain-English Summary

In the design phase of a Move, the product shows a set of solution options to compare. When the client has not supplied its own options, the set comes from a built-in pattern chosen for the kind of use case, and it is meant to be informed by the findings approved at the end of discovery.

Two things were wrong.

First, the pattern was chosen by looking for words in the Move's text, one pattern at a time in a fixed order, and it treated a word as present if those letters appeared anywhere — inside another word included. The first pattern with any hit won. One incidental word was enough to give a contact-centre Move the generic operations options, even though the Move's own declared type said what it was and its text was full of contact-centre terms. The pattern now comes from the Move's declared type when that type determines it. Otherwise words are matched as whole words and the pattern with the most distinct terms present wins.

Second, the comparison always said the discovery evidence was unavailable. An approved discovery document is stored as Markdown. The code that reads findings out of it only understood HTML, found no headings or tables, and returned nothing. It now reads Markdown headings and tables as well, so approved discovery findings and limits reach the comparison.

The source line on the comparison also now shows the discovery document's title rather than its internal key.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves design-phase behavior for every client; not behind a feature flag.

- **Product layer — Moves design options:** Which built-in option set is shown, and whether approved prior-phase findings inform it. Options supplied by the client are untouched and still take precedence. Scoring rules are unchanged; with prior findings now present, unresolved limits recorded in discovery lower confidence as the existing rules intend.
- **Product layer — carry-forward content:** The same reader serves the "carries forward" content shown between phases; it now also returns content for accepted Markdown deliverables.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-templates/p3-option-assembler.ts`: pattern from the declared Move type where it determines one; whole-word, most-terms-wins inference otherwise; a title lookup for the discovery source.
- `src/lib/deliverables/exhibit-content-extractor.ts`: Markdown heading and table locators alongside the HTML ones.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: source line shows the document title.
- Tests for each.

## QA / Validation

- Targeted Jest: pass — `37 suites, 389 tests` across the option assembler, the deliverables library, and the phase page component; 11 new.
- Mutation checks, each failing the suite: first-hit order restored (1); substring matching restored (1); declared type ignored (1); Markdown headings not read (3); Markdown tables not read (1).
- Existing pattern tests for the other use cases pass unchanged.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic contact-centre workflow with discovery approved, the design comparison showed the generic operations options and stated that discovery evidence was unavailable.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, reload the design phase of the synthetic workflow and confirm the contact-centre option set is shown and the source line names the approved discovery document.

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
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Only one declared Move type is mapped to a pattern. Other types still rely on word inference.
- The findings reader looks for a fixed list of heading keywords. A discovery document whose headings use other words yields fewer findings; it does not yield wrong ones.
- Options a person types into the design-phase input as prose are not parsed into the comparison. Only an uploaded option table is treated as the client's own option set.
- The built-in option sets are fixed per pattern and their descriptive text is not specific to the Move.
