---
release_id: 2026-06-28-moves-worker-content-packaging
date: 2026-06-28
lane: global-control-lane
status: candidate
owner: codex
---

# Moves Worker Content Packaging

## What changed

The Azure Container Apps runtime image now copies `src/content` into the final runtime stage. This keeps private operator jobs aligned with server-side source imports that resolve authored deliverable evidence assets, including `_evidence-base.json` and `_timeline.json` files used by the enterprise data room.

## Why

The deployed P2 async operator path correctly queued the Lakeshore Current Work Diagnostic, but the private operator job failed before claiming the run because `src/lib/knowledge/enterprise-data-room.ts` imported an authored Apex evidence JSON file that was present in the repo and build context but not copied into the runtime image.

This was a packaging flaw, not a prompt or Moves gate flaw. Missing optional authored content must not prevent unrelated tenant Moves work from starting.

## Layer impact

- Runtime packaging only.
- No database schema change.
- No tenant data mutation.
- Applies to all ACA web and private operator job images built from this Dockerfile.

## Clients affected

All clients benefit because the shared private operator image can now resolve authored evidence assets required by server-side context modules. The triggering proof case was Lakeshore Moves P2 async generation.

## Validation

- Pre-fix live proof: signed-in Lakeshore CIO session enqueued P2 draft generation in 882 ms and received `202 queued`.
- Pre-fix private operator proof: `job-abarva-private-operator-eus-btu4bko` failed before claiming the run with `Cannot find module '@/content/deliverables/apex-retail/morrison/_evidence-base.json'`.
- Post-fix validation required after merge/deploy: rerun the same private operator script and confirm the queued run is claimed, processed, persisted to the Move File Cabinet, and downloadable.

## Rollout

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, then rerun the queued P2 operator proof on the digest-pinned image using `job-abarva-private-operator-eus`.

## Rollback

Revert this Dockerfile copy line and redeploy the previous image. Rollback would restore prior packaging behavior and may reintroduce private operator boot failures for source imports that depend on `src/content`.
