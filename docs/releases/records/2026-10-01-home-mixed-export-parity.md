# 2026-10-01-home-mixed-export-parity - Mixed Record Chapter Parity

## Release ID

`2026-10-01-home-mixed-export-parity`

## Status

`candidate`

## Plain-English Summary

Mixed-record Home chapters now close their prior interpretation when the reader changes chapters. HTML and PDF walkthrough exports lead each mixed chapter with current deterministic depth and label the earlier narrative at its point of use. A shared status label distinguishes an older reviewed narrative from one whose lineage is not verified. No source data or generated claim is changed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: no intake, adapter, canonical, or serving-projection change.
- Layer 4: Home chapter disclosure state, source-status copy, and walkthrough HTML/PDF presentation.

## Client Applicability

- All clients: mixed served Home records use the chapter-state and export labels.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Reset an expanded prior-chapter disclosure when navigating to another chapter.
- Use one browser/export label for reviewed versus unverified prior interpretation.
- Put current deterministic findings and tables ahead of prior narrative in mixed HTML/PDF chapters.
- State the lack of served interview rows before older leadership prose where applicable.
- Preserve the existing ordering for coherent served and reviewed stored records.

## QA / Validation

- PASS: focused Home chapter and walkthrough export tests.
- PASS: TypeScript, touched-file ESLint, formatting, diff check, Home ratchet, and release check before PR.
- PASS: real PDF renderer fixture produced a multi-page, text-extractable document; visual review of the cover and chapter state confirmed the current/prior ordering. The Jest PDF assertion uses a renderer mock and is not this layout proof.
- NOT RUN at candidate authoring: PR CI and signed-in deployed browser/PDF proof.

## Rollout Plan

Squash-merge after PR checks pass. Deploy through the repo-owned ACA main workflow. Verify digest parity across the web and required workers, signed-in cross-chapter disclosure reset, and downloaded HTML/PDF state and layout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker images.
- Feature/env flag update path: none.
- Live signed-in proof required: a previously opened prior chapter closes after navigation, and exports distinguish current rows from prior interpretation.

## Rollback Plan

Revert through a controlled PR and redeploy through the same workflow. No data rollback is needed.

## Audit Evidence

Focused component/export tests, Home ratchet, PR checks, main deploy run, runtime digest readback, signed-in navigation proof, and extracted-text plus visual PDF review.

## Known Gaps

This does not reconcile prior claims with current rows or repair missing source links. The full PDF currently limits each table to twelve displayed rows, with a pointer to HTML and the live browser for the remainder; complete table-row preservation requires a separate export pagination change. No source set is approved or loaded by this release.
