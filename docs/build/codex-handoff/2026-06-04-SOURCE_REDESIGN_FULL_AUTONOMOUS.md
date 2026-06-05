# Source Redesign — Full Autonomous Execution Brief (All 4 Waves)

**For:** Codex (full-privilege autonomous · multi-agent · merge + deploy authority · all 19 specs · no spend cap · no time cap)
**Mission:** Ship the complete Source module redesign — 19 PRs across 4 waves — non-stop, with full QA, automatic merge after CI green + acceptance + design-fidelity check, and prod deploy verification per spec. Auto-continue between waves on clean completion.
**Source of truth:** `docs/build/source-design/` on branch `docs/source-design-package-2026-06-04` (or read from `main` after merge)
**Output:** 19 merged PRs · 19 prod deploys verified · 19 spec acceptances logged · 4 per-wave readiness reports · 1 final `FULL_REDESIGN_READINESS.md`.

---

## Mission

The design package is complete, reviewed by the design module, and approved by Anand. Every spec has a verdict (`04-design-module-review.md`), every load-bearing surface has a wireframe (`05-wireframe-atlas.html`), and the two pattern-setter screens (`06-strategy-screen.html`, `07-executive-decision-screen.html`) are the fidelity bar.

You execute autonomously through all 19 specs. Multi-agent fan-out per wave. Auto-continue from one wave to the next when the wave-completion criteria are met. Full authority to commit, push, open PRs, merge after CI green + acceptance + fidelity, and trigger production deploy.

**Do not pause between waves unless an escalation gate fires.** The whole roadmap ships unless quality fails.

---

## Authorization

You have explicit permission from Anand to:

- Open new branches off `main` for any spec
- Commit and push to those branches
- Open PRs
- Merge PRs after CI green AND acceptance criteria met AND design-fidelity check passes
- Trigger production deploys (Vercel auto-deploys on merge to main)
- Run prod smoke tests after deploy
- Make small judgment calls (library picks, microcopy refinement, test-naming) without asking
- Spawn parallel agents per the multi-agent plan for each wave
- Auto-continue from one wave to the next when the wave's completion criteria pass
- Decide test refinements, file naming, commit message wording without consulting

You do NOT have permission to:

- Skip CI hooks or `release:check`
- Force-push to any branch
- Modify the design package files (`docs/build/source-design/*`) — they are the contract
- Touch files outside a spec's file-ownership list (silent scope expansion breaks parallel discipline)
- Weaken or delete existing tests to make a new PR pass
- Continue past an escalation gate without explicit human input
- Auto-revert a deployed spec without human approval (file an issue + surface instead)

**No spend cap. No wall-clock cap.** Run to completion or stop on quality.

---

## Preconditions (verify before kick-off)

```bash
# 1. On a clean checkout off main
git fetch origin main
git rev-parse origin/main
# Use this SHA as the base for all worktrees across all waves.

# 2. The design package is reachable
ls docs/build/source-design/
# Must show 01 through 07 + README.md.

# 3. The CXO testing brief is reachable (the bar)
ls docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md

# 4. E2E test infrastructure exists
ls tests/e2e/source/

# 5. CI scripts work locally
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --skipLibCheck
npx eslint src/ --max-warnings 0
```

If any precondition fails → STOP, write `ESCALATE_BLOCKED_PRECONDITION.md`, do not proceed.

---

## The 4 waves · 19 specs

### Wave 1 — Load-bearing fixes (close the most user-jarring bugs)

Phase 1 · 3 agents in parallel · disjoint files · no merge conflicts possible

