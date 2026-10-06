# Moves — human-declared discovery blueprint at origination

## Release ID

`2026-10-06-moves-discovery-archetype-origination`

## Status

`candidate` — not merged, deployed, or live-proven.

## Plain-English Summary

Move origination can suggest discovery blueprints from the problem, outcome, and scope text, then lets the authorized user explicitly choose one. Suggestions never select a blueprint automatically. The declaration is stored separately from the existing Move archetype and function-pack identity, and it guides discovery evidence families without changing phase gates or approvals.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 — Products / Moves: adds an optional, human-declared discovery blueprint to the origination flow and restores it when the draft is reopened. No canonical tenant facts, evidence, or governed decisions are created by this UI.

## Client Applicability

- All clients using authenticated Moves origination receive the optional field after deployment.
- No tenant-specific enablement or feature flag is changed.
- The declaration is optional; existing Moves and undeclared origination continue to use the existing resolver behavior.

## Changes Included

- Move origination page and client: expose catalog choices, show deterministic suggestions only at the archetype step, and persist/restore the user's separate discovery-archetype selection.
- Authenticated suggestion route: accepts bounded brief text and returns catalog suggestions without persisting or logging the text.
- Origination submit: validates the selected catalog ID and stores it under `charter.classification.archetype` with human-declaration provenance; does not replace `program.archetype`, `functionPackKey`, or existing classification codes.
- Focused declaration, submit-contract, and origination UI tests.
- No database migration, tenant data load, gate change, phase transition, or approval behavior change.

## QA / Validation

- Focused Jest suites: **73 tests passed** across 4 suites, including the runtime resolver's declared-archetype precedence.
- ESLint on changed TypeScript/TSX files: **passed**.
- `git diff --check`: **passed**.
- Bare `npx tsc --noEmit --pretty false`: Node exhausted its default heap and exited 134; the repository's canonical `npm run typecheck` then completed cleanly.
- Nexus manual freshness: **passed**.
- `npm run release:check --base origin/main --head HEAD`: **11 of 11 gates passed**.
- Signed-in origination walkthrough: pending.

## Rollout Plan

Merge through a squash PR. Ship only through the repo-owned `.github/workflows/aca-main-deploy.yml` workflow. This record does not claim the change is deployed or live-proven. Capture signed-in proof after deployment before marking the release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: pending official workflow.
- ACA runtime invariant: must verify template image, 100%-traffic revision, and required worker images match the approved digest.
- Worker image invariant: pending official workflow.
- Feature/env flag update path: no flag or environment change.
- Live signed-in proof required: yes; verify a suggestion remains unselected until a user chooses, the choice survives draft reopen and is submitted as a discovery declaration, and existing Move identity and phase gates remain unchanged.

## Rollback Plan

Revert the PR through a follow-up PR and deploy through the repo-owned ACA workflow. No data migration or tenant evidence write requires rollback. Existing declarations remain inert metadata if already submitted; the existing program archetype and function-pack fields are unchanged.

## Audit Evidence

- Focused tests cover catalog validation, non-authoritative suggestions, separate declaration storage, and draft restoration.
- PR, CI, official ACA workflow run, digest-parity proof, and signed-in walkthrough are pending.

## Known Gaps

- The bare TypeScript invocation is not usable at the default heap on this checkout; the repository's canonical typecheck wrapper completed cleanly. CI must also pass before merge.
- No signed-in or deployed proof has been captured.
