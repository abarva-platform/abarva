# 2026-07-23 Moves P3b Right-Sized Artifacts

## Release ID

`2026-07-23-moves-p3b-right-sized-artifacts`

## Status

`candidate`

## Plain-English Summary

Moves now generates the P3 Solution Design, Operating Model Design, and
Sourcing Strategy as concise decision instruments instead of open-ended
consulting binders. Each artifact has a fixed purpose, exhaustive section
structure, required visual exhibits, and a hard word ceiling. Rendered exports
also suppress a duplicated section heading when the authored Markdown repeats
the heading already owned by the renderer.

## Layer Impact

- `global-control-lane`: changes shared deliverable structures, generation
  prompts, quality bars, and export rendering.
- No gate, evidence, phase-state, tenant-data, architecture-option, or approved
  architecture-decision behavior changes.

## Client Applicability

- All clients: yes, when generating these three Moves P3 artifacts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add fixed eight-section Solution Design and Operating Model Design contracts.
- Add a fixed seven-section Sourcing Strategy contract.
- Require purpose-specific workflow, component, decision-rights, and sourcing
  option exhibits using the existing governed visual schema.
- Enforce body-word bands of 2,800-5,200, 2,400-4,600, and 1,800-3,600 words,
  respectively, with maximums treated as quality blockers.
- Tell generation to preserve the accepted architecture, avoid predecessor
  repetition, consolidate gaps/risks, and carry detail in tables and exhibits.
- Remove only an exact duplicate Markdown section heading from rendered HTML,
  DOCX, and PDF bodies while preserving real nested headings.

## QA / Validation

- Pass: 72 focused brief, quality-bar, prompt, orchestration, and renderer tests.
- Pass: focused ESLint.
- Pass: TypeScript with `NODE_OPTIONS=--max-old-space-size=8192`.
- Pass: `git diff --check`.
- Pass: changed-file architecture-rules audit.
- Pass: Moves tenant-isolation audit.
- Pass: release-control check.
- Pending: post-deploy disposable First Capital P3b chain and downloaded-artifact
  word-count/render audit.

## Rollout Plan

Merge through a PR and deploy through the repo-owned ACA main workflow. Prove
the web and deliverable-worker images use the approved digest, then rerun the
four-artifact P3 architecture assembly on the disposable First Capital proof
Move without approving its gate or advancing P4.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior approved digest. Existing generated
artifacts remain immutable historical versions; no schema or phase-state
rollback is required.

## Audit Evidence

- Oversize baseline and live chain proof:
  `moves-p3-architecture-live-proof-v9-2026-07-23T10-43-24Z`.
- PR, deployment invariant, and right-sized post-fix proof: pending.

## Known Gaps

- The hard word ceilings and heading correction remain unproven in production
  until the post-deploy P3b generation retry completes.
