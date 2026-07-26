# 2026-07-26-source-artifact-contract-authority-enforcement — Review, export, and downstream enforcement (PR 4C)

## Release ID

`2026-07-26-source-artifact-contract-authority-enforcement`

## Status

`proposed` — merged pending; deploy and live-proof steps below to be executed after merge and
recorded in a docs-only follow-up PR, matching this workstream's established pattern (PR 4A, 4B).

## Plain-English Summary

PR 4C of the Source stage/artifact governance workstream (`ADR-0013`, `ADR-0015`), sequenced
after PR 4B (generation-route stage/upstream enforcement). PR 4B surfaced a distinction that
this release completes: AI generation enforces stage and authoritative-upstream requirements;
human chat-save authoring may still create an out-of-sequence draft, but what it creates must
not automatically become authoritative, exportable, or available to downstream decision
artifacts.

1. **New shared authority resolver** — `src/lib/source/contracts/artifact-authority.ts`. One
   function, `resolveArtifactAuthority()`, now decides `isDraft` / `isAccepted` /
   `isAuthoritative` / `isExportEligible` / `isFinal` for any artifact instance, with a
   structured `blockers[]` explaining why not. It composes two pre-existing mechanisms that had
   never been wired together: `deriveSourceArtifactGovernanceStage()` (one call site before this
   PR) and the contract's `exportEligibility`/`finalityConditions` fields (never read before this
   PR).
2. **Root-cause finding, fixed**: the acceptance ledger (`source_artifact_acceptances`) had zero
   effect on anything before this PR — no live caller ever populated
   `hasActiveAcceptance` on an authority candidate, so accepting an artifact only ever wrote an
   audit row. This release wires it into: the accept route (new stage-eligibility gate before
   acceptance + returns the full authority decision), `nexus/ask/route.ts` (acceptance now
   actually outranks a newer unaccepted draft in the same d16/d19/d22/d24-style slot), and the
   AI-generate route (`findMissingUpstreamCodes` → `findUnsatisfiedRequiredUpstream`, so a
   required upstream code must be genuinely accepted + stage-eligible + non-superseded, not just
   "has a body").
3. **New export-eligibility gates** on both real export surfaces — the unified render route and
   the File Cabinet/Gate Decision/canvas download route — block with a structured
   `409 export_not_eligible` when an artifact with a registered contract hasn't cleared its
   governance-stage export minimum (e.g. a client-facing artifact still at `ai_draft`).
4. **Rejected artifacts** are honestly mapped onto the existing, previously-unused
   `status === "blocked"` value (no reject mechanism exists for general d0X artifacts; building
   one was not asked for).
5. **Governance-banner text normalization is explicitly scoped OUT** and fully inventoried
   instead of silently skipped — see Known Gaps.
6. **Chat-save is unchanged beyond PR 4B**: it still creates out-of-sequence drafts freely; what
   changed is that those drafts cannot be accepted before their stage, cannot export before
   clearing governance minimums, and do not win an authoritative slot until actually accepted.

## Layer Impact

- `global-control-lane`: five route/module changes with real, additive behavior change (new
  `409` cases on accept/render/download that nothing previously returned) plus one correctness
  fix (acceptance ledger now actually affects authority resolution). No tenant-specific
  behavior.

## Client Applicability

- All clients: yes — no tenant-specific behavior. Internal only: no (live, client-facing accept/
  export/ask routes). Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/source/contracts/artifact-authority.ts` (new) — shared authority resolver.
- `src/lib/source/contracts/__tests__/artifact-authority.test.ts` (new, 16 cases).
- `src/lib/source/contracts/upstream-satisfaction.ts` (new) — real upstream-satisfaction check,
  batched (no N+1).
- `src/lib/source/contracts/__tests__/upstream-satisfaction.test.ts` (new, 6 cases).
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/route.ts` — contract lookup
  (404 if unregistered), contract-driven acceptance-authority check, new stage-eligibility gate,
  full authority decision in the success response.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/__tests__/route.test.ts` — +3
  cases; fixed a pre-existing mock (`jest.requireActual` spread) that broke once this route's
  import chain reached the real contract registry.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` —
  `findMissingUpstreamCodes` replaced with `findUnsatisfiedRequiredUpstream`.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — `toArtifactAuthorityCandidate` now
  populates real `hasActiveAcceptance` via a batch acceptance lookup.
