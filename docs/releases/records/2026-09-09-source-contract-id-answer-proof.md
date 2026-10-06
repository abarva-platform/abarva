# 2026-09-09-source-contract-id-answer-proof - Source Contract Id Answer Proof

## Release ID

`2026-09-09-source-contract-id-answer-proof`

## Status

`released`

## Plain-English Summary

Source aVa answers now preserve public Source contract identifiers that use multi-part contract codes, while continuing to scrub internal record identifiers before rendering. Contract 360 answers also include selected contract header fields so vendor, renewal timing, notice period, auto-renewal, and owner details can be reported from governed Source context, even when serialized surface fields arrive as numeric strings.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source aVa answer shaping and public render safety only. No tenant intake, adapter, canonical model, schema, or data-plane mutation is included.

## Client Applicability

- All clients: Source Workspace and Contract 360 aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ava-answer/public-answer-scrub.ts`
- `src/lib/ava-answer/render-layer-shaper.ts`
- `src/lib/agent/product-truth/runtime-guard.ts`
- `src/lib/intelligence/answer/answer-safety.ts`
- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- `src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `docs/releases/records/2026-09-09-source-contract-id-answer-proof.md`

## QA / Validation

Pass before merge:

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts`
- `npm test -- --runTestsByPath src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts` after adding explicit selected-vendor prose coverage.
- `npx eslint src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/render-layer-shaper.ts src/lib/intelligence/answer/answer-safety.ts src/lib/source/ava/source-workspace-visual-answer.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `npm run release:check`

Post-deploy live proof:

- ACA deploy run `34302794554` deployed PR `#7447`; direct runtime invariant matched digest `sha256:c9008aeeca06bb7e6126737d1f98ac95d54610710c6b33fde25d40914aa002e1`.
- ACA deploy run `34304040836` deployed PR `#7448`; direct runtime invariant matched digest `sha256:492f3c800f0ca6f2b04fdab7bd0d26a0344e607981cb69ebfdfee45f694bc0c5`.
- Verify-only ACA jobs on digest `sha256:492f3c800f0ca6f2b04fdab7bd0d26a0344e607981cb69ebfdfee45f694bc0c5` passed Layer 2/3 readback, Layer 4 readback, and Tower bridge readback.
- ACA deploy run `34306344800` deployed PR `#7450`; direct runtime invariant matched digest `sha256:cb2a844198e836662a95642e0d1c02af90e0ded776cdebbd963808429d870425`.
- Signed-in Source Workspace aVa proof on the released runtime preserved the full selected public contract ID, rendered the selected vendor in the loaded-facts paragraph, reported the notice period as `90 days`, and did not render `(contract -)`, a bare contract prefix, fallback copy, or a missing-notice-period claim.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: `sha256:cb2a844198e836662a95642e0d1c02af90e0ded776cdebbd963808429d870425`
- ACA runtime invariant: passed; web template image and 100%-traffic revision image matched the approved digest.
- Worker image invariant: passed; `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` matched the approved digest.
- Feature/env flag update path: none
- Live signed-in proof required: passed for Source Contract 360 and Source Workspace aVa answers.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

- PR `#7447`, PR `#7448`, and PR `#7450`.
- ACA main deploy runs `34302794554`, `34304040836`, and `34306344800`.
- Verify-only ACA proof folders:
  - `/tmp/source-dbx-layer23-verify-live-20260909T0258Z`
  - `/tmp/source-dbx-layer4-verify-live-20260909T0300Z`
  - `/tmp/tower-source-cloud-bridge-verify-live-20260909T0302Z`
- Direct Azure runtime invariant query captured the released web template, 100%-traffic revision, and required worker job images on digest `sha256:cb2a844198e836662a95642e0d1c02af90e0ded776cdebbd963808429d870425`.
- Signed-in browser proof captured the released Source Workspace aVa response with vendor, full public contract ID, annual value, actual annual spend, end date, notice period, auto-renewal status, top opportunity, evidence-gate language, chart, relationship map, and decision table.

## Known Gaps

This release does not attach governed source document files to contracts or change Source Evidence tab document-file coverage.
