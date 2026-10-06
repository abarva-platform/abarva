# 2026-10-06-source-motion-acceptance — Explicit Solicitation Motion Decision

## Release ID

`2026-10-06-source-motion-acceptance`

## Status

`candidate`

## Plain-English Summary

A Source event can record a user's explicit choice to run an RFI or RFP motion. The choice is accepted only once, by an authorized event owner or client admin, while the event is active in the market-package stage. The route records who accepted it and when. This does not approve a package, contact a supplier, release an RFx, or advance a stage.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source workflow only. It records an existing event authority field and does not create a vendor, price, score, or contract fact in Layer 3.

## Client Applicability

All clients with the existing Source event-authority schema. No feature flag; no client data is changed by deployment alone.

## Changes Included

Tenant- and actor-bound POST route, one-time conditional event update, and behavior cases in the existing CI-run Source event-authority suite. No migration.

## QA / Validation

Red-first focused test, successful focused and adjacent tests, typecheck, lint, release check, and deliberate mutation result are recorded in the PR. Runtime and signed-in proof are separate from local checks.

## Rollout Plan

Squash merge after applicable green CI and review. The repo-owned ACA main workflow alone deploys the digest-pinned image. No live event motion is accepted by deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: record after deployment
- ACA runtime invariant: web template and sole 100%-traffic healthy revision must match
- Worker image invariant: both required workers must match the web digest
- Feature/env flag update path: none
- Live signed-in proof required: yes, for a deliberately authorized synthetic decision

## Rollback Plan

Revert the route/service through a PR and official ACA deploy. A recorded human motion is not erased by code rollback; any data correction needs separately governed authorization and audit.

## Audit Evidence

PR, CI, official ACA run, immutable image digest, and separate signed-in event readback when available.

## Known Gaps

The workspace operator control is outside this slice and separately owned. No positive signed-in acceptance or release is claimed by this code change.
