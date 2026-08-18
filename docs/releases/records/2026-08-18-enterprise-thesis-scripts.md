# 2026-08-18-enterprise-thesis-scripts — npm entry points and result retrieval for the thesis build

## Release ID

`2026-08-18-enterprise-thesis-scripts`

## Status

`candidate`

## Plain-English Summary

Two additions needed before `build-enterprise-thesis.ts` can run as an ACA Job and produce a
result anyone can actually read afterward.

`data-build:enterprise-thesis:plan` and `:apply` npm scripts, matching the exact pattern used for
the orientation pack build — the ACA operator job wrapper only accepts `--script <npm-script>`,
not an arbitrary command.

The script also now prints its full result (signal packet, thesis, structural issues, verifier
results) to stdout wrapped in a unique marker, in addition to writing it to `--out-dir`. The
out-dir is inside the job's ephemeral container and is lost when the job exits; stdout is captured
into the job's log file by the operator wrapper regardless, so this is what makes the real
generated content retrievable after a run instead of existing only inside a container that no
longer exists.

## Layer Impact

Lane: `global-control-lane`. `package.json` and one generator script — a print statement, no
generation logic changed.

## Client Applicability

- All clients: no client-facing change.
- Specific clients: none.
- Internal only: yes — internal build tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `package.json` — two new script entries.
- `scripts/data-build/build-enterprise-thesis.ts` — result marker printed to stdout.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit` — PASS, 0 errors, genuine clean exit.
- `npx eslint` — PASS, 0 errors.
- `python3 -c "import json; json.load(open('package.json'))"` — PASS, valid JSON.
- Ran locally end to end (no API key, deterministic layers only): confirmed the marker line prints
  the complete, correctly-structured result JSON for SkyHarbor.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image containing these entries. First
execution of the EnterpriseThesis build — plan pass, then the acceptance-test review, then apply —
is tracked as a separate operational step once this image is live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR.

## Rollback Plan

Revert the commit. No data written by this change.

## Audit Evidence

PR link recorded at merge.

## Known Gaps

The actual generation and verification run — the point of adding these scripts — is tracked
separately as an ACA Job execution, once this image is deployed.
