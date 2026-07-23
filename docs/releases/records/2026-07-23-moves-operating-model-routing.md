# 2026-07-23 Moves Operating Model Routing

## Release ID

`2026-07-23-moves-operating-model-routing`

## Status

`candidate`

## Plain-English Summary

The P3 Operating Model Design now receives the concise fixed structure and hard
quality band introduced for the architecture assembly. The previous release
registered that contract under the registry-facing name, while the live Moves
worker correctly routes the artifact through the canonical orchestrator name
`operating_model`; that mismatch caused the live run to use the older generic
binder. Evidence and Source Register appendix headings that use a period after
the appendix label are also recognized as appendix content rather than
client-narrative machinery.

## Layer Impact

- `global-control-lane`: aligns shared Moves artifact routing, quality controls,
  and deterministic client-language scanning.
- No gate, evidence, tenant-data, phase-state, approved option, or architecture
  decision changes.

## Client Applicability

- All clients: yes, for P3 Operating Model Design generation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Bind the fixed eight-section Operating Model contract to the canonical
  `operating_model` orchestrator key used by the live registry mapping.
- Apply the 2,400-4,600-word hard quality band to that canonical key.
- Remove the superseded generic operating-model structure.
- Recognize `Appendix B. Evidence Register` and `Appendix B. Source Register` as
  explicit appendix boundaries while continuing to flag machinery references
  in the client narrative before the appendix.
- Add routing, structure, quality-band, and appendix-boundary regressions.

## QA / Validation

- Pass: 81 focused routing, brief, quality-bar, prompt, and transformation-gate
  tests.
- Pass: focused ESLint and TypeScript with the required 8 GB heap.
- Pass: changed-file architecture-rules and Moves tenant-isolation audits.
- Pass: release-control check and `git diff --check`.
- Live finding: v11 correctly completed Target Architecture and Solution Design,
  then blocked Operating Model on the old generic path for
  `non_mechanical_writing`; Sourcing remained dependency-blocked.
- Pending: post-deploy disposable First Capital P3 architecture retry.

## Rollout Plan

Merge through a PR and deploy through the repo-owned ACA main workflow. Prove
web and worker image parity, then rerun the four-artifact P3 chain on a new
immutable option version without approving the P3 gate or advancing P4.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy the prior approved digest. Existing generated and
blocked runs remain immutable audit history; no schema or phase-state rollback
is required.

## Audit Evidence

- v11 live proof:
  `moves-p3-architecture-live-proof-v11-2026-07-23T11-42-54Z`.
- Worker log finding: run `17b029a8-8345-4521-b0a8-ac0bd00849aa` matched
  period-delimited Evidence/Source Register appendix headings.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3b chain proof remains open until the post-deploy retry passes.
