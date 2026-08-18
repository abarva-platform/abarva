# 2026-08-18-home-orientation-pack-scripts — npm entry points for the orientation pack build

## Release ID

`2026-08-18-home-orientation-pack-scripts`

## Status

`candidate`

## Plain-English Summary

Adds two npm scripts, `data-build:home-orientation-pack:plan` and
`data-build:home-orientation-pack:apply`, so `scripts/data-build/build-home-orientation-pack.ts`
can be invoked by name inside a container — required because the ACA operator job wrapper
(`scripts/ops/submit-aca-operator-job.mjs`) only accepts `--script <npm-script>`, not an arbitrary
command. `:plan` runs the script's existing dry-run default (build and validate, do not write).
`:apply` sets `HOME_PACK_WRITE=true HOME_PACK_WRITE_APPROVED=true`, the two-flag gate the script
already requires before it writes.

No behavior in the script itself changes. This is the packaging needed to run it as an ACA Job per
`docs/ops/aca-data-build-job-rule.md`, ahead of populating the orientation pack for the first time.

## Layer Impact

Lane: `global-control-lane`. `package.json` only — no source, no schema, no runtime behavior
change for any existing script.

## Client Applicability

All clients: no client-facing change. Internal build tooling only.

## Changes Included

- `package.json` — two new script entries.

## QA / Validation

- `python3 -c "import json; json.load(open('package.json'))"` — PASS, valid JSON.
- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors (unaffected by this change).
- Not independently tested by running `npm run data-build:home-orientation-pack:plan` locally,
  because this environment has no `DATABASE_URL` and no route to the VNet-private Postgres
  instance. First execution will be the ACA Job run this PR unblocks.

## Rollout Plan

Merge to `main`. The ACA main-deploy workflow builds a new digest-pinned image containing these
script entries. The orientation pack build then runs as an ACA Job against that image, per the
required job contract in `docs/ops/aca-data-build-job-rule.md`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` builds the image this PR's
  scripts will run inside; it is not itself invoking a mutating data build.
- Shared runtime mutators: none directly from this PR. The follow-on ACA Job run (tracked
  separately, see Known Gaps) writes to `public.home_knowledge_packs` and must use the
  digest-pinned image this deploy produces.
- Live signed-in proof required: not for this PR; required for the follow-on job run before Home's
  orientation content can be called live-proven.

## Rollback Plan

Revert the commit. No data written by this change.

## Audit Evidence

PR link recorded at merge.

## Known Gaps

This PR only adds the entry points. The actual population run — plan pass, review, apply pass,
readback verification — is tracked and evidenced separately as an ACA Job execution, per the job
contract's requirement to record job name, run id, tenant scope, build version, and proof location.
