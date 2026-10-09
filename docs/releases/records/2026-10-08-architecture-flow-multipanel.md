# 2026-10-08 Architecture Flow Multipanel Export

## Release ID

`2026-10-08-architecture-flow-multipanel`

## Status

`candidate`

## Plain-English Summary

Generated architecture documents now place more than twelve recorded flows on consecutive full-size panels. Every panel retains the existing card design and carries its part number. The deck checker verifies every panel and the complete set of recorded flow identities before export succeeds.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 presentation and quality enforcement only. The change reads the existing governed architecture model. It changes no client intake, adapter, canonical fact, source flow, tenant binding, or approval record.

## Client Applicability

- All clients: generated architecture documents whose explicit flow sets exceed one visual panel.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this extends the existing architecture export path.

## Changes Included

- The reviewed three-column, four-row card layout is repeated as needed. A 19-flow model produces two panels, with flows 1–12 and 13–19, rather than dropping flows or shrinking all nineteen into one image.
- The HTML preview, PPTX deck, and DOCX report receive the same recorded panels. Continuation pages stay adjacent to the first page of their exhibit and carry a visible part number.
- Complete recorded flow descriptions are retained in PPTX slide notes and image accessibility text, and in DOCX figure accessibility text, even when the card's short visual summary wraps.
- The semantic deck judge compares the complete flow-ID multiset and the digest of every exported panel. The DOCX quality gate checks the count and source digest of every architecture figure panel. The original board-story slide budget stays fixed; only panels required by explicit recorded flows add pages, within the existing overall deck cap.

## QA / Validation

- Focused architecture HTML, composition, PPTX, and DOCX suites: 87/87 passed, including 19-flow positive cases, full recorded-label retention, and missing-continuation negative cases in both Office formats.
- Full `npm run typecheck`: clean. Changed-file ESLint and `git diff --check`: clean. Existing formatting warnings on some touched files are present on the base revision; no unrelated formatting rewrite is included.
- Local synthetic 19-flow deck reopened through LibreOffice: 22 slides, with full-size flow panels on slides 19–20. Both panels were visually inspected; `renderValidatedDeck` reported physical integrity, and the semantic judge found no missing flow or exhibit panel. This is local QA, not signed-in product proof.
- Local synthetic DOCX rendered to eight pages through LibreOffice and was visually inspected. Both 19-flow panels fit on page five without clipping; the card summaries shorten long labels, while the Office accessibility text and slide notes preserve the complete descriptions. This is local QA, not signed-in product proof.
- The test census was regenerated from the current main tree. The architecture HTML golden snapshot was updated for the new continuation heading style. The Word download-route test now checks exact exhibit keys and the digest of each exported figure. All 113 deliverables suites (1,335 tests, three snapshots) and all 81 v1 API route suites (721 tests) passed locally. Full typecheck was clean and release check passed 11/11. CI, ACA digest invariant, and signed-in generated-artifact proof remain pending.

## Rollout Plan

Squash-merge the scoped PR after all format tests and release gates pass. The repository-owned ACA main deploy workflow builds and promotes the digest-pinned image. Verify template, sole 100%-traffic revision, and required worker jobs against that digest. Then run the signed-in whole-phase build and inspect the generated PPTX and DOCX before any document or phase approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through a reviewed PR and redeploy through the same ACA workflow. The prior renderer again refuses a flow set above its one-panel capacity. No data migration or source-model rewrite is involved.

## Audit Evidence

The scoped PR, test output, local 22-slide PDF inspection, release gates, and later ACA plus signed-in generated-artifact proof.

## Known Gaps

Generated artifacts are not retroactively rewritten; a whole-phase regeneration is required after deployment. Live P3 PPTX and DOCX visual QA remain open until a real generated output is available. The cards remain short summaries; complete flow descriptions are available through PPTX notes/alternative text and DOCX alternative text.
