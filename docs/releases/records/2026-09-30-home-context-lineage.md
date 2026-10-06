# 2026-09-30 Home Context Lineage

## Release ID

`2026-09-30-home-context-lineage`

## Status

`candidate`

## Plain-English Summary

Home now distinguishes a live served record from the executive narrative shown alongside it. When those layers cannot be verified as one coherent version, the page and walkthrough export say so, and the Home advisor does not synthesize from unverified chapter prose. A no-data advisor response cannot include uncited narrative.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: no change.
- Product projection: read-time lineage checks over existing Home serving rows and narrative metadata. No writes to tenant records.
- Product surfaces: source and narrative status in Home and walkthrough exports; answer packaging guard in Home aVa.

## Client Applicability

- All clients: Home users on the served projection or reviewed snapshot paths.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

Home projection bundle lineage, shared record-source labels, Home rail and walkthrough export status, advisor evidence guards, and focused regression tests. No schema migration or data build.

## QA / Validation

Focused Home projection, advisor, and export tests passed. Typecheck passed. Lint, release gate, and post-deploy signed-in verification are required before release status becomes `released`.

## Rollout Plan

Squash merge the reviewed PR to protected main. The repo-owned ACA main deploy workflow builds and deploys the exact main commit. No data-plane job or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: verify template and 100% traffic revision use the approved digest.
- Worker image invariant: verify required worker job images remain at the approved digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: record label, narrative status, advisor answer, and export state.

## Rollback Plan

Revert the PR through a new protected-main PR and redeploy via the ACA main workflow. The change is read-only and has no migration rollback.

## Audit Evidence

PR diff and checks, deploy workflow run, ACA digest invariant output, focused test log, and signed-in Home/export proof.

## Known Gaps

The served narrative and deterministic packet are not yet a single published version. This release exposes that limit and prevents the advisor from treating an unverified narrative as current; source-aligned narrative generation and evidence closure remain separate work.
