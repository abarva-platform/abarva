# Source Redesign — Wave 1 Autonomous Execution Brief

**For:** Codex (full-privilege autonomous · multi-agent · merge + deploy authority)
**Mission:** Ship Wave 1 of the Source redesign — 4 PRs in 2 phases — non-stop, with full QA, automatic merge after CI green + acceptance, and prod deploy verification per spec.
**Source of truth:** `docs/build/source-design/` on branch `docs/source-design-package-2026-06-04` (SHA `3b2a3cf28`)
**Budget envelope:** ~$60 in model spend, ~16 hours wall-clock.
**Output:** 4 merged PRs · 4 prod deploys verified · 4 spec acceptances logged · final readiness report.

---

## Mission

The design package is complete and approved (see `docs/build/source-design/README.md`). Wave 1 closes the most user-jarring bugs and is cleared to start with **no further design-module pass needed for these 4 specs**.

You execute autonomously. Multi-agent fan-out for Phase 1. Full authority to commit, push, open PRs, merge after CI green + acceptance, and trigger production deploy.

Do not pause for approval unless an explicit escalation gate fires.

---

## Authorization

You have explicit permission from Anand to:

- Open new branches off `main`
- Commit and push to those branches
- Open PRs
- Merge PRs after CI green AND acceptance criteria met AND design-fidelity check passes
- Trigger production deploys
- Run prod smoke tests after deploy
- Make small judgment calls (library picks, microcopy refinement, test-naming) without asking
- Spawn parallel agents per the multi-agent plan below

You do NOT have permission to:

- Skip CI hooks or release:check
- Force-push to main
- Touch files outside the spec's file-ownership list
- Continue past an escalation gate
- Modify the design package files (`docs/build/source-design/*`) — they are the contract

---

## Preconditions (verify before kick-off)

```bash
# 1. On a clean checkout off origin/main
git fetch origin main
git rev-parse origin/main
# Should resolve to a recent SHA — use this as the base for all Wave 1 worktrees.

# 2. The design package is reachable
ls docs/build/source-design/
# Must show 01 through 07 + README.md.

# 3. The CXO testing brief is reachable (the bar)
ls docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md

# 4. E2E test infrastructure exists
ls tests/e2e/source/
# Must show golden-event-apex-ams.spec.ts + cross-tenant-isolation.spec.ts + separation-of-duties.spec.ts + _audit-harness.ts + _auth.ts

# 5. CI scripts run locally
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --skipLibCheck
```

If any precondition fails → STOP, write `ESCALATE_BLOCKED_PRECONDITION.md`, do not proceed.

---

## Wave 1 plan

### Phase 1 · 3 PRs in parallel (3 agents · 3 worktrees)

| Agent | Spec | What | File ownership |
|---|---|---|---|
| **Agent-A** | Spec 4 · Lifecycle routing guard | Middleware in `src/proxy.ts` redirects by `lifecycle_state` · canvas physically inaccessible until approved | `src/proxy.ts`, `src/lib/source/lifecycle-routing-guard.ts` (new) |
| **Agent-B** | Spec 2 · Intake completion footer | "Open event" CTA appears at 5/5 captured · routes to `/approval` (not canvas) · facts collapse to checklist | `src/app/(maestro)/source/new/page.tsx`, `src/components/source/intake/IntakeCompletionFooter.tsx` (new) |
| **Agent-C** | Spec 7 · Artifact tile humanization sweep (WIDENED) | Hide artifact codes, "Template", "GATE", "NOT STARTED", "DB-backed documents", "AWAITING AUTHORING", "STORED DOCUMENTS" jargon from production UI · export CTAs hidden until artifact has body · empty states authored | `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`, `src/components/source/canvas/ArtifactTile.tsx`, `src/components/source/canvas/ArtifactStatusStrip.tsx`, `src/lib/source/artifact-display-names.ts` |

These 3 specs touch disjoint files. **True parallel execution — no merge conflicts.**

Each agent runs the per-spec flow below independently. None waits for the others.

### Phase 2 · 1 PR after Phase 1 merges (1 agent)

