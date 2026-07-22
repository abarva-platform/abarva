# 2026-07-22-tower-mart-aca-job-wiring — Wire the Tower mart write CLI to the governed ACA operator job

## Release ID

`2026-07-22-tower-mart-aca-job-wiring`

## Status

`candidate`

## Plain-English Summary

The Tower mart write CLI (shipped in #5262, refined in #5266) is code-complete and dry-run-proven, but it was not yet runnable through the governed ACA operator job wrapper. Verifying the run prerequisites surfaced two real last-mile gaps:

1. The wrapper (`scripts/ops/submit-aca-operator-job.mjs`) runs exactly `npm run <script>` inside the job with **no forwarded arguments**, so the existing `project:tower-mart:write-job` script (which had no `--tenant`/`--v3-dir`) would exit with a usage error.
2. The CLI did not emit a proof bundle between the `__SEMANTIC2_PROOF_TGZ_BEGIN__/END__` markers the wrapper extracts from job logs, so a live run would not return its summary/mart JSON to the operator.

This PR closes both: the CLI now supports `--emit-proof-bundle` (tars the out-dir and prints it base64-encoded between the markers, mirroring the existing `project-meridian-v3-to-cio-tower.mjs` pattern), and a self-contained `project:tower-mart:meridian:write-job` npm script hardcodes the Meridian tenant, V3 dir, proof-bundle flag, and out-dir — so the wrapper can run it with a single `--script` argument and retrieve the proof.

The runtime image already contains everything the job needs: the Dockerfile copies `src/scripts`, `src/lib`, and `datasets/` into the runtime stage (lines 113-118), so the CLI and the Meridian V3 CSVs are present in the deployed image.

No mart rows are written by this PR. It only makes the governed write **runnable**; the write itself is a separate operator step gated on this PR merging + deploying (so the new npm script is in the image).

## Layer Impact

- `internal-admin` lane: `src/scripts/tower/project-tower-mart.ts` (adds `--emit-proof-bundle`) and `package.json` (adds `project:tower-mart:meridian:write-job`). Operator tooling only; no runtime request-path change, no shared-lane behavior change.

## Client Applicability

- All clients: no. Meridian-specific convenience script; the generic `project:tower-mart:write-job` is unchanged.
- Feature flag: none.

## Changes Included

- `src/scripts/tower/project-tower-mart.ts` — `--emit-proof-bundle` flag + `emitProofBundle()` (tar + base64 + markers), called in both dry-run and write paths.
- `package.json` — `project:tower-mart:meridian:write-job` self-contained script.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in the changed file.
- Pass: dry-run with `--emit-proof-bundle` emits exactly one `__SEMANTIC2_PROOF_TGZ_BEGIN__`/`END` pair; the base64 payload decodes to a valid tar containing `projection-summary.json` + `mart.json` (verified by `base64 -d | tar -tzf -`).
- Pass: `jest src/lib/cio-tower/mart-projection/__tests__/` — 49/49 (unchanged; no library change).
- Prerequisite verified: Dockerfile runtime stage copies `src/scripts`, `src/lib`, `datasets/` — CLI + Meridian CSVs present in the image.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds the image with the new npm script. After deploy + runtime-invariant verification, the governed write becomes runnable:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<current-approved-digest> \
  --script project:tower-mart:meridian:write-job
```

The wrapper extracts the proof bundle (summary + mart JSON) from the job logs into its out-dir.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected (no web runtime change).
- Live signed-in proof required: after the governed write job runs and DB volumetrics are captured — not by this PR.

## Rollback Plan

Revert the PR. Additive flag + npm script; nothing references them until an operator runs the job.

## Audit Evidence

- Proof-bundle round-trip: `base64 -d | tar -tzf -` lists `projection-summary.json`, `mart.json`.
- PR URL: pending.

## Known Gaps

- The governed write itself has not run; no mart rows written, no DB volumetrics captured. That is the next operator step, gated on this PR's deploy.
- Real `tower_*` telemetry still not ingested for any tenant (usage/adoption remains gap-only).
