# 2026-10-13-moves-authored-p1-files-surface — Authored P1 controls in Files

## Release ID

`2026-10-13-moves-authored-p1-files-surface`

## Status

`candidate`

## Plain-English Summary

The normal P1 Files workspace now includes the existing authored Charter and Discovery Workshop Guide controls for an authorized author. It reads the canonical document register before offering an initial draft upload, preserves existing and signed documents, and keeps the Artifact Vault beside those controls. A confirmed admission refreshes the Vault's existing metadata read for the same Move.

## Layer Impact

Release lane: `experimental`.

- Layer 4: connect the existing server document reader and authored controls to the normal phase workspace's Files view. Unknown document availability is shown as unavailable and offers no upload control.
- Layer 3: no new writer, schema, catalog definition or approval rule. The previously released authored admission and approval APIs retain their tenant, permission, absent-only, original-byte, current-version and evidence checks.

## Client Applicability

- All clients: no default expansion.
- Specific clients: the registry-declared synthetic demo tenant under the existing flag.
- Internal only: no new operator or data-build entry.
- Public/demo only: generic mechanisms and synthetic test fixtures.
- Feature flag: `moves_authored_p1_draft_upload_v1`; both upload and author permissions and the allowed Move scope remain required.

## Changes Included

- The real phase route supplies a server-authorized P1 document slot to the existing normal Files composition. Switching from Steps to Files retains that slot; other phases do not render it.
- A bounded view of the existing document panel shows P1 rows only. Existing or signed versions retain their download and sign-off readback; unavailable canonical reads withhold initial admission.
- The existing successful authored admission emits a same-Move notification. The existing Vault responds with its ordinary read-only reload, retaining its upload, history and download behavior.
- Five existing covered suites verify the actual route connection, normal host composition, closed permissions, unavailable reads, signed history and same-Move read refresh. No test file or runtime mutation path is added.

## QA / Validation

- PASS: 417 focused tests in five existing suites and 77 existing upload/sign-off boundary tests in two further suites on the reconciled source.
- PASS: nine planted defects were caught by the affected tests and the original source was restored after every check.
- PASS: Node.js 24 typecheck, changed-file lint, no new library orphans and route/export reachability checks.
- PASS: genuine manual, coverage and tenancy regeneration from current main's artifacts, followed by all three generated checks. The manual and tenancy outputs remain unchanged.
- Coverage: 2865 covered test files on both the candidate and independently measured immutable current main. Main's committed census was stale at 2863; regeneration reflects two already-landed suites. This change adds no covered suite, relocation or count adjustment.
- PASS: all six context/corpus validators.
- PASS: the actual server panel composed with the real Files host was rendered locally at 1440 and 390 pixels in light and dark themes. Both declared file controls and the Vault were inspected, with no horizontal overflow. These are synthetic local views.
- PASS: all 11 release gates after this record. Complete exact-head CI, exact delegated source review, actual current-main applicability and the complete fresh fetched-ref guard remain required before readiness.
- Runtime and signed-in normal-page proof are pending. No local test or layout image establishes an actual upload, approval or journey acceptance.

## Rollout Plan

Review the exact source and QA, publish a draft PR and complete every exact-head check attempt and legacy context. Refresh actual main and every open Moves/shared-census contender, including drafts, using actual fetched refs immediately before readiness and protected squash merge. The repo-owned ACA main workflow deploys the resulting main image. Independently verify the digest and runtime invariant, then inspect the actual normal signed-in P1 Files page before any separately approved operator action.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this branch; no local or ad-hoc image, template, environment or traffic update.
- Approved image digest: supplied by the successful official deployment; unknown for this candidate.
- ACA runtime invariant: digest-pinned web template and sole 100% traffic revision must match the approved digest and satisfy healthy/running/provisioned checks.
- Worker image invariant: every worker required by the deployed update-worker script must match that digest.
- Feature/env flag update path: existing registry release only; no tenant or runtime flag mutation here.
- Live signed-in proof required: actual normal Files controls, existing document readback and Vault retention, followed by separately reviewed operations if authorized.

## Rollback Plan

Revert the Files composition and read-refresh wiring through the protected repository release lane. Preserve stored original files, signed pointers and all version history. The existing authored API and prior document surfaces remain governed by their own release controls. Never delete or rebuild a signed document as rollback.

## Audit Evidence

- Exact source manifest, current-main preservation, local test logs, planted-defect results and composed layout images are retained in the internal release tracker under this release ID.
- The draft PR, full current-head CI, exact source decision, final actual fetched-ref/current-main proofs and squash receipt are recorded when completed.
- Official ACA deployment and independent template/revision/worker/health observations are separate from the operator's actual normal-page and admission evidence.

## Known Gaps

The candidate is not deployed or signed-in proven. Initial upload and approval remain separate operator actions. Authored drafts are not native model generation and gain no inferred engine score, independent human/client/Finance attestation or context admission. The existing phone-width Vault header spacing is inherited. Full same-case Office deliverables, approved figures/citations/formulas and journey acceptance remain open.
