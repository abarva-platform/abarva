# 2026-10-11-source-document-origin - Preserve Declared Document Origins

## Release ID

`2026-10-11-source-document-origin`

## Status

`candidate` - local validation only; no data repair or load performed.

## Plain-English Summary

The document projection loader now preserves upstream system, original file, manifest row and owner declarations. It keeps the processor identity separate and refuses a manifest whose tenant, contract or package version disagrees with the document. Missing origin declarations remain unknown. A declared synthetic origin is not a verified connector.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 (Source Adapters): carry existing intake manifest lineage through a pure, deterministic file-input builder. Layer 3 (Canonical Model): future authorized document loads retain that lineage in existing document metadata. No schema change. Layers 1 and 4 are unchanged by this release.

## Client Applicability

- All clients: none automatically; no data load runs at deploy time.
- Specific clients: only explicitly scoped, separately authorized synthetic contract-depth package loads using this companion loader.
- Internal only: operator plan now exposes proposed document origins for review.
- Public/demo only: no new public route.
- Feature flag: none; existing authorization and tenant controls are unchanged.

## Changes Included

- Existing document loader: validate manifest identity before opening the database; preserve the upstream declaration and manifest hash in the file metadata actually written.
- Existing loader tests: origin preservation, absent origin, tenant/package/contract conflicts, ambiguous files, writer integration and offline CLI preflight.
- Source integration workflow: explicitly run this Node behavior suite, previously not owned by a workflow.

## QA / Validation

- Red first: four existing cases passed and six new behavioral cases failed on the original implementation.
- Fourteen focused cases pass, including the actual SQL parameter binding, CLI plan path without database credentials and conflicts in a page/clause row despite a matching manifest. The two row-conflict cases also failed first on the prior implementation.
- Ten deliberate mutations are assertion-killed; the fourteen-case baseline passes before and after restoration.
- Focused ESLint passes. Coverage census remains unchanged because it counts Jest suites under src; the explicit Node workflow command supplies this suite's execution owner.
- All five existing contract-depth package plans pass offline, without a database connection. Export reachability matches the existing baseline; all eleven release gates pass.

## Rollout Plan

Review current-head CI and squash merge through a PR. Only the repo-owned ACA main workflow builds and releases the shared runtime. This makes corrected loader code available but changes no stored row. An exact package hash, contract/tenant scope, before-images and reviewed write diff are required before any separate data apply. Incorrect source declarations must be corrected in intake, not silently relabelled by the adapter.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that main workflow; no branch traffic/template changes.
- Approved image digest: supplied by the main workflow after merge; none asserted here.
- ACA runtime invariant: template and healthy 100%-traffic revision must match the approved digest.
- Worker image invariant: both required worker images must match that digest.
- Feature/env flag update path: none.
- Live signed-in proof required: after an independently authorized metadata load, verify the Evidence view shows the declared synthetic origin and reference, not a connected-system claim.

## Rollback Plan

Revert the loader change through a PR. This does not itself revert any later approved metadata write. Such a write must carry its own before-images and separately scoped rollback plan.

## Audit Evidence

Inspect focused tests, mutation proof, offline plans, the public PR and CI. Private operator inventory and exact repair plans remain outside the public repository. No database mutation, migration, supplier communication or product approval occurred in this release.

## Known Gaps

- Existing stored documents are not repaired by merging or deploying this code.
- A manifest's source system can be incorrect. Preserving it does not certify its accuracy.
- Missing executed agreements, observed invoices/payments, measured usage and approved archetype declarations need separate input repair.
- This is not financial validation, executed commercial-rule proof or full sourcing acceptance.
