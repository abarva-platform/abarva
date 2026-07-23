# 2026-07-23-source-artifact-quality-public-caveats — Source Artifact Quality Public Caveats

## Release ID

`2026-07-23-source-artifact-quality-public-caveats`

## Status

`candidate`

## Plain-English Summary

Removes internal storage language from Source aVa artifact-quality caveats and makes the empty-artifact state actionable. The answer still explains the same evidence boundary, but now uses buyer-safe wording and names the required artifact-capture gap so the rendered packet can pass the public-language safety gate.

## Layer Impact

- `global-control-lane`: shared Source aVa answer wording changes for artifact-quality/lifecycle questions.
- Source aVa answer quality: caveats now say “accepted Source records” and “visible processing status” instead of exposing internal storage language.

## Client Applicability

- All clients: any Source artifact-quality aVa answer receives the safer wording.
- Specific clients: Apex Retail live proof route remains the validation target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/artifact-quality-governed-answer.ts`: updates caveat language and adds a high-severity missing-artifact-capture gap for no-data answers.
- `src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts`: asserts the answer passes the forbidden-language safety flag, includes the no-data gap, and does not include internal storage language.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts --runInBand` passed on 2026-07-23. Jest reported pre-existing duplicate manual mock warnings for mdast/micromark helpers.
- `npx eslint src/lib/source/ava/artifact-quality-governed-answer.ts src/lib/source/ava/__tests__/artifact-quality-governed-answer.test.ts` passed on 2026-07-23.
- `npm run release:check -- --base origin/main --head HEAD` passed on 2026-07-23.
- Live proof before this fix showed the answer packet was functionally restored, with `agent-answer`, chart/table artifacts, and tenant fence true, but `safety.forbiddenLanguagePassed` was false because public answer validation still saw an unsafe no-data/error shape.

## Rollout Plan

Merge through a governed PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. After deploy, run independent ACA runtime invariant and repeat signed-in Source/aVa proof for artifact quality.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned ACA deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required by the deploy workflow when worker images are updated.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and deploy through the repo-owned ACA main workflow. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5448.
- Failed pre-fix safety proof: `/private/tmp/source-artifact-registry-slug-or-fix-live-proof-202607230731`.
- Post-deploy invariant and signed-in proof: pending after merge/deploy.

## Known Gaps

This does not add OCR, transcription, vector indexing, enterprise-context promotion, or new artifact ingestion. It only hardens public-language safety for the existing artifact-quality answer packet.
