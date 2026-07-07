# 2026-06-13-citation-gap-grounded-forms — Stop the "no citations" banner firing on grounded answers

## Release ID

`2026-06-13-citation-gap-grounded-forms`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor IROPS browser eval flagged that the "CITATION GAP — this AI output has no source citations attached" banner appeared on **every** Nexus answer on the Move overview, including answers that *do* cite evidence — which erodes trust in well-grounded responses. Root cause: the text-only banner heuristic (`shouldShowPlainTextCitationGap`, used by the AtlasDrawer Nexus surface, which only has the response text — no structured citation metadata) didn't recognize the grounded engine's own citation forms. After the source-label work, grounded answers attach sources as `(cited <Source Name> …)` (answerGrounded) and `[source: <Source Name>]` (grounded deliverable bodies). This teaches `hasAgentCitationMarkup` to recognize those two deterministic forms, so a cited answer no longer gets the "no citations" banner. Genuine `[MISSING EVIDENCE]` gaps (no citation attached) still show the banner.

## Layer Impact

- `global-control-lane`: shared agent-response governance UI for all tenants. Pure display heuristic in `src/lib/agent/citation-gap.ts`; no data/schema/auth change. Conservative by design — it only *suppresses* the banner on text containing an explicit attached-source form, so it cannot hide the banner on genuinely uncited prose.

## Client Applicability

- All clients: Yes — anyone seeing Nexus answers that cite evidence (e.g. Tower-backed grounded answers on the Move overview).
- Feature flag: None — correctness fix.

## Changes Included

- `src/lib/agent/citation-gap.ts` — `hasAgentCitationMarkup` now also matches `[source:` (CITATION_MARKERS) and `(cited <token>` (new `GROUNDED_CITE_REGEX`).
- `src/lib/agent/__tests__/citation-gap.test.ts` — +cases: grounded forms suppress the banner; a real uncited gap still shows it.

## QA / Validation

- Unit tests: **pass** — `npx jest citation-gap` → 1 suite, 4 tests (incl. the 2 new cases).
- ESLint on changed files: **pass** (clean).
- CI typecheck + reasoning-layer tests: **pass** (enforced on the PR).
- Live UI re-verification on `app.abarva.ai`: **not-run** — browser extension was disconnected at fix time; behavior is fully determined by the unit-tested pure heuristic. Confirm visually next browser session.

## Rollout Plan

Merge to main (squash). Reaches production (`app.abarva.ai`, served by ACA — see project_azure_aca_runtime memory) via the normal `main` CD pipeline. No manual prod deploy from this change while the ACA revision/traffic-ownership loop is being stabilized.

## Rollback Plan

Pure heuristic change, no migration. Revert the squash commit.

## Audit Evidence

An auditor can confirm this change is safe and effective without running the app: read `src/lib/agent/citation-gap.ts` and see that `hasAgentCitationMarkup` returns true only when the text contains an explicit attached-source token (`[source:`, `{{cite:`, `[tenant-specific:`, `[user-context:`, `Source basis:`, a `[PAT-…]` pattern ref, or `(cited <token>`) — it never suppresses on free prose, so the governance banner can only be hidden when a citation is genuinely present. The PR's CI run shows the unit suite `src/lib/agent/__tests__/citation-gap.test.ts` passing, including the explicit case that a `[MISSING EVIDENCE: …]` / uncited gap response STILL returns `shouldShowPlainTextCitationGap === true` (banner shown). PR URL + CI checks are the linked evidence; the diff is the audit surface (one heuristic file + its tests).

## Known Gaps

- The other eval P2 — "ARTIFACTS 0" vs "DELIVERABLES 1" count mismatch — is tracked separately.
- AtlasDrawer's Nexus renderers receive only response text (no structured citation/evidence metadata); a fuller fix would thread the evidence envelope through, but this text-form recognition resolves the reported false-positive without that larger refactor.