- `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/artifact-authority-context.test.ts` — +2
  cases.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/route.ts` — new
  export-eligibility gate.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/render/__tests__/route.test.ts` — +2
  cases; one pre-existing fixture updated (`artifactStates`/`currentStageKey` added to the
  generation-context mock, which this gate now reads).
- `src/app/api/v1/source/artifacts/[artifactId]/download/route.ts` — new export-eligibility
  gate (`checkExportEligibility`), applied once at the single choke point after authority-record
  resolution, ahead of all three streaming paths this route supports.
- `src/app/api/v1/source/artifacts/[artifactId]/download/__tests__/route.test.ts` — +2 cases; 5
  pre-existing fixtures updated (`status`/`approvedBy` added) so tests built to prove
  substitution/format/filename mechanics keep passing under the new gate rather than being
  incidentally blocked by it.
- `docs/architecture/adr/ADR-0015-source-artifact-contract.md` — PR 4C amendment (full renderer
  inventory, downstream-context mapping, scope decisions).

## QA / Validation

- `pass` — `artifact-authority.test.ts` (16 cases) against the real contract registry: fresh
  draft is draft/not-accepted/not-authoritative; an out-of-sequence chat-save draft (d24 at
  scope stage) is blocked on both `not_accepted` and `stage_not_eligible` simultaneously and
  cannot satisfy an upstream requirement; accepted + stage-eligible → authoritative and satisfies
  upstream; accepted but stage-ineligible → accepted, NOT authoritative; review-pending doesn't
  satisfy upstream; `status: "blocked"` (rejected) never authoritative even if accepted;
  superseded/retired never authoritative even if accepted; internal artifact export-eligible at
  `ai_draft`; client-facing artifact NOT export-eligible at `ai_draft`, IS eligible once
  approved; superseded never export-eligible; a finality-gated artifact (d24) cannot claim
  finality without its sibling (d26) accepted even if itself accepted + stage-eligible, and does
  achieve finality once all conditions are met; an artifact with no finality conditions never
  claims finality; unknown code throws.
- `pass` — `upstream-satisfaction.test.ts` (6 cases): empty required-codes list short-circuits
  with zero DB calls; no-linked-artifact is unsatisfied; linked-but-never-accepted is unsatisfied
  (a body existing is not enough); accepted + stage-eligible + non-superseded is satisfied;
  superseded is unsatisfied even with an acceptance record; a mixed batch reports exactly the
  right codes with exactly one DB query (no N+1).
- `pass` — accept route test suite: 7 pre-existing tests green + 3 new (authority decision
  returned on success and is both accepted and authoritative; `409 stage_not_eligible` when
  accepting before the artifact's earliest eligible stage; unregistered code rejected with
  `404` before any DB lookup).
- `pass` — `nexus/ask` authority-context test suite: 2 pre-existing structural tests green + 2
  new (acceptance lookup is actually wired into the candidate builder; an artifact with an
  active acceptance outranks a newer, unaccepted "generated" draft in the same slot).
- `pass` — render route test suite: 2 pre-existing tests green (one fixture updated to add
  `artifactStates: []`/`currentStageKey` to the generation-context mock, reflecting the real
  shape this route's context always has) + 2 new (`409 export_not_eligible` with the correct
  governance stage when a client-facing artifact hasn't cleared the bar; `200` once approved for
  external use and accepted).
- `pass` — download route test suite: 10 pre-existing tests green (5 fixtures updated to carry
  `status: "approved", approvedBy` where the artifact code is a real client-facing contract, so
  substitution/format/filename mechanics tests keep exercising what they were built for) + 2 new
  (`409` blocked / `200` eligible, mirroring the render-route proof for this second export
  surface).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — zero errors.
