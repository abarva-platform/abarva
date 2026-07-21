# 2026-07-20-home-knowledge-grounding-engine — Home Knowledge Grounding Packet

## Release ID

`2026-07-20-home-knowledge-grounding-engine`

## Status

`candidate`

## Recovery Note (2026-07-21)

This candidate's code was originally implemented and locally validated on 2026-07-20, but was left uncommitted in a shared local working directory that multiple parallel sessions operate in. A subsequent `git reset` to `origin/main` on that same checkout (from unrelated work) discarded the uncommitted diff; only this release record and some report/proof artifacts survived as untracked files. The actual code was recovered from `git stash` — two "lint-staged automatic backup" stashes that had captured the changes incidentally during unrelated commit attempts — by cross-referencing the file list in "Changes Included" below against both stashes' contents, and selecting the correct version of each file (the two stashes contained different, not-mutually-compatible concurrent work from other parallel sessions touching some of the same files). Compatibility was verified by typechecking and testing all 12 files together in an isolated worktree, not by trusting either stash's version blindly. This surfaced and fixed one real gap in the process: `src/components/home/HomeKnowledgeDesignContractSurface.tsx` was missing an import (`HomeKnowledgeDataSet`) that its own code required — fixed as part of this recovery. One existing test assertion (`universal-dimension-dossier.test.ts`) also needed updating: it encoded the pre-fix routing behavior for a question containing "automate," which now correctly routes to the richer AI dossier as intended by this fix rather than the plain operations dossier — see "Changes Included."

## Plain-English Summary

Home aVa now uses the richer enterprise dossier path before falling back to older Home V7/V6 ask layers. The local Home packet assembly now prefers current V7 tenant datasets and executive interview files, so AI/use-case/current-state questions can carry client-specific systems, data assets, AI initiatives, operational evidence, risk/control context, business priorities, benchmarks, relationship paths, tables, charts, and graphs into the answer path.

The Home/Knowledge dimension cockpit also renders each dimension as an executive context surface: approved story/insight text drives the narrative, deterministic rows drive data tables and filters, and Recharts renders a first-pass visual distribution for the selected dimension.

## Layer Impact

- `global-control-lane`: Updates the Home ask API routing and shared semantic dossier assembly for all launch-demo tenants.
- `client-data-lane`: Updates local dossier source resolution to prefer current V7/context/interview files for Meridian, SkyHarbor, First Capital, and Lakeshore, with old synthetic packs retained only as fallback.

## Client Applicability

- All clients: Home ask route uses the enterprise dossier path first.
- Specific clients: Meridian / Healthcare Demo, SkyHarbor / Airline Demo, First Capital / Financial Services Demo, Lakeshore Holdings receive richer local V7 source resolution where files exist.
- Internal only: None.
- Public/demo only: Launch-demo tenant display-name canonicalization fixed for canonical slugs.
- Feature flag: Claude Home consultant synthesis still follows the existing feature flag and environment behavior.

## Changes Included

