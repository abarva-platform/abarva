# 2026-08-12-source-responses-decision-agenda — Source Responses decision agenda

## Release ID

`2026-08-12-source-responses-decision-agenda`

## Status

`candidate`

## Plain-English Summary

The proposal intelligence brief on the Source Responses stage told a buyer how much work the system had done, not what to do about it. Its headline tiles counted activity — challenges found, BAFO asks generated, "decision view: 9" — and its three supporting lists were flat strings of file locators such as "vendor-a-main-response.pdf paragraph 2 - SLA response". A reader could not tell which item to act on first, which ones stop a score being given, or which commercial claims were actually backed by evidence.

The brief now leads with a ranked decision agenda. Every open item is shown with what review found, its impact signal, how it affects scoring, the ask to put to the vendor, and the evidence behind it. Score-blocking items sort above leverage-only items, and higher severity sorts above lower.

The headline tiles now report decision counts: how many open items block a score, how many are leverage only, how much of the commercial impact is evidence-backed versus only worth testing, how many vendors are ready to score, and how many packages are cited.

No new data is produced. Every field is carried through from a challenge, a leverage seed, or a BAFO question that the stage already computed, along with the evidence label that model already attached.

Two honesty fixes are included:

- The three supporting lists silently truncated to seven or eight entries and then displayed the truncated length as the count. "Missing before score lock: 8" was shown when 18 items existed. The lists now report the true total and state how many are not shown.
- Two agenda columns were initially labelled "What it is worth" and "What it blocks". The underlying `estimatedImpact` and `scoringDisposition` fields hold qualitative prose, not amounts, and a disposition sometimes reads "can be scored with caveats" rather than a blocking statement. The columns are labelled "Impact signal" and "Scoring disposition" so the header does not promise a number or a blocking claim the data does not contain. Impact that is not high-confidence is marked "Test, do not book".

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source UI only. One existing Responses-stage panel is restructured; a new pure read-model builder joins three models the stage already computes.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the Source Responses-stage canvas receive the change after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/vendor-response-decision-agenda.ts` (new read-model builder)
- `src/components/source/canvas/responses/VendorResponseIntelligenceBrief.tsx`
- `src/lib/source/__tests__/vendor-response-decision-agenda.test.ts` (new)
- `src/components/source/canvas/responses/__tests__/VendorResponseIntelligenceBrief.test.tsx`

## QA / Validation

- `npx jest src/lib/source/__tests__/vendor-response-decision-agenda.test.ts src/components/source/canvas/responses` — 11 suites, 23 tests passed.
- New tests pin: score-blocking items rank above leverage-only ones; the two counts sum to the total without losing items; evidenced and test-only impact partition the leverage seeds; every emitted item carries a finding, an ask and a disposition; impact stays null rather than being invented; the builder falls back to the challenge log when no BAFO pack exists.
- Rendered the panel against the real event server-side and read the output before shipping. Result: 4 blocks-a-score, 4 leverage-only, 4/8 evidenced impact, 0/3 ready to score, 3/3 cited packages, and a six-row agenda with per-row evidence locators.
- `npx eslint` on all changed files — clean.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc -p tsconfig.json --noEmit` — clean.
- `git diff --check` — clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see PR body.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, migration apply, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the deploy workflow updates worker jobs with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The Responses stage must show the ranked agenda with per-row evidence and decision-count tiles.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior brief. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Local focused test, lint, typecheck, and server-side render output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in Responses-stage screenshot required after merge.

## Known Gaps

- The agenda shows the top six items and states the remainder; the full log stays in the challenge and BAFO panels below. This is a stated cap, not a silent one.
- A BAFO question's `priority` and its `scoringDisposition` can disagree — an item can be on the must-resolve list while its disposition reads "can be scored with caveats". Both are displayed side by side rather than one being suppressed. Reconciling the two in the underlying model is not attempted here.
- Impact signals remain qualitative. Nothing in this change converts them into monetary amounts, and nothing should book them as savings before a vendor prices them.
- No new persistence, parser production ingestion, scoring persistence, vendor communication dispatch, or approval automation is introduced.
