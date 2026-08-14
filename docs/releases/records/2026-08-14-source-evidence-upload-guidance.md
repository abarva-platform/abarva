# 2026-08-14-source-evidence-upload-guidance — Source Evidence Upload Guidance

## Release ID

`2026-08-14-source-evidence-upload-guidance`

## Status

`candidate`

## Plain-English Summary

Source stage evidence now renders as a practical upload checklist instead of an internal readiness legend. For each evidence item, the user can see whether it is required or optional, what kind of upload is expected, likely source systems, accepted file formats, whether a file is loaded, parse/readiness state, done status, and the next action.

## Layer Impact

Layer 4 Products: Source canvas presentation only. The change reuses existing event evidence state and canonical evidence requirement metadata already available to the client bundle.

No Layer 1 intake, Layer 2 adapter, Layer 3 canonical model, persistence, upload parser, approval automation, or data-plane behavior changes are included.

## Client Applicability

- All clients: Yes, wherever the Source canvas Evidence tab is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/workspace-tabs/EvidenceTab.tsx`
- `src/components/source/__tests__/EvidenceTab.test.tsx`
- `tests/e2e/source/skyharbor-euc-critical-path.spec.ts`
- PR: https://github.com/abarva-platform/abarva/pull/6284

## QA / Validation

- `npx jest src/components/source/__tests__/EvidenceTab.test.tsx --runInBand` - pass.
- Broader formatting, release, and layout smoke checks are pending before PR readiness.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the resulting image. No manual Azure mutation is required or allowed for this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live proof.
- Worker image invariant: Required after deploy before claiming live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for production-live UX proof of the Evidence tab if this slice is demo-claimed.

## Rollback Plan

Revert the PR to restore the prior Evidence tab rendering. Because this is a presentation-only change with no schema or data-plane mutation, rollback does not require data repair.

## Audit Evidence

- PR URL and CI checks after PR creation.
- Focused Jest output for the Evidence tab.
- Source layout smoke output after validation.
- ACA deploy evidence after merge/deploy if promoted to main.

## Known Gaps

This does not implement production upload parsing, file ingestion, citation extraction, or approval automation. It only makes the existing evidence requirement state easier to understand and act on.
