# 2026-08-03-home-tower-claude-narrative — Home Narrative Sourced from Validated Tower Claude Advisory

## Release ID

`2026-08-03-home-tower-claude-narrative`

## Status

`candidate`

## Plain-English Summary

The AI Success Command Center's hero headline, decision table, and portfolio/evidence-gap panels were sourced from hand-written placeholder copy, not from the Claude-generated business narrative the pipeline already produces. Separately, the one existing attempt to generate that narrative (`run_tower_claude_layer.mjs`, output-only, not tracked in git) had been auto-rejected by its own validator due to two bugs: the claim-language checks ran over the raw serialized JSON blob instead of prose text (catching structural artifacts, not real overclaims), and there was no negation guard, so a correct sentence like "none are realized value" tripped the same rule as an actual overclaim. This change fixes both validator bugs, adds a required-field blank-value check, re-runs the generator against the local dataset to a clean pass, and wires the validated result into Home. It also adds a real-data-bound architecture flow diagram (source systems → integration → transformation → data platforms → AI outcomes) alongside the existing node/edge explorer, and fixes two navigation links that pointed at generic module landing pages instead of the specific filterable architecture table.

## Layer Impact

Lane: `global-control-lane`.

Products: Home surface only. No change to canonical model, source adapters, tenancy, loaders, or context/corpus governance. The regenerated narrative is a new static JSON snapshot checked into the same location as the existing `architecture-advisory-result.json`; it is not a live database read.

## Client Applicability

- All clients: Yes, for users who can access the Home command center (currently SkyHarbor Global dataset only).
- Specific clients: SkyHarbor Global (synthetic fixture tenant).
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/home/readSkyHarborAiSuccessHome.ts` — source hero headline/lead, leadership decisions, portfolio-choice priorities, and evidence gaps from the Tower Claude advisory result instead of hardcoded copy; add a real-data-bound flow-diagram builder; add module-route mapping for decision/finding destination links.
- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx` — render the sourced hero copy; make the decision-table destination and the top explorer link real `next/link`s; add the new architecture flow diagram and investment-priority/evidence-gap panels.
- `src/components/home/ai-success-command-center/ArchitectureFlowDiagram.tsx` (new), `ArchitectureFlowDiagram.module.css` (new) — swim-lane diagram bound to real graph/packet data (real vendor/product names, real cost figures, real edge-degree counts; zero decorative/placeholder values).
- `src/lib/home/ai-success-data/tower-advisory-result.json` (new) — validated output of the fixed `run_tower_claude_layer.mjs` generator (not itself tracked in git; lives in the gitignored `out/` tree).

## QA / Validation

- Pass: `npx tsc --noEmit` scoped to all touched files (full-project `tsc` crashes locally with a stack overflow in this checkout unrelated to this change — zero `error TS` lines emitted; CI is authoritative for the full-project check per existing project practice).
- Pass: `npx eslint` on all touched files, exit code 0.
- Pass: re-ran `run_tower_claude_layer.mjs` end to end against the local dev database after the validator fix — `status: passed`, zero validation issues, zero blank required fields.
- Pass: scripted verification that every flow-diagram box across all 5 stages has a non-blank title/subtitle/tag, and that AI-tool boxes are deduplicated by name (no repeated tool across boxes).
- Not done: live signed-in browser proof. This candidate was built and validated in an isolated worktree without a working local Clerk sign-in path; no claim is made that the page renders correctly on screen.

## Rollout Plan

Merge the PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime. No migration, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned main deploy workflow.
- ACA runtime invariant: Verify after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — Home route visual check after deployment, explicitly not yet performed.

## Rollback Plan

Revert this PR's commit and merge through the same repo-owned deployment workflow. No data or schema rollback is required; the regenerated JSON snapshot is a static file with no downstream writers.

## Audit Evidence

- PR URL: Pending (opened alongside this record).
- CI/release validation: Pending.
- ACA deployment run: Pending.
- Signed-in Home route proof: Pending — explicitly not captured before this record was written.

## Known Gaps

- Live signed-in browser verification has not been performed (see QA/Validation above) — recommend a manual check before or immediately after deploy.
- True external industry/peer benchmarking ("what other airlines do") is not covered by this change; the content added here is enterprise-specific recommendation (portfolio choices, evidence gaps), not peer/market comparison. A separate, real peer-benchmark dataset would be required for that.
- The validator fix lives in `run_tower_claude_layer.mjs` under the gitignored `out/` tree, not in a tracked `scripts/` location — if that generator is regenerated fresh from some other process, the fix could be silently lost. Recommend relocating the generator script into a tracked path in a follow-up.