- `pass` — `npx eslint` on all touched/added files — zero errors, zero warnings.
- `pass` — regression sweep, `src/lib/source/**` + `src/app/api/v1/source/**` (2523 tests):
  2491 passing. 10 pre-existing failing suites — identical set, by name, to the ones confirmed
  unrelated during PR 4A's and PR 4B's regression sweeps; `git status` confirms this PR touches
  none of those files (verified directly for `context-binder.test.ts`, whose one failure is an
  unrelated tenant-display-name assertion).
- `pending` — `node scripts/release-check.mjs --base origin/main --head HEAD`.
- `pending` — CI on the PR.
- `pending` — live proof against `app.abarva.ai` per the user's 12-step plan (two real sourcing
  events at different stages: create/identify an out-of-sequence draft; confirm it saves;
  confirm acceptance blocked with a structured reason on an ineligible stage; confirm final
  export blocked; confirm downstream context excludes it; on an eligible event, accept a valid
  artifact and confirm it becomes authoritative; confirm downstream context includes it; confirm
  the correct governance banner in a real export — see Known Gaps on banner text; confirm
  rejected/superseded exclusion after a state transition; confirm vendor-facing export still
  requires stronger authority; confirm direct route calls cannot bypass the rules).

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. Live behavior
change on four routes (accept, AI-generate, render, download) — each gains a new blocking case
that nothing previously returned, plus `nexus/ask`'s authority resolution becoming acceptance-
aware. No migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none directly (a normal code deploy).
- Approved image digest: to be recorded in the deploy-evidence follow-up PR once merged and
  deployed.
- ACA runtime invariant: to be verified in the deploy-evidence follow-up PR.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation (pending).

## Rollback Plan

Revert the merge commit. All four routes return to their pre-PR behavior (no stage/authority
gate on accept, body-presence-only upstream check on AI-generate, no export-eligibility gate on
render/download, acceptance-blind authority resolution on `nexus/ask`) — no data migration
involved either direction. The acceptance ledger itself is unaffected by rollback (it is
additive audit data written by the pre-existing accept flow, not schema this PR introduces).

## Audit Evidence

- PR: to be recorded once opened.
- Deploy run: to be recorded in the deploy-evidence follow-up PR.
- Live proof: to be recorded in the deploy-evidence follow-up PR.
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0015-source-artifact-contract.md` (PR 4C
  amendment).
- Prior releases this follows: `2026-07-26-source-artifact-contract-registry.md` (PR 4A),
  `2026-07-26-source-artifact-contract-generation-enforcement.md` (PR 4B).

## Known Gaps

- **Governance-banner text is not normalized across renderers in this release.** The export
  **gate** (point 3 above) is real and enforced — an ineligible artifact cannot be exported at
  all. But for artifacts that DO clear the gate, the banner *text* rendered inside the file
  still hardcodes `'ai_draft'` in the 6 structured renderer pairs that call a governance banner
  at all (app-inventory, bafo-question-pack-docx, market-scan-docx, pricing-template,
  response-checklist, scorecard, each ×docx) and in the shared narrative renderer (backing 9 of
  the 20 `SourceDeliverableKind` values). 5 more structured renderer pairs (tco-iceberg,
  ai-clause-gap, renewal-decision, pricing-comparison, trap-log) call no governance banner at
  all today. Making the banner text reflect the real derived stage requires threading a computed
  `governanceStage` from `buildSourceDeliverableSpec()` through `SourceDeliverableSpec` into all
  ~20 renderer call sites — a real, separate, mechanical plumbing change, tracked as explicit
  follow-up (PR 4C-2 or folded into PR 4D per `ADR-0015`'s amendment), not silently left
  unstated.
- **`collectUpstreamBodies` (the function binding upstream text into generation prompts) has
  exactly one live call site in the repo** (the AI-generate route, already gated by the new
  `findUnsatisfiedRequiredUpstream` check ahead of it). No separate "downstream chain used by
  exports or Decision Brief generation" exists as its own code path — renderers render each
  artifact's own already-generated body; they do not re-stitch other artifacts' content at
  render time. Confirmed by direct search, not assumed.
- **PR 4D (UI eligibility explanations + full stage × artifact regression harness) remains**,
  per the original PR 4 sequencing — this release covers review/export/downstream authority
  enforcement only.
