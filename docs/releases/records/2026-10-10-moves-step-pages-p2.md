# 2026-10-10 — Moves P2 Discover step pages

## Release ID

`2026-10-10-moves-step-pages-p2`

## Status

`candidate`

## Plain-English Summary

The remaining Discover steps now have pages in the shared Moves step-page design. The evidence-plan page lists the governed evidence needs and lets the team upload against a selected need or acknowledge a gap with an owner role. The baseline page saves team findings and structured metrics, holds uncited figures, and shows approved evidence references beside confirmed assumption-register rows. The validation page embeds the existing structured solution-route assessment. Each page reads the existing HARD gate verdicts; neither typing an answer nor acknowledging a gap approves evidence or attests a baseline.

When the two existing step-page flags are on, every P2 step has a page and the phase address opens the first open step. `?legacy=1` retains the old capture flow until a signed-in walk validates its replacement.

## Layer Impact

- Release lane: `global-control-lane`, behind existing tenant flags.
- Layer 3 canonical model: no schema or data-plane change. Two phase step records store accepted team words through the existing capture route. Evidence review, assumption-register status, route confirmation and gate evaluation retain their existing owners.
- Layer 4 products: three Moves step pages, host routing, and a selected evidence-family field on the existing in-step upload helper.

## Client Applicability

- All clients: no default change without the flags.
- Specific clients: the enrolled synthetic demo tenant only.
- Internal only: no.
- Public/demo only: no.
- Feature flags: `moves_step_pages_v3` and `moves_capture_v2`, both already present.

## Changes Included

- `p2-step-pages.tsx` and `p2-step-readiness.ts`: P2.1, P2.2 and P2.4 presentation and fail-closed readiness/citation helpers.
- `StepEvidence.tsx`: optional selected governed family passed to the existing upload route; other callers retain its previous behavior.
- `MovesPhaseStandaloneClient.tsx`, the phase route and step-page registry: mount, authoritative step completion, register read, and real Files/Record links.
- Phase workflow and capture-text readers: acknowledged gaps and accepted baseline words as step records.
- Legacy sunset ledger and focused model, page, record-reader and routing tests.

## QA / Validation

- Focused P2 and routing suites: 4 suites, 34 tests passed, including six HARD-check open/unreadable cases, a packet-complete but report-blocked case, citation holds for draft/redacted/figureless register rows, selected-family upload, owner-role rejection, citation-aware save, accepted team-word record text, invalid persisted findings, missing route readback and the legacy hatch.
- Affected governance, route, registry, step-view and host suites: 11 suites, 613 tests passed. Host coverage includes P2 default landing, the legacy hatch and flag-off capture behavior.
- Mutation checks: seven independent changes to packet coverage, citation hold, draft-register eligibility, confirmed-route consistency, upload family, accepted record words and invalid persisted findings were each caught by the focused tests, then restored.
- `npm run typecheck`: passed. Changed-file ESLint: passed. Prettier applied to touched files.
- Library orphan audit: no new orphans. Route and export reachability: no new findings. After reconciling `main`, the test-coverage census is 2,814 to 2,816 covered files, matching two new test files. Tenancy census unchanged.
- Temporary local component visual fixtures at 390px and 1440px in light and dark: all three pages had no horizontal overflow. P2.1's eleven needs were condensed after this check. The P2.4 visual fixture used a stand-in for the host-private structured route editor; its real embedding is covered by page and host code tests.
- No live signed-in walkthrough, database mutation, migration, workflow dispatch, merge or deployment was performed for this candidate.

## Rollout Plan

Merge through a protected-main PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. A signed-in P2 walkthrough should verify autosave/reload, governed upload and review, gate status, selected route, and the `?legacy=1` hatch before the P2 legacy rows are removed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify serving revision and web template against the approved digest.
- Worker image invariant: verify required worker images against the approved digest.
- Feature/env flag update path: existing tenant-gated registry entries through the main deploy workflow.
- Live signed-in proof required: yes, before claiming this release is live-proven.

## Rollback Plan

Turn off the existing step-page flag for the affected tenant or revert this PR through the protected branch. The old P2 capture flow remains behind `?legacy=1`; accepted step records remain readable as team text.

## Audit Evidence

- PR, local focused and quality-check output, test-coverage census diff, mutation results, and temporary component visual captures.
- Post-deploy ACA invariant and signed-in walkthrough are pending.

## Known Gaps

- The brief described `p2ReadinessBlockedReason` as a source of approved evidence-need coverage. In the current governance code it is the failure text for signed Discovery Report/capture readiness. This release keeps packet coverage, current-state hard gaps and that evaluator criterion visible as separate requirements; it does not change the governance rule.
- The confirmed solution-route record includes the reviewer but no confirmation timestamp. The page says time was not recorded; it does not invent one.
- The real structured route editor is private to the large phase host and was not included in the standalone HTML visual fixture. Signed-in visual verification remains open.
- A signed-in P2 walkthrough and legacy removal have not occurred.