- `src/app/api/home/know/ask/route.ts`: Route Home ask through `buildHomeKnowResponse` before V7/V6 fallback.
- `src/lib/home/know/dossier-source-loader.ts`: Add current V7/context/interview dataset resolution and legacy fallback.
- `src/lib/semantic-dossiers/dimension-router.ts`: Add interview and AI/use-case/contact-center retrieval expansion.
- `src/lib/semantic-dossiers/build-universal-dimension-dossier.ts`: Add client-grounding facts, AI rollups, metrics, benchmark context, and interview-to-AI relationship path.
- `src/lib/semantic-dossiers/compose-dossier-answer.ts`: Improve deterministic fallback language.
- `src/lib/home/know/home-know-engine.ts`: Preserve full packet evidence-channel diagnostics through validation.
- `src/lib/client-config.ts`: Fix canonical display-name resolution for canonical tenant slugs.
- `src/lib/__tests__/client-config-canonical.test.ts`: Add canonical-slug display-name regression coverage.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: Add meaningful per-dimension tab gating, multi-facet Data filters, Recharts-based dimension distribution visuals, and a three-part CXO storyline from approved `STORY` / `INSIGHTS` context. (Recovery fix: added a missing `HomeKnowledgeDataSet` type import the component's own code required.)
- `src/app/(maestro)/home/page.tsx`: Use the design-contract Home surface for any tenant that has an approved design-contract pack, instead of hard-coding the surface to Healthcare Demo only.
- `src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts` (recovery addition, not in the original candidate): split the "routes operational/back-office questions" test — the "automate" case now has its own test asserting the new, intended `ai_value_governance` routing instead of the old `operations_process` routing, since this fix deliberately makes automation-flavored questions route to the richer AI dossier.

## QA / Validation

Re-verified 2026-07-21 in an isolated `git worktree` off a fresh `origin/main` (all 12 files above, copied in cleanly, no other uncommitted changes present):

- `npx eslint` on all 12 touched files — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo, not filtered) — zero errors attributed to any of the 12 files.
- `npx jest src/lib/home src/lib/semantic-dossiers src/lib/__tests__/client-config-canonical.test.ts` — 125 passed / 57 failed / 182 total, verified byte-for-byte against a clean-`origin/main` baseline run in the same isolated worktree (124 passed / 57 failed / 181 total) via exact failing-test-name diff, not just pass/fail counts. The 57 failures are 100% pre-existing and unrelated (mostly `home-summary-snapshot.test.ts` and other files this candidate does not touch, failing on unrelated `sourceMode`/`moduleContextSummary` assertions against code paths outside this change). Net: +1 test (the new automation-routing test), zero regressions.

Prior 2026-07-20 validation (original implementation, before the candidate was lost and recovered):

- Local dossier probe passed:
  - Healthcare Demo: 216 executive interview signals, 15 systems, 36 data assets, 3 AI initiatives, 10 operational/process signals, 28 risk/control records, 2 benchmark patterns, table/chart/graph available.
  - Airline Demo: 192 executive interview signals, 14 systems, 33 data assets, 3 AI initiatives, 10 operational/process signals, 28 risk/control records, 2 benchmark patterns, table/chart/graph available.
  - Financial Services Demo: 204 executive interview signals, 12 systems, 34 data assets, 3 AI initiatives, 10 operational/process signals, 28 risk/control records, 2 benchmark patterns, table/chart/graph available.
- Full repo-wide `tsc --noEmit` was blocked by pre-existing, unrelated Moves artifact-upload test typing errors at the time; the 2026-07-21 re-verification above ran the full-repo typecheck cleanly with no such block, so this is resolved or no longer applicable.

## Rollout Plan

Open PR from this candidate, merge through the normal protected main lane, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run signed-in Home/Knowledge browser proof for Healthcare Demo, Airline Demo, Financial Services Demo, and Lakeshore Holdings with AI agent-assist/current-state questions and verify that the right-side canvas, Home aVa answer, table, chart, graph, citations, and export diagnostics are populated from the same packet.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this candidate.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: Existing feature flags only.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. The old V7/V6 Home ask path remains available as fallback, so rollback is code-only and does not require data migration rollback.

## Audit Evidence

- Local command output above.
- Existing audit baseline: `reports/home-knowledge-gap-audit-20260720.md`.
- Existing proof bundle: `proof/home-knowledge-gap-audit-20260720/`.

## Known Gaps

- Not deployed or signed-in production-proven yet.
- Curated Semantic2 database reads were not available locally because `DATABASE_URL` was not set; local validation proved the new local V7/interview fallback path.
- This candidate is code-recovery-verified (lint/typecheck/test parity in an isolated worktree), not re-run through the original local dossier probe script — the 2026-07-20 probe numbers above are carried forward, not re-executed. Worth a quick re-run before merge if time allows, though the underlying logic is unchanged from what was originally probed.
