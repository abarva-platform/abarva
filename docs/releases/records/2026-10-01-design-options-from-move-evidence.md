# 2026-10-01 — Design Options From Move Evidence

## Release ID

`2026-10-01-design-options-from-move-evidence`

## Status

`candidate`

## Plain-English Summary

In the design phase a Move decides which solution option architecture should implement. When the Move's approved evidence contains the client's own list of options, that list is now what the decision screen offers and what gets recorded as the approved option.

Previously the options on the decision screen always came from a built-in template set, chosen by matching keywords in the Move's text. A client's uploaded option list reached document generation only as background evidence. The option recorded as approved — which the architecture documents are then instructed to build to — was therefore a template option, even when the client had supplied a different set. A client option and a template option could also share a letter, and the check that reads a written recommendation matched that letter as a substring, so it could select the wrong one.

Client options are shown as written: benefit, trade-off, condition and scope. They are not scored, ranked, or recommended, because the template scoring does not assess them.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves design-phase behavior for every client; not behind a feature flag.

- **Product layer — Moves design phase:** Option source, option card content, and the option-approval payload change when a Move declares its own options. A Move with no declared options behaves as before.
- **Evidence handling:** Read-only use of already-approved Move evidence. No change to admission, review, or approval of evidence.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-templates/uploaded-solution-options.ts` (new): reads an option set from approved design-phase evidence — only from a table with an explicit option-id column and a name column — and a whole-token matcher for which option a written recommendation names.
- `src/lib/programs/phase-templates/p3-option-assembler.ts`: the client's option set takes precedence over the template set.
- Phase workspace page and client: load the declared option set for the design phase, render client options as written, and send them in the option-approval request without template scores.
- Tests for the parser, the matcher, and the precedence rule.

## QA / Validation

- Targeted Jest: pass — `30 suites, 288 tests` across phase templates and Moves components, including 21 new tests.
- Targeted ESLint and Prettier on new files: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Signed-in runtime verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, open the design phase of a synthetic workflow that has an uploaded option list and confirm the decision screen shows those options, by their own ids, with no scores.

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
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Only a table with an explicit option-id column is recognised. Options described in prose, or in a table without declared ids, still fall back to the template set.
- If two approved evidence items each declare an option set, neither is used and the template set is shown; the conflict is not yet surfaced to the user.
- A human-corrected extraction of the evidence is not read; the option set comes from the originally extracted text or tables.
- An option already approved from the template set on an existing Move is not revisited.
