# 2026-08-12-source-responses-readiness-from-parsed-profiles — Source Responses readiness from parsed profiles

## Release ID

`2026-08-12-source-responses-readiness-from-parsed-profiles`

## Status

`candidate`

## Plain-English Summary

The Source Responses stage reported two different vendor populations at once. One panel said three vendor packages had been received and parsed with parser citations against them, while the package cockpit and the file-readiness ledger on the same screen said no vendor packages were bound and no response files were loaded. A buyer could not tell which statement was true.

The cause was two independent read paths. The vendor-response completeness model resolved its vendors by exact event id against a fixed table of demo events, so any event outside that table returned zero vendors. The parsed profile model resolved an event by id, code, name or account, so it returned the real vendors. Panels fed by the first model showed an empty stage; panels fed by the second showed the real one.

The completeness model now falls back to the parsed profile set when the fixed table has no entry for an event. Events already in the table keep their existing data exactly. Nothing new is persisted, no parser ingestion is added, and no vendor content is invented: a section counts as submitted only where the parser actually found it, and sections it could not find stay missing.

Two defects surfaced once the ledger rendered real rows on this event and are fixed in the same change:

- The "next action" on a required file row showed the vendor's first blocker regardless of which file that blocker concerned, so an incomplete transition plan appeared as the next action on the main proposal and pricing rows. Blockers are now matched to the row they belong to.
- The "Cited items" summary summed per-row citation counts, but those counts overlap by design — the main proposal row counts every reference for a vendor and the other rows re-count their own subsets. The summary reported 62 cited items where 32 distinct references exist. It now counts distinct references per vendor.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source UI and the Source read-model derivation feeding it. The Responses stage now reports one vendor population instead of two.
- Canonical model: No change. No schema, migration, or persisted record is touched.
- Source adapters: No change. No new parser ingestion path.
- Client intake: No change.

## Client Applicability

- All clients: Yes. Any event with parsed vendor profiles and no seed-table entry will now populate the Responses cockpit, file-readiness ledger, status cards, and forward gate from those profiles instead of showing empty states.
- Specific clients: None singled out.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/vendor-response-completeness-from-profiles.ts` (new adapter)
- `src/lib/source/vendor-response-completeness.ts` (export the canonical required-section list)
- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/components/source/SourceActiveStageWorkspace.tsx`
- `src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx`
- `src/lib/source/__tests__/vendor-response-completeness-from-profiles.test.ts` (new)
- `src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/responses src/lib/source/__tests__/vendor-response-completeness-from-profiles.test.ts` — 11 suites, 22 tests passed.
- New tests pin the behaviour that matters: seeded events keep their seed; derived submitted sections are always a subset of required sections; a section the parser marked missing is never reported as submitted; blockers are not attributed to unrelated rows; the cited-items summary never exceeds the distinct reference count.
- Rendered the ledger against the real event server-side before shipping and read the output: 3 vendors, 21 rows, required 4/6 done, 2 open, 32 distinct cited items, per-row parse states matching each vendor's profile.
- `npx eslint` on all changed files — clean.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc -p tsconfig.json --noEmit` — clean. (The default heap OOMs on this repo locally; the larger heap is required to complete the check.)
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.
- Pre-existing unrelated failures: 8 suites / 20 tests under `src/lib/source/__tests__` fail identically on a clean `origin/main` checkout (artifact binding matrix, ava intake response parts, gate auto assessment, nexus api live context, source governance enforcement, stage next move, stage progression). Verified by stashing this branch's changes and re-running. Not introduced here and not addressed here.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, migration apply, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the deploy workflow updates worker jobs with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The Responses stage must show the same vendor count in the cockpit, the file-readiness ledger, and the long-response intake panel.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior UI. The Responses stage returns to its previous behaviour, including the empty-state mismatch. No database rollback is required, because nothing is persisted.

## Audit Evidence

- PR URL: pending.
- Local focused test, lint, typecheck, and server-side render output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in Responses-stage screenshot required after merge.

## Known Gaps

- The forward gate and completeness panel now evaluate real vendors on these events instead of rendering an empty state. That is the intended correction, but it means gate readouts change for any event that previously fell outside the seed table. Reviewers should confirm the gate readout on a demo event after deploy.
- `receivedAt` is not recoverable from a parsed profile and is reported as unknown rather than guessed.
- The ledger's "Cited items" and the long-response intake panel's "Parser citations" count different things — distinct evidence references on parsed profiles versus citations produced by the parse-report pipeline — and are labelled accordingly. Reconciling the two counting bases is not attempted here.
- No new persistence, parser production ingestion, scoring persistence, vendor communication dispatch, or approval automation is introduced.
