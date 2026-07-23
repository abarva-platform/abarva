# 2026-07-23-home-knowledge-v4-visual-contract — Home Knowledge Visual Contract

## Release ID

`2026-07-23-home-knowledge-v4-visual-contract`

## Status

`candidate`

## Plain-English Summary

Home Knowledge generation and rendering now treat executive visuals as a governed contract, not a generic fallback. Claude must author compact, C-suite-readable visual specifications from a closed vocabulary, separate tenant facts from industry patterns, and describe industry realization patterns for use cases without presenting them as tenant achievements. The Home dimension page now preserves those authored visual specifications and renders compact Recharts-based visuals instead of showing the same generic chart across dimensions.

Follow-up hardening after the first Meridian single-dimension ACA run makes the Claude prompt contract explicit for every visual-like object and every use-case object. Claude must now provide all required visual fields (`visual_type`, title, executive question, classification, data points, encoding, annotation, evidence boundary, and empty state), and every qualified candidate, foundation, and early idea must carry the grounding fields the validator enforces. The change also makes generated dimension proof file names stable and readable for the expanded catalog.

Second-pass hardening after the full Meridian 38-dimension ACA run corrects the V4 validator so relationship graph objects are validated by their `visual_type: relationship_graph`, not only by the literal object key `graph_display_contract`. The prior validator incorrectly applied normal chart required fields to nested relationship-graph contracts and produced false visual-field findings even when Claude authored relationship graph semantics.

## Layer Impact

- `global-control-lane`: Updates shared Home Knowledge generation prompts, review tooling, and Home dimension rendering for all tenants that use approved Home packs.
- `client-data-lane`: No data is migrated by this PR. Future pack generation runs will use the updated prompt contract when creating candidate or approved Home Knowledge content.

## Client Applicability

- All clients: Applies to any tenant whose Home Knowledge pack is generated or rendered through this code path.
- Specific clients: Synthetic demo tenants benefit when their packs are regenerated after this release.
- Internal only: The V4 review generator is review tooling and does not write production data unless explicitly run with its write flag.
- Public/demo only: None.
- Feature flag: Existing Home routing/flags remain unchanged.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`: Tightens Claude prompt contract for visual types, use-case industry realization, and dimension visual specifications.
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: Adds V4 candidate-review generator with closed classification and visual vocabularies.
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: Follow-up hardening aligns prompt instructions with the deterministic validator for visual fields and use-case grounding fields, and replaces alphabetic dimension proof suffixes with zero-padded numeric suffixes for the 38-dimension catalog.
- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: Validates any `relationship_graph` visual with the relationship graph field contract, whether it appears as `graph_display_contract` or as a nested relationship visual object.
- `src/lib/home/home-knowledge-design-contract.ts`: Preserves authored dimension visual specifications in the Home read model.
- `src/components/home/HomeEnterpriseBriefApp.tsx`: Renders dimension visuals from the authored contract and shows use-case cards with industry pattern plus client context.

## QA / Validation

- PASS: `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- PASS: `node --check scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
- PASS: `npm run home:knowledge-v4:review-job:meridian -- --packet-only --out-dir=/tmp/home-v4-visual-contract-packet-meridian`
- PASS: `./node_modules/.bin/eslint src/components/home/HomeEnterpriseBriefApp.tsx src/lib/home/home-knowledge-design-contract.ts`
- PASS: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `npm run release:check` after this release record was updated.
- OBSERVED: Meridian single-dimension ACA review job completed on image `acrabarvalab001.azurecr.io/abarva/web@sha256:79ec2676cdf3363caa6be469700248cde599644f87357e46ea2564e99fd2474e` but correctly returned `candidate_failed` because Claude omitted required fields in several visual contracts and use-case objects. That output is review evidence only and was not loaded or approved.
- OBSERVED: Meridian full 38-dimension ACA review job completed on image `acrabarvalab001.azurecr.io/abarva/web@sha256:e2a4a868934476bbe1cbb735d114d32d276bcb4818774b8bd46dcafe17a77349` and returned `candidate_failed` with `visuals=298, findings=80`. The run proved all 38 dimensions can be generated, but exposed validator drift for nested relationship graphs. No generated content was loaded or approved.
- NOT RUN: New all-tenant Claude V4 content generation/load. The latest content audit found the existing V4 candidate archive is not load-ready because it has fail-open review status, incomplete expanded dimensions, prose-only tab payloads, unconstrained visual payloads, raw technical leakage, use-case schema drift, and ungoverned external-industry provenance.
- NOT RUN: Azure/Postgres publication. This PR intentionally ships the stricter generator, candidate validator, and renderer contract only.
- PENDING AFTER DEPLOY: signed-in Home Knowledge browser proof on `https://app.abarva.ai` after the normal ACA deployment lands.

## Rollout Plan

Merge through PR to `main`. The normal ACA main deploy workflow builds and deploys the updated app image. Existing approved Home packs remain readable; regenerated packs will use the stricter prompt contract.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home Knowledge dimension page on the deployed app.

## Rollback Plan

Revert the PR and redeploy the previous ACA image. Approved Home pack data is not modified by this PR, so rollback is code-only unless a separate data-generation job is later run.

## Audit Evidence

- PR URL and CI checks.
- ACA deploy run, revision, digest, traffic, and health proof.
- Candidate preview HTML/PNG generated from the revised prompt contract.
- Signed-in browser screenshot of a Home Knowledge dimension page after deploy.

## Known Gaps

This PR updates prompt contract, fail-closed candidate validation, and rendering. It does not approve or load regenerated synthetic tenant packs into Azure/Postgres. A governed data-build job is still required before any regenerated candidate content becomes an approved Home pack.

The current V4 candidate archive remains review-only and must not be loaded until the generator produces:

- candidate status `candidate_review_ready` only when Claude coherence recommends approval and no high-severity finding remains;
- authored content for the full expanded explorer catalog, not just the 19 legacy dimensions;
- typed Summary/Data/Relationships/Gaps/Evidence tab objects;
- visual contracts using the closed renderer enum only;
- no client-visible raw row, record, node, edge, file, source-ID, or internal table/path leakage;
- one enforced use-case schema with industry realization labeled as `industry_pattern`;
- external-industry provenance or an explicit directional evidence boundary.