| Agent | Spec | What | File ownership |
|---|---|---|---|
| **A** | **Spec 4** — Lifecycle routing guard | Middleware redirects by `lifecycle_state`; canvas blocked until approved | `src/proxy.ts`, `src/lib/source/lifecycle-routing-guard.ts` (new) |
| **B** | **Spec 2** — Intake completion footer | "Open event" CTA appears at 5/5 captured; routes to `/approval` (not canvas); facts collapse to checklist | `src/app/(maestro)/source/new/page.tsx`, `src/components/source/intake/IntakeCompletionFooter.tsx` (new) |
| **C** | **Spec 7** — Artifact tile humanization sweep (WIDENED) | Hide `d01_*` codes, "Template", "GATE", "NOT STARTED", "DB-backed documents", "AWAITING AUTHORING", "STORED DOCUMENTS"; export CTAs hidden when body null; empty states authored | `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`, `src/components/source/canvas/ArtifactTile.tsx`, `src/components/source/canvas/ArtifactStatusStrip.tsx`, `src/lib/source/artifact-display-names.ts` |

Phase 2 · 1 agent · sequential (depends on Spec 4 deployed)

| Agent | Spec | What | Depends on |
|---|---|---|---|
| **D** | **Spec 3** — Approval page (NEW · LOAD-BEARING) | Dedicated `/source/events/[eventId]/approval`; 1 primary "Approve" + 1 secondary "Send to co-approver" + "Other decisions ▾"; intake chat trail expandable inline; rationale required; self-approval notice for creator | Spec 4 deployed (Approval page is the routing-guard's redirect target) |

### Wave 2 — Canvas redesign (the spine of the new pattern)

4 agents in parallel · the canvas pattern lands across the surfaces that drive daily workflow

| Agent | Spec | What | File ownership |
|---|---|---|---|
| **E** | **Spec 5** — Stage canvas Next-Move pattern (the spine) | Sticky Next-Move card per stage; resolved by stage + artifact state; gates checklist tied to next stage unlock | `src/components/source/canvas/StageNextMoveCard.tsx` (new), `src/components/source/canvas/UniversalCanvasShell.tsx`, `src/lib/source/stage-next-move.ts` (new) |
| **F** | **Spec 6** — Sentinel chat sizing per stage | Proportional width per stage (intake 50% → strategy 40% → exec decision 15% / collapsed); no duplication of Next-Move CTA; per-stage persistence | `src/components/source/canvas/SentinelChatProportional.tsx` (new), `src/lib/source/chat-sizing-policy.ts` (new) |
| **G** | **Spec 8** — Strategy stage refit (canonical drafting canvas) | Inherits Spec 5 + 6 + 7; matches `06-strategy-screen.html` fidelity; humanized gates, export gating, "Required to advance" framing | `src/components/source/canvas/strategy/StrategyStageView.tsx` (new), conditional rendering in `UniversalCanvasShell` |
| **H** | **Spec 1** — Decision queue triage bands | OVERDUE / DUE THIS QUARTER / PIPELINE bands; clickable; secondary CTAs need lightweight confirm; zero state authored | `src/app/(maestro)/source/queue/page.tsx`, `src/components/source/SourceDecisionQueue.tsx`, `src/components/source/SourceTriageBands.tsx` (new), `src/lib/source/queue/triage-banding.ts` (new) |

Inter-spec dependency note: Specs 5/6/8 share `UniversalCanvasShell.tsx`. To avoid conflicts, **Agent E lands Spec 5 first** (touches the shell to add Next-Move slot). Then Agent F + Agent G + Agent H run in parallel — Spec 6 and Spec 8 only consume Spec 5's slot; Spec 1 is fully independent. So Wave 2 = 1 sequential (E) + 3 parallel (F, G, H).

### Wave 3 — Stage depth (load-bearing visual moments)

4 agents in parallel · each spec owns its own stage canvas component tree

| Agent | Spec | What | File ownership |
|---|---|---|---|
| **I** | **Spec 9** — Scope + RFP stages | Application inventory (explicit CMDB pull), dependency map (list for v1), eval rubric (soft 100% warning) | `src/components/source/canvas/scope/ScopeStageView.tsx`, `src/components/source/canvas/rfp/RfpStageView.tsx` (both new), supporting components per spec |
| **J** | **Spec 10** — Responses + Evaluation stages | Per-vendor completeness matrix, symmetric Q&A log, weighted scorecard, dissent panel (with attachments), BATNA panel (sourcing-lead-named) | `src/components/source/canvas/responses/*`, `src/components/source/canvas/evaluation/*` (all new) |
| **K** | **Spec 11** — Pricing + BAFO (LOAD-BEARING) | TCO bridge, iceberg as labeled STACKED BARS (not skeuomorphic), pre-rendered sensitivity cards (±20/10/5%), per-vendor BAFO lever envelope cards (NOT grand table), concession ledger | `src/components/source/canvas/pricing/*`, `src/components/source/canvas/bafo/*` (all new), `src/lib/source/pricing-normalization-model.ts` (extend) |
| **L** | **Spec 12** — Executive Decision page-1 (LOAD-BEARING · MOST SCRUTINIZED) | Dark charcoal `#1f2937` header (the ONLY dark moment in the lifecycle); 1+3 layout (Recommendation HUGE; Savings/Trade-off/Dissent stack smaller); no empty cells (replace empty dissent with "Risks · {n} open"); human-authored "Deciding axis" sentence; match `07-executive-decision-screen.html` fidelity | `src/components/source/canvas/executive-decision/ExecutiveSummaryHeader.tsx`, `src/components/source/canvas/executive-decision/ExecutiveDecisionStageView.tsx` (both new) |

### Wave 4 — Lifecycle completion + cross-cutting

7 specs with mixed parallel/sequential structure

Parallel cohort (6 agents):

| Agent | Spec | What | File ownership |
|---|---|---|---|
| **M** | **Spec 13** — Stage 10 Transition (NEW) | KT milestone list (Discovery/Shadow/Reverse Shadow/Cutover/Hypercare), 4-workstream readiness scorecard, risk register reusing Evaluation dissent-panel pattern, fixed signer schema (CIO + CDO + Vendor PM) | `src/components/source/canvas/transition/*` (all new) |
| **N** | **Spec 14** — Stage 11 Value extension | Reuses approval-page pattern for CFO attestation; "Locked" badge + signature trail (not padlock alone); configurable variance threshold (8% default); auto-generated quarterly board pack | `src/app/(maestro)/source/events/[eventId]/value/page.tsx` (edit), `src/components/source/value/*` (mostly new), `src/lib/source/value-chain.ts` (extend) |
| **O** | **Spec 16** — Evidence drawer (NEW) | Right-edge drawer ~28%; superscript citation chips inline ([E-001] in drawer); persistent toggle | `src/components/source/EvidenceDrawer.tsx`, `src/components/source/EvidenceRecordCard.tsx`, `src/components/source/EvidenceCitationLink.tsx` (all new) |
| **P** | **Spec 17** — Audit log extension | Humanized action names in UI (raw enum in export); browser-local timestamps with UTC tooltip; subtle Sentinel tag + tint differentiating AI-action rows; **self-action flag** when actor of `gate_met` equals event creator | `src/components/source/canvas/workspace-tabs/LogTab.tsx`, `src/lib/source/activity-log.ts` |
| **Q** | **Spec 18** — Cross-event Attention surface (NEW) | Top-nav bell with count opening a panel (NOT a full /attention page); read/unread with auto-mark-read on action; queue ↔ bell separation (queue = needs DECISION; bell = needs ATTENTION) | `src/components/source/SourceAttentionSurface.tsx`, `src/lib/source/notifications/attention-resolver.ts`, `src/components/source/SourceSubNav.tsx` (edit for bell) |
| **R** | **Spec 19** — Renewal auto-event | Configurable 180-day trigger; auto-fills 5 intake facts marked "auto-filled from {contract}, review"; renewal MUST land in `waiting_on_client` (never active); SRM scorecard with quarterly auto-refresh + on-demand | `src/lib/source/renewal/contract-clock.ts`, `src/lib/source/renewal/renewal-event-creator.ts`, `src/lib/source/renewal/srm-scorecard.ts`, `src/app/(maestro)/source/events/[eventId]/srm/page.tsx`, `vercel.ts` (cron) |

Sequential after parallel cohort (1 agent):

| Agent | Spec | What | Depends on |
|---|---|---|---|
| **S** | **Spec 15** — CXO Report + Deal Pack rewrites | Page-1 Exec Summary (LIGHT card; dark reserved for in-app); explicit "Freeze & generate" CTA by CIO; deal pack gated to "decision authored" events; branded filename pattern; **Stage 10 Transition + Stage 11 Value sections added** (currently missing); HTML exports legible at 375px width | Specs 13 + 14 merged (deal pack consumes Transition + Value content); reuses Exec Decision pattern from Spec 12 (Wave 3) |

So Wave 4 = 6 parallel (M, N, O, P, Q, R) + 1 sequential (S after M + N merge).

---

## Per-spec execution flow (every agent runs this for every spec)

### Step 1 · Set up worktree

```bash
# Fresh worktree off latest origin/main — one per spec
mkdir -p /private/tmp/source-redesign
git worktree add /private/tmp/source-redesign/spec-<NN> origin/main -b feat/source-spec-<NN>-<slug>
cd /private/tmp/source-redesign/spec-<NN>
```

Branch name format: `feat/source-spec-<NN>-<short-slug>`

### Step 2 · Read the contract

Before writing any code:

1. Open `docs/build/source-design/03-build-specs.html` → find the spec block (file paths, props, copy, behavior, acceptance)
2. Open `docs/build/source-design/04-design-module-review.md` → find the verdict + revisions for the spec (these override the spec where they conflict)
3. Open `docs/build/source-design/05-wireframe-atlas.html` → jump to the section referenced by the spec
4. If a drafting-canvas spec (5, 6, 7, 8, 9): open `06-strategy-screen.html` for the fidelity bar
5. If a decision-rendering spec (12, 15): open `07-executive-decision-screen.html` for the fidelity bar
6. Re-read the bar (Part 2) and the locked tokens (Part 3) of `03-build-specs.html`, including the three usage constraints ("one dark moment" / "no export of nothing" / "empty state is a designed state")

**The wireframe is the contract for layout. The prose is the contract for behavior. The review verdict is the override.** Build to all three.

### Step 3 · Implement

Write the code. Stay strictly within the spec's file-ownership list.

Special rules:
- Use the locked tokens from `03-build-specs.html` Part 3 — Georgia serif, accent `#1d4ed8`, paper `#F8F7F4`. No off-the-cuff colors or fonts.
- The "one dark moment" rule: charcoal `#1f2937` is reserved for Executive Decision header only (Spec 12). Never use it elsewhere.
- The "no export of nothing" rule: any download/export CTA must be hidden when `artifact.body === null`.
- The "empty state is a designed state" rule: every list/shelf/grid must have an authored empty state leading with the Next Move.

### Step 4 · Test (per-spec QA discipline)

Every PR must pass all of these before merge:

```bash
# Type safety
npx tsc --noEmit --skipLibCheck

# Lint
npx eslint src/ --max-warnings 0

# Unit tests
npm run test -- <changed-test-files>

# Integration tests
npm run test:integration -- <relevant-suite>

# Release check
npm run release:check -- --base origin/main --head HEAD

# E2E (if the spec touches an event canvas, intake flow, queue, approval, or exports)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/source/<relevant-spec>.spec.ts
```

**Add at least one E2E assertion per spec** that proves the headline acceptance criterion. Examples:
- Spec 4: "navigating to /source/events/<waiting_on_client_event> redirects to /approval"
- Spec 12: "Executive Decision header is the only `background: #1f2937` element across the canvas DOM tree"
- Spec 19: "auto-created renewal event has `lifecycle_state = 'waiting_on_client'`, never active"

If your spec doesn't have a corresponding test file in `tests/e2e/source/`, create one. Don't ship without a new assertion.

### Step 5 · Design fidelity check (gate before merge)

For specs touching UI:

1. Build the page in dev (`npm run dev`)
2. Open the corresponding wireframe section in `05-wireframe-atlas.html` or the pattern setter (`06-strategy-screen.html` / `07-executive-decision-screen.html`) in a second tab
3. Compare layout, hierarchy, spacing, copy
4. **Squint test:** blur both views 50%. Is the primary action obvious in both? If not, the implementation failed — iterate.
5. Capture before/after screenshots to attach to the PR

If the build doesn't match the wireframe within reasonable tolerance: stop, surface what diverged, write `ESCALATE_FIDELITY_DIVERGENCE_<spec>.md`, escalate.

### Step 6 · Open PR

PR title format: `<type>(source): <one-line description> · Spec <NN> · Wave <N>`

PR body template:

```markdown
## Spec
Closes Spec <NN> from `docs/build/source-design/03-build-specs.html`.

Design module verdict: <verdict + key revisions from 04-design-module-review.md>
Wireframe reference: <section in 05-wireframe-atlas.html> · <pattern setter if applicable>

## What changed
- <bullet>

## Acceptance criteria (from spec + review revisions)
- [x] <criterion 1>
- [x] <criterion 2>

## Design fidelity
- [x] Layout matches wireframe atlas section / pattern setter
- [x] Squint test passes
- [x] Locked tokens used (no off-the-cuff colors or fonts)
- [x] "One dark moment" rule honored (charcoal #1f2937 reserved for Exec Decision)
- [x] "No export of nothing" rule honored (export CTAs hidden when body null)
- [x] Empty state authored (if applicable)

## Tests
- [x] tsc clean
- [x] eslint clean
- [x] unit tests pass
- [x] integration tests pass
- [x] release:check passes
- [x] E2E added: <test file> — <one-line assertion>

## Screenshots (before / after)
<inline>

## Risk
<low | med | hi> — <one-line reasoning>

## Rollback
Revert this PR · <note any data/migration considerations>
```

### Step 7 · Watch CI

Monitor GitHub Actions. If failures:
- Lint/type/unit/integration → diagnose, fix, push amendment
- E2E flake → re-run once; if still failing, diagnose
- release:check failure → investigate; do NOT bypass

Cap mid-PR retries at 2 failed-CI cycles. If still failing after 2 retries → G3 fires, stop that agent (others continue).

### Step 8 · Merge

When CI is fully green AND acceptance criteria visibly checked in PR body AND design fidelity confirmed:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

### Step 9 · Watch deploy

Vercel auto-deploys main. If deploy fails → diagnose, surface; do NOT auto-revert without human approval.

### Step 10 · Prod smoke

Run a spec-specific prod smoke confirming the acceptance is live. Write `reports/source-redesign/spec-<NN>/smoke-result.json`.

### Step 11 · Checkpoint

Write `reports/source-redesign/spec-<NN>/checkpoint.json`:

```json
{
  "spec": "<NN>",
  "wave": <1-4>,
  "branch": "feat/source-spec-<NN>-<slug>",
  "pr": <number>,
  "merge_sha": "<sha>",
  "deploy_id": "<vercel-deploy-id>",
  "deploy_url": "<vercel-url>",
  "smoke_passed": true,
  "started_at": "<iso>",
  "merged_at": "<iso>",
  "deployed_at": "<iso>"
}
```

---

## Per-wave coordination

### Wave kickoff

For each wave: spawn all agents per the wave's multi-agent plan. Parallel agents run independently and do not block each other.

### Wave completion criteria

A wave is complete when ALL of its specs have:
- ✅ Merged to main
- ✅ Deployed successfully
- ✅ Prod smoke passed
- ✅ Checkpoint written

When wave completion is reached, write `reports/source-redesign/wave-<N>-readiness.md` with:
- PR list + merge SHAs + deploy URLs + smoke results
- Behavior change summary
- Acceptance verifications
- Design fidelity confirmations
- Outstanding spec items deferred (if any)
- Next wave kickoff timestamp

### Inter-wave auto-continue

**On a clean wave completion: immediately start the next wave.** Do not wait for human approval. Do not pause for review.

The exception: if any escalation gate fired during the wave (G1-G5, G8, G9), stop. Even if the wave technically completed, an unresolved escalation must clear before the next wave starts.

### Final readiness (after Wave 4)

When all 19 specs have shipped, write `reports/source-redesign/FULL_REDESIGN_READINESS.md`:

```markdown
# Source Module Redesign · Full Readiness

## 19 PRs · 4 waves · complete

### Wave 1 · Load-bearing fixes
- Spec 4 · PR # · sha · deploy
- Spec 2 · PR # · sha · deploy
- Spec 7 · PR # · sha · deploy
- Spec 3 · PR # · sha · deploy

### Wave 2 · Canvas redesign
<4 entries>

### Wave 3 · Stage depth
<4 entries>

### Wave 4 · Lifecycle completion
<7 entries>

## Behavior change summary
<one paragraph per wave>

## Acceptance verification
- [x] Every spec acceptance criterion met in its PR
- [x] Every spec has a new or updated E2E test in tests/e2e/source/
- [x] Every spec's design fidelity matched its wireframe section
- [x] All prod smokes passed
- [x] No skipped CI hooks, no bypassed release:check
- [x] No tests deleted or weakened

## Score arc
- Pre-redesign L6 score: 4.8 / 10 (rigorous audit baseline)
- Predicted post-redesign L6: ~9.0 - 9.5 / 10 (needs CXO re-test to confirm)

## Hand-off
Source module is now ready for VP IT Sourcing test against the bar in
docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md.

## What's NOT in this redesign (explicit deferrals)
- Full mobile responsiveness for working surfaces (Wave 5 separate exercise; partial mobile shipped in Spec 15 exports per Q7 review)
- D3 dependency map viz (Spec 9 simple list shipped; viz is a Wave-later enrichment)
- Interactive sensitivity sliders (Spec 11 pre-rendered scenarios shipped)
- Gantt KT plan (Spec 13 milestone list shipped)
- /attention full page (Spec 18 bell + panel shipped; full page deferred)
```

Surface that report to Anand. Stop.

---

## Escalation gates — STOP if any fires (quality-only · no budget/time gates)

| Gate | Condition | Action |
|---|---|---|
| **G1** | Precondition check fails | `ESCALATE_BLOCKED_PRECONDITION.md`; STOP entire roadmap |
| **G2** | Design fidelity divergence beyond reasonable tolerance | `ESCALATE_FIDELITY_DIVERGENCE_<spec>.md`; STOP that agent; surface to design module; other agents continue |
| **G3** | CI fails after 2 retry cycles on the same PR | `ESCALATE_CI_BLOCKED_<spec>.md`; STOP that agent; other agents continue; wave cannot complete until resolved |
| **G4** | `release:check` fails | `ESCALATE_RELEASE_CHECK_<spec>.md`; STOP; do NOT skip the hook |
| **G5** | Prod smoke fails after merge + deploy | File issue + `ESCALATE_PROD_SMOKE_<spec>.md`; do NOT auto-revert; surface to Anand; other agents continue but wave cannot close until resolved |
| **G8** | Spec implementation requires touching files outside its file-ownership list | STOP that agent; surface scope-expansion request; do NOT silently expand scope |
| **G9** | Any test deletes or weakens an existing assertion | STOP; never lower the bar to make a PR pass |
| **G10** | A wave completes but one or more open `ESCALATE_*.md` exists | STOP wave-to-wave auto-continue; surface and wait for human input before starting next wave |

For each escalation: write the corresponding `ESCALATE_*.md` under `reports/source-redesign/` with full context (which step failed, what was attempted, what's blocking).

---

## Reporting cadence

Status update every 2 hours per active agent — one line per spec — to `reports/source-redesign/status.md`:

```
2026-06-04 14:00 UTC · Wave 1 · Spec 4 · in PR · CI running (3/5 checks green)
2026-06-04 14:00 UTC · Wave 1 · Spec 2 · drafted footer · adding E2E test
2026-06-04 14:00 UTC · Wave 1 · Spec 7 · sweep underway · 12 of ~18 string sites updated
```

When a spec hits a milestone (PR opened, CI green, merged, deployed, smoke passed): single-line entry.

When a wave completes: `reports/source-redesign/wave-<N>-readiness.md`.

When all 4 waves complete: `reports/source-redesign/FULL_REDESIGN_READINESS.md`. Surface to Anand. Stop.

---

## Definition of done

The full roadmap is complete when ALL of these are true:

- [ ] 19 PRs merged to main (Specs 1 through 19)
- [ ] 19 deploys succeeded on Vercel
- [ ] 19 prod smokes passed
- [ ] 19 checkpoints written under `reports/source-redesign/spec-*/`
- [ ] 4 wave readiness reports written (`wave-1-readiness.md` through `wave-4-readiness.md`)
- [ ] Final `FULL_REDESIGN_READINESS.md` written and surfaced
- [ ] No open escalations across any wave
- [ ] No skipped CI hooks, no bypassed release:check, no weakened tests

If any escalation remains open at the end of Wave 4: stop, surface, do not declare done.

---

## What NOT to do

- Do NOT modify files in `docs/build/source-design/*` — those are the contract.
- Do NOT skip CI hooks or `release:check` — even once.
- Do NOT force-push to any branch.
- Do NOT merge a PR without all acceptance criteria checked AND CI green AND design fidelity confirmed.
- Do NOT continue past an escalation gate without explicit human input.
- Do NOT auto-revert a deployed spec without human approval — file an issue + surface, but leave the deploy in place.
- Do NOT touch files outside a spec's ownership list — silent scope expansion creates merge conflicts and breaks the parallel discipline.
- Do NOT weaken or delete existing tests to make a new PR pass — the bar only goes up.
- Do NOT pause between waves for human approval on a clean completion — auto-continue.

---

## Headline outcomes per wave

**Wave 1 — the load-bearing bugs close**
Approval is no longer invisible. Intake has a finish line. The canvas reads like a product, not a backend. Routing respects state.

**Wave 2 — the canvas becomes the spine of the new pattern**
Every stage leads with the Next Move. Sentinel chat is right-sized per stage. Strategy stage matches the pattern setter. Decision queue is triaged, not a wall.

**Wave 3 — the stages do real sourcing work**
Scope and RFP work end-to-end. Responses and Evaluation capture rationale and dissent. Pricing surfaces TCO + iceberg + sensitivity + trap log. Executive Decision is page-1-summary-led with the dark header that earns its contrast.

**Wave 4 — the lifecycle completes and the cross-cutting patterns land**
Transition tracks KT and go-live readiness. Value ledger chains baseline → projected → realized with CFO attestation. Exports lead with the answer, page 1. Evidence drawer makes citations clickable. Audit log humanized + self-action flagged. Attention bell + Renewal auto-event close the loop.

**Final**
The Source module goes from "where do I go?" to "this is the next move," from "scaffold-only" to "decision-grade," from "incomplete" to "Board-defensible." VP IT Sourcing test against the original CXO bar predicts ~9 / 10 — a massive recovery from the 4.8 pre-redesign baseline.

---

## One-line invocation

Hand Codex this:

```
Execute docs/build/codex-handoff/2026-06-04-SOURCE_REDESIGN_FULL_AUTONOMOUS.md
end-to-end. 19 specs · 4 waves · multi-agent fan-out per wave ·
auto-continue between waves. Full merge + deploy authority.
No spend cap, no time cap. Stop only on quality failure
(escalation gates G1-G5, G8-G10). Surface the
FULL_REDESIGN_READINESS report when done.
```
