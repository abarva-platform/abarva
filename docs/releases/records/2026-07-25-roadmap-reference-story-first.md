# 2026-07-25-roadmap-reference-story-first — REF_EXECUTIVE_ROADMAP: story-first fast-follow

## Release ID

`2026-07-25-roadmap-reference-story-first`

## Status

`candidate`

## Plain-English Summary

Fast-follow to the REF_EXECUTIVE_ROADMAP pilot (PR #5596). Review of that pilot found the mechanics
were proven — shared contract, real SVG renderer, required-element presence-check, forbidden-pattern
check — but the governing hierarchy was not yet explicit end to end:

```
Executive decision and story → Artifact narrative → Section purpose
  → Exhibit message → Visual reference → SVG rendering
```

A technically compliant roadmap SVG can still read as a polished project schedule if the narrative
spine is missing. This release adds the story-first fields the pilot lacked:

1. **Message-led title enforcement** — the title itself must be the executive conclusion (e.g. "A
   four-stage transition builds the foundation first, proves priority value, and scales only after
   controls are established"), not a bare category label ("Execution Roadmap"). New `titleRule` on
   the reference contract, the orchestrator's `QualityBar`, and golden-bar's options; checked against
   the rendered `<h1>` (golden-bar) / `doc.title` (orchestrator). Advisory-only.
2. **Outcome-led horizons** — each horizon now has a fixed `horizonOutcomes` statement (the state
   achieved, e.g. "Establish Foundation: Trusted data, governance and delivery foundation
   operational") that the prompt requires leading with; activities may appear beneath it, never in
   place of it.
3. **Evidence status per item** — `requiredItemFields` gains `evidenceStatus`, one of approved /
   recommended / illustrative / client_decision_required / evidence_required, so an unconfirmed
   sequence can never read as committed.
4. **Named decision gates and value milestones** — `decisionGates` (e.g. "Funding authorized",
   "Pilot value validated") and `valueMilestones` (e.g. "First measurable result demonstrated",
   "Benefits accepted by Finance") are now explicit fields the prompt surfaces, not just a rendering
   shape (diamond).
5. **Gold-standard SVG exemplar fixed** — the hand-authored exemplar contained cell text that
   overflowed its box; the real `svgRoadmapExhibit()` renderer truncates cell content to 44
   characters (`.slice(0, 44)`), and the exemplar's longer synthetic strings didn't match that
   real truncation behavior. Trimmed to fit, preserving meaning. A gold-standard reference must not
   itself contain a rendering defect — it would be normalized as acceptable by anyone using it as a
   template.

## Layer Impact

- **global-control-lane**: same shared reference contract as PR #5596, extended in place.

## Client Applicability

- All clients: yes — every P4 Executive Roadmap generated after this deploys gets the additional
  story-first prompt guidance and the (still advisory) title-quality check.

## Changes Included

- `src/lib/deliverables/shared/reference-library/executive-roadmap-reference.ts` — adds
  `titleRule`, `horizonOutcomes`, `decisionGates`, `valueMilestones`, `evidenceStatus` (new
  `requiredItemFields` entry and `RoadmapEvidenceStatus` type).
- `src/lib/deliverables/orchestrator/types.ts` — `QualityBar` gains `titleRule`.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` — `moves::roadmap` wires the new
  `titleRule` from the shared contract.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — new title-quality warning check.
- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — `p4RoadmapAssignment()` prompt now
  states the title rule, outcome-led horizon statements, evidenceStatus values, named decision gates,
  and named value milestones; `premiumGoldenBarOptionsForArtifact` wires the matching `titleRule` for
  `execution_roadmap`.
- `src/lib/deliverables/golden-bar.ts` — matching `titleRule` option/check/`titleReadsAsGenericLabel`
  result field for this pipeline (checked against the rendered `<h1>`).
- `docs/design/moves/reference-library/executive-roadmap/gold-standard.svg` — fixed cell-text
  overflow to match the real renderer's 44-character truncation.
- Tests: `executive-roadmap-reference.test.ts` gains 4 new assertions (evidenceStatus field,
  horizon outcomes present, decision gates/value milestones non-empty, title-rule pattern behavior).
  `persist-move-generated-artifact.test.ts` fixture updated for the new required
  `titleReadsAsGenericLabel` field on `GoldenBarResult`.

## QA / Validation

- `npx eslint` on all changed files — pass, in a clean worktree built from `origin/main` (post
  PR #5596 merge).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (full project) — pass.
- `npx jest src/lib/deliverables` — 465/472 pass; the failures are the same pre-existing 3-suite/
  6-test baseline confirmed via `git stash` diff against the unmodified worktree — unchanged by this
  PR.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass.
- Live signed-in proof — not yet run; deferred to the same live-prove pass covering the base pilot
  (generate a real P4 roadmap through both pipelines and check the full 7-point checklist: message-
  led title, outcome-led horizons, no false precision, named gates, value milestones, evidence-status
  labels, legibility at document size).

## Rollout Plan

Merge to `main` via squash-merge PR, repo-owned `aca-main-deploy.yml` deploys it. No flag, no
migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: yes — same live-prove pass as PR #5596's open item, now covering
  the story-first checklist too.

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened.
- Prior context: PR #5596 (REF_EXECUTIVE_ROADMAP pilot).

## Known Gaps

- Same known gaps as PR #5596 (pilot scope, no reference-loader abstraction, advisory-only
  enforcement, SVG exemplars hand-authored not programmatically rendered).
- **`target_state_architecture` pipeline-word-floor asymmetry, restated explicitly per review**:
  both pipelines share the same advisory and blocking maximum (ceiling) for this artifact type, but
  their target minimums remain intentionally different — the orchestrator's floor is 9,000 words,
  golden-bar's is 2,500 — because one pipeline is single-pass (golden-bar's
  `p3FutureStateAssignment`) and the other is decomposed multi-pass (the orchestrator's generator,
  which the 9,000-word floor was designed around). This is a pragmatic interim choice, not a fully
  reconciled semantics: **the pipelines are not fully reconciled on this dimension.** Longer term,
  the artifact contract should remain identical across pipelines, while the generation strategy
  adapts internally — a user should not receive materially shallower architecture output simply
  because a different button invoked a single-pass pipeline instead of a multi-pass one. Revisit once
  golden-bar's single-pass prompt is proven (via real generation samples) to reliably produce more
  depth, or once the two pipelines converge on one generation strategy for this artifact type.
- The story-first fields added here (evidenceStatus, decisionGates, valueMilestones, horizonOutcomes,
  titleRule) are all advisory/prompt-guidance only — none are structurally validated yet (e.g. there
  is no check that a generated roadmap item's `evidenceStatus` value is actually one of the five
  allowed labels, only that the prompt asks for it). A structural per-item validator is real
  follow-up scope once real generations exist to calibrate against.

## Live Proof — one real governed Move to P4, both pipelines (2026-07-25, added post-merge)

**Status of this pilot after live proof: pilot / live-proven vertical slice — NOT a finished
artifact system.** The broader reference library (the other ~19 references) and the Executive Deck
family remain sequenced behind this closure.

**How it was proven.** A single real Move — `Charter Reconciliation Live Proof - It`
(id `3fc8e69f-ec3c-4f41-9311-2cf997d3e7f6`, Meridian healthcare composite demo tenant, archetype
`ai_product_enablement`) — was advanced through the **entire governed workflow P0 → P4** using only
the authenticated product API (the exact actions the UI performs), with **zero fabricated client
facts**. Every governance gate was enforced honestly:

- P1 Charter: generated, sponsor-signed-off, gate closed.
- P2 Understand Current State: Discovery & Diagnose Report (q90) + Root Cause Worksheet (q100)
  generated, reviewed, accepted; the **`p2_readiness_cleared` evidence-integrity gate correctly
  rejected** a placeholder recommendation containing "stop" — resolved honestly by writing a real
  proceed decision that reclassifies open items as non-blocking P3 caveats (Evidence required /
  Client decision required), **not** by faking clearance.
- P3 Choose the Approach: solution-option approval sub-gate satisfied (governed agent-assist chosen
  over autonomous / manual-only, tradeoffs + caveats recorded); Target-State Architecture (q90) and
  Solution Design (q90) generated and signed off as authoritative; gate closed.
- P4 Build the Plan: capture written with evidence-disciplined content (relative horizons, no dates,
  Illustrative/Recommended estimates, no fabricated owners/durations).

**Both roadmap pipelines were then run and inspected against the full closure checklist.**

| Checklist item | Legacy golden-bar (`execution_roadmap`, HTML, artifact `c8123330…`, q83, 4,628 words, 5 SVGs) | Orchestrator (`move_board_pack`, artifact `48dc0b3f…`, q80, 12,739 words, 4 SVGs) |
|---|---|---|
| Message-led title (executive conclusion, not a label) | **PASS** — h1: "A four-horizon transition that builds the foundation first, proves value in one contact-center function, and only then earns the right to scale" | **FAIL** — h1: "Charter Reconciliation Live Proof — Executive Roadmap" (move name + category label; the advisory `titleRule` warns but does not block) |
| Horizons lead with an achieved outcome, not a task list | **PASS** — "Mobilize → Sponsorship, funding, rights"; "Establish Foundation → Trusted data + control loop"; "Deliver Priority Outcome → One function live, measurable result" | **PASS** — all four horizons present, outcome-oriented |
| Narrative and visual tell the same story | **PASS** — recommendation exhibit ("Fund the foundation and one proving function only; gate scale behind proven value") matches the h1 thesis | **PASS** — consistent, though denser |
| Decision gates explicit + visually prominent | **PASS** — "five gates", ◆ diamond markers, dedicated gate/dependency exhibit | **PASS** — section 7 "Phase Gates & Milestones" + roadmap exhibit |
| Value milestones present | **PASS** — "five value milestones" named | **PARTIAL** — milestones present as a concept but the specific value-milestone vocabulary (baseline approved / first measurable result / adoption threshold / control effectiveness / benefits accepted) did not surface |
| Evidence status / uncertainty visible | **PASS** — all four labels present (Illustrative, Recommended, Evidence required, Client decision required), shown on the dependency exhibit | **PARTIAL** — Illustrative / Recommended / Evidence required present; "Client decision required" absent |
| No false precision (no dates/sprints/named owners/durations) | **PASS** — "3/6/9/12" explicitly "Illustrative — not committed dates"; owners shown as "[client input]" | **PASS** — no sprint/gantt/day/week/calendar-date patterns |
| Not a Gantt / delivery plan | **PASS** — reads as an executive decision artifact | **PASS-with-caveat** — "Phases & Work Packages" / "Critical Path" framing leans slightly more plan-like, but not a Gantt |
| `svgRoadmapExhibit` grid renders (horizons × workstreams, gate diamonds) — the PR #5596 renderer | not this pipeline's path (golden-bar renders its own executive SVGs) | **PASS** — HTML contains `data-kind="roadmap"`; the dedicated roadmap exhibit renderer fires **live in production** |
| Understandable by an executive in under a minute | **PASS** — message-led title + recommendation box + one-line "why this order" | **WEAKER** — 12,739 words is comprehensive but not a sub-minute read |
| Legible at document size, no clipping/overflow (HTML) | **PASS** — SVGs render at full size (e.g. timeline 1168×375) with real fills, no clipping | **PASS** (HTML); DOCX is the native board-pack format |
| Both pipelines materially equivalent advisory depth | **NOT EQUIVALENT (honest finding)** — see below | |

**Pipeline-parity finding (reported plainly).** The two pipelines are **not** materially equivalent
in story discipline. The legacy golden-bar roadmap is the stronger *executive-story-led* artifact:
tight (4.6k words), a genuine message-led title, all four evidence-status labels, all five named
value milestones. The orchestrator roadmap is more *comprehensive* (12.7k words) and is the one that
renders the new `svgRoadmapExhibit` grid, but its h1 is a category label rather than a message-led
headline, its value-milestone/evidence vocabulary is thinner, and its length works against the
"under a minute" executive read. Both received the same `p4RoadmapAssignment` story-first prompt
(PR #5599); the divergence is in how each pipeline's downstream rendering/decomposition applies it.

**Artifact identifiers (this Move).** Legacy roadmap HTML `c8123330-231e-4f96-9faf-9308033429c8`
(q83) + editable DOCX `cb10e415-9cf1-46fc-9600-96cb4ba23bf1` (q83); orchestrator roadmap
`48dc0b3f-0531-4a83-82a6-1ead302753df` (q80, DOCX board pack, HTML via `?format=html`). P3 design
evidence: Target-State Architecture `dfd56260…` (q90), Solution Design `6171136e…` (q90).

**Screenshots.** The legacy roadmap's message-led header (title + AI-draft disclaimer + sequencing
argument) was captured in the signed-in browser. Full-page section screenshots below the fold were
degraded by a `document.write` repaint quirk in the review harness (not a roadmap/renderer defect —
`getBoundingClientRect` confirmed every exhibit renders at full size with real fills and no
clipping); structural extraction of all exhibit text/labels stands in as the machine-checked proof.

**Two workflow defects observed during the proof — tracked separately, NOT roadmap-reference
failures** (neither blocked generation or rendering): (1) the phase-workspace UI shows stale
status after successful server-side actions until a hard reload; (2) step-navigation clicks
intermittently fail to register/refresh. Both are spawned as their own follow-up tasks.

**Remaining limitations after live proof.** (a) The orchestrator pipeline does not yet adopt the
message-led title or the full value-milestone/evidence-label vocabulary — the `titleRule` and
reference-element checks are advisory (warn-only), so they surface the gap without enforcing it; a
future increment should either graduate these to blockers once calibrated, or align the
orchestrator's title/section rendering to the reference. (b) PDF export was not separately captured
in this pass (DOCX exists for both pipelines). (c) Pipeline parity remains an open item: the
document-level contract is shared, but the two pipelines still produce materially different
story-discipline — the same convergence caution recorded for the `target_state_architecture` word
floor applies here.
