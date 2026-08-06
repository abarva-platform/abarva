# 2026-08-06-client-registry-repair — Client Registry Repair Operator

## Release ID

`2026-08-06-client-registry-repair`

## Status

`candidate`

## Plain-English Summary

Adds a narrow operator script that repairs one demo client's app-level registry row after tenant-key consolidation. The script restores the bridge between the app client key, canonical tenant key, and the `clients` table so authenticated surfaces can resolve the correct tenant subject.

## Layer Impact

Release lane: `client-data-lane`.

Layer 3 Canonical Enterprise Model: the script verifies and repairs the tenant registry row used by runtime tenant resolution. It does not change source facts, product marts, value metrics, or tenant data packages.

Layer 4 Products: Home, Source, Tower, Intelligence, and related signed-in routes depend on this registry for session-to-tenant binding. This change provides the operator hook needed to restore that binding.

## Client Applicability

- All clients: No.
- Specific clients: One active demo tenant only.
- Internal only: Operational repair script and release evidence.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/ops/repair-skyharbor-client-registry.mjs`
- `package.json` scripts:
  - `ops:skyharbor-client-registry:repair`
  - `ops:skyharbor-client-registry:repair:apply`

## QA / Validation

Candidate validation:

- Pass: `node scripts/ops/repair-skyharbor-client-registry.mjs --self-test`
- Pass: `node --check scripts/ops/repair-skyharbor-client-registry.mjs`
- Pending: `npm run release:check`

Live validation required after merge and deploy:

- Pending: Run through the ACA private operator job with the deployed digest-pinned image.
- Pending: Inspect the structured proof event `skyharbor_client_registry_repair`.
- Pending: Run signed-in browser proof for Home, Source, and Tower.

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow build and deploy the image, then run the repair script through the ACA private operator job using the deployed digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: ACA private operator job for the database repair script only.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Must be proven after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Code rollback is a revert of this release if the script should no longer be available. The database repair itself is idempotent and only updates a registry row to the canonical app/tenant mapping; rollback should not restore retired tenant aliases as active tenant keys.

## Audit Evidence

- PR URL
- ACA main deploy run
- ACA operator job proof output
- Signed-in browser screenshots and crawl logs for affected surfaces

## Known Gaps

The script does not accept Responsible AI clickwrap on behalf of a user. That remains a normal app/API action after tenant subject resolution is restored.
