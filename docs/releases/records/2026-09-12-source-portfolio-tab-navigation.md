# Source Portfolio Tab Navigation

## Release ID

`source-portfolio-tab-navigation-2026-09-12`

## Status

Candidate for `global-control-lane` release.

## Plain-English Summary

Source portfolio navigation is now rendered as stateful buttons. Clicking Command,
Contracts, Levers, Evidence, or Coverage updates the existing workspace state and
canonical URL without initiating a document navigation or mounting a second page shell.

## Layer Impact

- **Layer 1 - Client intake:** no change.
- **Layer 2 - Source adapters:** no change.
- **Layer 3 - Canonical model:** no change.
- **Layer 4 - Product:** `global-control-lane`, Source workspace portfolio navigation only.

## Client Applicability

All clients: all authorized Source users receive the global `global-control-lane`
navigation behavior. No tenant data, schema, or data-plane writes are included.

## Changes Included

- Replaced portfolio navigation anchors with buttons.
- Preserved the existing state-to-URL synchronization on the canonical `/source` route.
- Preserved active styling and added an accessible pressed state for the selected tab.
- Added behavior coverage that the navigation controls do not depend on an `href`.

## QA / Validation

- Source workspace browser-surface tests: pass.
- Source shell performance/contract surface tests: pass.
- Canonical workspace URL tests: pass.
- `git diff --check`: pass.

## Rollout Plan

Merge through the protected main deploy workflow. Build the image from the exact
merge SHA, verify the ACA runtime invariant, assign 100% traffic to the healthy
digest-pinned revision, and run signed-in Source navigation proof.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may build and shift shared web traffic.

## Rollback Plan

Restore the prior digest-pinned ACA revision through the protected main deploy
workflow if the signed-in Source navigation proof fails. No data rollback is needed.

## Audit Evidence

The merge SHA, ACA deployment artifact, runtime-invariant proof, and signed-in
navigation evidence are recorded with the release execution.

## Known Gaps

This release does not reconcile the separate portfolio register and contract-depth
populations or add missing contract evidence. Those remain data-plane work and must
not be inferred from the navigation change.
