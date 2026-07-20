# 2026-07-20-source-artifact-governance-labels — Source artifact draft/final governance labels

## Release ID

`2026-07-20-source-artifact-governance-labels`

## Status

`candidate`

## Plain-English Summary

Source generated artifacts now state the correct governance boundary: AbarVa/aVa prepares a working draft, human review is required before external use, and an uploaded client-final artifact is the authoritative deliverable of record. This keeps the canvas, generated narrative exports, and generated File Cabinet metadata aligned with the human-approval workflow.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact governance copy and generated artifact metadata for all clients using the Source canvas.
- `client-data-lane`: No schema, migration, seed, or tenant data change.

## Client Applicability

- All clients: Yes, for Source artifact canvas/export behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds shared Source artifact governance wording in `src/lib/source/artifact-governance.ts`.
- Reuses the shared client-final governance message in `src/lib/source/client-final-artifacts.ts`.
- Shows a visible AI-draft / human-review banner in `DocumentTab` before a client-final artifact is accepted.
- Keeps the existing client-final banner as the authoritative state once a human-approved file is uploaded.
- Marks generated File Cabinet artifacts with draft/human-review wording in generated artifact metadata.
- Adds the AI-draft notice to narrative DOCX and HTML export cover metadata.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx src/lib/source/__tests__/client-final-artifacts.test.ts src/lib/source/exports/__tests__/narrative-html.test.ts` — passed, 22/22. Jest reported existing duplicate manual mock warnings for markdown mocks; no test failures.

## Rollout Plan

Open a PR, merge through the protected GitHub path, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this candidate.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a generated Source artifact shows the draft/human-review banner and an accepted client-final artifact shows the authoritative final state.

## Rollback Plan

Revert the PR and redeploy the previous ACA image. No database rollback is required.

## Audit Evidence

- Candidate branch diff in `codex/source-artifact-governance-2`.
- Focused Jest output listed above.
- PR URL, deploy run, ACA invariant, and signed-in screenshot proof pending.

## Known Gaps

- This slice does not add missing generation prompts for all d01-d33 artifacts.
- This slice does not add client-final upload acceptance to non-Source/Moves artifacts.
- Structured XLSX/PDF renderers should be audited next to ensure every generated export surface carries the same governance label.
