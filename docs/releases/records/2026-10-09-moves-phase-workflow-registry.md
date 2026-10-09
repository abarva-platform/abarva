# 2026-10-09 — Moves phase workflow registry

## Release ID

`2026-10-09-moves-phase-workflow-registry`

## Status

`candidate`

## Plain-English Summary

Moves phases are meant to run as a small set of steps (the P2 and P3 design
packs each define five), and how deep each step goes should depend on the use
case: a few reports need far less operating-model work than a full
transformation. Until now that depth rule lived as an if/else inside the
capture contract, and a separate rule chose which documents to build.

This change declares the P2 and P3 steps once, in a registry, together with
the change profile (technical, limited or full) derived from the solution
route the consultant confirms in P2. The capture contract now reads its route
decision from that same profile. Nothing a consultant sees or a document
receives changes: tests pin the registry to today's capture contract exactly.

The registry also makes three existing gaps explicit and tested: P2's evidence
plan has no capture field (it is served by evidence readiness), P3 has no
root-cause-to-design traceability capture, and only the limited route captures
estimate assumptions.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: Moves capture. The P3 route decision in
  `getPhaseCaptureSections` now calls `resolveChangeProfile`; the returned
  section sets are unchanged for every route.
- Canonical model: no schema, data or tenant change.
- Document generation: unchanged. Captured values are still read by the same
  section keys.

## Client Applicability

- All clients: yes, with no behavior change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none (no behavior change to gate).

## Changes Included

- `src/lib/programs/phase-workflow-registry.ts` (new): `ChangeProfile`,
  `resolveChangeProfile`, the P2 and P3 step declarations with per-profile
  depth and owned capture keys, `resolvePhaseWorkflow`, and
  `KNOWN_CAPTURE_GAPS`.
- `src/lib/programs/phase-capture-contract.ts`: the P3 route branch delegates
  to `resolveChangeProfile`.
- `src/lib/programs/__tests__/phase-workflow-registry.test.ts` (new): the
  profile rule across nine route shapes; parity between the registry and the
  capture contract for P2 and P3 on every route; no key owned twice; the
  operating-and-adoption depth matching the capture variant; the known-gaps
  ratchet; skipped steps leaving a record.

## QA / Validation

- New suite: 48 tests pass. Five deliberate mutations (loosened profile rule,
  dropped key, key owned twice, gap removed from the ratchet, skip with no
  record) each fail the suite; the file was restored and diffed clean.
- Existing suites that exercise capture sections and route shaping, full
  `npm run typecheck` (includes tests), ESLint and Prettier are recorded in the
  pull request.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or
data job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: none beyond the standard post-deploy checks;
  the change is parity-pinned with no visible effect.

## Rollback Plan

Revert this change through a pull request. The capture contract returns to its
inline route branch; no data needs repair.

## Audit Evidence

- Pull request and CI results.
- Registry test suite and the mutation results above.

## Known Gaps

Next increments, in order: per-step depth drives capture, sessions, documents
and the gate from this registry; P2 root causes become a ranked, evidenced
list under the existing `gaps_root_causes` key with a formatter for document
generation; the P2 readiness check stops passing on a phrase match; the step
pages follow the finalized step-page template. The three gaps listed above
remain open until those increments close them.