| Agent | Spec | What | Depends on |
|---|---|---|---|
| **Agent-D** | Spec 3 · Approval page (NEW · LOAD-BEARING) | Dedicated `/source/events/[eventId]/approval` page · 1 primary "Approve" + 1 secondary "Send to co-approver" + "Other decisions ▾" menu · intake chat trail expandable inline · rationale required · self-approval notice for creator | Spec 4 (routing guard) must be merged AND deployed first — Approval page IS the redirect target |

Wait for Phase 1 to fully merge + deploy + verify before Agent-D starts. Do NOT race it.

---

## Per-spec execution flow (every agent runs this loop)

### Step 1 · Set up worktree

```bash
# Fresh worktree off origin/main — one per spec
mkdir -p /private/tmp/source-redesign-w1
git worktree add /private/tmp/source-redesign-w1/agent-{A,B,C,D} origin/main -b feat/source-spec-{04,02,07,03}-{slug}
cd /private/tmp/source-redesign-w1/agent-X
```

Branch name format: `feat/source-spec-<NN>-<short-slug>`
Examples:
- `feat/source-spec-04-lifecycle-routing-guard`
- `feat/source-spec-02-intake-completion-footer`
- `feat/source-spec-07-artifact-humanization-sweep`
- `feat/source-spec-03-approval-page`

### Step 2 · Read the contract

Before writing code:

1. Open `docs/build/source-design/03-build-specs.html` and find the spec block
2. Open `docs/build/source-design/04-design-module-review.md` and find the verdict + revisions for the spec
3. Open `docs/build/source-design/05-wireframe-atlas.html` and jump to the section referenced by the spec
4. If a drafting-canvas spec (5, 6, 7, 8): open `06-strategy-screen.html` for fidelity bar
5. If a decision-rendering spec (12, 15): open `07-executive-decision-screen.html` for fidelity bar

**The wireframe is the contract for layout. The prose is the contract for behavior. Build to both.**

### Step 3 · Implement

Write the code. File ownership is bounded per the Wave 1 plan above. Do not touch files outside your spec's ownership list.

Special rules:
- Use the locked tokens from `03-build-specs.html` Part 3 — Georgia serif, accent `#1d4ed8`, paper `#F8F7F4`. Do not pick colors or fonts off the cuff.
- The "one dark moment" rule: charcoal `#1f2937` reserved for Executive Decision header only. Never use it elsewhere.
- The "no export of nothing" rule: any download/export CTA must be hidden when `artifact.body === null`.
- The "empty state is a designed state" rule: every list/shelf/grid that can be empty must have an authored empty state leading with the Next Move.

### Step 4 · Test (per-spec QA discipline)

Every PR must pass all of these before merge:

```bash
# Type safety
npx tsc --noEmit --skipLibCheck

# Lint
npx eslint src/ --max-warnings 0

# Unit tests for changed files
npm run test -- <changed-test-files>

# Integration tests for affected surfaces
npm run test:integration -- <relevant-suite>

# Release check
npm run release:check -- --base origin/main --head HEAD

# E2E (if the spec touches an event canvas or intake flow)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/source/<relevant-spec>.spec.ts
```

**Add at least one E2E assertion per spec** that proves the acceptance criterion. Examples:
- Spec 4: "navigating to /source/events/<waiting_on_client_event> redirects to /approval"
- Spec 2: "after 5 facts captured, 'Open event' CTA appears and routes to /approval"
- Spec 7: "no element with text matching 'd[0-9]+_' visible in production-rendered tile"
- Spec 3: "approval page renders 1 primary CTA + 1 secondary CTA + 'Other decisions ▾' menu (not 4 equal buttons)"

If your spec doesn't yet have a corresponding test in `tests/e2e/source/`, add one. Don't ship without a test.

### Step 5 · Design fidelity check (gate before merge)

For specs touching UI:

1. Build the page in dev (`npm run dev`)
2. Open the corresponding wireframe section in `05-wireframe-atlas.html` or the pattern setter (`06-` or `07-`) in a second tab
3. Compare layout, hierarchy, spacing, copy
4. **Squint test:** blur both views 50%. Is the primary action obvious in both? If not, the spec failed — iterate.
5. Capture before/after screenshots to attach to the PR

