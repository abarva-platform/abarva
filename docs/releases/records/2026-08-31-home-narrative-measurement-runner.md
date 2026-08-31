# 2026-08-31-home-narrative-measurement-runner -- Home Narrative Measurement Runner

## Release ID

`2026-08-31-home-narrative-measurement-runner`

## Status

`candidate`

## Plain-English Summary

The Home narrative measurement command now runs through the same CLI-safe server-only preload used by other repository scripts. The manual measurement workflow also maps the configured Anthropic admin secret into the environment variable expected by the script, so the workflow can exercise the model-backed Home quality run instead of failing before generation starts. The chapter builder also attaches the governed Home page prompt contracts to the generated signal packet before measuring or publishing chapters, preventing the run from silently falling back to generic chapter lenses.

## Layer Impact

Layer 4 products: this changes Home proof tooling for narrative quality measurement only. It does not change product routes, visible page content, tenant data, projections, serving views, or runtime data-plane state.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: Applies to internal Home narrative quality and provenance measurement runs.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `package.json` updates `data-build:home-chapters:plan` and `data-build:home-chapters:measure` to use the CLI server-only preload.
- `.github/workflows/home-narrative-quality-measurement.yml` maps the available Anthropic admin secret into `ANTHROPIC_API_KEY` for the measurement command.
- `scripts/data-build/build-home-chapters.ts` attaches the Home page prompt contract to the signal packet used by chapter measurement and publication, and reports the resolved contract count in the measurement artifact.

## QA / Validation

- Pass: `npm test -- --runTestsByPath scripts/data-build/__tests__/home-lens-quality.test.ts`
- Pass: local CLI smoke for `scripts/data-build/build-home-chapters.ts --measure-quality` reaches the script-level missing-key guard instead of failing on `server-only`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: local model-backed measurement run confirms `lens sources: full_contract for every chapter`, with 16 page prompt contracts attached to the signal packet.
- Finding: the same measurement run still reports generated-output quality failures, including 5 baseline must-not-do violations, 5 width must-not-do violations, and 1 width+budget must-not-do violation. This PR makes the measurement truthful; it does not approve the generated prose for publication.
- Pending: GitHub workflow dispatch after merge, using repository-managed secrets.

## Rollout Plan

Merge through the normal PR path. No Azure Container Apps deploy, data migration, tenant load, or route cutover is required for this proof-tooling change.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the package script and workflow environment mapping. Since no runtime data or route state changes, rollback is code-only.

## Audit Evidence

Inspect the PR diff, the Home lens quality test output, the local CLI smoke output, the local model-backed measurement artifact, and the post-merge workflow dispatch result.

## Known Gaps

The workflow still depends on repository-managed Anthropic secret availability. This change wires the command path and prompt-contract attachment; it does not publish or approve generated Home narrative content. The current measured output still needs prompt and claim-routing improvement before it is suitable for a CXO-facing Home refresh.
