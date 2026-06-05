# 2026-06-04-source-redesign-contract-package — Source Redesign Contract Package

## Release ID

`2026-06-04-source-redesign-contract-package`

## Status

`candidate`

## Plain-English Summary

Adds the approved Source redesign contract package to the repo so Codex and reviewers can build the Source module redesign against the same spec, review notes, and wireframe references. This is a documentation/control artifact only; it does not change runtime behavior by itself.

## Layer Impact

- Release lane: `internal-admin`.
- `internal-admin`: Adds internal build specifications, design review notes, and wireframe targets used by the autonomous Source redesign execution.
- Secondary applicability: `public-demo`, because the CXO testing primer is used as the product-quality bar for Source walkthrough validation.

## Client Applicability

- All clients: No immediate runtime impact.
- Specific clients: Apex Retail is referenced in the CXO testing primer as the current Source walkthrough persona.
- Internal only: The design package and autonomous execution contract are internal build guidance.
- Public/demo only: The CXO primer supports demo-quality validation.
- Feature flag: None.

## Changes Included

- `docs/build/source-design/01-current-state-wireframes.html`
- `docs/build/source-design/02-end-to-end-wireframes.html`
- `docs/build/source-design/03-build-specs.html`
- `docs/build/source-design/04-design-module-review.md`
- `docs/build/source-design/05-wireframe-atlas.html`
- `docs/build/source-design/06-strategy-screen.html`
- `docs/build/source-design/07-executive-decision-screen.html`
- `docs/build/source-design/README.md`
- `docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md`

## QA / Validation

- Pass: Verified `docs/build/source-design/` contains files 01 through 07 plus `README.md`.
- Pass: Verified `03-build-specs.html` contains 19 `WIREFRAME` references.
- Pass: Verified `05-wireframe-atlas.html` is the full 37,043-byte atlas, not the earlier placeholder.
- Pass: Verified the CXO testing primer exists at the precondition path.
- Pass: Ran `git diff --check -- docs/build/source-design docs/build/cxo-primers`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `npx tsc --noEmit --skipLibCheck`.
- Blocked by pre-existing baseline: `npx eslint src/ --max-warnings 0` reports 0 errors and 163 warnings across unrelated existing source/test files. This docs-only package does not edit those files; the warning baseline must be handled separately before the full autonomous brief can honestly claim the global lint precondition is clean.

## Rollout Plan

Merge to `main`. No database migration, feature flag, or runtime deploy action is required beyond the normal Vercel documentation build/deploy.

## Rollback Plan

Revert the documentation commit. No runtime rollback or data repair is required.

## Audit Evidence

- PR for this release record and design package.
- `release:check` output.
- File-size and wireframe-count verification output.

## Known Gaps

This package only unblocks the redesign implementation. The runtime Source redesign ships in subsequent spec PRs.

The repo currently has a pre-existing full-source ESLint warning baseline (`npx eslint src/ --max-warnings 0` reports 163 warnings). That is outside this docs-only contract package and must be resolved or explicitly waived before the full redesign QA gate can be considered clean.