If the build doesn't match the wireframe within a reasonable tolerance: stop, surface what diverged, write `ESCALATE_FIDELITY_DIVERGENCE_<spec>.md`, escalate.

### Step 6 · Open PR

PR title format: `<type>(source): <one-line description> · Spec <NN> · Wave 1`

Examples:
- `feat(source): lifecycle-state routing guard · Spec 4 · Wave 1`
- `feat(source): intake completion footer + approval routing · Spec 2 · Wave 1`
- `fix(source): humanize artifact tile labels · Spec 7 · Wave 1`
- `feat(source): approval page · Spec 3 · Wave 1 Phase 2`

PR body template:

```markdown
## Spec
Closes Spec <NN> from `docs/build/source-design/03-build-specs.html`.

Design module verdict: <verdict from 04-design-module-review.md>
Wireframe reference: <section in 05-wireframe-atlas.html>

## What changed
- <bullet>

## Acceptance criteria (from spec)
- [x] <criterion 1>
- [x] <criterion 2>
- ...

## Design fidelity
- [x] Layout matches `05-wireframe-atlas.html` §<section> / `0<6/7>-<screen>.html`
- [x] Squint test passes
- [x] Locked tokens used (no off-the-cuff colors or fonts)
- [x] No "one dark moment" violation (charcoal #1f2937 reserved for Exec Decision)
- [x] No "export of nothing" violation (export CTAs hidden when body null)
- [x] Empty state authored (if applicable)

## Tests
- [x] tsc clean
- [x] eslint clean
- [x] unit tests pass
- [x] integration tests pass
- [x] release:check passes
- [x] E2E added: `tests/e2e/source/<spec>.spec.ts` — <one-line description>

## Screenshots (before / after)
<inline screenshots>

## Risk
<low | med | hi> — <one-line reasoning>

## Rollback
Revert this PR · no dependent migrations.
```

### Step 7 · Watch CI

Monitor GitHub Actions on the PR. If anything fails:
- Lint/type/unit/integration failures → diagnose, fix, push amendment
- E2E flake → re-run once; if still failing, diagnose
- release:check failure → investigate; do NOT bypass

Cap mid-PR retries at 2 failed-CI cycles. If still failing after 2 retries → escalate, do not force-push or skip hooks.

### Step 8 · Merge

When CI is fully green AND acceptance criteria are visibly checked in the PR body:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

Squash-merge keeps main history clean. Delete the source branch.

### Step 9 · Watch deploy

Vercel auto-deploys main. Watch the deploy status:
- If deploy fails → diagnose, surface; do NOT auto-revert
- If deploy succeeds → proceed to Step 10

### Step 10 · Prod smoke

Run a focused prod smoke specific to the spec just shipped:

```bash
# Generic deploy health
curl -sI https://app.abarva.ai/ | head -1
# Expected: HTTP/2 200

# Spec-specific smoke (examples)
# Spec 4:
curl -i 'https://app.abarva.ai/source/events/<waiting-event-id>' -H 'Cookie: __session=<test-session>'
# Expected: 302 to /approval

# Spec 2: manual click-path in DevTools-driven Playwright
# Spec 7: search rendered HTML for forbidden strings (d[0-9]+_*, "DB-backed", "AWAITING AUTHORING")
# Spec 3: navigate to /approval, confirm 1 primary + 1 secondary + "Other ▾"
```

Write `wave-1/spec-<NN>/smoke-result.json` with timestamp + result.

If smoke fails → file an issue, surface to Anand, do NOT immediately revert. Next agent starts on schedule.

### Step 11 · Checkpoint

Write `reports/source-redesign-w1/spec-<NN>/checkpoint.json`:

```json
{
  "spec": "<NN>",
  "phase": 1 | 2,
  "branch": "feat/source-spec-<NN>-<slug>",
  "pr": <number>,
  "merge_sha": "<sha>",
  "deploy_id": "<vercel-deploy-id>",
  "deploy_url": "<vercel-url>",
  "smoke_passed": true | false,
  "started_at": "<iso>",
  "merged_at": "<iso>",
  "deployed_at": "<iso>",
  "wall_clock_minutes": <n>,
  "model_spend_estimate_usd": <n.nn>
}
```

