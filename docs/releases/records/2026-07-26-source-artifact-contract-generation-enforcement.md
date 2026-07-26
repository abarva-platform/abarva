# 2026-07-26-source-artifact-contract-generation-enforcement — Generation and route enforcement (PR 4B)

## Release ID

`2026-07-26-source-artifact-contract-generation-enforcement`

## Status

`released` — merged, deployed, ACA runtime invariant verified, and live-verified on
`app.abarva.ai`.

## Plain-English Summary

PR 4B of the Source stage/artifact governance workstream (`ADR-0013`, `ADR-0015`), sequenced
directly after PR 4A (`SourceArtifactContract`, which nothing called yet). This release wires
the two live Source artifact-generation entry points through a new shared eligibility resolver:

1. **New shared resolver**: `src/lib/source/contracts/generation-eligibility.ts`'s
   `evaluateGenerationEligibility()`. Both the AI-generate route
   (`[eventId]/artifacts/[artifactCode]/generate/route.ts`) and the chat-save route
   (`[eventId]/artifacts/generate/route.ts`) now call the same function instead of each
   hand-rolling its own eligibility answer.
2. **Stage eligibility — genuinely new, applied identically to both routes.** Nothing
   previously checked whether an event's current stage permits generating a given artifact at
   all. Both routes now return `409 stage_not_eligible` (with the artifact's real earliest
   eligible stage and the event's current stage) if the event hasn't reached that stage yet.
   This is additive — it blocks a request nothing previously permitted meaningfully.
3. **Upstream-required presence, consolidated on AI-generate; deliberately NOT extended to
   chat-save.** AI-generate's existing missing-upstream check is unchanged in its exact response
   shape. Chat-save intentionally does not gate on missing upstream at all — discovered mid-build
   via an existing, real, currently-passing test that chat-saves a `d09_rfp_pack` with zero
   upstream present (a legitimate use case: chat-save persists human-authored content, which may
   be written out of order, unlike AI-generate, which drafts FROM upstream evidence). Applying
   the same gate would have silently broken real, tested behavior — named as a deliberate scope
   boundary in `ADR-0015`'s amendment, not the full literal reading of "same checks."
4. **Chat-save's independent, drift-prone stage→family mapping removed**, replaced with the
   contract's real per-code family (matching `canonical-specs/artifact-specs.ts`, with the
   caller's explicit override still respected).

## Layer Impact

- `global-control-lane`: two live route changes with real, additive behavior change (a new
  409 case neither route previously returned) plus one behavior-neutral internal refactor
  (family resolution). No tenant-specific behavior.

## Client Applicability

- All clients: yes — no tenant-specific behavior. Internal only: no (live, client-facing
  generation routes). Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/source/contracts/generation-eligibility.ts` (new) — the shared eligibility resolver.
- `src/lib/source/contracts/__tests__/generation-eligibility.test.ts` (new, 7 cases).
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — new stage
  check ahead of the existing, unchanged upstream check.
- `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts` — new stage check; family
  resolution now contract-driven; dead `parseArtifactFamily` hardcoded switch removed.
- `src/app/api/v1/source/[eventId]/artifacts/generate/__tests__/route.test.ts` — 2 new cases
  (stage block fires; chat-save's upstream exemption is real).
- `docs/architecture/adr/ADR-0015-source-artifact-contract.md` — PR 4B amendment.

## QA / Validation

- `pass` — new `generation-eligibility.test.ts` (7 cases) against the real, live contract
  registry: eligible/no-blockers baseline; stage-ineligible blocks with the correct
  earliest-eligible-stage metadata; eligible at the artifact's own stage AND every later stage;
  missing-upstream blocks independent of stage; both blockers fire together when both conditions
  hold; an empty missing-upstream list (chat-save's real call shape) never produces an upstream
  blocker regardless of what the artifact actually requires; an unknown code throws rather than
  silently allowing generation.
- `pass` — chat-save route test suite: all 5 pre-existing tests green with ZERO changes to their
  assertions (proof the family-resolution refactor and added stage check are non-breaking to
  existing, tested behavior) + 2 new tests (stage block actually fires for a real ineligible
  request; a real d09 with no upstream still chat-saves successfully, proving the upstream
  exemption is real, not just documented).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings.
- `pass` — regression sweep, `src/lib/source/**` + `src/app/api/v1/source/**` (2492 tests):
  2460 passing. 10 pre-existing failing suites — identical set, by name, to the ones confirmed
  unrelated during PR 4A's regression sweep; `git status` confirms this PR touches none of those
  files.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — Release Control
  Gate, Azure deployment lane check, Deploy Authority Gate, Pilot Data Loader Gate all passed.
- `pass` — CI on PR #5642 (all checks).
- `pass` — live proof against `app.abarva.ai` (signed-in session, real event
  `c03ffe14-49fb-403e-8d47-ed23c9fea9e2`, real "Healthcare Demo" tenant, currently at the
  `scope` stage). The AI-generate route has no existing unit test coverage anywhere in this
  repo, unlike chat-save, so this is that route's primary proof:
  - **Ineligible-stage request**: `POST .../artifacts/d24_decision_brief/generate` (earliest
    eligible stage `executive_decision`) returned the new blocker immediately:
    `{"error":"stage_not_eligible","detail":"Executive Award Recommendation (d24_decision_brief)
    is not eligible to generate before stage \"executive_decision\" — the event is currently at
    \"scope\".","earliestEligibleStage":"executive_decision","currentStage":"scope"}` — exact
    structured shape as designed, no side effects.
  - **Eligible-stage request**: `POST .../artifacts/d06_excl_log/generate` (stage `scope`,
    matching the event's real current stage) did NOT return `stage_not_eligible` and was still
    running past 8 seconds (client-aborted, not server-failed) — proving it passed both the new
    stage check and the pre-existing upstream check synchronously and moved on to real
    generation work, exactly as it would have before this PR. No false block on a genuinely
    eligible request.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. Live behavior
change on both generation routes (a new 409 case). No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly (a normal code deploy).
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:10c675ce1955cfefc37b08c235271b96a47cb4fd8529a3060160205e652e532f`
  (merge SHA `46754f0886560bce4870fb7467cc2f543c2d4f40`, ACA revision
  `ca-abarva-web-lab-eastus--m46754f08`).
- ACA runtime invariant: verified — deploy run
  [30188508738](https://github.com/abarva-platform/abarva/actions/runs/30188508738)'s "Verify
  ACA runtime invariant" step passed.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation.

## Rollback Plan

Revert the merge commit. Both routes return to their pre-PR behavior (no stage check, chat-save's
prior hardcoded family switch) — no data migration involved either direction.

## Audit Evidence

- PR: [#5642](https://github.com/abarva-platform/abarva/pull/5642) (merge commit
  `46754f0886560bce4870fb7467cc2f543c2d4f40`).
- Deploy run: [30188508738](https://github.com/abarva-platform/abarva/actions/runs/30188508738).
- Live proof: signed-in browser session against `https://app.abarva.ai` — see QA / Validation.
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0015-source-artifact-contract.md` (PR 4B
  amendment).
- Prior release this follows: `2026-07-26-source-artifact-contract-registry.md` (PR 4A).

## Known Gaps

- **Upstream-required presence is not tightened to "accepted authoritative"** — the contract's
  fuller rule ("candidate/rejected/superseded upstream artifacts do not satisfy requirements")
  is not enforced by this release; both routes still use "does a non-empty body exist," matching
  pre-PR behavior exactly. A real definition of "accepted" for general d-code artifacts would
  need `client-final-artifacts.ts`'s slot-based resolver wired into generation — a distinct,
  larger, separate follow-up.
- **Chat-save has no upstream-required gate at all**, by deliberate decision (see Plain-English
  Summary and `ADR-0015`'s amendment) — named explicitly, not an oversight.
- **PR 4C (review/export/downstream enforcement) and PR 4D (UI/regression harness) remain**,
  per the original PR 4 sequencing — this release covers generation-route enforcement only.
