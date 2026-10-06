# 2026-09-22-source-new-response-intake-status — Source New Response Intake Status

## Release ID

`2026-09-22-source-new-response-intake-status`

## Status

`candidate`

## Plain-English Summary

Source New now mounts a small internal response-intake panel when an event reaches the response stage. The panel lets an operator choose an already accepted fictional supplier, upload that supplier's synthetic response workbook through the existing governed artifact upload path, and read back upload, parser, and availability-review state separately.

The panel does not contact suppliers, invite respondents, score responses, approve evaluation, infer final acceptance, advance lifecycle state, or create an award recommendation.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4, Products: Source New gains a read-only projection and upload entry point inside the existing workspace. It projects accepted supplier authority, response-stage artifacts, normalized parser readback, and file-cabinet review state without owning the underlying data.

Layer 3 projection/readback: the page reads existing response artifact registry rows and normalized response packages. No schema, migration, canonical model write, or new parser is introduced.

## Client Applicability

- All clients: applies wherever Source New events and governed response artifacts are enabled.
- Specific clients: none.
- Internal only: the mounted intake surface is for sourcing operators.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Added `src/lib/source/new-workspace/response-intake.ts` to build the response-intake projection.
- Mounted the response-intake panel in `src/components/source/new-workspace/SourceNewWorkspace.tsx`.
- Wired `src/app/(maestro)/source/new/[eventId]/page.tsx` to read response-stage artifacts and normalized response packages fail-closed.
- Added focused behavior coverage in `src/lib/source/new-workspace/__tests__/response-intake.test.ts` and `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`.
- Added the helper test to the existing Source New workspace authority command in `.github/workflows/unit-suites.yml`.

## QA / Validation

- Red-first mounted behavior: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand --testNamePattern="mounts response intake"` failed before the panel was mounted because no `Vendor response intake` region rendered.
- Focused helper tests: `npx jest src/lib/source/new-workspace/__tests__/response-intake.test.ts --runInBand` passed, 3/3.
- Focused mounted workspace tests: `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand` passed, 53/53.
- Source New authority/workspace CI command: `npx jest --runTestsByPath ... src/lib/source/new-workspace/__tests__/response-intake.test.ts --no-coverage --ci` passed, 75/75.
- Mutation proof: changing the helper so any uploaded workbook counted as availability-reviewed made `does not treat an uploaded parsed workbook as availability-reviewed` fail; the guard was restored and the suite passed again.

## Rollout Plan

Open a PR, merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image. No migration, data-build job, or manual tenant-data operation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: pending repo-owned deploy after merge.
- ACA runtime invariant: pending repo-owned deploy after merge.
- Worker image invariant: pending repo-owned deploy after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deploy, for the Source New response-stage workspace. Local tests and PR checks are not signed-in acceptance.

## Rollback Plan

Revert the PR. The rollback removes only the mounted panel and read projection wiring; uploaded artifacts, parser output, existing reviews, and supplier authority records remain untouched.

## Audit Evidence

- PR URL: pending.
- Local red-first and focused Jest output.
- Mutation proof output for the availability-review guard.
- Release check output, typecheck output, scoped ESLint output, and coverage census output to be recorded before merge.

## Known Gaps

- No signed-in acceptance, deployment, ACA runtime invariant, or data-plane mutation is claimed by this candidate.
- The existing upload route records the selected supplier name through the existing vendor-name field; this release does not add a new supplier-id persistence contract.
- Evaluation scoring, BAFO, supplier communications, award, legal, security, finance, and final-acceptance workflows remain out of scope.