Commit the checkpoint to the next worktree's tree (`reports/source-redesign-w1/`) so it appears in the next PR.

---

## Phase coordination (multi-agent)

### Phase 1 launch

Spawn 3 agents simultaneously. Each follows the per-spec execution flow independently. They do not block each other.

### Phase 1 completion gate

When all 3 Phase 1 PRs have:
- ✅ Merged to main
- ✅ Deployed successfully
- ✅ Prod smoke passed

**Then Phase 2 starts.** Spec 3 (Approval page) depends on Spec 4 (routing guard) being live in prod — without it, the approval page has no incoming redirects.

If any Phase 1 spec fails to ship cleanly → Phase 2 waits. Do NOT start Spec 3 against an unmerged Spec 4.

### Phase 2 launch

Agent-D starts on Spec 3 after the Phase 1 gate clears. Same per-spec flow.

---

## Escalation gates — STOP if any fires

| Gate | Condition | Action |
|---|---|---|
| **G1** | Any precondition check fails | Write `ESCALATE_BLOCKED_PRECONDITION.md`; STOP |
| **G2** | Design fidelity divergence beyond reasonable tolerance | Write `ESCALATE_FIDELITY_DIVERGENCE_<spec>.md`; STOP, surface to design module |
| **G3** | CI fails after 2 retry cycles on the same PR | Write `ESCALATE_CI_BLOCKED_<spec>.md`; STOP that agent (others continue) |
| **G4** | release:check fails (release-record discipline broken) | Write `ESCALATE_RELEASE_CHECK_<spec>.md`; STOP; do NOT skip the hook |
| **G5** | Prod smoke fails after merge + deploy | File issue + write `ESCALATE_PROD_SMOKE_<spec>.md`; do NOT auto-revert; surface to Anand |
| **G6** | Wave 1 model spend exceeds $80 | STOP; cost-discipline check |
| **G7** | Wave 1 wall-clock exceeds 20 hours | STOP; investigate why |
| **G8** | Spec implementation requires touching files outside its file-ownership list | STOP; do not silently expand scope; escalate |
| **G9** | Any test deletes or weakens an existing assertion | STOP; never lower the bar to make a PR pass |

