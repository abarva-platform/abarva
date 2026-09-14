# 2026-09-08-cloud-architecture-icon-packs — Cloud Architecture Icon Packs

## Release ID

`2026-09-08-cloud-architecture-icon-packs`

## Status

`candidate`

## Plain-English Summary

Adds official AWS and Microsoft Azure architecture icon source metadata and download tooling to the
repository so architecture diagrams, slide appendices, and implementation topology visuals can use a
shared vendor asset source with documented provenance without redistributing vendor ZIP packages.

## Layer Impact

`global-control-lane` documentation and architecture materials only. This change does not alter
tenant data, source adapters, the canonical model, product surfaces, runtime routes, or generated
client answers.

## Client Applicability

- All clients: Shared documentation asset source is available for reusable architecture visuals.
- Specific clients: None.
- Internal only: Primary use is internal diagram and presentation assembly.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/vendor-icons/README.md`
- `docs/architecture/vendor-icons/manifest.json`
- `scripts/architecture/download-vendor-icon-packs.mjs`
- `.gitignore`

## QA / Validation

- Pass: Downloaded both packages from the official vendor pages locally through the repository
  script.
- Pass: Verified SHA-256 hashes for both local ZIP files against the recorded manifest values.
- Pass: Verified both local ZIP archives with `unzip -tq`.
- Pass: Ran `npm run release:check`.

## Rollout Plan

Merge through the standard repository PR path. There is no runtime rollout, database migration,
feature flag, Azure Container Apps deployment, worker update, or traffic shift.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: Not applicable.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. This removes the vendor asset manifest, usage notes, download script, release record,
and ZIP ignore rule.

## Audit Evidence

- PR diff showing the manifest, download script, and provenance notes.
- `shasum -a 256 -c` output for both ZIP files.
- `unzip -tq` output for both ZIP files.
- `npm run release:check` output.

## Known Gaps

The vendor ZIP packages are not committed. Diagram authors should download and extract locally, then
commit only curated per-deliverable icons when a specific artifact needs them.
