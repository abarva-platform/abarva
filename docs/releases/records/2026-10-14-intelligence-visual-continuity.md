# Intelligence Conversation and Exhibit Continuity

## Release ID

`2026-10-14-intelligence-visual-continuity`

## Status

`candidate`

## Plain-English Summary

Give each mounted Intelligence conversation its own opaque session identifier, reused for follow-ups. Previously requests without that identifier shared historical session context, which could be quarantined and cause a visual follow-up to substitute unrelated options. Explicit table requests also receive a stronger private exhibit instruction in the active model request.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4: Intelligence request session identity and private exhibit guidance.
- Existing application session logging remains tenant- and user-scoped. No session deletion, migration, data refresh or manual record mutation.
- Layers 1-3: unchanged; no canonical facts, graph edges, source-readiness promotion or governed data generation.

## Client Applicability

- All clients: newly mounted Intelligence conversations use an explicit opaque session ID.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; other callers retain their existing behavior.

## Changes Included

- Stable request ID within a mounted conversation; fresh ID after a fresh mount. The route already keys the component by tenant and selected record.
- Explicit tables retain supplied qualitative categories as table cells; the private contract rejects substituting a quadrant for that request.
- The active model user message ends with question-specific exhibit guidance and redraw continuity rules.
- Existing unverified-history quarantine and tenant/user authorization remain unchanged.

## QA / Validation

- PASS: 121 tests across 12 focused suites, Node 24 repository typecheck, scoped ESLint, all 11 release gates and context-corpus governance. Existing approval-metadata warnings remain unchanged.
- Regression coverage checks the same ID across follow-ups, a new ID across mounts, explicit table selection and actual model-call guidance.
- Existing session-history quarantine tests are required; no guard removal is permitted.
- Signed-in acceptance must repeat a table, a short redraw follow-up preserving the exact option names/categories, and a synthetic numeric comparison.
- NOT RUN: protected merge, ACA deployment and final signed-in acceptance at candidate preparation.

## Rollout Plan

Validate locally, open a public-safe PR, squash merge through repository controls and deploy the exact main SHA using the ACA main workflow. Reload a private test tab to load the new client, then inspect actual request IDs and response exhibits.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: workflow only.
- Approved image digest: resolve from the successful main release.
- ACA runtime invariant: template and healthy 100%-traffic revision match the approved digest.
- Worker image invariant: all required worker job images match the same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; three actual responses and conversation identity.

## Rollback Plan

Protected revert PR and the same ACA main deployment workflow. No canonical data rollback or session deletion is required.

## Audit Evidence

PR, local gate output, deployment run, independent runtime invariant and private response/screenshot evidence. Do not publish private session IDs, model answers or tenant-specific records.

## Known Gaps

This does not certify reasoning quality, source readiness or every possible visual choice. Home-bound continuation retains its separate record-isolation boundary; this release does not relax it. Existing conversations loaded before the update keep their old client until a fresh mount.