For each escalation: write the corresponding `ESCALATE_*.md` under `reports/source-redesign-w1/` with full context (which step failed, what was attempted, what's blocking). The user will decide next steps.

---

## Budget + wall-clock

| Metric | Target | Hard cap |
|---|---|---|
| Model spend (all agents combined) | $50-60 | $80 (G6) |
| Wall-clock (Phase 1 parallel + Phase 2) | 10-14 hours | 20 hours (G7) |
| Phase 1 parallel duration | ~6 hours each | n/a |
| Phase 2 (Spec 3) duration | ~5 hours | n/a |
| PR cycles per spec | 1 (clean) to 3 (with iteration) | 3 (G3) |

If you're under budget, you're moving correctly. If you're at hard cap and still mid-spec, escalate.

---

## Reporting cadence

Status update every 2 hours per agent — a one-liner per spec written to `reports/source-redesign-w1/status.md`:

```
2026-06-04 14:00 UTC · Spec 4 · in PR · CI running (2/4 checks green)
2026-06-04 14:00 UTC · Spec 2 · drafted footer · adding E2E test
2026-06-04 14:00 UTC · Spec 7 · sweep underway · 12 of ~18 string sites updated
```

When a spec hits a milestone (PR opened, CI green, merged, deployed, smoke passed): write a single-line entry to the status file.

At Phase 1 completion: write `reports/source-redesign-w1/phase-1-summary.md` with PR links, merge SHAs, deploy URLs, smoke results.

At Phase 2 completion (Wave 1 done): write the **final readiness report** at `reports/source-redesign-w1/WAVE_1_READINESS.md`:

```markdown
# Source Redesign · Wave 1 · Readiness

## What shipped
- Spec 4 · Lifecycle routing guard · PR #<n> · merged <sha> · deployed <url>
- Spec 2 · Intake completion footer · PR #<n> · merged <sha> · deployed <url>
- Spec 7 · Artifact humanization sweep · PR #<n> · merged <sha> · deployed <url>
- Spec 3 · Approval page · PR #<n> · merged <sha> · deployed <url>

## Behavior change
<2-3 sentences on what the user experience is now vs before>

## Acceptance verified
- [x] All per-spec acceptance criteria met in PR bodies
- [x] All E2E tests added and passing in prod
- [x] All prod smokes passed

## Design fidelity
- [x] Layouts match `05-wireframe-atlas.html` references
- [x] Pattern setters (`06-`, `07-`) honored where applicable
- [x] Squint test passes on all 4 surfaces

## Outstanding for Wave 2
<list of Wave 2 specs ready to start · or "Wave 2 unblocked, Codex can pick up Spec 1 / 5 / 6 / 8">

## Spend + wall-clock
- Model spend: $<n.nn>
- Wall-clock: <h.hh> hours
- Phase 1 parallel: <h.hh> hours
- Phase 2: <h.hh> hours
```

Surface that report to Anand. Wait for go-ahead before starting Wave 2.

---

## Definition of done

Wave 1 is complete when ALL of these are true:

- [ ] 4 PRs merged to main (Specs 4, 2, 7, 3)
- [ ] 4 deploys succeeded on Vercel
- [ ] 4 prod smokes passed
- [ ] 4 checkpoints written under `reports/source-redesign-w1/spec-*/`
- [ ] Final readiness report `WAVE_1_READINESS.md` committed and surfaced
- [ ] No open escalations from Wave 1
- [ ] Total spend ≤ $80
- [ ] Total wall-clock ≤ 20 hours

If any fails: stop, write the relevant `ESCALATE_*.md`, surface to Anand.

If all pass: declare Wave 1 done, wait for Anand's go-ahead before starting Wave 2 (Specs 1, 5, 6, 8 — the canvas redesign wave).

---

## What NOT to do

- Do NOT modify files in `docs/build/source-design/*` — those are the contract.
- Do NOT skip CI hooks or release:check — even once.
- Do NOT force-push to any branch.
- Do NOT merge a PR without all acceptance criteria checked AND CI green AND design fidelity confirmed.
- Do NOT continue past an escalation gate without explicit human input.
- Do NOT auto-revert a deployed spec without human approval — file an issue + surface, but leave the deploy in place.
- Do NOT touch files outside your spec's ownership list — silent scope expansion creates merge conflicts and breaks the parallel discipline.
- Do NOT weaken or delete existing tests to make a new PR pass — the bar only goes up.

---

## Headline

When Wave 1 ships, the user-facing change is:

1. **Approval is no longer invisible.** Creating an event lands the user on `/approval` with a clear "Approve" CTA, full facts visible, rationale required. The canvas is physically inaccessible until approved.
2. **The intake has a finish line.** Capturing 5/5 facts surfaces an "Open event" CTA that actually goes somewhere, with explicit routing preview.
3. **The canvas reads like a product, not a backend.** Artifact codes, "Template" badges, "GATE" red labels, "DB-backed documents" headlines, "AWAITING AUTHORING" strips — all gone from production UI. Export buttons hidden on empty memos. Empty states authored.
4. **Routing respects state.** Clicking on a `waiting_on_client` event no longer drops you on a half-rendered canvas — it goes to the approval page where the next action is obvious.

That's Wave 1. The product goes from "where do I go?" to "this is the next move," across 4 of the most-trafficked surfaces, in 16 hours of focused work.

---

## One-line invocation

Hand Codex this:

```
Execute docs/build/codex-handoff/2026-06-04-SOURCE_REDESIGN_WAVE_1_AUTONOMOUS.md
end-to-end. Phase 1: 3 parallel agents on Specs 4 · 2 · 7.
Phase 2: 1 agent on Spec 3 after Phase 1 deploys.
Full merge + deploy authority. Report at every escalation gate.
Surface the WAVE_1_READINESS report when done.
```
