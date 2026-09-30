# 2026-09-30 — Moves evidence-summary grounding

## Release ID

`2026-09-30-moves-evidence-summary`

## Status

`candidate`

## Plain-English Summary

Explicit Moves questions asking what evidence establishes now receive a deterministic response from the approved evidence for the active phase. The response cites each evidence item and keeps recorded statements separate from stakeholder observations, assumptions, and open questions. If approved evidence is empty or unavailable, it says so instead of generating unsupported client facts.

## Layer Impact

- **Release lane:** `global-control-lane`.
- **Products:** Moves chat adds a narrow deterministic evidence-summary answer path; existing phase gates and feature-flag policy are unchanged.
- **Canonical enterprise model:** No schema or canonical-record changes.
- **Client intake and adapters:** No changes.

## Client Applicability

- All clients: The explicit evidence-summary question path applies on Moves phase workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No flag change. Other Moves chat hardening remains tenant opt-in.

## Changes Included

- Adds an explicit evidence-summary answer mode and deterministic response builder.
- Loads only approved evidence scoped to the active phase for this answer; preserves observations, assumptions, open questions, and source citations as distinct fields.
- Makes the evidence-summary route fail closed if its evidence packet cannot be loaded.
- Corrects the feature registry description so it does not claim a runtime quality gate that is not wired for all free-form answers.

## QA / Validation

- Pass: targeted Moves chat, answer-mode, route-scope, and evidence-context tests (46/46).
- Pass: ESLint on changed TypeScript files.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Not run locally: full typecheck and full integration suites; CI checks are authoritative for those suites.
- Blocked: deployed signed-in proof until the desktop browser can open the native file picker; continue after unlock.

## Rollout Plan

Merge through the protected main-branch PR flow. Build and deploy the exact merge SHA only through the repository-owned ACA main deploy workflow. No feature flag, schema migration, or manual data operation is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Not available before the deployment run.
- ACA runtime invariant: Must be verified for the exact merge SHA before calling the change deployed.
- Worker image invariant: Must match the approved digest if the deploy workflow updates worker jobs.
- Feature/env flag update path: No change.
- Live signed-in proof required: Yes; confirm the evidence-summary response uses only approved current-phase sources and fails closed when none are present.

## Rollback Plan

Revert the application change through a follow-up PR and deploy the resulting main SHA with the repo-owned workflow. No data migration or evidence mutation needs rollback.

## Audit Evidence

- PR, CI run, exact ACA deployment run, runtime invariant proof, and signed-in smoke evidence will be attached after merge and deployment.

## Known Gaps

- Other free-form Moves model responses are still prompt-guided and are not post-hoc quality-gated at runtime.
- A full evidence-upload-to-P5 synthetic journey remains in progress.
