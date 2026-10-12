# 2026-10-12-source-writer-provenance-compatibility

## Release ID

`2026-10-12-source-writer-provenance-compatibility`

## Status

Candidate. No shared data apply or signed-in acceptance.

## Plain-English Summary

Contract package imports preserve declared document references instead of inventing a default document. Imported purpose text is labelled as an unreviewed header import, not a reviewed extraction. Header, scope, spend, performance and credit writers preserve explicit review state; importing a row does not itself perform a review. Missing confidence stays absent where the schema permits it, or uses the canonical minimum with an explicit unassessed basis where the schema requires a value.

This candidate integrates the existing clause-provenance implementation from PR #9050 in a compatibility branch. Generated clause text cannot claim an extraction page, score or extractor version. Genuine reviewed, cited extractions retain their provenance. The original branch, worktree and claim are not rewritten; their historical QA record is distinct from this candidate's validation.

## Layer Impact

Release lanes: `global-control-lane` for import/projection controls and `public-demo` for corrected, unapplied synthetic package declarations. Any future historical replay requires its own exact `client-data-lane` decision.

- Layer 1: preserve the original synthetic text while declaring its derived basis; no real-client source edits.
- Layer 2: source-row review and citation declarations survive normalization and classification.
- Layer 3: existing writers stop granting review or default citations. No schema or RLS change.
- Layer 4: clause projections expose derived versus extracted text honestly. No layout or financial calculation change.

## Client Applicability

- All clients: these guards apply to future imports through the affected loader and projection.
- Specific clients: no tenant rows change automatically at merge or deploy.
- Internal only: operator import controls and CI fixtures.
- Public/demo only: corrected synthetic clause files and QA projections remain unapplied.
- Feature flag: none; no authentication or RLS weakening.

## Changes Included

- Compatibility integration of the actual three committed PR #9050 changes, including classifier, projection, manifest declarations and suite ownership.
- Additional explicit review-state preservation and synthetic-authored classification.
- Real writer document-reference and confidence handling.
- Explicit Source integration CI ownership of the new Postgres writer suite.

## QA / Validation

- Seven writer regressions failed against measured main before the fix: invented purpose citations and five falsely reviewed writer outputs. The fixed implementations passed.
- Three additional clause regressions failed before the change; the complete 24-case clause suite passes, including the original genuine extraction case.
- The initial simplified SQL fixture did not prove schema nullability. Replacing it with exact selected repository CREATE TABLE statements exposed four failed subtests caused by required confidence fields. Schema-compatible unassessed minima fixed those failures without a migration.
- Disposable Postgres: 14 writer subtests pass with actual canonical table definitions, including repeat imports, missing references, synthetic review, missing confidence, genuine extraction and credit writes. This is not full migration/RLS replay or live schema acceptance.
- Combined generator, authority, runtime-binding, transaction and writer Node suites: 66 passing tests, zero skips.
- Contract workspace, adapter, loader and suite-owner Jest sweep: 46 suites, 480 passing tests using exact paths.
- After the prerequisite squash merge and rebase onto actual main, the expanded Source/shared-governance sweep passes 55 suites / 634 tests. The shared delegated foundation survives unchanged except the intended optional derived-text declaration. Genuine census regeneration measures one new covered clause suite; unrelated missing suites are not assigned invented counts.
- Mutation checks: unconditional reviewed state failed nine writer subtests; invented default document failed two; ignoring the authored synthetic basis failed the dedicated clause assertion. All mutations restored.
- Manifest governance passes with the existing agent-attribution warnings retained. Engineering attribution is not a personal review or load approval.
- Node 24 TypeScript passed with an 8 GiB heap; the first 4 GiB run exhausted memory, not type validation. Focused lint passed. CI census regenerated with explicit test ownership.

## Rollout Plan

Review and squash merge after the prerequisite adapter/operator candidate and current-main reconciliation. Only the repo-owned ACA main workflow builds and promotes the shared image. No data loader runs automatically. A later package apply requires current native identity and row before-images, an exact delegated write plan, transactional proof, private backup, independent readback and signed-in projection checks. Do not bulk downgrade or replay historical rows as part of this code release.

Because this candidate changes the shared census, obtain a fresh actual fetched-ref guard across all open Moves/shared-census contenders, including drafts, immediately before arming. Treat absent historical censuses as unknown, never zero. Do not alter coverage counts to avoid a collision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: not captured for this candidate.
- ACA runtime invariant: approved digest must match template and healthy active 100%-traffic revision.
- Worker image invariant: both required worker jobs verified separately.
- Feature/env flag update path: none.
- Live signed-in proof required: affected contract Story, terms, evidence and action projections after any separately approved data operation.

## Rollback Plan

Revert code through a new reviewed PR and the main deploy workflow. No data rollback is required for this candidate because no live rows have changed. Future writes require separately retained before-images and a drift-guarded restore; reverting code must not reclassify or rewrite historical evidence silently.

## Audit Evidence

PR #9050 source commits, compatibility PR diff, independent delegated integration decision, red/green writer and clause results, mutation results, CI suite ownership, current-main review, deploy invariant and later private native proof. Raw authority, before-images and tenant-specific decision evidence stay private.

## Known Gaps

No shared database mutation, historical replay, new synthetic package apply, deployment or signed-in proof. Code classification does not independently authenticate an imported review marker. Full native schema/RLS and contract identity remain preflight gates. No earned credit calculation, opportunity sizing, Finance confirmation, indexing/retrieval or cite-render acceptance is created by this candidate.
