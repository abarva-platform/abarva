# 2026-09-19-source-integration-intake-contract — Restore Source intake CI coverage

## Release ID

`2026-09-19-source-integration-intake-contract`

## Status

`candidate`

## Plain-English Summary

The Source intake integration suite now checks the current product contracts instead of retired labels. It verifies that required facts precede the optional category selector, projects categories from the canonical taxonomy, checks the approval packet inside its governed completion footer, preserves the incomplete-state guard, follows the current Source New routing contract, and uses the existing-contract optimization endpoint when a contract is already known.

The repaired suite is removed from the Source integration quarantine. It now runs on every pull request.

## Layer Impact

Release lane: `global-control-lane`.

- Repository test control plane: assertions and Source integration quarantine metadata.
- Product layers: no product code, route, schema, tenant data, model context, authorization, or runtime behavior changes.

## Client Applicability

No client receives a runtime change; this is repository CI only.

- All clients: no runtime change
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/integration/source/source-originate-page.test.ts`: replace stale labels with current behavior contracts.
- `scripts/quality/source-integration-quarantine.json`: remove the repaired suite.
- `scripts/quality/check-source-integration-quarantine.mjs`: lower the exclusion ceiling from 24 to 23.
- This release record.

## QA / Validation

**Status: pass.**

- Source intake integration suite: pass, 27/27.
- Registered Source integration suites: pass, 70 suites / 630 tests.
- Source integration quarantine checker: pass, 23 excluded of 93 directory suites.
- Behavior suites: pass, 35 suites / 359 tests.
- TypeScript with the repository-required 8 GB heap: pass.
- Targeted ESLint: pass.
- Release control: pass.
- Signed-in acceptance: not required because no product behavior changes.

## Rollout Plan

Squash merge through the protected pull-request path. No runtime image, ACA deploy, migration, data build, or feature flag is required.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, runtime images, worker jobs, flags, environment variables, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the test and quarantine changes together. Restoring the quarantine entry requires restoring the ceiling to 24 and recording why the suite is red.

## Audit Evidence

- Before: `source-originate-page.test.ts` failed seven stale expectations and was quarantined.
- After: the suite passes 27/27 and the registered Source integration set passes 70 suites / 630 tests.
- The dedicated `createdEventDestination` unit contract separately proves normal Source New and governed approval exceptions.
- PR URL and CI evidence are recorded on the pull request.

## Known Gaps

Twenty-three other Source integration suites remain quarantined under named backlog items. This release makes no claim about those suites, product runtime behavior, or signed-in acceptance.
