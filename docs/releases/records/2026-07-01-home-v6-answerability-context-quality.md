# 2026-07-01-home-v6-answerability-context-quality — Home V6 Answerability and Context Quality

## Release ID

`2026-07-01-home-v6-answerability-context-quality`

## Status

`candidate`

## Plain-English Summary

Home now carries an explicit answerability and context-quality contract for every V6 Home KNOW answer. Home can distinguish direct context answers from caveated answers, planning-grade answers, data-thin answers, and module-owned questions that should move to Tower, Intelligence, Source, or Moves.

## Layer Impact

- `global-control-lane`: Adds shared Home KNOW response metadata and prompt controls for all tenants using the V6 Home route.
- `public-demo`: Improves demo behavior by making Home act as a context navigator and routing layer instead of over-answering module-owned questions.

## Client Applicability

- All clients: Yes, through the shared `/api/home/know/ask` V6 path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No, although demo tenants receive the immediate proof path.
- Feature flag: Existing Home executive synthesis flags still control Claude phrasing. The deterministic answerability/context-quality contract is always computed.

## Changes Included

- `src/lib/home/know/v6-home-ask.ts`: derives answerability classification and context-quality scoring from the selected V6 rows, gaps, citations, relationships, and handoff target.
- `src/lib/home/know/v6-home-know-response.ts`: exposes the fields on `HomeKnowResponse` and records them in the composer trace.
- `src/lib/home/know/home-know-contract.ts`: adds public optional Home answerability and context-quality types, and makes Source a first-class Home handoff target.
- `src/lib/home/know/home-v6-executive-synthesis.ts`: passes answerability/context quality into the Claude prompt as control data while keeping raw labels out of visible prose.
- Focused Home tests updated for answerability, planning-grade, data-thin, Source handoff, and synthesis prompt coverage.

## QA / Validation

- Passed: `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand`
- Passed: `npx eslint src/lib/home/know/v6-home-ask.ts src/lib/home/know/v6-home-know-response.ts src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/home-know-contract.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- Local full `tsc --noEmit` was attempted but blocked in this temporary worktree by missing dependency/type packages from the linked `node_modules` (`js-yaml`, Azure Document Intelligence, and axe Playwright). This is not caused by the Home files and should be validated again in CI with a clean install.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, wait for the new ACA revision to become healthy and receive 100% traffic, then run signed-in Home proof for Airline/SkyHarbor and Industrial/Lakeshore along with a focused answerability smoke.

## Deployment Authority

- Repo-owned deploy workflow: Required, `ACA main deploy`.
- Shared runtime mutators: None outside the normal ACA deploy.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker behavior changed, but the deploy workflow should keep worker image alignment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit or shift ACA traffic back to the prior healthy revision. No schema, migration, or data-plane rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI result: Pending.
- ACA revision/digest: Pending.
- Signed-in Home proof: Pending.

## Known Gaps

- This release adds contract metadata and prompt controls. It does not add the full Dimension 200 or Cross-Dimension 100 harness yet.
