# 2026-07-17-intelligence-vertical-followups-fix — Intelligence Briefing Vertical + Suggested-Question Fix

## Release ID

`2026-07-17-intelligence-vertical-followups-fix`

## Status

`candidate`

## Plain-English Summary

A live signed-in audit of the Intelligence page against Healthcare Demo (Meridian) found the right-hand briefing canvas showing "Diversified Industrials" content — AP/invoice automation, treasury AI, portfolio-company language — instead of healthcare content, and the suggested-question strip staying on those same static industrial prompts even after aVa returned real healthcare-specific followups. Both were caused by `AdvisoryIntelligencePage.tsx` treating every tenant except SkyHarbor as one undifferentiated "generic industrial" bucket, and by a client-side event-ordering bug that let an empty field silently overwrite good data. This release fixes both, plus widens the chat/table split so typed table answers have more room before wrapping to a horizontal scroll.

## Layer Impact

- `global-control-lane`: `AdvisoryIntelligencePage.tsx` is shared UI for every tenant using the Intelligence advisory surface; this changes shared component behavior, not tenant data.

## Client Applicability

- All clients: yes — every tenant now gets vertical-appropriate briefing content instead of only SkyHarbor being differentiated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`:
  - Replaced the `isAirline` boolean binary in `buildCorpusBriefing()` with a `VERTICAL_CONTENT_PACKS` map keyed by `clientKey`, covering all 6 demo tenants (Healthcare, Financial Services, Clinical Technology, Retail, Global Airline, Diversified Holdco) plus a vertical-agnostic `FALLBACK_PACK`. The vertical label itself now reads from the existing canonical `getClientOption(clientKey).vertical` (`src/lib/client-config.ts`) instead of a hardcoded string.
  - Fixed the `agent-answer` SSE event handler so it only overwrites a message's `followups` with the answer packet's `nextSteps` when that list is non-empty, instead of unconditionally clobbering followups already set by the earlier, dedicated `followups` event.
  - Bumped the Intelligence chat/canvas split (`defaultLeftPercent` 32→40, `minLeftPx` 300→380) so typed table packets get more width before scrolling horizontally.
  - Follow-up polish after live proof: removed the remaining shared-panel hardcodes that still said "Industrial-sector AI investment", "shared services", "diversified industrials", and procurement-specific value labels for non-industrial tenants. These labels now render as vertical-derived or vertical-neutral copy.

## QA / Validation

- Pass: `npx eslint src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` (clean, no warnings).
- Pass: post-deploy focused proof after PR #4949 confirmed Healthcare vertical and healthcare followups were fixed, but found one remaining hardcoded "Industrial-sector AI investment" label in the shared Outlook panel. Follow-up polish in this release record removes that residual hardcode.
- Pass: `npx tsc --noEmit -p .` — verified clean for this file on an earlier, equivalent copy of this same change (0 errors on `AdvisoryIntelligencePage.tsx`, only 7 pre-existing unrelated errors in an untouched test file). Re-running `tsc` against this exact worktree crashed with a native Node/V8 SIGABRT, a known pre-existing local-machine issue unrelated to this change (see `feedback_tsjest_misses_type_errors` prior finding) — CI's typecheck is authoritative.
- Pass (pre-existing, unaffected): `npx jest src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx` fails identically with and without this change (`Trends` tab / "Opportunity map" query) — confirmed pre-existing on both this branch and a clean `origin/main` checkout, not introduced or worsened by this fix.
- Not run: live signed-in browser verification. Local dev environment has no valid Clerk session/credentials configured, so `/intelligence` and `/sign-in` both redirect to the public homepage — this could not be exercised end-to-end locally. The original finding was itself a live signed-in audit (`abarva-intelligence-ai-trends-audit-2026-07-17/final-audit-report.md`); re-running that same crawl after this deploys is the recommended live proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job — pure client-side/UI logic change.

## Deployment Authority

- Repo-owned deploy workflow: required (shared web image).
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable (no worker change).
- Feature/env flag update path: none.
- Live signed-in proof required: yes — re-run the same audit crawl (or equivalent) against Healthcare Demo and at least one other non-airline tenant post-deploy to confirm the briefing canvas and suggested questions are vertical-correct and stay in sync with live followups.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- Source finding: `abarva-intelligence-ai-trends-audit-2026-07-17/final-audit-report.md`, `audit-results.json` (live crawl against `https://app.abarva.ai/intelligence?client=meridian`, Healthcare Demo session).
- This PR's diff.
- ACA main deploy run after merge.
- Post-deploy live signed-in re-audit (recommended, not yet performed).

## Known Gaps

- Chart-generation inconsistency (2 of 10 explicit chart-request prompts in the audit returned tables only, no chart artifact) is a separate, deeper issue: `src/lib/ava-answer/cxo-quality-gate.ts` already detects a missing requested chart but only records it as a `severity: "warning"` finding — there is no retry/regeneration enforcement. Diagnosed but intentionally not fixed in this release; it touches the core answer-generation pipeline shared by every CXO answer mode, not just Intelligence, and needs its own scoped design/QA pass.
- Split-pane table width was widened but not re-verified live (no local auth); if 40%/380px still feels cramped for wide tables, that's a follow-up tuning pass, not a regression from this change.
